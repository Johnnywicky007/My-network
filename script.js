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

// ၂။ Notification Permission
if (Notification.permission !== "granted") {
    Notification.requestPermission();
}

function sendNotification(title, body) {
    if (Notification.permission === "granted") {
        new Notification(title, { body: body, icon: "https://cdn-icons-png.flaticon.com/512/682/682055.png" });
        document.getElementById('notif-sound').play();
    }
}

// ၃။ UI Toggle Logic
function toggleAuth(mode) {
    document.getElementById('login-box').classList.toggle('hidden', mode === 'reg');
    document.getElementById('reg-box').classList.toggle('hidden', mode === 'login');
}

function switchTab(tab) {
    document.getElementById('feed-tab').classList.toggle('hidden', tab !== 'feed');
    document.getElementById('chat-tab').classList.toggle('hidden', tab !== 'chat');
}

// ၄။ Auth Logic
function register() {
    const u = document.getElementById('r-user').value;
    const p = document.getElementById('r-pass').value;
    if(u && p) {
        db.ref('users/' + u).set({ password: p }).then(() => {
            alert("Identity Created!");
            toggleAuth('login');
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
            document.getElementById('user-tag').innerText = `OPERATOR: ${u}`;
            initListeners();
        } else { alert("ACCESS DENIED"); }
    });
}

// ၅။ Listeners (Post & Chat)
function initListeners() {
    // Post Listener (Newsfeed)
    db.ref('posts').on('child_added', (s) => {
        const p = s.val();
        const list = document.getElementById('feed-list');
        const img = p.image ? `<img src="${p.image}">` : "";
        list.innerHTML = `<div class="post"><div class="post-user">${p.user}</div><div>${p.text}</div>${img}</div>` + list.innerHTML;
        
        if(p.user !== currentUser) {
            sendNotification("New Broadcast", `${p.user} posted on feed.`);
        }
    });

    // Chat Listener
    db.ref('chat').on('child_added', (s) => {
        const m = s.val();
        const display = document.getElementById('chat-display');
        display.innerHTML += `<div><b style="color:red">[${m.user}]:</b> ${m.text}</div>`;
        display.scrollTop = display.scrollHeight;
        
        if(m.user !== currentUser) {
            sendNotification("New Message", `${m.user}: ${m.text}`);
        }
    });
}

// ၆။ Action Functions
function createPost() {
    const text = document.getElementById('post-desc').value;
    const img = document.getElementById('post-img-url').value;
    if(text) {
        db.ref('posts').push({ user: currentUser, text: text, image: img });
        document.getElementById('post-desc').value = "";
        document.getElementById('post-img-url').value = "";
    }
}

function sendChat() {
    const text = document.getElementById('chat-input').value;
    if(text) {
        db.ref('chat').push({ user: currentUser, text: text });
        document.getElementById('chat-input').value = "";
    }
}

// Matrix Background Effect (အရင်အတိုင်း)
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

