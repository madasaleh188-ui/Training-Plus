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

// Initialize Firebase (Compat SDK)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

let currentUserData = null;
let studentList = [];

// Monitor Firebase Auth State (Auto-Remembers Logged In Users)
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
// 2. GOOGLE SIGN-IN & AUTH FUNCTIONS
// ==========================================
async function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();

    try {
        const result = await auth.signInWithPopup(provider);
        const user = result.user;

        // Save or update user profile details in Firestore
        await db.collection("users").doc(user.uid).set({
            username: user.displayName || user.email.split('@')[0],
            email: user.email,
            photoURL: user.photoURL || "",
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log("Google Sign-In Successful:", user);
    } catch (error) {
        if (error.code !== 'auth/popup-closed-by-user') {
            console.error("Google Sign-In Error:", error);
            alert("Google Sign-In failed: " + error.message);
        }
    }
}

function updateUserUI(isLoggedIn) {
    document.getElementById('search-box')?.classList.toggle('hidden', !isLoggedIn);
    document.getElementById('account-btn')?.classList.toggle('hidden', !isLoggedIn);
    document.getElementById('logout-btn')?.classList.toggle('hidden', !isLoggedIn);

    if (isLoggedIn && currentUserData) {
        const idEl = document.getElementById('modal-userid');
        const nameEl = document.getElementById('modal-username');
        const emailEl = document.getElementById('modal-email');

        if (idEl) idEl.innerText = currentUserData.uid || '';
        if (nameEl) nameEl.innerText = currentUserData.displayName || "User";
        if (emailEl) emailEl.innerText = currentUserData.email || '';

        // Automatically send logged-in users straight to the directory view
        showView('view-home');
    } else {
        showView('view-auth');
    }
}

function logoutUser() {
    auth.signOut();
}

// ==========================================
// 3. CPR RECORD MANAGEMENT
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
// 4. STUDENT DIRECTORY & SEARCH
// ==========================================
function listenToStudentDirectory() {
    if (!currentUserData) return;

    const activeEmail = currentUserData.email;
    const activeName = currentUserData.displayName;

    db.collection('students').onSnapshot((snapshot) => {
        studentList = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // Restrict view so users only see student data they added
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

function renderStudentDirectory(list) {
    const container = document.getElementById('student-container');
    container.innerHTML = "";

    if (list.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#a0aec0; padding:20px;">No student records found.</p>`;
        return;
    }

    list.forEach((student) => {
        const item = document.createElement('div');
        item.className = "student-item";

        // 1. Build list of enrolled courses with timestamp and Delete Course button
        let coursesHTML = "";
        if (student.courses && Array.isArray(student.courses) && student.courses.length > 0) {
            coursesHTML = student.courses.map((c, index) => `
                <li style="display:flex; justify-space-between; align-items:center; background:#f8fafc; padding:8px 12px; border: 1px solid #e2e8f0; border-radius:6px; margin-bottom:6px; font-size:0.88rem;">
                    <div>
                        <strong style="color: #2d3748;">${c.name}</strong> 
                        <span style="color:#718096; margin-left:8px; font-size:0.80rem;">(${c.addedAt})</span>
                    </div>
                    <button type="button" onclick="removeCourse('${student.id}', ${index})" 
                        style="background: #fff5f5; border: 1px solid #feb2b2; color: #e53e3e; cursor: pointer; font-size: 0.75rem; padding: 4px 10px; border-radius: 100px; transition: all 0.2s;" 
                        onmouseover="this.style.background='#fee2e2'" 
                        onmouseout="this.style.background='#fff5f5'"
                    >
                        Delete Course
                    </button>
                </li>
            `).join("");
        } else {
            coursesHTML = `<p style="font-size:0.82rem; color:#a0aec0; margin-top:4px;">No courses added yet.</p>`;
        }

        // 2. Build CV status link with Delete CV button
        const cvDisplay = student.cvUrl 
            ? `<div style="display: flex; align-items: center; gap: 8px;">
                <a href="${student.cvUrl}" download="${student.cvName || 'Student_CV'}" target="_blank" style="color:var(--accent-slate-blue, #2b6cb0); font-weight:600; text-decoration:underline; font-size:0.85rem;">📄 View / Download CV</a>
                <button type="button" onclick="deleteStudentCV('${student.id}')" 
                    style="background: #fff5f5; border: 1px solid #feb2b2; color: #e53e3e; cursor: pointer; font-size: 0.75rem; padding: 4px 10px; border-radius: 100px; transition: all 0.2s;" 
                    onmouseover="this.style.background='#fee2e2'" 
                    onmouseout="this.style.background='#fff5f5'"
                >
                    Delete CV
                </button>
               </div>`
            : `<span style="color:#a0aec0; font-size:0.85rem;">No CV uploaded</span>`;

        // 3. Render complete student card HTML
        item.innerHTML = `
            <div class="student-header" onclick="this.nextElementSibling.classList.toggle('hidden')">
                <span>${student.name} (${student.cpr})</span>
                <svg class="arrow-icon" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
            <div class="student-details hidden">
                <div class="student-actions-wrapper">
                    <button class="delete-icon-btn" onclick="deleteStudent('${student.id}')">Delete Student</button>
                </div>
                
                <!-- STUDENT INFO FORM -->
                <div class="grid-form">
                    <label>Full Name: 
                        <input type="text" value="${student.name || ''}" onchange="updateStudentField('${student.id}', 'name', this.value)">
                    </label>
                    <label>CPR: 
                        <input type="text" value="${student.cpr}" readonly>
                    </label>
                    <label>Gender: 
                        <select onchange="updateStudentField('${student.id}', 'gender', this.value)">
                            <option value="male" ${student.gender === 'male' ? 'selected' : ''}>Male</option>
                            <option value="female" ${student.gender === 'female' ? 'selected' : ''}>Female</option>
                        </select>
                    </label>
                    <label>Email: 
                        <input type="email" value="${student.email || ''}" onchange="updateStudentField('${student.id}', 'email', this.value)">
                    </label>
                </div>

                <hr style="margin: 16px 0; border: none; border-top: 1px solid var(--border-color, #e2e8f0);">

                <!-- CV UPLOAD SECTION -->
                <div style="margin-bottom: 16px;">
                    <h4 style="margin-bottom: 8px; color: var(--accent-slate-blue, #2b6cb0);">Student CV Document</h4>
                    <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                        <input type="file" id="cv-input-${student.id}" accept=".pdf,.doc,.docx" style="font-size: 0.85rem;">
                        <button type="button" class="primary-btn" onclick="uploadStudentCV('${student.id}')" style="padding: 6px 12px; font-size: 0.85rem;">Upload CV</button>
                        <div style="margin-left: auto;">${cvDisplay}</div>
                    </div>
                </div>

                <hr style="margin: 16px 0; border: none; border-top: 1px solid var(--border-color, #e2e8f0);">

                <!-- ENROLLED COURSES SECTION -->
                <div>
                    <h4 style="margin-bottom: 8px; color: var(--accent-slate-blue, #2b6cb0);">Enrolled Courses</h4>
                    <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                        <input type="text" id="course-input-${student.id}" placeholder="Enter course name (e.g. Web Development)" style="flex: 1; padding: 8px; border: 1px solid var(--border-color, #e2e8f0); border-radius: 6px; font-size: 0.85rem;">
                        <button type="button" class="primary-btn" onclick="addCourseToStudent('${student.id}')" style="padding: 6px 14px; font-size: 0.85rem;">+ Add Course</button>
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
// 5. COURSE MANAGEMENT (WITH TIMESTAMP)
// ==========================================
async function addCourseToStudent(studentId) {
    const inputEl = document.getElementById(`course-input-${studentId}`);
    if (!inputEl) {
        alert("Input field not found.");
        return;
    }

    const courseName = inputEl.value.trim();
    if (!courseName) {
        alert("Please enter a course name.");
        return;
    }

    // Format Date and Time
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
        if (!docSnap.exists) {
            alert("Student document not found.");
            return;
        }

        const data = docSnap.data();
        let currentCourses = Array.isArray(data.courses) ? data.courses : [];
        currentCourses.push(newCourseObj);

        await studentRef.update({
            courses: currentCourses
        });

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

            await studentRef.update({
                courses: existingCourses
            });
        }
    } catch (err) {
        console.error("Error removing course:", err);
        alert("Failed to delete course: " + err.message);
    }
}

// ==========================================
// 6. CV UPLOAD & DELETE (BASE64 FIRESTORE)
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
        const base64String = e.target.result;

        try {
            await db.collection('students').doc(studentId).update({
                cvUrl: base64String,
                cvName: file.name
            });

            alert("CV uploaded and saved successfully!");
        } catch (err) {
            console.error("Firestore CV update error:", err);
            alert("Failed to save CV: " + err.message);
        }
    };

    reader.onerror = function (error) {
        console.error("File reading error:", error);
        alert("Could not read file!");
    };

    reader.readAsDataURL(file);
}

async function deleteStudentCV(studentId) {
    if (!confirm("Are you sure you want to delete this CV?")) return;

    try {
        const studentRef = db.collection('students').doc(studentId);

        await studentRef.update({
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
// 7. PASSWORD CHANGE
// ==========================================
async function submitPasswordChange() {
    const newPassword = document.getElementById('new-password-input').value.trim();
    if (currentUserData) {
        try {
            await currentUserData.updatePassword(newPassword);
            alert("Password updated successfully!");
            closeAccountModal();
        } catch (err) {
            alert("Failed to update password: " + err.message + " (You may need to re-login first).");
        }
    }
}

// ==========================================
// 8. REAL-TIME GROUP CHAT
// ==========================================
function listenToGroupChat() {
    db.collection('chat_messages').orderBy('timestamp', 'asc').limitToLast(50).onSnapshot((snapshot) => {
        const box = document.getElementById('chat-messages');
        box.innerHTML = "";
        snapshot.forEach(doc => {
            const m = doc.data();
            const div = document.createElement('div');
            div.className = "chat-msg";
            div.innerHTML = `<strong>${m.username}:</strong> ${m.message}`;
            box.appendChild(div);
        });
        box.scrollTop = box.scrollHeight;
    });
}

async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (!message || !currentUserData) return;

    await db.collection('chat_messages').add({
        username: currentUserData.displayName || currentUserData.email,
        message: message,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    input.value = "";
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
            el.innerText = now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + " | " + now.toLocaleTimeString();
        }, 1000);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    runLiveFooterClock();
});
