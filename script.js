// Local In-Memory State Mocking Management
let currentUser = "Guest";
let currentLang = "en";
const studentDatabase = [
    { name: "Ali Mansoor", cpr: "020304050", gender: "male", email: "ali@example.com", status: "graduate", courses: "Web Dev 101", ministry: "yes", degree: "bachelor" }
];

// 1. Dynamic Live Clock
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

// 2. Front-end Navigation Engine
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

// 3. Auth Toggle (Sign In / Create Account)
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

// Auth Submit Form Handling
document.getElementById('auth-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const usernameInput = document.getElementById('auth-username').value.trim();
    currentUser = isSignUpMode && usernameInput ? usernameInput : (document.getElementById('auth-email').value.split('@')[0]);
    showView('view-cpr');
});

// 4. CPR Form Processing & Validations
document.getElementById('add-student-btn').addEventListener('click', () => {
    const cprInput = document.getElementById('cpr-input').value.trim();
    
    // Rule Checklist: 9 units long, completely numeric evaluation, positive threshold
    if (cprInput.length !== 9 || isNaN(cprInput) || parseInt(cprInput) <= 0) {
        alert(currentLang === 'en' ? "CPR must be exactly 9 numbers and greater than 0!" : "يجب أن يتكون الرقم الشخصي من 9 أرقams وأكبر من 0!");
        return;
    }

    // Uniqueness constraint checking
    const existingStudent = studentDatabase.find(s => s.cpr === cprInput);
    if (existingStudent) {
        alert(currentLang === 'en' ? `This student already added by ${currentUser}` : `تم إضافة هذا الطالب بالفعل بواسطة ${currentUser}`);
    } else {
        // Pre-fill target item template schema collection context
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
        alert(currentLang === 'en' ? "The student added successfully" : "تم إضافة الطالب بنجاح");
        
        renderStudentDirectory();
        showView('view-home');
        document.getElementById('cpr-form').reset();
    }
});

// 5. Render Accordions Dynamic Engine
function renderStudentDirectory() {
    const container = document.getElementById('student-container');
    container.innerHTML = "";
    
    studentDatabase.forEach((student, index) => {
        const item = document.createElement('div');
        item.className = "student-item";
        item.innerHTML = `
            <div class="student-header" onclick="this.nextElementSibling.classList.toggle('hidden')">
                <span class="student-name">${student.name}</span>
                <span>▼</span>
            </div>
            <div class="student-details hidden">
                <button class="edit-pin" onclick="alert('Editing enabled for field inputs!')" title="Edit Info">📌</button>
                <div class="grid-form">
                    <label>Full Name: <input type="text" value="${student.name}" onchange="studentDatabase[${index}].name = this.value; renderStudentDirectory()"></label>
                    <label>CPR: <input type="text" value="${student.cpr}" readonly></label>
                    <label>Gender: 
                        <select>
                            <option value="male" ${student.gender === 'male' ? 'selected' : ''}>Male</option>
                            <option value="female" ${student.gender === 'female' ? 'selected' : ''}>Female</option>
                        </select>
                    </label>
                    <label>Email: <input type="email" value="${student.email}"></label>
                    <label>CV (PDF): <input type="file" accept=".pdf"></label>
                    <label>Status: 
                        <select>
                            <option value="student" ${student.status === 'student' ? 'selected' : ''}>Student</option>
                            <option value="graduate" ${student.status === 'graduate' ? 'selected' : ''}>Graduate</option>
                        </select>
                    </label>
                    <label>Courses: <input type="text" value="${student.courses}"></label>
                    <label>Ministry of Labour: 
                        <select>
                            <option value="yes" ${student.ministry === 'yes' ? 'selected' : ''}>Yes</option>
                            <option value="no" ${student.ministry === 'no' ? 'selected' : ''}>No</option>
                        </select>
                    </label>
                    <label>Degree: 
                        <select>
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

// 6. Navigation Actions Mapping
document.getElementById('nav-home-btn').addEventListener('click', () => showView('view-home'));
document.getElementById('nav-add-btn').addEventListener('click', () => showView('view-cpr'));
document.getElementById('nav-logout-btn').addEventListener('click', () => {
    document.getElementById('auth-form').reset();
    showView('view-auth');
});

// 7. Multi-language Translator Framework Toggle Switch
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

// Launch Systems Prerender Initializations
window.addEventListener('DOMContentLoaded', () => {
    runLiveClock();
    renderStudentDirectory();
    showView('view-auth');
});
