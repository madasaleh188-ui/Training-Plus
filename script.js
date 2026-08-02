let currentUser = null;
let activeChatUserId = null;
let currentLang = 'en';
let studentsData = [];

// Localization Dictionary
const translations = {
  en: {
    welcome: "Welcome to Training Plus",
    loginPrompt: "Please sign in with Google to access your dashboard.",
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

// Check Existing Session on Page Load
document.addEventListener('DOMContentLoaded', () => {
  fetch('api.php?action=check_session')
    .then(res => res.json())
    .then(data => {
      if (data.authenticated) {
        currentUser = data.user;
        document.getElementById('auth-overlay').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        initApp();
      }
    });
});

// Google Authentication Callback
function handleCredentialResponse(response) {
  fetch('api.php?action=google_login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: response.credential })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      currentUser = data.user;
      document.getElementById('auth-overlay').classList.add('hidden');
      document.getElementById('app').classList.remove('hidden');
      initApp();
    } else {
      showToast(data.message || 'Authentication failed', true);
    }
  });
}

function signOut() {
  fetch('api.php?action=logout').then(() => {
    currentUser = null;
    document.getElementById('app').classList.add('hidden');
    document.getElementById('auth-overlay').classList.remove('hidden');
  });
}

function initApp() {
  loadStudents();
  loadUsers();
  setupEventListeners();
}

function setupEventListeners() {
  // Language Toggle Switcher (AR / EN)
  document.getElementById('btn-lang-toggle').addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'ar' : 'en';
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;
    applyLanguage();
  });

  // Add Student Form Submission
  document.getElementById('student-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('student-name').value;
    const email = document.getElementById('student-email').value;
    const course = document.getElementById('student-course').value;

    fetch('api.php?action=add_student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, course })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        showToast(translations[currentLang].addedSuccess);
        document.getElementById('student-form').reset();
        loadStudents();
      }
    });
  });

  // Export All Students to Excel Button
  document.getElementById('btn-download-all').addEventListener('click', () => {
    if (studentsData.length === 0) return;
    exportToExcel(studentsData, 'My_Students_Data.xlsx');
  });

  // Send Message Button
  document.getElementById('btn-send-msg').addEventListener('click', sendMessage);
  
  // Send Message on Pressing Enter
  document.getElementById('chat-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
}

function applyLanguage() {
  document.querySelectorAll('[data-i18n]').forEach(elem => {
    const key = elem.getAttribute('data-i18n');
    if (translations[currentLang][key]) {
      elem.innerText = translations[currentLang][key];
    }
  });
}

// Fetch Isolated Private Students
function loadStudents() {
  fetch('api.php?action=get_students')
    .then(res => res.json())
    .then(data => {
      studentsData = data;
      const tbody = document.getElementById('students-list');
      tbody.innerHTML = '';

      data.forEach(student => {
        const tr = document.createElement('tr');
        tr.setAttribute('draggable', 'true');
        tr.ondragstart = (e) => e.dataTransfer.setData("text/plain", JSON.stringify(student));

        tr.innerHTML = `
          <td>${escapeHtml(student.name)}</td>
          <td>${escapeHtml(student.email)}</td>
          <td>${escapeHtml(student.course)}</td>
          <td class="action-cells">
            <!-- Single Excel Download Icon beside Delete Button -->
            <button class="icon-btn download-btn" onclick="exportSingleStudent(${student.id})" title="Download Excel">
              <i class="fa-solid fa-file-excel"></i>
            </button>
            <button class="icon-btn delete-btn" onclick="deleteStudent(${student.id})" title="Delete">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    });
}

function deleteStudent(id) {
  fetch('api.php?action=delete_student', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  })
  .then(res => res.json())
  .then(() => {
    showToast(translations[currentLang].deletedSuccess);
    loadStudents();
  });
}

// Download Single Student Data to Excel
function exportSingleStudent(id) {
  const student = studentsData.find(s => s.id === id);
  if (student) {
    exportToExcel([student], `Student_${student.name.replace(/\s+/g, '_')}.xlsx`);
  }
}

// Excel Sheet Exporter using SheetJS
function exportToExcel(dataArray, filename) {
  const exportFormat = dataArray.map(item => ({
    "Student ID": item.id,
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

// --- 1-on-1 Chat & Drag and Drop Sharing ---

function loadUsers() {
  fetch('api.php?action=get_users')
    .then(res => res.json())
    .then(users => {
      const ul = document.getElementById('users-ul');
      ul.innerHTML = '';
      
      users.filter(u => u.id !== currentUser.id).forEach(user => {
        const li = document.createElement('li');
        li.id = `user-item-${user.id}`;
        li.innerHTML = `<i class="fa-solid fa-user"></i> ${escapeHtml(user.name)}`;
        li.onclick = () => openPrivateChat(user);
        ul.appendChild(li);
      });
    });
}

function openPrivateChat(user) {
  activeChatUserId = user.id;
  
  // Highlight Selected User
  document.querySelectorAll('.users-list li').forEach(el => el.classList.remove('active'));
  document.getElementById(`user-item-${user.id}`).classList.add('active');

  document.getElementById('chat-header-title').innerText = `${user.name}`;
  document.getElementById('chat-input').disabled = false;
  document.getElementById('btn-send-msg').disabled = false;
  
  loadMessages();
}

function loadMessages() {
  if (!activeChatUserId) return;
  
  fetch(`api.php?action=get_messages&receiver_id=${activeChatUserId}`)
    .then(res => res.json())
    .then(messages => {
      const chatBox = document.getElementById('chat-messages');
      chatBox.innerHTML = '';

      messages.forEach(msg => {
        const bubble = document.createElement('div');
        const isMine = msg.sender_id === currentUser.id;
        bubble.className = `chat-bubble ${isMine ? 'mine' : 'other'}`;

        if (msg.student_payload) {
          const student = JSON.parse(msg.student_payload);
          bubble.innerHTML = `
            <div class="shared-card">
              <h4><i class="fa-solid fa-id-card"></i> ${escapeHtml(student.name)}</h4>
              <p>${escapeHtml(student.email)} | ${escapeHtml(student.course)}</p>
              ${!isMine ? `<button class="btn-small" onclick='importSharedStudent(${JSON.stringify(msg.student_payload)})'>${translations[currentLang].addToList}</button>` : ''}
            </div>
          `;
        } else {
          bubble.innerText = msg.message;
        }
        chatBox.appendChild(bubble);
      });
      
      chatBox.scrollTop = chatBox.scrollHeight;
    });
}

function sendMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text || !activeChatUserId) return;

  fetch('api.php?action=send_message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ receiver_id: activeChatUserId, message: text })
  }).then(() => {
    input.value = '';
    loadMessages();
  });
}

// Drag & Drop Handlers
function allowDrop(e) { e.preventDefault(); }

function dropStudent(e) {
  e.preventDefault();
  if (!activeChatUserId) return;

  const rawData = e.dataTransfer.getData("text/plain");
  if (!rawData) return;

  fetch('api.php?action=send_message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      receiver_id: activeChatUserId,
      message: "Shared a student card",
      student_payload: rawData
    })
  }).then(() => loadMessages());
}

// "Add to My List" Handler for Shared Cards
function importSharedStudent(payloadStr) {
  const student = JSON.parse(payloadStr);
  fetch('api.php?action=add_student', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: student.name, email: student.email, course: student.course })
  })
  .then(res => res.json())
  .then(() => {
    showToast(translations[currentLang].studentImported);
    loadStudents();
  });
}

// Helper Toast Alert
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
