// ==========================================
// 1. FIREBASE CONFIGURATION
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyCzTs_zw28wkHij4Jj9-EEW3XOpQ5si2yc",
    authDomain: "training-plus-212a2.firebaseapp.com",
    projectId: "training-plus-212a2",
    storageBucket: "training-plus-212a2.firebasestorage.app",
    messagingSenderId: "330136803727",
    appId: "1:330136803727:web:3013a358a547a112ff93fa",
    measurementId: "G-FX3XRSLD8W"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

let currentUserData = null;
let studentList = [];
let currentLang = 'en';

// ==========================================
// 2. LANGUAGE TRANSLATIONS (ENGLISH / ARABIC)
// ==========================================
const translations = {
    en: {
        search_placeholder: "Search by name or CPR...",
        download_all: "Download All (Excel)",
        account: "Account",
        logout: "Logout",
        welcome_title: "Welcome",
        welcome_subtitle: "Sign in to access the Training Plus Student Directory",
        btn_google: "Sign in with Google",
        student_directory: "Student Directory",
        add_new_cpr: "+ Add New CPR",
        register_cpr: "Register New CPR",
        register_cpr_subtitle: "Enter a 9-digit CPR number to add a student.",
        cpr_label: "CPR Number (9 Digits):",
        btn_submit: "Submit Record",
        btn_back: "Done / Back",
        cpr_success_title: "CPR Added Successfully!",
        cpr_success_subtitle: "Would you like to add another student CPR record?",
        btn_add_another: "+ Add Another CPR",
        btn_go_directory: "Go to Directory",
        modal_account_title: "User Account",
        lbl_user_id: "User ID:",
        lbl_username: "Username:",
        lbl_email: "Email:",
        chat_header: "Team Group Chat",
        chat_placeholder: "Type a message...",
        btn_send: "Send",
        btn_download_excel: "Download Excel",
        btn_delete_student: "Delete Student",
        lbl_full_name: "Full Name:",
        lbl_cpr: "CPR:",
        lbl_gender: "Gender:",
        opt_male: "Male",
        opt_female: "Female",
        lbl_cv_doc: "Student CV Document",
        btn_upload_cv: "Upload CV",
        btn_view_cv: "📄 View / Download CV",
        btn_delete_cv: "Delete CV",
        lbl_no_cv: "No CV uploaded",
        lbl_enrolled_courses: "Enrolled Courses",
        ph_course: "Enter course name (e.g. Web Development)",
        btn_add_course: "+ Add Course",
        btn_delete_course: "Delete Course",
        lbl_no_courses: "No courses added yet.",
        lbl_no_students: "No student records found."
    },
    ar: {
        search_placeholder: "البحث بالاسم أو الرقم الشخصي...",
        download_all: "تحميل الكل (إكسل)",
        account: "الحساب",
        logout: "تسجيل الخروج",
        welcome_title: "مرحباً بك",
        welcome_subtitle: "سجل الدخول للوصول إلى دليل طلاب ترينينج بلس",
        btn_google: "تسجيل الدخول باستخدام جوجل",
        student_directory: "دليل الطلاب",
        add_new_cpr: "+ إضافة رقم شخصي جديد",
        register_cpr: "تسجيل رقم شخصي جديد",
        register_cpr_subtitle: "أدخل الرقم الشخصي المكون من 9 أرقام لإضافة طالب.",
        cpr_label: "الرقم الشخصي (9 أرقام):",
        btn_submit: "إرسال السجل",
        btn_back: "تم / العودة",
        cpr_success_title: "تمت إضافة الرقم الشخصي بنجاح!",
        cpr_success_subtitle: "هل ترغب في إضافة سجل طالب آخر؟",
        btn_add_another: "+ إضافة رقم شخصي آخر",
        btn_go_directory: "الانتقال إلى الدليل",
        modal_account_title: "حساب المستخدم",
        lbl_user_id: "معرف المستخدم:",
        lbl_username: "اسم المستخدم:",
        lbl_email: "البريد الإلكتروني:",
        chat_header: "محادثة الفريق الجماعية",
        chat_placeholder: "اكتب رسالة...",
        btn_send: "إرسال",
        btn_download_excel: "تحميل إكسل",
        btn_delete_student: "حذف الطالب",
        lbl_full_name: "الاسم الكامل:",
        lbl_cpr: "الرقم الشخصي:",
        lbl_gender: "الجنس:",
        opt_male: "ذكر",
        opt_female: "أنثى",
        lbl_cv_doc: "مستند السيرة الذاتية للطالب",
        btn_upload_cv: "رفع السيرة الذاتية",
        btn_view_cv: "📄 عرض / تحميل السيرة الذاتية",
        btn_delete_cv: "حذف السيرة الذاتية",
        lbl_no_cv: "لم يتم رفع سيرة ذاتية",
        lbl_enrolled_courses: "الدورات المسجلة",
        ph_course: "أدخل اسم الدورة (مثال: تطوير الويب)",
        btn_add_course: "+ إضافة دورة",
        btn_delete_course: "حذف الدورة",
        lbl_no_courses: "لم يتم إضافة دورات بعد.",
        lbl_no_students: "لم يتم العثور على سجلات للطلاب."
    }
};

function toggleLanguage() {
    currentLang = (currentLang === 'en') ? 'ar' : 'en';
    document.documentElement.dir = (currentLang === 'ar') ? 'rtl' : 'ltr';
    applyLanguageTranslations();
    renderStudentDirectory(studentList);
}

function applyLanguageTranslations() {
    const langObj = translations[currentLang];

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (langObj[key]) el.innerText = langObj[key];
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (langObj[key]) el.placeholder = langObj[key];
    });
}

// Monitor Auth State
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUserData = user;
        updateUserUI(true);
        listenToStudentDirectory();
        listenToGroupChat();
    } else {
        currentUserData = null;
        updateUserUI(false);
    }
});

// ==========================================
// 3. USER UI & AUTH UPDATES
// ==========================================
async function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        await auth.signInWithPopup(provider);
    } catch (error) {
        console.error("Google Sign-In Error:", error);
        alert("Sign-In Failed: " + error.message);
    }
}

function updateUserUI(isLoggedIn) {
    document.getElementById('search-box')?.classList.toggle('hidden', !isLoggedIn);
    document.getElementById('download-all-btn')?.classList.toggle('hidden', !isLoggedIn);
    document.getElementById('account-btn')?.classList.toggle('hidden', !isLoggedIn);
    document.getElementById('logout-btn')?.classList.toggle('hidden', !isLoggedIn);

    if (isLoggedIn && currentUserData) {
        const idEl = document.getElementById('modal-userid');
        const nameEl = document.getElementById('modal-username');
        const emailEl = document.getElementById('modal-email');

        const simpleUserId = currentUserData.uid 
            ? `#USR-${currentUserData.uid.substring(0, 6).toUpperCase()}`
            : '#10001';

        if (idEl) idEl.innerText = simpleUserId;
        if (nameEl) nameEl.innerText = currentUserData.displayName || currentUserData.email?.split('@')[0] || "User";
        if (emailEl) emailEl.innerText = currentUserData.email || '';

        showView('view-home');
    } else {
        showView('view-auth');
    }
}

function logoutUser() {
    auth.signOut();
}

// ==========================================
// 4. CPR RECORD MANAGEMENT
// ==========================================
async function addStudentCPR() {
    const cpr = document.getElementById('cpr-input').value.trim();
    if (cpr.length !== 9 || isNaN(cpr)) {
        alert("CPR must be exactly 9 numbers.");
        return;
    }

    try {
        const snapshot = await db.collection('students').where('cpr', '==', cpr).get();
        if (!snapshot.empty) {
            const existingDoc = snapshot.docs[0].data();
            alert(`This CPR is already in the system and was added by user: ${existingDoc.added_by || 'Unknown'}`);
            return;
        }

        const userIdentifier = currentUserData.email || currentUserData.displayName || currentUserData.uid;

        await db.collection('students').add({
            cpr: cpr,
            name: "New Student",
            gender: "male",
            email: "",
            added_by: userIdentifier,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        document.getElementById('cpr-form').reset();
        showView('view-cpr-success');
    } catch (err) {
        alert("Error adding CPR: " + err.message);
    }
}

function resetAndAddAnotherCPR() {
    document.getElementById('cpr-form').reset();
    showView('view-add-cpr');
}

// ==========================================
// 5. STUDENT DIRECTORY & EXCEL EXPORTS
// ==========================================
function listenToStudentDirectory() {
    if (!currentUserData) return;

    const activeEmail = currentUserData.email;
    const activeName = currentUserData.displayName;

    db.collection('students').onSnapshot((snapshot) => {
        studentList = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.added_by === activeEmail || data.added_by === activeName || data.added_by === currentUserData.uid) {
                studentList.push({ id: doc.id, ...data });
            }
        });

        renderStudentDirectory(studentList);
    }, (error) => {
        console.error("Error fetching students:", error);
    });
}

function handleSearch() {
    const q = document.getElementById('search-input').value.toLowerCase().trim();
    const filtered = studentList.filter(s => 
        (s.name && s.name.toLowerCase().includes(q)) || 
        (s.cpr && s.cpr.includes(q))
    );
    renderStudentDirectory(filtered);
}

// EXCEL EXPORTS
function downloadAllStudentsData() {
    if (studentList.length === 0) {
        alert("No student data available to download.");
        return;
    }

    if (typeof XLSX === 'undefined') {
        alert("Excel export library is loading, please try again in a second.");
        return;
    }

    const studentsRows = studentList.map(s => {
        const courseNames = Array.isArray(s.courses) ? s.courses.map(c => c.name).join(', ') : 'None';
        return {
            "Full Name": s.name || '',
            "CPR": s.cpr || '',
            "Gender": s.gender || '',
            "Email": s.email || '',
            "Enrolled Courses": courseNames,
            "CV Status": s.cvUrl ? 'Uploaded' : 'No CV',
            "Added By": s.added_by || ''
        };
    });

    const courseRows = [];
    studentList.forEach(s => {
        if (Array.isArray(s.courses) && s.courses.length > 0) {
            s.courses.forEach(c => {
                courseRows.push({
                    "Student Name": s.name || '',
                    "CPR": s.cpr || '',
                    "Course Name": c.name || '',
                    "Date Added": c.addedAt || ''
                });
            });
        }
    });

    const wb = XLSX.utils.book_new();
    const wsStudents = XLSX.utils.json_to_sheet(studentsRows);
    XLSX.utils.book_append_sheet(wb, wsStudents, "All Students");

    if (courseRows.length > 0) {
        const wsCourses = XLSX.utils.json_to_sheet(courseRows);
        XLSX.utils.book_append_sheet(wb, wsCourses, "Course Details");
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `All_Students_Data_${todayStr}.xlsx`);
}

function downloadSingleStudentData(studentId) {
    const student = studentList.find(s => s.id === studentId);
    if (!student) {
        alert("Student record not found.");
        return;
    }

    if (typeof XLSX === 'undefined') {
        alert("Excel export library is loading, please try again in a second.");
        return;
    }

    const recordRows = [
        ["STUDENT RECORD INFORMATION", ""],
        ["Full Name", student.name || 'N/A'],
        ["CPR", student.cpr || 'N/A'],
        ["Gender", student.gender || 'N/A'],
        ["Email", student.email || 'N/A'],
        ["Added By", student.added_by || 'N/A'],
        ["CV Upload Status", student.cvUrl ? `Uploaded (${student.cvName || 'File'})` : 'No CV Uploaded'],
        ["", ""],
        ["ENROLLED COURSES", "ADDED DATE"]
    ];

    if (Array.isArray(student.courses) && student.courses.length > 0) {
        student.courses.forEach(c => {
            recordRows.push([c.name, c.addedAt || '']);
        });
    } else {
        recordRows.push(["No courses enrolled", ""]);
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(recordRows);
    XLSX.utils.book_append_sheet(wb, ws, "Student Details");

    XLSX.writeFile(wb, `Student_${student.cpr || studentId}.xlsx`);
}

function renderStudentDirectory(list) {
    const container = document.getElementById('student-container');
    container.innerHTML = "";

    const t = translations[currentLang];

    if (list.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#a0aec0; padding:20px;">${t.lbl_no_students}</p>`;
        return;
    }

    list.forEach((student) => {
        const item = document.createElement('div');
        item.className = "student-item";

        // Enrolled courses
        let coursesHTML = "";
        if (student.courses && Array.isArray(student.courses) && student.courses.length > 0) {
            coursesHTML = student.courses.map((c, index) => `
                <li style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:8px 12px; border: 1px solid #e2e8f0; border-radius:6px; margin-bottom:6px; font-size:0.88rem;">
                    <div>
                        <strong style="color: #2d3748;">${c.name}</strong> 
                        <span style="color:#718096; margin-left:8px; font-size:0.80rem;">(${c.addedAt})</span>
                    </div>
                    <button type="button" onclick="removeCourse('${student.id}', ${index})" 
                        style="background: #fff5f5; border: 1px solid #feb2b2; color: #e53e3e; cursor: pointer; font-size: 0.75rem; padding: 4px 10px; border-radius: 100px; transition: all 0.2s;" 
                        onmouseover="this.style.background='#fee2e2'" 
                        onmouseout="this.style.background='#fff5f5'"
                    >
                        ${t.btn_delete_course}
                    </button>
                </li>
            `).join("");
        } else {
            coursesHTML = `<p style="font-size:0.82rem; color:#a0aec0; margin-top:4px;">${t.lbl_no_courses}</p>`;
        }

        // CV status
        const cvDisplay = student.cvUrl 
            ? `<div style="display: flex; align-items: center; gap: 8px;">
                <a href="${student.cvUrl}" download="${student.cvName || 'Student_CV'}" target="_blank" style="color:var(--accent-slate-blue, #2b6cb0); font-weight:600; text-decoration:underline; font-size:0.85rem;">${t.btn_view_cv}</a>
                <button type="button" onclick="deleteStudentCV('${student.id}')" 
                    style="background: #fff5f5; border: 1px solid #feb2b2; color: #e53e3e; cursor: pointer; font-size: 0.75rem; padding: 4px 10px; border-radius: 100px; transition: all 0.2s;" 
                    onmouseover="this.style.background='#fee2e2'" 
                    onmouseout="this.style.background='#fff5f5'"
                >
                    ${t.btn_delete_cv}
                </button>
               </div>`
            : `<span style="color:#a0aec0; font-size:0.85rem;">${t.lbl_no_cv}</span>`;

        // Render Student Card
        item.innerHTML = `
            <div class="student-header" onclick="this.nextElementSibling.classList.toggle('hidden')">
                <span>${student.name} (${student.cpr})</span>
                <svg class="arrow-icon" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
            <div class="student-details hidden">
                <div class="student-actions-wrapper" style="display: flex; gap: 8px; justify-content: flex-end; margin-bottom: 12px;">
                    <button class="nav-btn" onclick="downloadSingleStudentData('${student.id}')" style="background: #edf2f7; border: 1px solid #cbd5e0; color: #2d3748; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.82rem;">${t.btn_download_excel}</button>
                    <button class="delete-icon-btn" onclick="deleteStudent('${student.id}')">${t.btn_delete_student}</button>
                </div>
                
                <div class="grid-form">
                    <label>${t.lbl_full_name} 
                        <input type="text" value="${student.name || ''}" onchange="updateStudentField('${student.id}', 'name', this.value)">
                    </label>
                    <label>${t.lbl_cpr} 
                        <input type="text" value="${student.cpr}" readonly>
                    </label>
                    <label>${t.lbl_gender} 
                        <select onchange="updateStudentField('${student.id}', 'gender', this.value)">
                            <option value="male" ${student.gender === 'male' ? 'selected' : ''}>${t.opt_male}</option>
                            <option value="female" ${student.gender === 'female' ? 'selected' : ''}>${t.opt_female}</option>
                        </select>
                    </label>
                    <label>${t.lbl_email} 
                        <input type="email" value="${student.email || ''}" onchange="updateStudentField('${student.id}', 'email', this.value)">
                    </label>
                </div>

                <hr style="margin: 16px 0; border: none; border-top: 1px solid var(--border-color, #e2e8f0);">

                <div style="margin-bottom: 16px;">
                    <h4 style="margin-bottom: 8px; color: var(--accent-slate-blue, #2b6cb0);">${t.lbl_cv_doc}</h4>
                    <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                        <input type="file" id="cv-input-${student.id}" accept=".pdf,.doc,.docx" style="font-size: 0.85rem;">
                        <button type="button" class="primary-btn" onclick="uploadStudentCV('${student.id}')" style="padding: 6px 12px; font-size: 0.85rem;">${t.btn_upload_cv}</button>
                        <div style="margin-left: auto;">${cvDisplay}</div>
                    </div>
                </div>

                <hr style="margin: 16px 0; border: none; border-top: 1px solid var(--border-color, #e2e8f0);">

                <div>
                    <h4 style="margin-bottom: 8px; color: var(--accent-slate-blue, #2b6cb0);">${t.lbl_enrolled_courses}</h4>
                    <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                        <input type="text" id="course-input-${student.id}" placeholder="${t.ph_course}" style="flex: 1; padding: 8px; border: 1px solid var(--border-color, #e2e8f0); border-radius: 6px; font-size: 0.85rem;">
                        <button type="button" class="primary-btn" onclick="addCourseToStudent('${student.id}')" style="padding: 6px 14px; font-size: 0.85rem;">${t.btn_add_course}</button>
                    </div>
                    
                    <ul style="list-style: none; padding: 0; margin: 0;">
                        ${coursesHTML}
                    </ul>
                </div>
            </div>
        `;
        container.appendChild(item);
    });
}

async function updateStudentField(id, field, value) {
    await db.collection('students').doc(id).update({ [field]: value });
}

async function deleteStudent(id) {
    if (confirm("Delete this student entry?")) {
        await db.collection('students').doc(id).delete();
    }
}

// ==========================================
// 6. COURSE MANAGEMENT
// ==========================================
async function addCourseToStudent(studentId) {
    const inputEl = document.getElementById(`course-input-${studentId}`);
    if (!inputEl) return;

    const courseName = inputEl.value.trim();
    if (!courseName) {
        alert("Please enter a course name.");
        return;
    }

    const now = new Date();
    const formattedDateTime = now.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    }) + ", " + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newCourseObj = {
        name: courseName,
        addedAt: formattedDateTime
    };

    try {
        const studentRef = db.collection('students').doc(studentId);
        const docSnap = await studentRef.get();
        if (!docSnap.exists) return;

        const data = docSnap.data();
        let currentCourses = Array.isArray(data.courses) ? data.courses : [];
        currentCourses.push(newCourseObj);

        await studentRef.update({ courses: currentCourses });
        inputEl.value = "";
    } catch (err) {
        console.error("Error adding course:", err);
        alert("Error adding course: " + err.message);
    }
}

async function removeCourse(studentId, courseIndex) {
    if (!confirm("Are you sure you want to delete this course?")) return;

    try {
        const studentRef = db.collection('students').doc(studentId);
        const docSnap = await studentRef.get();

        if (docSnap.exists) {
            const data = docSnap.data();
            let existingCourses = Array.isArray(data.courses) ? data.courses : [];
            existingCourses.splice(courseIndex, 1);
            await studentRef.update({ courses: existingCourses });
        }
    } catch (err) {
        console.error("Error removing course:", err);
        alert("Failed to delete course: " + err.message);
    }
}

// ==========================================
// 7. CV UPLOAD & DELETE
// ==========================================
async function uploadStudentCV(studentId) {
    const fileInput = document.getElementById(`cv-input-${studentId}`);
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        alert("Please select a file first!");
        return;
    }

    const file = fileInput.files[0];
    if (file.size > 700 * 1024) {
        alert("File size is too large! Please select a file under 700KB.");
        return;
    }

    const reader = new FileReader();
    reader.onload = async function (e) {
        try {
            await db.collection('students').doc(studentId).update({
                cvUrl: e.target.result,
                cvName: file.name
            });
            alert("CV uploaded and saved successfully!");
        } catch (err) {
            console.error("Firestore CV update error:", err);
            alert("Failed to save CV: " + err.message);
        }
    };
    reader.readAsDataURL(file);
}

async function deleteStudentCV(studentId) {
    if (!confirm("Are you sure you want to delete this CV?")) return;

    try {
        await db.collection('students').doc(studentId).update({
            cvUrl: firebase.firestore.FieldValue.delete(),
            cvName: firebase.firestore.FieldValue.delete()
        });
        alert("CV deleted successfully!");
    } catch (err) {
        console.error("Error deleting CV:", err);
        alert("Failed to delete CV: " + err.message);
    }
}

// ==========================================
// 8. REAL-TIME GROUP CHAT
// ==========================================
function listenToGroupChat() {
    db.collection('chat_messages')
      .orderBy('timestamp', 'asc')
      .limitToLast(50)
      .onSnapshot((snapshot) => {
          const box = document.getElementById('chat-messages');
          if (!box) return;

          box.innerHTML = "";

          snapshot.forEach(doc => {
              const m = doc.data();
              const div = document.createElement('div');
              div.className = "chat-msg";
              
              const senderName = m.username || "Anonymous";
              const textContent = m.message || "";

              div.innerHTML = `<strong>${escapeHTML(senderName)}:</strong> ${escapeHTML(textContent)}`;
              box.appendChild(div);
          });

          box.scrollTop = box.scrollHeight;
      }, (error) => {
          console.error("Chat permission error:", error);
      });
}

async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    if (!input) return;

    const message = input.value.trim();
    if (!message || !currentUserData) return;

    try {
        const displayName = currentUserData.displayName 
            || (currentUserData.email ? currentUserData.email.split('@')[0] : "User");

        input.value = "";

        await db.collection('chat_messages').add({
            username: displayName,
            message: message,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (err) {
        console.error("Failed to send message:", err);
        alert("Failed to send message: " + err.message);
    }
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// ==========================================
// 9. NAVIGATION, MODALS & LIVE CLOCK
// ==========================================
function showView(id) {
    document.querySelectorAll('.card-view').forEach(v => v.classList.add('hidden'));
    document.getElementById(id)?.classList.remove('hidden');
}

function openAccountModal() { document.getElementById('account-modal').classList.remove('hidden'); }
function closeAccountModal() { document.getElementById('account-modal').classList.add('hidden'); }
function toggleChatWindow() { document.getElementById('chat-window').classList.toggle('hidden'); }

function runLiveFooterClock() {
    const el = document.getElementById('live-footer-datetime');
    if (el) {
        setInterval(() => {
            const now = new Date();
            el.innerText = now.toLocaleDateString(currentLang === 'ar' ? 'ar-BH' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + " | " + now.toLocaleTimeString();
        }, 1000);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    runLiveFooterClock();
    applyLanguageTranslations();
});
