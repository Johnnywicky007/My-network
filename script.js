// ၁။ Firebase Configuration (Replace with YOUR keys)
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
const ADMIN_ID = "johnny"; // မင်းရဲ့ Admin ID

// ၂။ Backend & Security Utilities
function escapeHTML(str) {
    if (!str) return "";
    return str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

function checkSession() {
    const saved = localStorage.getItem("void_session");
    if (saved) {
        currentUser = saved;
        enterApp();
    }
}

function saveSession(u) { localStorage.setItem("void_session", u); }
function logout() { localStorage.removeItem("void_session"); location.reload(); }

// ၃။ Auth Logic
function toggleAuth(mode) {
    document.getElementById('login-box').classList.toggle('hidden', mode === 'reg');
    document.getElementById('reg-box').classList.toggle('hidden', mode === 'login');
}

function register() {
    const u = escapeHTML(document.getElementById('r-user').value.trim());
    const p = document.getElementById('r-pass').value;
    if (u && p) {
        db.ref('users/' + u).set({ password: p, avatar: "https://cdn-icons-png.flaticon.com/512/149/149071.png" })
        .then(() => { alert("NODE_CREATED"); toggleAuth('login'); });
    }
}

function login() {
    const u = escapeHTML(document.getElementById('l-user').value.trim());
    const p = document.getElementById('l-pass').value;
    db.ref('users/' + u).once('value', s => {
        if (s.exists() && s.val().password === p) {
            currentUser = u;
            saveSession(u);
            enterApp();
        } else { alert("ACCESS_DENIED"); }
    });
}

function enterApp() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('app-screen').classList.remove('hidden');
    document.getElementById('user-tag').innerText = `NODE: ${currentUser} [SECURE_LINK]`;
    document.getElementById('profile-name').innerText = currentUser;
    
    // Set Online Status
    db.ref('online/' + currentUser).set(true);
    db.ref('online/' + currentUser).onDisconnect().remove();
    
    Notification.requestPermission();
    initListeners();
}

// ၄။ Application Logic (Newsfeed, Chat, Profile)
function switchTab(t) {
    document.querySelectorAll('.container').forEach(c => c.classList.add('hidden'));
    document.getElementById(t + '-tab').classList.remove('hidden');
}

function initListeners() {
    // Newsfeed Listener
    db.ref('posts').on('child_added', s => {
        const p = s.val(), key = s.key;
        const list = document.getElementById('feed-list');
        const delBtn = (currentUser === ADMIN_ID) ? `<span class="admin-del" onclick="deleteData('posts/${key}')">DELETE</span>` : "";
        const html = `<div class="post" id="${key}"><div class="post-user">${delBtn} BROADCAST_BY: ${p.user}</div><div>${escapeHTML(p.text)}</div>${p.image ? `<img src="${escapeHTML(p.image)}">` : ""}</div>`;
        list.insertAdjacentHTML('afterbegin', html);
    });
    db.ref('posts').on('child_removed', s => document.getElementById(s.key)?.remove());

    // Chat Listener
    db.ref('chat').on('child_added', s => {
        const m = s.val(), key = s.key;
        db.ref('users/' + m.user + '/avatar').once('value', av => {
            const display = document.getElementById('chat-display');
            const del = (currentUser === ADMIN_ID) ? `<span style="cursor:pointer" onclick="deleteData('chat/${key}')">[X]</span> ` : "";
            display.innerHTML += `<div class="msg-item" id="${key}"><img src="${av.val()}" class="msg-avatar">${del}<b>${m.user}:</b> ${escapeHTML(m.text)}</div>`;
            display.scrollTop = display.scrollHeight;
            if (m.user !== currentUser) {
                new Notification("SIGNAL_INCOMING", { body: `${m.user}: ${m.text}` });
                document.getElementById('notif-sound').play();
            }
        });
    });
    db.ref('chat').on('child_removed', s => document.getElementById(s.key)?.remove());

    // Online List Listener
    db.ref('online').on('value', s => {
        const inner = document.getElementById('users-inner');
        inner.innerHTML = "";
        if (s.exists()) Object.keys(s.val()).forEach(u => inner.innerHTML += `<div style="color:var(--cyan)">● ${u}</div>`);
    });

    // Profile Load
    db.ref('users/' + currentUser + '/avatar').on('value', s => document.getElementById('my-avatar').src = s.val());
}

// ၅။ Actions
function createPost() {
    const t = document.getElementById('post-desc').value;
    const i = document.getElementById('post-img-url').value;
    if (t) { db.ref('posts').push({ user: currentUser, text: t, image: i }); document.getElementById('post-desc').value = ""; }
}

function sendChat() {
    const t = document.getElementById('chat-input').value;
    if (t) { db.ref('chat').push({ user: currentUser, text: t }); document.getElementById('chat-input').value = ""; }
}

function updateProfile() {
    const url = document.getElementById('avatar-input').value;
    if (url) { db.ref('users/' + currentUser).update({ avatar: url }); alert("PROFILE_SYNCED"); }
}

function deleteData(path) { if (confirm("TERMINATE_DATA?")) db.ref(path).remove(); }

// Matrix Background
const canvas = document.getElementById('matrix');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth; canvas.height = window.innerHeight;
const drops = Array(Math.floor(canvas.width/16)).fill(1);
setInterval(() => {
    ctx.fillStyle = "rgba(0,0,0,0.1)"; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "#f00";
    drops.forEach((y, i) => {
        ctx.fillText(String.fromCharCode(Math.random()*128), i*16, y*16);
        if(y*16 > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
    });
}, 35);
                      
