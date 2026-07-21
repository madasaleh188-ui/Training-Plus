let currentUser = "Guest";

// Live Clock System
function runLiveClock() {
    const clock = document.getElementById('live-clock');
    if (!clock) return;
    const update = () => {
        const now = new Date();
        clock.textContent = now.toLocaleString();
    };
    update();
    setInterval(update, 1000);
}

// Auth Toggle (Sign In / Create Account)
const authToggle = document.getElementById('auth-toggle');
let isSignUpMode = false;
if (authToggle) {
    authToggle.addEventListener('click', (e) => {
        e.preventDefault();
        isSignUpMode = !isSignUpMode;
        document.querySelectorAll('.signup-only').forEach(el => el.classList.toggle('hidden', !isSignUpMode));
        
        document.getElementById('auth-title').textContent = isSignUpMode ? 'Create Account' : 'Sign In';
        document.getElementById('btn-submit').textContent = isSignUpMode ? 'Sign Up' : 'Sign In';
        document.getElementById('txt-toggle').textContent = isSignUpMode ? 'Already have an account?' : "Don't have an account?";
        authToggle.textContent = isSignUpMode ? 'Sign In' : 'Create Account';
    });
}

// CPR Submission Logic
const addStudentBtn = document.getElementById('add-student-btn');
if (addStudentBtn) {
    addStudentBtn.addEventListener('click', () => {
        const cprInput = document.getElementById('cpr-input').value.trim();
        
        if (cprInput.length !== 9 || isNaN(cprInput) || parseInt(cprInput) <= 0) {
            alert("CPR must be exactly 9 numbers and greater than 0!");
            return;
        }

        let students = JSON.parse(localStorage.getItem('studentDatabase') || "[]");
        const existingStudent = students.find(s => s.cpr === cprInput);
        
        if (existingStudent) {
            alert("this student orady added by " + currentUser + " ");
        } else {
            students.push({
                name: "New Student",
                cpr: cprInput,
                gender: "male",
                email: "",
                status: "student",
                courses: "",
                ministry: "no",
                degree: "high-school",
                photo: ""
            });
            localStorage.setItem('studentDatabase', JSON.stringify(students));
            alert("the student addes succussfly ");
            window.location.href = "home.html";
        }
    });
}

// Image Preview Function
function previewImage(event, index) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById(`preview-${index}`).src = e.target.result;
            let students = JSON.parse(localStorage.getItem('studentDatabase') || "[]");
            if (students[index]) {
                students[index].photo = e.target.result;
                localStorage.setItem('studentDatabase', JSON.stringify(students));
            }
        };
        reader.readAsDataURL(file);
    }
}

// Delete Student
function deleteStudent(index) {
    if (confirm("Delete this entry?")) {
        let students = JSON.parse(localStorage.getItem('studentDatabase') || "[]");
        students.splice(index, 1);
        localStorage.setItem('studentDatabase', JSON.stringify(students));
        renderStudentDirectory();
    }
}

// Render Directory on home.html
function renderStudentDirectory() {
    const container = document.getElementById('student-container');
    if (!container) return;
    
    let students = JSON.parse(localStorage.getItem('studentDatabase') || "[]");
    container.innerHTML = "";
    
    if (students.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#a0aec0; padding:20px;">No records found.</p>`;
        return;
    }
    
    students.forEach((student, index) => {
        const item = document.createElement('div');
        item.className = "student-item";
        item.innerHTML = `
            <div class="student-header" onclick="this.nextElementSibling.classList.toggle('hidden')">
                <span class="student-name">${student.name}</span>
                <span>▼</span>
            </div>
            <div class="student-details hidden">
                <div class="student-actions-wrapper">
                    <button class="action-btn" title="Edit Info">📌</button>
                    <button class="action-btn" onclick="deleteStudent(${index})" title="Delete">🗑️</button>
                </div>

                <div class="student-photo-container">
                    <img id="preview-${index}" src="${student.photo || 'https://via.placeholder.com/90?text=Photo'}" alt="Student Photo" class="student-photo-img">
                </div>
                
                <div class="grid-form">
                    <label>full name: <input type="text" value="${student.name}"></label>
                    <label>cpr: <input type="text" value="${student.cpr}" readonly></label>
                    <label>image: <input type="file" accept="image/*" onchange="previewImage(event, ${index})"></label>
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

window.addEventListener('DOMContentLoaded', () => {
    runLiveClock();
    renderStudentDirectory();
});
