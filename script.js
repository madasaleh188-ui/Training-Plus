import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, collection, addDoc, doc, setDoc, getDocs, query, where, 
  onSnapshot, deleteDoc, orderBy, serverTimestamp, or, and 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// REPLACE THIS WITH YOUR FIREBASE CONFIG FROM FIREBASE CONSOLE
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

let currentUser = null;
let activeChatUserId = null;
let currentLang = 'en';
let studentsData = [];
let chatUnsubscribe = null;

// Localization Dictionary
const translations = {
  en: {
    welcome: "Welcome to Training Plus",
    loginPrompt: "Please sign in with Google to access your dashboard.",
    signInGoogle: "Sign in with Google",
    home: "Home",
    downloadAll: "Export All (Excel)",
    signOut: "Sign Out",
    addStudentHeader: "Add New Student",
    addStudentBtn: "Add Student",
    myStudentsHeader: "My Students",
    thName: "Name",
    thEmail: "Email",
    thCourse: "Course",
    thActions: "Actions",
    chatHeader: "Private Direct Messages",
    selectUserTitle: "Select Team Member",
    selectUserHint: "Select a user from the list to open a private chat",
    addToList: "Add to My List",
    addedSuccess: "Student added successfully!",
    downloadSuccess: "Excel downloaded successfully!",
    studentImported: "Shared student added to your private list!",
    deletedSuccess: "Student deleted successfully!"
  },
  ar: {
    welcome: "مرحباً بك في ترينينج بلس",
    loginPrompt: "يرجى تسجيل الدخول باستخدام جوجل للوصول إلى حسابك.",
    signInGoogle: "تسجيل الدخول بواسطة جوجل",
    home: "الرئيسية",
    downloadAll: "تصدير الكل (إكسيل)",
    signOut: "تسجيل الخروج",
    addStudentHeader: "إضافة طالب جديد",
    addStudentBtn: "إضافة طالب",
    myStudentsHeader: "قائمة طلابي الخصوصية",
    thName: "الاسم",
    thEmail: "البريد الإلكتروني",
    thCourse: "الدورة / المسار",
    thActions: "الإجراءات",
    chatHeader: "المحادثات الخاصة Direct Messages",
    selectUserTitle: "اختر عضواً للمحادثة",
    selectUserHint: "اختر مستخدماً من القائمة لبدء محادثة خاصة معه",
    addToList: "إضافة إلى قائمتي",
    addedSuccess: "تمت إضافة الطالب بنجاح!",
    downloadSuccess: "تم تحميل ملف الإكسيل بنجاح!",
    studentImported: "تمت إضافة الطالب المشارك إلى قائمتك الخاصة!",
    deletedSuccess: "تم حذف الطالب بنجاح!"
  }
};

// Listen to Auth State Changes
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    
    // Save/Update user profile in Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name: user.displayName,
      email: user.email,
      photoURL: user.photoURL
    }, { merge: true });

    document.getElementById('auth-overlay').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    initApp();
  } else {
    currentUser = null;
    document.getElementById('app').classList.add('hidden');
    document.getElementById('auth-overlay').classList.remove('hidden');
  }
});

// Setup Initial App Listeners
function initApp() {
  listenToMyStudents();
  loadUsers();
  setupEventListeners();
  setupDragAndDrop();
}

function setupEventListeners() {
  // Google Sign-In Button
  document.getElementById('btn-google-login').onclick = () => {
    signInWithPopup(auth, googleProvider).catch(err => showToast(err.message, true));
  };

  // Sign Out Button
  document.getElementById('btn-signout').onclick = () => {
    if (chatUnsubscribe) chatUnsubscribe();
    signOut(auth);
  };

  // Language Toggle Switcher (AR / EN)
  document.getElementById('btn-lang-toggle').onclick = () => {
    currentLang = currentLang === 'en' ? 'ar' : 'en';
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;
    applyLanguage();
  };

  // Add Student Form Submission
  document.getElementById('student-form').onsubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById('student-name').value;
    const email = document.getElementById('student-email').value;
    const course = document.getElementById('student-course').value;

    try {
      await addDoc(collection(db, "students"), {
        userId: currentUser.uid,
        name,
        email,
        course,
        createdAt: serverTimestamp()
      });
      showToast(translations[currentLang].addedSuccess);
      document.getElementById('student-form').reset();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  // Export All Students to Excel Button
  document.getElementById('btn-download-all').onclick = () => {
    if (studentsData.length === 0) return;
    exportToExcel(studentsData, 'My_Students_Data.xlsx');
  };

  // Send Chat Message Button
  document.getElementById('btn-send-msg').onclick = sendMessage;
  document.getElementById('chat-input').onkeypress = (e) => {
    if (e.key === 'Enter') sendMessage();
  };
}

function applyLanguage() {
  document.querySelectorAll('[data-i18n]').forEach(elem => {
    const key = elem.getAttribute('data-i18n');
    if (translations[currentLang][key]) {
      elem.innerText = translations[currentLang][key];
    }
  });
}

// --- PRIVATE STUDENTS REALTIME SYNC ---
function listenToMyStudents() {
  const q = query(
    collection(db, "students"), 
    where("userId", "==", currentUser.uid)
  );

  onSnapshot(q, (snapshot) => {
    studentsData = [];
    const tbody = document.getElementById('students-list');
    tbody.innerHTML = '';

    snapshot.forEach((docSnap) => {
      const student = { id: docSnap.id, ...docSnap.data() };
      studentsData.push(student);

      const tr = document.createElement('tr');
      tr.setAttribute('draggable', 'true');
      tr.ondragstart = (e) => e.dataTransfer.setData("text/plain", JSON.stringify(student));

      tr.innerHTML = `
        <td>${escapeHtml(student.name)}</td>
        <td>${escapeHtml(student.email)}</td>
        <td>${escapeHtml(student.course)}</td>
        <td class="action-cells">
          <button class="icon-btn download-btn" data-id="${student.id}" title="Download Excel">
            <i class="fa-solid fa-file-excel"></i>
          </button>
          <button class="icon-btn delete-btn" data-id="${student.id}" title="Delete">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      `;

      tr.querySelector('.download-btn').onclick = () => exportSingleStudent(student.id);
      tr.querySelector('.delete-btn').onclick = () => deleteStudent(student.id);

      tbody.appendChild(tr);
    });
  });
}

async function deleteStudent(id) {
  try {
    await deleteDoc(doc(db, "students", id));
    showToast(translations[currentLang].deletedSuccess);
  } catch (err) {
    showToast(err.message, true);
  }
}

function exportSingleStudent(id) {
  const student = studentsData.find(s => s.id === id);
  if (student) {
    exportToExcel([student], `Student_${student.name.replace(/\s+/g, '_')}.xlsx`);
  }
}

function exportToExcel(dataArray, filename) {
  const exportFormat = dataArray.map(item => ({
    "Full Name": item.name,
    "Email Address": item.email,
    "Course / Track": item.course
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportFormat);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
  XLSX.writeFile(workbook, filename);
  showToast(translations[currentLang].downloadSuccess);
}

// --- 1-ON-1 REALTIME CHAT & DRAG-AND-DROP ---
async function loadUsers() {
  const querySnapshot = await getDocs(collection(db, "users"));
  const ul = document.getElementById('users-ul');
  ul.innerHTML = '';

  querySnapshot.forEach((docSnap) => {
    const user = docSnap.data();
    if (user.uid !== currentUser.uid) {
      const li = document.createElement('li');
      li.id = `user-item-${user.uid}`;
      li.innerHTML = `<i class="fa-solid fa-user"></i> ${escapeHtml(user.name)}`;
      li.onclick = () => openPrivateChat(user);
      ul.appendChild(li);
    }
  });
}

function openPrivateChat(user) {
  activeChatUserId = user.uid;

  document.querySelectorAll('.users-list li').forEach(el => el.classList.remove('active'));
  document.getElementById(`user-item-${user.uid}`).classList.add('active');

  document.getElementById('chat-header-title').innerText = `${user.name}`;
  document.getElementById('chat-input').disabled = false;
  document.getElementById('btn-send-msg').disabled = false;

  listenToMessages();
}

function listenToMessages() {
  if (chatUnsubscribe) chatUnsubscribe();

  const q = query(
    collection(db, "messages"),
    or(
      and(where("senderId", "==", currentUser.uid), where("receiverId", "==", activeChatUserId)),
      and(where("senderId", "==", activeChatUserId), where("receiverId", "==", currentUser.uid))
    ),
    orderBy("createdAt", "asc")
  );

  chatUnsubscribe = onSnapshot(q, (snapshot) => {
    const chatBox = document.getElementById('chat-messages');
    chatBox.innerHTML = '';

    snapshot.forEach((docSnap) => {
      const msg = docSnap.data();
      const bubble = document.createElement('div');
      const isMine = msg.senderId === currentUser.uid;
      bubble.className = `chat-bubble ${isMine ? 'mine' : 'other'}`;

      if (msg.studentPayload) {
        const student = JSON.parse(msg.studentPayload);
        bubble.innerHTML = `
          <div class="shared-card">
            <h4><i class="fa-solid fa-id-card"></i> ${escapeHtml(student.name)}</h4>
            <p>${escapeHtml(student.email)} | ${escapeHtml(student.course)}</p>
            ${!isMine ? `<button class="btn-small btn-import">${translations[currentLang].addToList}</button>` : ''}
          </div>
        `;

        if (!isMine) {
          bubble.querySelector('.btn-import').onclick = () => importSharedStudent(msg.studentPayload);
        }
      } else {
        bubble.innerText = msg.message;
      }
      chatBox.appendChild(bubble);
    });

    chatBox.scrollTop = chatBox.scrollHeight;
  });
}

async function sendMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text || !activeChatUserId) return;

  try {
    await addDoc(collection(db, "messages"), {
      senderId: currentUser.uid,
      receiverId: activeChatUserId,
      message: text,
      studentPayload: null,
      createdAt: serverTimestamp()
    });
    input.value = '';
  } catch (err) {
    showToast(err.message, true);
  }
}

function setupDragAndDrop() {
  const chatWindow = document.getElementById('chat-window');
  chatWindow.ondragover = (e) => e.preventDefault();
  
  chatWindow.ondrop = async (e) => {
    e.preventDefault();
    if (!activeChatUserId) return;

    const rawData = e.dataTransfer.getData("text/plain");
    if (!rawData) return;

    await addDoc(collection(db, "messages"), {
      senderId: currentUser.uid,
      receiverId: activeChatUserId,
      message: "Shared a student card",
      studentPayload: rawData,
      createdAt: serverTimestamp()
    });
  };
}

async function importSharedStudent(payloadStr) {
  const student = JSON.parse(payloadStr);
  try {
    await addDoc(collection(db, "students"), {
      userId: currentUser.uid,
      name: student.name,
      email: student.email,
      course: student.course,
      createdAt: serverTimestamp()
    });
    showToast(translations[currentLang].studentImported);
  } catch (err) {
    showToast(err.message, true);
  }
}

function showToast(msg, isError = false) {
  const toast = document.getElementById('toast');
  toast.innerText = msg;
  toast.className = `toast ${isError ? 'error' : 'success'}`;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, function (m) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
  });
}
