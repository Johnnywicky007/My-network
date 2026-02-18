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

// ၂။ Security: XSS ကာကွယ်ရေး (HTML Injection ဖျက်ထုတ်ခြင်း)
function escapeHTML(str) {
    if (!str) return "";
    return str.replace(/[&<>"']/g, function(m) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[m];
    });
}

// ၃။ Auth & UI Logic
function toggleAuth(mode) {
    document.getElementById('login-box').classList.toggle('hidden', mode === 'reg');
    document.getElementById('reg-box').classList.toggle('hidden', mode === 'login');
}

function switchTab(tab) {
    document.querySelectorAll('.container').forEach(c => c.classList.add('hidden'));
    document.getElementById(tab + '-tab').classList.remove('hidden');
}

function sendNotif(t, b) {
    if (Notification.permission === "granted") {
        new Notification(t, { body: b });
        document.getElementById('notif-sound').play();
    }
}

// ၄။ Auth Logic
function register() {
    const u = escapeHTML(document.getElementById('r-user').value.trim());
    const p = document.getElementById('r-pass').value;
    if(u && p) {
        db.ref('users/' + u).set({ password: p, avatar: "https://cdn-icons-png.flaticon.com/512/149/149071.png" }).then(() => {
            alert("IDENTITY_GENERATED"); toggleAuth('login');
        });
    }
}

function login() {
    const u = escapeHTML(document.getElementById('l-user').value.trim());
    const p = document.getElementById('l-pass').value;
    db.ref('users/' + u).once('value', (s) => {
        if(s.exists() && s.val().password === p) {
            currentUser = u;
            document.getElementById('auth-screen').classList.add('hidden');
            document.getElementById('app-screen').classList.remove('hidden');
            document.getElementById('user-tag').innerText = `NODE: ${u} [AUTHORIZED]`;
            document.getElementById('profile-name').innerText = u;
            
            db.ref('online/' + u).set(true);
            db.ref('online/' + u).onDisconnect().remove();
            
            Notification.requestPermission();
            initApp();
        } else { alert("ACCESS_DENIED: INVALID_CREDENTIALS"); }
    });
}

// ၅။ Main App (Security Listeners)
function initApp() {
    // Feed Listener with Admin Delete
    db.ref('posts').on('child_added', (s) => {
        const p = s.val();
        const key = s.key;
        const list = document.getElementById('feed-list');
        const adminBtn = (currentUser === 'johnny') ? `<button class="admin-del" onclick="deleteItem('posts/${key}')">X</button>` : "";
        
        const item = document.createElement('div');
        item.className = 'post';
        item.id = key;
        item.innerHTML = `
            <div class="post-user">${adminBtn} OPERATOR: ${escapeHTML(p.user)}</div>
            <div>${escapeHTML(p.text)}</div>
            ${p.image ? `<img src="${escapeHTML(p.image)}">` : ""}
        `;
        list.prepend(item);
        if(p.user !== currentUser) sendNotif("BROADCAST_INCOMING", p.user + " updated node.");
    });

    db.ref('posts').on('child_removed', (s) => { document.getElementById(s.key)?.remove(); });

    // Chat Listener
    db.ref('chat').on('child_added', (s) => {
        const m = s.val();
        const key = s.key;
        db.ref('users/' + m.user + '/avatar').once('value', (av) => {
            const display = document.getElementById('chat-display');
            const adminBtn = (currentUser === 'johnny') ? `<span style="cursor:pointer;color:gray" onclick="deleteItem('chat/${key}')">[X]</span> ` : "";
            
            display.innerHTML += `
                <div class="msg-item" id="${key}">
                    <img src="${escapeHTML(av.val())}" class="msg-avatar">
                    ${adminBtn}<b style="color:var(--red)">${escapeHTML(m.user)}:</b> ${escapeHTML(m.text)}
                </div>`;
            display.scrollTop = display.scrollHeight;
            if(m.user !== currentUser) sendNotif("SIGNAL_RECEIVED", m.user + ": " + m.text);
        });
    });

    db.ref('chat').on('child_removed', (s) => { document.getElementById(s.key)?.remove(); });

    // Online List
    db.ref('online').on('value', (s) => {
        const inner = document.getElementById('users-inner');
        inner.innerHTML = "";
        if(s.exists()) {
            Object.keys(s.val()).forEach(u => {
                inner.innerHTML += `<div style="color:#00f3ff; font-size:11px; margin-bottom:5px;">● ${escapeHTML(u)}</div>`;
            });
        }
    });

    // Profile Load
    db.ref('users/' + currentUser + '/avatar').on('value', (s) => {
        document.getElementById('my-avatar').src = escapeHTML(s.val());
    });
}

// ၆။ Action Functions
function createPost() {
    const t = document.getElementById('post-desc').value;
    const i = document.getElementById('post-img-url').value;
    if(t) { 
        db.ref('posts').push({ user: currentUser, text: t, image: i }); 
        document.getElementById('post-desc').value = ""; 
    }
}

function sendChat() {
    const t = document.getElementById('chat-input').value;
    if(t) { 
        db.ref('chat').push({ user: currentUser, text: t }); 
        document.getElementById('chat-input').value = ""; 
    }
}

function deleteItem(path) {
    if(confirm("TERMINATE_DATA?")) db.ref(path).remove();
}

function updateProfile() {
    const url = document.getElementById('avatar-input').value;
    if(url) { 
        db.ref('users/' + currentUser).update({ avatar: url }); 
        alert("IDENTITY_UPDATED"); 
    }
}

// Matrix Background
const canvas = document.getElementById('matrix');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth; canvas.height = window.innerHeight;
const drops = Array(Math.floor(canvas.width/16)).fill(1);
setInterval(() => {
    ctx.fillStyle = "rgba(0,0,0,0.08)"; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "#f00"; ctx.font = "15px monospace";
    drops.forEach((y, i) => {
        const text = String.fromCharCode(Math.random()*128);
        ctx.fillText(text, i*16, y*16);
        if(y*16 > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
    });
}, 35);
                
