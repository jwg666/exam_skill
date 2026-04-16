function showToast(msg, type='info') {
    let c = document.getElementById('toastContainer');
    if (!c) {
        c = document.createElement('div');
        c.id = 'toastContainer';
        c.className = 'toast-container';
        document.body.appendChild(c);
    }
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => t.remove(), 2500);
}

function togglePwdVis(inputId, btn) {
    const inp = document.getElementById(inputId);
    const icon = btn.querySelector('i');
    if (inp.type === 'password') {
        inp.type = 'text';
        icon.className = 'fas fa-eye';
    } else {
        inp.type = 'password';
        icon.className = 'fas fa-eye-slash';
    }
}

function getGreeting() {
    const h = new Date().getHours();
    if (h < 6) return '夜深了';
    if (h < 9) return '早上好';
    if (h < 12) return '上午好';
    if (h < 14) return '中午好';
    if (h < 18) return '下午好';
    if (h < 22) return '晚上好';
    return '夜深了';
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2,'0')}`;
}

function navigateTo(pageUrl) {
    window.location.href = pageUrl;
}

function goBack() {
    window.history.back();
}

function checkLoginAuth() {
    if (!appState.user && !window.location.href.includes('login.html')) {
        window.location.href = 'login.html';
    }
}

// 渲染底部导航组件
function renderBottomNav(activeIndex) {
    const navHTML = `
    <nav class="bottom-nav" id="bottomNav">
        <div style="display:flex;">
            <a class="nav-item ${activeIndex === 0 ? 'active' : ''}" href="index.html">
                <i class="fas fa-home"></i>
                <span>首页</span>
            </a>
            <a class="nav-item ${activeIndex === 1 ? 'active' : ''}" href="bank.html">
                <i class="fas fa-book"></i>
                <span>题库</span>
            </a>
            <a class="nav-item ${activeIndex === 2 ? 'active' : ''}" href="wrong.html" style="position:relative;">
                <i class="fas fa-times-circle"></i>
                <span>错题</span>
                <span class="badge" id="wrongBadge" style="display:none;">0</span>
            </a>
            <a class="nav-item ${activeIndex === 3 ? 'active' : ''}" href="profile.html">
                <i class="fas fa-user"></i>
                <span>我的</span>
            </a>
        </div>
    </nav>
    `;
    document.body.insertAdjacentHTML('beforeend', navHTML);
    updateWrongBadge();
}

function updateWrongBadge() {
    const badge = document.getElementById('wrongBadge');
    if (badge) {
        if (appState.wrongBook && appState.wrongBook.length > 0) {
            badge.style.display = 'flex';
            badge.textContent = appState.wrongBook.length;
        } else {
            badge.style.display = 'none';
        }
    }
}
