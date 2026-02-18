// ၁။ Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyDK-icUpAmTIkLGw3uwE5LxcCEUZdzIZuE",
  authDomain: "website-91f5b.firebaseapp.com",
  databaseURL: "https://website-91f5b-default-rtdb.firebaseio.com",
  projectId: "website-91f5b",
  storageBucket: "website-91f5b.firebasestorage.app",
  messagingSenderId: "340045873223",
  appId: "1:340045873223:web:6883f2469140df178c7162",
  measurementId: "G-VJ7TV1BXT2"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let currentUser = "";
const ADMIN_ID = "Ghost"; // <--- Admin

// ၂။ Security & Parsing
function escapeHTML(str) {
    if (!str) return "";
    return str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

function parseMentions(text) {
    return text.replace(/@(\w+)/g, '<span class="mention" style="color:#00f3ff; font-weight:bold;">@$1</span>');
}

// ၃။ Auth & Session
function checkSession() {
    const saved = localStorage.getItem("void_session");
    if (saved) { currentUser = saved; enterApp(); }
}

function saveSession(u) { localStorage.setItem("void_session", u); }
function logout() { localStorage.removeItem("void_session"); location.reload(); }

function toggleAuth(mode) {
    document.getElementById('login-box').classList.toggle('hidden', mode === 'reg');
    document.getElementById('reg-box').classList.toggle('hidden', mode === 'login');
}

function register() {
    const u = escapeHTML(document.getElementById('r-user').value.trim());
    const p = document.getElementById('r-pass').value;
    if (u && p) {
        db.ref('users/' + u).set({ password: p, avatar: "https://cdn-icons-png.flaticon.com/512/149/149071.png" })
        .then(() => { alert("ID_GENERATED"); toggleAuth('login'); });
    }
}

function login() {
    const u = escapeHTML(document.getElementById('l-user').value.trim());
    const p = document.getElementById('l-pass').value;
    db.ref('users/' + u).once('value', s => {
        if (s.exists() && s.val().password === p) {
            currentUser = u; saveSession(u); enterApp();
        } else { alert("ACCESS_DENIED"); }
    });
}

function enterApp() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('app-screen').classList.remove('hidden');
    document.getElementById('user-tag').innerText = `NODE: ${currentUser}`;
    document.getElementById('profile-name').innerText = currentUser;

    // Admin ဆိုရင် Alert ပေးမယ် (Check လုပ်ဖို့)
    if(currentUser === ADMIN_ID) {
        console.log("ADMIN PRIVILEGES ACTIVATED");
    }

    db.ref('online/' + currentUser).set(true);
    db.ref('online/' + currentUser).onDisconnect().remove();
    initListeners();
}

function switchTab(t) {
    document.querySelectorAll('.container').forEach(c => c.classList.add('hidden'));
    document.getElementById(t + '-tab').classList.remove('hidden');
}

// ၄။ Main Listeners (Admin Power တွေ ဒီထဲမှာ ပါတယ်)
function initListeners() {
    // Newsfeed + Comments
    db.ref('posts').on('value', s => {
        const list = document.getElementById('feed-list');
        list.innerHTML = "";
        s.forEach(child => {
            const p = child.val(), key = child.key;
            
            // ADMIN စစ်ဆေးချက် - တူရင် ဖျက်တဲ့ခလုတ် ပေါ်မယ်
            const delBtn = (currentUser === ADMIN_ID) ? 
                `<button style="float:right; background:none; color:red; border:1px solid red; font-size:10px; cursor:pointer;" onclick="deleteData('posts/${key}')">TERMINATE [X]</button>` : "";
            
            // Admin Badge စစ်ဆေးချက်
            const adminBadge = (p.user === ADMIN_ID) ? `<span style="background:red; color:white; font-size:9px; padding:2px 5px; margin-left:5px; border-radius:3px;">ADMIN</span>` : "";

            let cmtHtml = `<div class="comment-section" style="margin-top:10px; border-top:1px solid #222; padding-top:5px;">`;
            if(p.comments) {
                Object.values(p.comments).forEach(c => {
                    cmtHtml += `<div style="font-size:12px; color:#aaa; margin-bottom:3px;"><b>${c.user}:</b> ${parseMentions(escapeHTML(c.text))}</div>`;
                });
            }
            cmtHtml += `</div>`;

            const html = `
                <div class="post" style="background:#050505; border-left:3px solid red; padding:15px; margin-bottom:20px;">
                    ${delBtn
