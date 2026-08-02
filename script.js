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
let currentAuthMode = "login";
let studentList = [];

// Monitor Firebase Auth State (Auto-Remembers Logged In Users)
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUserData = user;
        updateUserUI(true);
        showView('view-home');
        listenToStudentDirectory();
        listenToGroupChat();
    } else {
        currentUserData = null;
        updateUserUI(false);
        showView('view-auth');
    }
});

// ==========================================
// 2. GOOGLE SIGN-IN FUNCTION
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

// ==========================================
// 3. AUTHENTICATION HANDLERS
// ==========================================
// Switch Auth Tabs
function switchAuthTab(mode) {
    currentAuthMode = mode;
    document.getElementById('tab-login').classList.toggle('active', mode === 'login');
    document.getElementById('tab-register').classList.toggle('active', mode === 'register');
    document.getElementById('password-rules').classList.toggle('hidden', mode === 'login');
    document.getElementById('btn-auth-submit').innerText = mode === 'login' ? 'Sign In' : 'Create Account';
}

// Password Requirement Check
function validatePasswordRules() {
    if (currentAuthMode !== 'register') return;
    const val = document.getElementById('auth-password').value;

    updateRuleState('rule-length', val.length >= 8, "Minimum 8 characters");
    updateRuleState('rule-upper', /[A-Z]/.test(val), "At least one uppercase letter (A-Z)");
    updateRuleState('rule-lower', /[a-z]/.test(val), "At least one lowercase letter (a-z)");
    updateRuleState('rule-number', /\d/.test(val), "At least one number (0-9)");
}

function updateRuleState(id, isValid, labelText) {
    const el = document.getElementById(id);
    if (el) {
        el.innerText = (isValid ? "✓ " : "✖ ") + labelText;
        el.classList.toggle('valid', isValid);
    }
}

// Register or Login via Firebase
document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('auth-username').value.trim();
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value.trim();

    if (currentAuthMode === 'register') {
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!regex.test(password)) {
            alert("Password must be at least 8 characters with uppercase, lowercase, and a number.");
            return;
        }

        try {
            const userCred = await auth.createUserWithEmailAndPassword(email, password);
            await userCred.user.updateProfile({ displayName: username });
            alert("Account created successfully!");
        } catch (err) {
            alert(err.message);
        }
    } else {
        try {
            await auth.signInWithEmailAndPassword(email, password);
        } catch (err) {
            alert("Login failed: " + err.message);
        }
    }
});

function updateUserUI(isLoggedIn) {
    document.getElementById('search-box').classList.toggle('hidden', !isLoggedIn);
    document.getElementById('account-btn').classList.toggle('hidden', !isLoggedIn);
    document.getElementById('logout-btn').classList.toggle('hidden', !isLoggedIn);

    if (isLoggedIn && currentUserData) {
        document.getElementById('modal-userid').innerText = currentUserData.uid;
        document.getElementById('modal-username').innerText = currentUserData.displayName || "User";
        document.getElementById('modal-email').innerText = currentUserData.email;
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
        // Check if CPR exists in Firestore
        const snapshot = await db.collection('students').where('cpr', '==', cpr).get();
        if (!snapshot.empty) {
            const existingDoc = snapshot.docs[0].data();
            alert(`This CPR is already in the system and was added by user: ${existingDoc.added_by || 'Unknown'}`);
            return;
        }

        // Add new student
        await db.collection('students').add({
            cpr: cpr,
            name: "New Student",
            gender: "male",
            email: "",
            added_by: currentUserData.displayName || currentUserData.email,
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
// 5. STUDENT DIRECTORY & SEARCH
// ==========================================
function listenToStudentDirectory() {
    db.collection('students').orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
        studentList = [];
        snapshot.forEach(doc => {
            studentList.push({ id: doc.id, ...doc.data() });
        });
        renderStudentDirectory(studentList);
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
        item.innerHTML = `
            <div class="student-header" onclick="this.nextElementSibling.classList.toggle('hidden')">
                <span>${student.name} (${student.cpr})</span>
                <svg class="arrow-icon" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
            <div class="student-details hidden">
                <div class="student-actions-wrapper">
                    <button class="delete-icon-btn" onclick="deleteStudent('${student.id}')">Delete</button>
                </div>
                <div class="grid-form">
                    <label>Full Name: <input type="text" value="${student.name || ''}" onchange="updateStudentField('${student.id}', 'name', this.value)"></label>
                    <label>CPR: <input type="text" value="${student.cpr}" readonly></label>
                    <label>Added By: <input type="text" value="${student.added_by || ''}" readonly></label>
                    <label>Gender: 
                        <select onchange="updateStudentField('${student.id}', 'gender', this.value)">
                            <option value="male" ${student.gender === 'male' ? 'selected' : ''}>Male</option>
                            <option value="female" ${student.gender === 'female' ? 'selected' : ''}>Female</option>
                        </select>
                    </label>
                    <label>Email: <input type="email" value="${student.email || ''}" onchange="updateStudentField('${student.id}', 'email', this.value)"></label>
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
// 6. PASSWORD CHANGE
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
// 7. REAL-TIME GROUP CHAT
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
// 8. NAVIGATION, MODALS & LIVE CLOCK
// ==========================================
function showView(id) {
    document.querySelectorAll('.card-view').forEach(v => v.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
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
