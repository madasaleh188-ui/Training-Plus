let currentUser = "Guest";
let currentLang = "en";
const studentDatabase = [];

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

// View Routing Engine
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

// Authentication Toggle Form Context
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
    currentUser = isSignUpMode && usernameInput ? usernameInput : (document.getElementById('auth-email').value.split('@')[0]);
    showView('view-cpr');
});

// Precise Alert Constraints Matches
document.getElementById('add-student-btn').addEventListener('click', () => {
    const cprInput = document.getElementById('cpr-input').value.trim();
    
    if (cprInput.length !== 9 || isNaN(cprInput) || parseInt(cprInput) <= 0) {
        alert("CPR must be exactly 9 numbers and greater than 0!");
        return;
    }

    const existingStudent = studentDatabase.find(s => s.cpr === cprInput);
    if (existingStudent) {
        // EXACT REQUIRED STRING MATCH
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
            degree: "high-school"
        };
        studentDatabase.push(newStudent);
        // EXACT REQUIRED STRING MATCH
        alert("the student addes succussfly ");
        
        renderStudentDirectory();
        showView('view-home');
        document.getElementById('cpr-form').reset();
    }
});

function deleteStudent(index) {
    if (confirm("Delete this entry?")) {
        studentDatabase.splice(index, 1);
        renderStudentDirectory();
    }
}

// Render Engine mapping literal assignment labels
function renderStudentDirectory() {
    const container = document.getElementById('student-container');
    container.innerHTML = "";
    
    if (studentDatabase.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#a0aec0; padding:20px;">No records found.</p>`;
        return;
    }
    
    studentDatabase.forEach((student, index) => {
        const item = document.createElement('div');
        item.className = "student-item";
        item.innerHTML = `
            <div class="student-header" onclick="this.nextElementSibling.classList.toggle('hidden')">
                <span class="student-name">${student.name}</span>
                <span class="dropdown-icon-v2"><i class="fa-solid fa-angle-down"></i></span>
            </div>
            <div class="student-details hidden">
                <div class="student-actions-wrapper">
                    <button class="edit-pin-v2" title="Edit Info"><i class="fa-solid fa-thumbtack"></i></button>
                    <button class="delete-btn-v2" onclick="deleteStudent(${index})" title="Delete"><i class="fa-solid fa-trash-can" style="color: #e53e3e;"></i></button>
                </div>
                
                <div class="grid-form">
                    <label>full name: <input type="text" value="${student.name}" onchange="studentDatabase[${index}].name = this.value; renderStudentDirectory()"></label>
                    <label>cpr: <input type="text" value="${student.cpr}" readonly></label>
                    <label>gander: 
                        <select>
                            <option value="male" ${student.gender === 'male' ? 'selected' : ''}>male</option>
                            <option value="female" ${student.gender === 'female' ? 'selected' : ''}>femal</option>
                        </select>
                    </label>
                    <label>email: <input type="email" value="${student.email}"></label>
                    <label>cv: <input type="file" accept=".pdf"></label>
                    <label>stat: 
                        <select>
                            <option value="student" ${student.status === 'student' ? 'selected' : ''}>student</option>
                            <option value="graduate" ${student.status === 'graduate' ? 'selected' : ''}>gradouate</option>
                        </select>
                    </label>
                    <label>courses: <input type="text" value="${student.courses}"></label>
                    <label>with the ministiry of labur: 
                        <select>
                            <option value="yes" ${student.ministry === 'yes' ? 'selected' : ''}>yes</option>
                            <option value="no" ${student.ministry === 'no' ? 'selected' : ''}>no</option>
                        </select>
                    </label>
                    <label>degree: 
                        <select>
                            <option value="high-school" ${student.degree === 'high-school' ? 'selected' : ''}>high school</option>
                            <option value="diploma" ${student.degree === 'diploma' ? 'selected' : ''}>doploma</option>
                            <option value="bachelor" ${student.degree === 'bachelor' ? 'selected' : ''}>bacholarios</option>
                            <option value="master" ${student.degree === 'master' ? 'selected' : ''}>master</option>
                            <option value="phd" ${student.degree === 'phd' ? 'selected' : ''}>phd</option>
                            <option value="other" ${student.degree === 'other' ? 'selected' : ''}>other</option>
                        </select>
                    </label>
                </div>
            </div>
        `;
        container.appendChild(item);
    });
}

// Navigation Actions
document.getElementById('nav-home-btn').addEventListener('click', () => showView('view-home'));
document.getElementById('page-add-btn').addEventListener('click', () => showView('view-cpr'));
document.getElementById('nav-logout-btn').addEventListener('click', () => {
    document.getElementById('auth-form').reset();
    showView('view-auth');
});

// Language Switch
function updateLanguageLayout() {
    document.querySelectorAll('[data-en]').forEach(el => {
        el.textContent = el.getAttribute(`data-${currentLang}`);
    });
    document.body.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;
}

document.getElementById('lang-toggle').addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'ar' : 'en';
    updateLanguageLayout();
});

window.addEventListener('DOMContentLoaded', () => {
    runLiveClock();
    renderStudentDirectory();
    showView('view-auth');
});
