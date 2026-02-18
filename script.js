// Firebase Config (မင်းရဲ့ Key တွေ ဒီမှာ အစားထိုးပါ)
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

// --- UI ပြောင်းလဲတဲ့ Function များ ---
function showRegister() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('register-screen').classList.remove('hidden');
}

function showLogin() {
    document.getElementById('register-screen').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
}

// --- Register Logic ---
function register() {
    const user = document.getElementById('reg-user').value.trim();
    const pass = document.getElementById('reg-pass').value.trim();
    
    if(!user || !pass) return alert("Please fill the requirements!");

    db.ref('users/' + user).set({ password: pass }).then(() => {
        alert("Identity Created! Accessing System...");
        enterDashboard(user); // Register ပြီးတာနဲ့ Dashboard ထဲ တန်းပို့မယ်
    });
}

// --- Login Logic ---
function login() {
    const user = document.getElementById('login-user').value.trim();
    const pass = document.getElementById('login-pass').value.trim();

    db.ref('users/' + user).once('value', (s) => {
        if(s.exists() && s.val().password === pass) {
            enterDashboard(user);
        } else {
            alert("Access Denied!");
        }
    });
}

function enterDashboard(user) {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('register-screen').classList.add('hidden');
    document.getElementById('main-system').classList.remove('hidden');
    document.getElementById('op-name').innerText = user;
    loadChat();
}

// --- Chat Logic ---
function loadChat() {
    db.ref('messages').on('child_added', (s) => {
        const m = s.val();
        document.getElementById('chat-box').innerHTML += `<div><b style="color:red">[${m.user}]:</b> ${m.text}</div>`;
    });
}

function sendMsg() {
    const text = document.getElementById('msg-input').value;
    const user = document.getElementById('op-name').innerText;
    if(text) {
        db.ref('messages').push({ user, text });
        document.getElementById('msg-input').value = "";
    }
}

// Matrix Effect (အရင်အတိုင်း)
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
