// ============ 个人中心 ============

function renderProfile() {
    if (!appState.user) return;

    const initial = appState.user.name.charAt(0).toUpperCase();
    document.getElementById('profileAvatar').textContent = initial;
    document.getElementById('profileName').textContent = appState.user.name;
    document.getElementById('profilePhone').textContent = appState.user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');

    // 等级计算
    const exp = appState.totalAnswered * 10 + appState.streak * 5;
    const level = Math.floor(exp / 100) + 1;
    const expInLevel = exp % 100;
    document.getElementById('profileLevel').textContent = level;
    document.getElementById('profileExp').textContent = exp;
    document.getElementById('expProgress').textContent = `${expInLevel}/100`;
    document.getElementById('expBar').style.width = `${expInLevel}%`;

    // 统计
    document.getElementById('pStatTotal').textContent = appState.totalAnswered;
    document.getElementById('pStatCorrect').textContent = appState.totalCorrect;
    document.getElementById('pStatDays').textContent = appState.checkedDays.length;
    const avgAcc = appState.totalAnswered > 0 ? Math.round(appState.totalCorrect / appState.totalAnswered * 100) : 0;
    document.getElementById('pStatAvgAcc').textContent = avgAcc + '%';

    // 功能计数
    document.getElementById('wrongCount').textContent = appState.wrongBook.length + '题';
    document.getElementById('favCount').textContent = appState.favorites.length + '题';
    document.getElementById('achieveCount').textContent = `${appState.achievements.length}/${achievementDefs.length}`;
}

function showEditProfile() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
    <div class="modal-content">
        <h3 style="font-weight:700;margin-bottom:16px;">编辑资料</h3>
        <div style="margin-bottom:12px;">
            <label style="font-size:13px;color:var(--muted);display:block;margin-bottom:4px;">昵称</label>
            <input type="text" class="g-input" id="editNameInput" value="${appState.user.name}" maxlength="12">
        </div>
        <div style="display:flex;gap:12px;">
            <button class="g-btn g-btn-ghost" style="flex:1;" onclick="this.closest('.modal-overlay').remove()">取消</button>
            <button class="g-btn g-btn-primary" style="flex:1;" onclick="saveProfileEdit()">保存</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);
}

function saveProfileEdit() {
    const name = document.getElementById('editNameInput').value.trim();
    if (!name) { showToast('昵称不能为空', 'error'); return; }
    appState.user.name = name;
    saveState();
    document.querySelector('.modal-overlay')?.remove();
    renderProfile();
    showToast('资料已更新', 'success');
}

function showAbout() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
    <div class="modal-content">
        <div style="text-align:center;margin-bottom:16px;">
            <div style="width:60px;height:60px;border-radius:18px;background:linear-gradient(135deg,var(--accent),var(--accent2));display:inline-flex;align-items:center;justify-content:center;margin-bottom:10px;">
                <i class="fas fa-water" style="font-size:28px;color:#fff;"></i>
            </div>
            <h3 style="font-family:'ZCOOL KuaiLe',sans-serif;font-size:22px;">题海拾贝</h3>
            <p style="color:var(--muted);font-size:13px;">版本 1.0.0</p>
        </div>
        <p style="color:var(--fg2);font-size:14px;line-height:1.7;text-align:center;margin-bottom:20px;">
            题海拾贝是一款专注于知识刷题的学习应用，<br>
            助你高效备考，轻松上岸。<br>
            每天进步一点点，知识海洋任你游。
        </p>
        <button class="g-btn g-btn-ghost" style="width:100%;" onclick="this.closest('.modal-overlay').remove()">关闭</button>
    </div>`;
    document.body.appendChild(overlay);
}

function toggleDarkMode() {
    showToast('当前为深色模式', 'info');
}

// ============ 学习报告 ============

function renderStats() {
    // 本周数据
    const weekChart = document.getElementById('weekChart');
    const weekLabels = document.getElementById('weekLabels');
    const dayNames = ['周一','周二','周三','周四','周五','周六','周日'];
    const weekData = [12, 25, 8, 30, 15, 22, appState.totalAnswered > 0 ? Math.min(35, appState.totalAnswered % 40 + 10) : 5];
    const maxVal = Math.max(...weekData, 1);

    weekChart.innerHTML = '';
    weekLabels.innerHTML = '';
    weekData.forEach((v, i) => {
        const h = Math.max(8, (v / maxVal) * 120);
        const isToday = i === new Date().getDay() - 1 || (new Date().getDay() === 0 && i === 6);
        weekChart.innerHTML += `<div class="stat-bar" style="height:${h}px;background:${isToday?'linear-gradient(0deg,var(--accent),var(--accent2))':'var(--card2)'};width:28px;border-radius:4px 4px 0 0;"></div>`;
        weekLabels.innerHTML += `<div style="width:28px;text-align:center;font-size:11px;color:${isToday?'var(--accent2)':'var(--muted)'};">${dayNames[i]}</div>`;
    });

    // 科目正确率
    const subjectList = document.getElementById('subjectAccList');
    subjectList.innerHTML = '';
    questionBanks.forEach(bank => {
        const bankHistory = appState.history.filter(h => h.bankId === bank.id);
        const acc = bankHistory.length > 0 ? Math.round(bankHistory.reduce((s,h)=>s+h.accuracy,0)/bankHistory.length) : 0;
        subjectList.innerHTML += `
        <div style="margin-bottom:12px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
                <span style="font-size:13px;display:flex;align-items:center;gap:6px;"><i class="${bank.icon}" style="color:${bank.color};"></i> ${bank.name}</span>
                <span style="font-size:13px;font-weight:600;color:${acc>=80?'var(--success)':acc>=60?'var(--warm)':'var(--danger)'};">${acc}%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width:${acc}%;background:${acc>=80?'var(--success)':acc>=60?'var(--warm)':'var(--danger)'};"></div>
            </div>
        </div>`;
    });

    // 时段分布
    const timeDist = document.getElementById('timeDistribution');
    const morning = 30 + Math.random() * 20;
    const afternoon = 20 + Math.random() * 15;
    const evening = 100 - morning - afternoon;
    timeDist.innerHTML = `
        <div class="stat-bar" style="height:${morning}%;background:var(--warm);flex:1;"></div>
        <div class="stat-bar" style="height:${afternoon}%;background:var(--info);flex:1;"></div>
        <div class="stat-bar" style="height:${evening}%;background:#818CF8;flex:1;"></div>`;
    document.getElementById('morningPct').textContent = Math.round(morning) + '%';
    document.getElementById('afternoonPct').textContent = Math.round(afternoon) + '%';
    document.getElementById('eveningPct').textContent = Math.round(evening) + '%';
}

// ============ 答题历史 ============

function renderHistory() {
    const list = document.getElementById('historyList');
    const empty = document.getElementById('historyEmpty');

    if (appState.history.length === 0) {
        list.innerHTML = '';
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';
    list.innerHTML = '';

    appState.history.slice().reverse().forEach((h, i) => {
        const bank = questionBanks.find(b => b.id === h.bankId);
        if (!bank) return;
        list.innerHTML += `
        <div class="g-card" style="margin-bottom:12px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <i class="${bank.icon}" style="color:${bank.color};"></i>
                    <span style="font-weight:600;">${bank.name}</span>
                </div>
                <span style="font-size:12px;color:var(--muted);">${h.date}</span>
            </div>
            <div style="display:flex;gap:16px;font-size:13px;color:var(--fg2);">
                <span>${h.total}题</span>
                <span>答对${h.correct}题</span>
                <span>用时${formatTime(h.time)}</span>
                <span style="color:${h.accuracy>=80?'var(--success)':h.accuracy>=60?'var(--warm)':'var(--danger)'};font-weight:600;">${h.accuracy}%</span>
            </div>
        </div>`;
    });
}

// ============ 成就 ============

function renderAchievements() {
    const grid = document.getElementById('achieveGrid');
    grid.innerHTML = '';

    achievementDefs.forEach(a => {
        const unlocked = appState.achievements.includes(a.id);
        grid.innerHTML += `
        <div class="g-card" style="text-align:center;padding:16px;opacity:${unlocked?1:0.4};">
            <div style="width:48px;height:48px;border-radius:14px;background:${unlocked?a.color+'22':'var(--card2)'};display:inline-flex;align-items:center;justify-content:center;margin-bottom:8px;">
                <i class="${a.icon}" style="font-size:20px;color:${unlocked?a.color:'var(--muted)'};"></i>
            </div>
            <div style="font-weight:700;font-size:13px;margin-bottom:2px;">${a.name}</div>
            <div style="font-size:11px;color:var(--muted);">${a.desc}</div>
            ${unlocked ? '<div style="margin-top:4px;font-size:10px;color:var(--success);"><i class="fas fa-check-circle"></i> 已解锁</div>' : ''}
        </div>`;
    });
}

// ============ 通知 ============

function renderNotifications() {
    const list = document.getElementById('notifList');
    const notifs = [
        { icon: 'fas fa-bullhorn', color: 'var(--accent2)', title: '新题库上线', desc: '趣味百科题库新增100道题目，快来挑战！', time: '2小时前', unread: true },
        { icon: 'fas fa-trophy', color: 'var(--warm)', title: '排行更新', desc: '本周学习排行榜已更新，查看你的排名', time: '5小时前', unread: true },
        { icon: 'fas fa-gift', color: '#C084FC', title: '连续打卡奖励', desc: '你已连续打卡3天，获得"三日之约"成就徽章', time: '1天前', unread: true },
        { icon: 'fas fa-bell', color: 'var(--info)', title: '系统通知', desc: '题海拾贝V1.0正式上线，祝学习愉快！', time: '3天前', unread: false }
    ];

    list.innerHTML = '';
    notifs.forEach(n => {
        list.innerHTML += `
        <div class="g-card" style="margin-bottom:10px;display:flex;gap:12px;align-items:flex-start;${n.unread?'border-left:3px solid var(--accent);':''}">
            <div style="width:40px;height:40px;border-radius:12px;background:${n.color}18;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <i class="${n.icon}" style="color:${n.color};"></i>
            </div>
            <div style="flex:1;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2px;">
                    <span style="font-weight:700;font-size:14px;">${n.title}</span>
                    <span style="font-size:11px;color:var(--muted);">${n.time}</span>
                </div>
                <p style="font-size:13px;color:var(--fg2);line-height:1.5;">${n.desc}</p>
            </div>
        </div>`;
    });
}
