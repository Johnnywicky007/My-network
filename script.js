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

// Utility Functions
function escapeHTML(str) {
    if (!str) return "";
    return str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

function parseMentions(text) {
    return text.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
}

// Session Logic
function checkSession() {
    const saved = localStorage.getItem("void_session");
    if (saved) { currentUser = saved; enterApp(); }
}
function saveSession(u) { localStorage.setItem("void_session", u); }
function logout() { localStorage.removeItem("void_session"); location.reload(); }

// Auth Logic
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
    db.ref('online/' + currentUser).set(true);
    db.ref('online/' + currentUser).onDisconnect().remove();
    Notification.requestPermission();
    initListeners();
}

function switchTab(t) {
    document.querySelectorAll('.container').forEach(c => c.classList.add('hidden'));
    document.getElementById(t + '-tab').classList.remove('hidden');
}

// Main Listeners
function initListeners() {
    // Newsfeed + Comments
    db.ref('posts').on('value', s => {
        const list = document.getElementById('feed-list');
        list.innerHTML = "";
        s.forEach(child => {
            const p = child.val(), key = child.key;
            const delBtn = (currentUser === ADMIN_ID) ? `<button style="float:right; background:none; color:red; border:1px solid red; font-size:10px;" onclick="deleteData('posts/${key}')">X</button>` : "";
            
            let cmtHtml = `<div class="comment-section">`;
            if(p.comments) {
                Object.values(p.comments).forEach(c => {
                    cmtHtml += `<div class="comment-item"><b>${c.user}:</b> ${parseMentions(escapeHTML(c.text))}</div>`;
                });
            }
            cmtHtml += `</div>`;

            const html = `
                <div class="post">
                    ${delBtn}
                    <div class="post-user">${p.user} ${p.user === ADMIN_ID ? '<span class="admin-badge">ADMIN</span>' : ''}</div>
                    <div>${parseMentions(escapeHTML(p.text))}</div>
                    ${p.image ? `<img src="${escapeHTML(p.image)}">` : ""}
                    ${cmtHtml}
                    <div class="comment-input-box">
                        <input type="text" id="cmt-${key}" placeholder="Reply...">
                        <button onclick="addComment('${key}')">SEND</button>
                    </div>
                </div>`;
            list.insertAdjacentHTML('afterbegin', html);
        });
    });

    // Chat
    db.ref('chat').limitToLast(20).on('child_added', s => {
        const m = s.val(), key = s.key;
        db.ref('users/' + m.user + '/avatar').once('value', av => {
            const display = document.getElementById('chat-display');
            const del = (currentUser === ADMIN_ID) ? `<span onclick="deleteData('chat/${key}')" style="cursor:pointer; color:red;">[X]</span> ` : "";
            display.innerHTML += `<div><img src="${av.val()}" class="msg-avatar">${del}<b>${m.user}:</b> ${parseMentions(escapeHTML(m.text))}</div>`;
            display.scrollTop = display.scrollHeight;
            if (m.text.includes(`@${currentUser}`)) { document.getElementById('notif-sound').play(); }
        });
    });

    // Online
    db.ref('online').on('value', s => {
        const inner = document.getElementById('users-inner');
        inner.innerHTML = "";
        if (s.exists()) Object.keys(s.val()).forEach(u => inner.innerHTML += `<div style="color:var(--cyan)">● ${u}</div>`);
    });

    db.ref('users/' + currentUser + '/avatar').on('value', s => document.getElementById('my-avatar').src = s.val());
}

// Actions
function createPost() {
    const t = document.getElementById('post-desc').value;
    const i = document.getElementById('post-img-url').value;
    if (t) { db.ref('posts').push({ user: currentUser, text: t, image: i }); document.getElementById('post-desc').value = ""; }
}

function addComment(id) {
    const t = document.getElementById(`cmt-${id}`).value;
    if (t) { db.ref(`posts/${id}/comments`).push({ user: currentUser, text: t }); }
}

function sendChat() {
    const t = document.getElementById('chat-input').value;
    if (t) { db.ref('chat').push({ user: currentUser, text: t }); document.getElementById('chat-input').value = ""; }
}

function updateProfile() {
    const url = document.getElementById('avatar-input').value;
    if (url) { db.ref('users/' + currentUser).update({ avatar: url }); alert("SYNCED"); }
}

function deleteData(path) { if(confirm("TERMINATE?")) db.ref(path).remove(); }

// Matrix Effect
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
        
