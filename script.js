// Persistent State Management using localStorage
let currentUser = localStorage.getItem('tp_currentUser') || "Guest";
let currentUserEmail = localStorage.getItem('tp_currentUserEmail') || "";
let currentLang = localStorage.getItem('tp_currentLang') || "en";

// Load students or default to empty array
let studentDatabase = JSON.parse(localStorage.getItem('tp_studentDatabase')) || [];

function saveStateToStorage() {
    localStorage.setItem('tp_currentUser', currentUser);
    localStorage.setItem('tp_currentUserEmail', currentUserEmail);
    localStorage.setItem('tp_currentLang', currentLang);
    localStorage.setItem('tp_studentDatabase', JSON.stringify(studentDatabase));
}

// Live Clock System
function runLiveClock() {
    const clock = document.getElementById('live-clock');
    if (!clock) return;
    const update = () => {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
        clock.textContent = now.toLocaleDateString(currentLang === 'en' ? 'en-US' : 'ar-BH', options);
    };
    update();
    setInterval(update, 1000);
}

// Single-Page View Router Engine
function showView(viewId) {
    document.getElementById('view-auth').classList.add('hidden');
    document.getElementById('view-cpr').classList.add('hidden');
    document.getElementById('view-home').classList.add('hidden');
    document.getElementById('main-nav').classList.add('hidden');

    document.getElementById(viewId).classList.remove('hidden');
    if (viewId !== 'view-auth') {
        document.getElementById('main-nav').classList.remove('hidden');
    }
}

// Account Modal Engine
const userModal = document.getElementById('user-modal');
const accountBtn = document.getElementById('nav-account-btn');
const closeModal = document.getElementById('close-modal');

accountBtn.addEventListener('click', () => {
    document.getElementById('modal-username').textContent = currentUser;
    document.getElementById('modal-email').textContent = currentUserEmail || 'Not specified';
    userModal.classList.remove('hidden');
});

closeModal.addEventListener('click', () => userModal.classList.add('hidden'));
window.addEventListener('click', (e) => {
    if (e.target === userModal) userModal.classList.add('hidden');
});

// Authentication Toggle Engine
const authToggle = document.getElementById('auth-toggle');
let isSignUpMode = false;
authToggle.addEventListener('click', (e) => {
    e.preventDefault();
    isSignUpMode = !isSignUpMode;
    document.querySelectorAll('.signup-only').forEach(el => el.classList.toggle('hidden', !isSignUpMode));
    
    const title = document.getElementById('auth-title');
    const submitBtn = document.getElementById('btn-submit');
    const toggleTxt = document.getElementById('txt-toggle');
    
    if (isSignUpMode) {
        title.setAttribute('data-en', 'Create Account'); title.setAttribute('data-ar', 'إنشاء حساب');
        submitBtn.setAttribute('data-en', 'Sign Up'); submitBtn.setAttribute('data-ar', 'إنشاء حساب');
        toggleTxt.setAttribute('data-en', 'Already have an account?'); toggleTxt.setAttribute('data-ar', 'لديك حساب بالفعل؟');
        authToggle.setAttribute('data-en', 'Sign In'); authToggle.setAttribute('data-ar', 'تسجيل الدخول');
    } else {
        title.setAttribute('data-en', 'Sign In'); title.setAttribute('data-ar', 'تسجيل الدخول');
        submitBtn.setAttribute('data-en', 'Sign In'); submitBtn.setAttribute('data-ar', 'تسجيل الدخول');
        toggleTxt.setAttribute('data-en', "Don't have an account?"); toggleTxt.setAttribute('data-ar', 'ليس لديك حساب؟');
        authToggle.setAttribute('data-en', 'Create Account'); authToggle.setAttribute('data-ar', 'إنشاء حساب');
    }
    updateLanguageLayout();
});

document.getElementById('auth-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const usernameInput = document.getElementById('auth-username').value.trim();
    const emailInput = document.getElementById('auth-email').value.trim();
    
    currentUserEmail = emailInput;
    currentUser = isSignUpMode && usernameInput ? usernameInput : (emailInput.split('@')[0]);
    
    saveStateToStorage();
    showView('view-cpr');
});

// CPR Form Submission & Validation
document.getElementById('add-student-btn').addEventListener('click', () => {
    const cprInput = document.getElementById('cpr-input').value.trim();
    
    if (cprInput.length !== 9 || isNaN(cprInput) || parseInt(cprInput) <= 0) {
        alert("CPR must be exactly 9 numbers and greater than 0!");
        return;
    }

    const existingStudent = studentDatabase.find(s => s.cpr === cprInput);
    if (existingStudent) {
        alert("this student orady added by " + currentUser + " ");
    } else {
        const newStudent = {
            name: "New Student",
            cpr: cprInput,
            gender: "male",
            email: "",
            status: "student",
            courses: "",
            ministry: "no",
            degree: "high-school",
            photo: ""
        };
        studentDatabase.push(newStudent);
        saveStateToStorage();
        
        alert("the student addes succussfly ");
        
        renderStudentDirectory();
        showView('view-home');
        document.getElementById('cpr-form').reset();
    }
});

// Student Delete Action
function deleteStudent(index) {
    if (confirm("Delete this student entry?")) {
        studentDatabase.splice(index, 1);
        saveStateToStorage();
        renderStudentDirectory();
    }
}

// Image Preview Renderer & Data Persistence
function previewImage(event, index) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById(`preview-${index}`).src = e.target.result;
            studentDatabase[index].photo = e.target.result;
            saveStateToStorage();
        };
        reader.readAsDataURL(file);
    }
}

// Field Input Helper for Real-Time Storage
function updateStudentField(index, field, value) {
    studentDatabase[index][field] = value;
    saveStateToStorage();
}

// Student Directory Rendering Function
function renderStudentDirectory() {
    const container = document.getElementById('student-container');
    container.innerHTML = "";
    
    if (studentDatabase.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-folder-open"></i>
                <p>No student records found. Click the + button above to add one.</p>
            </div>`;
        return;
    }
    
    studentDatabase.forEach((student, index) => {
        const item = document.createElement('div');
        item.className = "student-item";
        item.innerHTML = `
            <div class="student-header" onclick="this.nextElementSibling.classList.toggle('hidden')">
                <div class="header-left">
                    <img src="${student.photo || 'https://via.placeholder.com/90?text=Photo'}" class="student-mini-avatar" alt="Mini Avatar">
                    <span class="student-name">${student.name}</span>
                </div>
                <i class="fa-solid fa-chevron-down accordion-icon"></i>
            </div>
            <div class="student-details hidden">
                <div class="student-actions-wrapper">
                    <button class="action-btn delete-btn" onclick="deleteStudent(${index})" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
                </div>

                <!-- TOP-LEFT PHOTO LAYOUT SECTION -->
                <div class="profile-layout-header">
                    <div class="student-photo-container">
                        <img id="preview-${index}" src="${student.photo || 'https://via.placeholder.com/90?text=Photo'}" alt="Student Photo" class="student-photo-img">
                        <label class="photo-upload-overlay" for="file-input-${index}" title="Change Photo">
                            <i class="fa-solid fa-camera"></i>
                        </label>
                        <input type="file" id="file-input-${index}" class="hidden-file-input" accept="image/*" onchange="previewImage(event, ${index})">
                    </div>
                    <div class="profile-brief">
                        <h4>${student.name}</h4>
                        <span class="cpr-badge"><i class="fa-solid fa-id-badge"></i> CPR: ${student.cpr}</span>
                    </div>
                </div>
                
                <div class="grid-form">
                    <label>Full Name: 
                        <input type="text" value="${student.name}" onchange="updateStudentField(${index}, 'name', this.value); renderStudentDirectory();">
                    </label>
                    <label>CPR Number: 
                        <input type="text" value="${student.cpr}" readonly class="readonly-input">
                    </label>
                    <label>Upload Photo: 
                        <input type="file" accept="image/*" onchange="previewImage(event, ${index})">
                    </label>
                    <label>Gender: 
                        <select onchange="updateStudentField(${index}, 'gender', this.value)">
                            <option value="male" ${student.gender === 'male' ? 'selected' : ''}>Male</option>
                            <option value="female" ${student.gender === 'female' ? 'selected' : ''}>Female</option>
                        </select>
                    </label>
                    <label>Email: 
                        <input type="email" value="${student.email}" onchange="updateStudentField(${index}, 'email', this.value)">
                    </label>
                    <label>CV Document: 
                        <input type="file" accept=".pdf">
                    </label>
                    <label>Status: 
                        <select onchange="updateStudentField(${index}, 'status', this.value)">
                            <option value="student" ${student.status === 'student' ? 'selected' : ''}>Student</option>
                            <option value="graduate" ${student.status === 'graduate' ? 'selected' : ''}>Graduate</option>
                        </select>
                    </label>
                    <label>Courses: 
                        <input type="text" value="${student.courses}" onchange="updateStudentField(${index}, 'courses', this.value)">
                    </label>
                    <label>Ministry of Labour: 
                        <select onchange="updateStudentField(${index}, 'ministry', this.value)">
                            <option value="yes" ${student.ministry === 'yes' ? 'selected' : ''}>Yes</option>
                            <option value="no" ${student.ministry === 'no' ? 'selected' : ''}>No</option>
                        </select>
                    </label>
                    <label>Degree: 
                        <select onchange="updateStudentField(${index}, 'degree', this.value)">
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

// Navbar Action Bindings
document.getElementById('nav-home-btn').addEventListener('click', () => showView('view-home'));
document.getElementById('page-add-btn').addEventListener('click', () => showView('view-cpr'));
document.getElementById('nav-logout-btn').addEventListener('click', () => {
    if (confirm("Sign out of current account?")) {
        currentUser = "Guest";
        currentUserEmail = "";
        saveStateToStorage();
        document.getElementById('auth-form').reset();
        showView('view-auth');
    }
});

// Multi-language Toggle Engine
function updateLanguageLayout() {
    document.querySelectorAll('[data-en]').forEach(el => {
        el.textContent = el.getAttribute(`data-${currentLang}`);
    });
    document.body.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;
}

document.getElementById('lang-toggle').addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'ar' : 'en';
    saveStateToStorage();
    updateLanguageLayout();
});

// Application Startup Initialization
window.addEventListener('DOMContentLoaded', () => {
    runLiveClock();
    updateLanguageLayout();
    renderStudentDirectory();
    
    // Auto restore session if user was logged in
    if (currentUser && currentUser !== "Guest") {
        showView('view-home');
    } else {
        showView('view-auth');
    }
});
