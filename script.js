let currentUser = "Guest";
let currentUserEmail = "";
let currentLang = "en";
let studentDatabase = [];

// Language Dictionary
const translations = {
    en: {
        authTitle: "Welcome to Training Plus",
        authDesc: "Please log in or create an account to access student management.",
        labelUser: "Username:",
        labelEmail: "Email:",
        labelPass: "Password:",
        btnLogin: "Sign In / Sign Up",
        dashTitle: "Student Directory",
        btnAddCpr: "+ Add New CPR",
        cprTitle: "Register New CPR",
        cprLabel: "CPR Number (9 Digits):",
        btnSubmit: "Submit Record",
        btnCancel: "Cancel",
        modalTitle: "User Account Details"
    },
    ar: {
        authTitle: "مرحباً بكم في ترينينج بلس",
        authDesc: "يرجى تسجيل الدخول أو إنشاء حساب للوصول إلى إدارة الطلاب.",
        labelUser: "اسم المستخدم:",
        labelEmail: "البريد الإلكتروني:",
        labelPass: "كلمة المرور:",
        btnLogin: "تسجيل الدخول / التسجيل",
        dashTitle: "سجل الطلاب",
        btnAddCpr: "+ إضافة شخصي جديد",
        cprTitle: "تسجيل الرقم الشخصي",
        cprLabel: "الرقم الشخصي (9 أرقام):",
        btnSubmit: "إرسال البيانات",
        btnCancel: "إلغاء",
        modalTitle: "تفاصيل حساب المستخدم"
    }
};

// Toggle Language Mode
document.getElementById('lang-toggle').addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'ar' : 'en';
    document.getElementById('lang-toggle').innerText = currentLang === 'en' ? 'العربية' : 'English';
    document.body.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');
    applyTranslations();
});

function applyTranslations() {
    const t = translations[currentLang];
    document.getElementById('txt-auth-title').innerText = t.authTitle;
    document.getElementById('txt-auth-desc').innerText = t.authDesc;
    document.getElementById('txt-label-user').innerText = t.labelUser;
    document.getElementById('txt-label-email').innerText = t.labelEmail;
    document.getElementById('txt-label-pass').innerText = t.labelPass;
    document.getElementById('btn-login').innerText = t.btnLogin;
    document.getElementById('txt-dashboard-title').innerText = t.dashTitle;
    document.getElementById('btn-go-add').innerText = t.btnAddCpr;
    document.getElementById('txt-cpr-title').innerText = t.cprTitle;
    document.getElementById('txt-cpr-label').innerText = t.cprLabel;
    document.getElementById('add-student-btn').innerText = t.btnSubmit;
    document.getElementById('btn-cancel').innerText = t.btnCancel;
    document.getElementById('txt-modal-title').innerText = t.modalTitle;
}

// Live Navigation Clock
function runLiveClock() {
    const clockEl = document.getElementById('clock');
    setInterval(() => {
        const now = new Date();
        clockEl.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }, 1000);
}

// View Routing Switcher
function showView(viewId) {
    document.querySelectorAll('.card-view').forEach(view => view.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');
}

// User Sign-In Handler
document.getElementById('auth-form').addEventListener('submit', (e) => {
    e.preventDefault();
    currentUser = document.getElementById('auth-username').value.trim();
    currentUserEmail = document.getElementById('auth-email').value.trim();
    
    document.getElementById('modal-username').innerText = currentUser;
    document.getElementById('modal-email').innerText = currentUserEmail;
    
    showView('view-home');
    fetchStudentDirectory();
});

function logoutUser() {
    currentUser = "Guest";
    currentUserEmail = "";
    document.getElementById('auth-form').reset();
    showView('view-auth');
}

// Modal Handlers
function openAccountModal() {
    document.getElementById('account-modal').classList.remove('hidden');
}

function closeAccountModal() {
    document.getElementById('account-modal').classList.add('hidden');
}

// Fetch Records from MySQL Server
async function fetchStudentDirectory() {
    try {
        const response = await fetch('api.php?action=get_students');
        studentDatabase = await response.json();
        renderStudentDirectory();
    } catch (err) {
        console.error("Failed to load records from MySQL:", err);
    }
}

// Add Student Record
document.getElementById('add-student-btn').addEventListener('click', async () => {
    const cprInput = document.getElementById('cpr-input').value.trim();

    if (cprInput.length !== 9 || isNaN(cprInput) || parseInt(cprInput) <= 0) {
        alert("CPR must be exactly 9 numbers and greater than 0!");
        return;
    }

    try {
        const response = await fetch('api.php?action=add_student', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cpr: cprInput })
        });

        const result = await response.json();
        alert(result.message);

        if (result.status === 'success') {
            document.getElementById('cpr-form').reset();
            showView('view-home');
            fetchStudentDirectory();
        }
    } catch (err) {
        alert("Server communication failed.");
    }
});

// Inline Field Updates
async function updateStudentField(id, field, value) {
    await fetch('api.php?action=update_student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, field, value })
    });
}

// Photo Upload Handler
async function uploadStudentPhoto(event, id) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('id', id);
    formData.append('photo', file);

    const response = await fetch('api.php?action=upload_photo', {
        method: 'POST',
        body: formData
    });

    const result = await response.json();
    if (result.status === 'success') {
        fetchStudentDirectory();
    } else {
        alert("Failed to upload image.");
    }
}

// Delete Record
async function deleteStudent(id) {
    if (confirm("Are you sure you want to delete this student entry?")) {
        await fetch('api.php?action=delete_student', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        fetchStudentDirectory();
    }
}

// Render Student Cards
function renderStudentDirectory() {
    const container = document.getElementById('student-container');
    container.innerHTML = "";

    if (!studentDatabase || studentDatabase.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#a0aec0; padding:20px;">No records found in database.</p>`;
        return;
    }

    studentDatabase.forEach((student) => {
        const item = document.createElement('div');
        item.className = "student-item";
        item.innerHTML = `
            <div class="student-header" onclick="this.nextElementSibling.classList.toggle('hidden')">
                <span class="student-name">${student.name}</span>
                <span>▼</span>
            </div>
            <div class="student-details hidden">
                <div class="student-actions-wrapper">
                    <button class="action-btn" onclick="deleteStudent(${student.id})" title="Delete">🗑️</button>
                </div>

                <div class="student-photo-container">
                    <img src="${student.photo || 'https://via.placeholder.com/90?text=Photo'}" alt="Student Photo" class="student-photo-img">
                </div>

                <div class="grid-form">
                    <label>Full Name: 
                        <input type="text" value="${student.name}" onchange="updateStudentField(${student.id}, 'name', this.value)">
                    </label>
                    <label>CPR: 
                        <input type="text" value="${student.cpr}" readonly>
                    </label>
                    <label>Upload Photo: 
                        <input type="file" accept="image/*" onchange="uploadStudentPhoto(event, ${student.id})">
                    </label>
                    <label>Gender: 
                        <select onchange="updateStudentField(${student.id}, 'gender', this.value)">
                            <option value="male" ${student.gender === 'male' ? 'selected' : ''}>Male</option>
                            <option value="female" ${student.gender === 'female' ? 'selected' : ''}>Female</option>
                        </select>
                    </label>
                    <label>Email: 
                        <input type="email" value="${student.email || ''}" onchange="updateStudentField(${student.id}, 'email', this.value)">
                    </label>
                    <label>Status: 
                        <select onchange="updateStudentField(${student.id}, 'status', this.value)">
                            <option value="student" ${student.status === 'student' ? 'selected' : ''}>Student</option>
                            <option value="graduate" ${student.status === 'graduate' ? 'selected' : ''}>Graduate</option>
                        </select>
                    </label>
                    <label>Courses: 
                        <input type="text" value="${student.courses || ''}" onchange="updateStudentField(${student.id}, 'courses', this.value)">
                    </label>
                    <label>Ministry of Labour: 
                        <select onchange="updateStudentField(${student.id}, 'ministry', this.value)">
                            <option value="yes" ${student.ministry === 'yes' ? 'selected' : ''}>Yes</option>
                            <option value="no" ${student.ministry === 'no' ? 'selected' : ''}>No</option>
                        </select>
                    </label>
                    <label>Degree: 
                        <select onchange="updateStudentField(${student.id}, 'degree', this.value)">
                            <option value="high-school" ${student.degree === 'high-school' ? 'selected' : ''}>High School</option>
                            <option value="diploma" ${student.degree === 'diploma' ? 'selected' : ''}>Diploma</option>
                            <option value="bachelor" ${student.degree === 'bachelor' ? 'selected' : ''}>Bachelor</option>
                            <option value="master" ${student.degree === 'master' ? 'selected' : ''}>Master</option>
                            <option value="phd" ${student.degree === 'phd' ? 'selected' : ''}>PhD</option>
                            <option value="other" ${student.degree === 'other' ? 'selected' : ''}>Other</option>
                        </select>
                    </label>
                </div>
            </div>
        `;
        container.appendChild(item);
    });
}

// App Initialization
window.addEventListener('DOMContentLoaded', () => {
    runLiveClock();
    showView('view-auth');
});
