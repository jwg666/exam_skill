window.onload = function() {
    checkLoginAuth();
    if (appState.user) {
        renderHome();
        renderBottomNav(0);
    }
};

function renderHome() {
    if (!appState.user) return;

    // 问候
    document.getElementById('homeGreeting').textContent = getGreeting();
    document.getElementById('homeUsername').textContent = appState.user.name;
    const initial = appState.user.name.charAt(0).toUpperCase();
    document.getElementById('homeAvatar').textContent = initial;

    // 打卡状态
    const today = new Date().toDateString();
    const todayIdx = new Date().getDay();
    appState.checkedInToday = appState.checkedDays.includes(today);

    const btn = document.getElementById('checkinBtn');
    if (appState.checkedInToday) {
        btn.innerHTML = '<i class="fas fa-check"></i> 已打卡';
        btn.style.opacity = '0.6';
        btn.style.pointerEvents = 'none';
    } else {
        btn.innerHTML = '<i class="fas fa-check-circle"></i> 打卡';
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
    }

    // 每日目标
    const dailyDone = appState.checkedInToday ? Math.min(30, appState.totalAnswered % 40 + 15) : 0;
    document.getElementById('dailyGoalText').textContent = `已完成 ${dailyDone}/30 题`;
    document.getElementById('dailyProgress').style.width = `${Math.min(100, dailyDone/30*100)}%`;

    // 本周打卡点
    const weekDots = document.getElementById('weekDots');
    weekDots.innerHTML = '';
    const dayNames = ['一','二','三','四','五','六','日'];
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - todayIdx + i + 1);
        const ds = d.toDateString();
        const isChecked = appState.checkedDays.includes(ds);
        const isToday = ds === today;
        weekDots.innerHTML += `<div style="width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;
            ${isChecked ? 'background:rgba(255,255,255,0.2);color:#fff;' : isToday ? 'border:1.5px solid rgba(255,255,255,0.5);color:rgba(255,255,255,0.8);' : 'color:rgba(255,255,255,0.4);'}">${dayNames[i]}</div>`;
    }

    // 统计
    document.getElementById('statTotal').textContent = appState.totalAnswered;
    const acc = appState.totalAnswered > 0 ? Math.round(appState.totalCorrect / appState.totalAnswered * 100) : 0;
    document.getElementById('statAccuracy').textContent = acc + '%';
    document.getElementById('statStreak').textContent = appState.streak;

    // 热门题库
    const hotBanks = document.getElementById('hotBanks');
    hotBanks.innerHTML = '';
    questionBanks.forEach((bank, i) => {
        const progress = appState.bankProgress[bank.id] || 0;
        const pct = Math.round(progress / bank.questions.length * 100);
        hotBanks.innerHTML += `
        <div class="g-card" style="min-width:240px;cursor:pointer;border-left:3px solid ${bank.color};" onclick="navigateTo('bank-detail.html?id=${bank.id}')">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                <i class="${bank.icon}" style="font-size:22px;color:${bank.color};"></i>
                <div>
                    <div style="font-weight:700;font-size:14px;">${bank.name}</div>
                    <div style="font-size:11px;color:var(--muted);">${bank.total}题 · ${bank.typeName}</div>
                </div>
            </div>
            <div class="progress-bar" style="margin-bottom:4px;">
                <div class="progress-fill" style="width:${pct}%;"></div>
            </div>
            <div style="font-size:11px;color:var(--muted);">已完成 ${progress}/${bank.questions.length}</div>
        </div>`;
    });

    // 最近练习
    const recentBanks = document.getElementById('recentBanks');
    recentBanks.innerHTML = '';
    const recent = appState.history.slice(-3).reverse();
    if (recent.length === 0) {
        recentBanks.innerHTML = `<div class="g-card" style="text-align:center;color:var(--muted);padding:30px;">
            <i class="fas fa-book-open" style="font-size:32px;opacity:0.3;"></i>
            <p style="margin-top:8px;">还没有练习记录，快去刷题吧</p>
        </div>`;
    } else {
        recent.forEach(h => {
            const bank = questionBanks.find(b => b.id === h.bankId);
            if (!bank) return;
            const acc = h.total > 0 ? Math.round(h.correct/h.total*100) : 0;
            recentBanks.innerHTML += `
            <div class="g-card" style="cursor:pointer;" onclick="navigateTo('bank-detail.html?id=${bank.id}')">
                <div style="display:flex;align-items:center;justify-content:space-between;">
                    <div style="display:flex;align-items:center;gap:10px;">
                        <i class="${bank.icon}" style="font-size:18px;color:${bank.color};"></i>
                        <div>
                            <div style="font-weight:600;font-size:14px;">${bank.name}</div>
                            <div style="font-size:12px;color:var(--muted);">${h.date} · ${h.total}题</div>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-weight:700;color:${acc>=80?'var(--success)':acc>=60?'var(--warm)':'var(--danger)'};">${acc}%</div>
                        <div style="font-size:11px;color:var(--muted);">正确率</div>
                    </div>
                </div>
            </div>`;
        });
    }

    // 排行榜
    const rankList = document.getElementById('rankList');
    const rankData = [
        { name: '学习王者', score: 2847, avatar: 'W' },
        { name: '题海行者', score: 2103, avatar: 'X' },
        { name: appState.user.name, score: appState.totalAnswered, avatar: initial, isMe: true }
    ].sort((a,b) => b.score - a.score);
    rankList.innerHTML = '';
    rankData.forEach((r, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
        rankList.innerHTML += `
        <div style="display:flex;align-items:center;gap:12px;padding:12px 0;${i<2?'border-bottom:1px solid var(--border);':''}${r.isMe?'background:rgba(13,148,136,0.08);margin:0 -16px;padding:12px 16px;border-radius:8px;':''}">
            <span style="font-size:20px;width:28px;text-align:center;">${medal}</span>
            <div style="width:32px;height:32px;border-radius:10px;background:${r.isMe?'linear-gradient(135deg,var(--accent),var(--accent2))':'var(--card2)'};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:${r.isMe?'#fff':'var(--fg2)'};">${r.avatar}</div>
            <span style="flex:1;font-weight:${r.isMe?'700':'500'};font-size:14px;">${r.name}${r.isMe?' (我)':''}</span>
            <span style="font-weight:700;color:var(--warm);font-size:14px;">${r.score}分</span>
        </div>`;
    });
}

function handleCheckin() {
    const today = new Date().toDateString();
    if (appState.checkedInToday) return;

    appState.checkedInToday = true;
    if (!appState.checkedDays.includes(today)) {
        appState.checkedDays.push(today);
    }

    // 连续打卡计算
    let streak = 1;
    let d = new Date();
    d.setDate(d.getDate() - 1);
    while (appState.checkedDays.includes(d.toDateString())) {
        streak++;
        d.setDate(d.getDate() - 1);
    }
    appState.streak = Math.max(appState.streak, streak);

    if (appState.streak >= 3) checkAchievement('streak_3');
    if (appState.streak >= 7) checkAchievement('streak_7');
    if (appState.streak >= 30) checkAchievement('streak_30');

    saveState();
    showToast('打卡成功，继续加油！', 'success');
    renderHome();
}
