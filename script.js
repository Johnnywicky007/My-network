// ၁။ Firebase Config - မင်းရဲ့ Key တွေ ပြန်ထည့်ပါ
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

// ၂။ Core Functions
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

// ၃။ Auth Logic
function register() {
    const u = document.getElementById('r-user').value;
    const p = document.getElementById('r-pass').value;
    if(u && p) {
        db.ref('users/' + u).set({ password: p, avatar: "https://cdn-icons-png.flaticon.com/512/149/149071.png" }).then(() => {
            alert("Success!"); toggleAuth('login');
        });
    }
}

function login() {
    const u = document.getElementById('l-user').value;
    const p = document.getElementById('l-pass').value;
    db.ref('users/' + u).once('value', (s) => {
        if(s.exists() && s.val().password === p) {
            currentUser = u;
            document.getElementById('auth-screen').classList.add('hidden');
            document.getElementById('app-screen').classList.remove('hidden');
            document.getElementById('user-tag').innerText = `ID: ${u}`;
            document.getElementById('profile-name').innerText = u;
            
            // Online Status
            db.ref('online/' + u).set(true);
            db.ref('online/' + u).onDisconnect().remove();
            
            Notification.requestPermission();
            initApp();
        } else { alert("ACCESS DENIED"); }
    });
}

// ၄။ App Logic
function initApp() {
    // Feed Listener
    db.ref('posts').on('child_added', (s) => {
        const p = s.val();
        const list = document.getElementById('feed-list');
        list.innerHTML = `<div class="post"><div class="post-user">${p.user}</div><div>${p.text}</div>${p.image ? `<img src="${p.image}">` : ""}</div>` + list.innerHTML;
        if(p.user !== currentUser) sendNotif("New Broadcast", p.user + " posted.");
    });

    // Chat Listener
    db.ref('chat').on('child_added', (s) => {
        const m = s.val();
        db.ref('users/' + m.user + '/avatar').once('value', (av) => {
            const display = document.getElementById('chat-display');
            display.innerHTML += `<div><img src="${av.val()}" class="msg-avatar"><b style="color:red">${m.user}:</b> ${m.text}</div>`;
            display.scrollTop = display.scrollHeight;
            if(m.user !== currentUser) sendNotif("New Message", m.user + ": " + m.text);
        });
    });

    // Online Users Listener
    db.ref('online').on('value', (s) => {
        const inner = document.getElementById('users-inner');
        inner.innerHTML = "";
        if(s.exists()) {
            Object.keys(s.val()).forEach(u => {
                inner.innerHTML += `<div style="color:#00f3ff">● ${u}</div>`;
            });
        }
    });

    // Profile Avatar Load
    db.ref('users/' + currentUser + '/avatar').on('value', (s) => {
        document.getElementById('my-avatar').src = s.val();
    });
}

function createPost() {
    const t = document.getElementById('post-desc').value;
    const i = document.getElementById('post-img-url').value;
    if(t) { db.ref('posts').push({ user: currentUser, text: t, image: i }); document.getElementById('post-desc').value = ""; }
}

function sendChat() {
    const t = document.getElementById('chat-input').value;
    if(t) { db.ref('chat').push({ user: currentUser, text: t }); document.getElementById('chat-input').value = ""; }
}

function updateProfile() {
    const url = document.getElementById('avatar-input').value;
    if(url) { db.ref('users/' + currentUser).update({ avatar: url }); alert("Avatar Updated!"); }
}

// Matrix Background
const canvas = document.getElementById('matrix');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth; canvas.height = window.innerHeight;
const drops = Array(Math.floor(canvas.width/16)).fill(1);
setInterval(() => {
    ctx.fillStyle = "rgba(0,0,0,0.05)"; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "#f00";
    drops.forEach((y, i) => {
        ctx.fillText(String.fromCharCode(Math.random()*128), i*16, y*16);
        if(y*16 > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
    });
}, 35);
        
