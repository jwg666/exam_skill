function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
}

function showLogin() {
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
}

function handleLogin() {
    const phone = document.getElementById('loginPhone').value.trim();
    const pwd = document.getElementById('loginPwd').value;

    if (!phone || phone.length < 11) {
        showToast('请输入正确的手机号', 'error');
        return;
    }
    if (!pwd || pwd.length < 6) {
        showToast('密码至少6位', 'error');
        return;
    }

    // 模拟登录
    appState.user = {
        name: phone.slice(-4) + '用户',
        phone: phone
    };
    saveState();
    showToast('登录成功', 'success');
    checkAchievement('first_login');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 500);
}

function handleRegister() {
    const name = document.getElementById('regName').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const pwd = document.getElementById('regPwd').value;
    const pwd2 = document.getElementById('regPwd2').value;

    if (!name) { showToast('请输入昵称', 'error'); return; }
    if (!phone || phone.length < 11) { showToast('请输入正确的手机号', 'error'); return; }
    if (!pwd || pwd.length < 6) { showToast('密码至少6位', 'error'); return; }
    if (pwd !== pwd2) { showToast('两次密码不一致', 'error'); return; }

    appState.user = { name, phone };
    saveState();
    showToast('注册成功', 'success');
    checkAchievement('first_login');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 500);
}

window.onload = function() {
    // 若已登录，跳转到首页
    if (appState.user) {
        window.location.href = 'index.html';
    }
};
