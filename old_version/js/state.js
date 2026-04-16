// 用户状态
let appState = {
    user: null,
    totalAnswered: 0,
    totalCorrect: 0,
    streak: 0,
    checkedInToday: false,
    checkedDays: [],
    wrongBook: [],
    favorites: [],
    history: [],
    bankProgress: {},
    achievements: [],
    currentBankCategory: 'all'
};

// 答题状态 (独立于appState，方便MPA页面间传递)
let quizState = {
    bankId: null,
    questions: [],
    currentIdx: 0,
    answers: [],
    flags: [],
    selectedOption: -1,
    answered: false,
    startTime: 0,
    elapsed: 0,
    mode: 'practice' // practice | exam
};

function saveState() {
    localStorage.setItem('quizAppState', JSON.stringify(appState));
}

function loadState() {
    const saved = localStorage.getItem('quizAppState');
    if (saved) {
        const d = JSON.parse(saved);
        Object.assign(appState, d);
    }
    // 检查日期重置打卡状态
    const today = new Date().toDateString();
    if (!appState.checkedDays.includes(today)) {
        appState.checkedInToday = false;
    }
}

function saveQuizState() {
    localStorage.setItem('quizStateData', JSON.stringify(quizState));
}

function loadQuizState() {
    const saved = localStorage.getItem('quizStateData');
    if (saved) {
        const d = JSON.parse(saved);
        Object.assign(quizState, d);
    }
}

function checkAchievement(id) {
    if (!appState.achievements.includes(id)) {
        appState.achievements.push(id);
        const a = achievementDefs.find(x => x.id === id);
        if (a && typeof showToast === 'function') {
            showToast(`🎉 解锁成就：${a.name}`, 'success');
        }
        saveState();
    }
}

function handleLogout() {
    appState.user = null;
    localStorage.removeItem('quizAppState');
    localStorage.removeItem('quizStateData');
    if (typeof showToast === 'function') {
        showToast('已退出登录', 'info');
    }
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 500);
}

// 初始化时自动加载状态
loadState();
loadQuizState();
