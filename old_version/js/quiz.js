let timerInterval = null;

function initQuiz() {
    if (!quizState || !quizState.bankId) {
        window.location.href = 'bank.html';
        return;
    }
    
    // 如果是从别的页面进来，且没有处于答题状态中，这里就只重新开始计时
    // 若中途刷新页面，继续计时
    if (quizState.startTime === 0) {
        quizState.startTime = Date.now();
    }
    
    timerInterval = setInterval(() => {
        quizState.elapsed = Math.floor((Date.now() - quizState.startTime) / 1000);
        saveQuizState();
    }, 1000);

    renderQuestion();
}

function renderQuestion() {
    const q = quizState.questions[quizState.currentIdx];
    if (!q) return;

    const total = quizState.questions.length;
    const idx = quizState.currentIdx;

    // 进度
    document.getElementById('quizProgress').textContent = `${idx+1}/${total}`;
    document.getElementById('quizProgressBar').style.width = `${(idx+1)/total*100}%`;

    // 难度标签
    document.getElementById('quizDiffTag').innerHTML = '<i class="fas fa-signal"></i> 中等';
    document.getElementById('quizDiffTag').className = 'g-tag';
    document.getElementById('quizDiffTag').style.cssText = 'background:rgba(251,191,36,0.12);color:#FBBF24;padding:4px 10px;border-radius:8px;font-size:11px;';

    // 题目
    document.getElementById('quizQuestion').textContent = q.q;

    // 选项
    const optContainer = document.getElementById('quizOptions');
    optContainer.innerHTML = '';
    const labels = ['A','B','C','D'];
    q.opts.forEach((opt, i) => {
        const isSelected = quizState.answers[idx] === i;
        const isAnswered = quizState.answers[idx] >= 0;
        let extraClass = '';
        if (isAnswered) {
            if (i === q.ans) extraClass = 'correct';
            else if (isSelected && i !== q.ans) extraClass = 'wrong';
        } else if (quizState.selectedOption === i) {
            extraClass = 'selected';
        }

        optContainer.innerHTML += `
        <div class="quiz-option ${extraClass}" onclick="selectOption(${i})" ${isAnswered?'style="pointer-events:none;"':''}>
            <div class="opt-label">${labels[i]}</div>
            <div style="flex:1;font-size:15px;line-height:1.5;">${opt}</div>
            ${isAnswered && i === q.ans ? '<i class="fas fa-check-circle" style="color:var(--success);font-size:18px;flex-shrink:0;"></i>' : ''}
            ${isAnswered && isSelected && i !== q.ans ? '<i class="fas fa-times-circle" style="color:var(--danger);font-size:18px;flex-shrink:0;"></i>' : ''}
        </div>`;
    });

    // 解析
    const expDiv = document.getElementById('quizExplanation');
    if (quizState.answers[idx] >= 0) {
        expDiv.style.display = 'block';
        document.getElementById('quizExpText').textContent = q.exp;
    } else {
        expDiv.style.display = 'none';
    }

    // 标记状态
    const flagIcon = document.querySelector('#flagBtn i');
    flagIcon.className = quizState.flags[idx] ? 'fas fa-flag' : 'far fa-flag';
    document.getElementById('flagBtn').style.color = quizState.flags[idx] ? 'var(--warm)' : 'var(--muted)';

    // 收藏状态
    const bankQIdx = getBankQIdx(q);
    const favKey = `${quizState.bankId}_${bankQIdx}`;
    const isFav = appState.favorites.some(f => f.key === favKey);
    const favIcon = document.querySelector('#favQBtn i');
    favIcon.className = isFav ? 'fas fa-bookmark' : 'far fa-bookmark';
    document.getElementById('favQBtn').style.color = isFav ? 'var(--warm)' : 'var(--muted)';

    // 按钮状态
    document.getElementById('prevBtn').style.visibility = idx > 0 ? 'visible' : 'hidden';
    const nextBtn = document.getElementById('nextBtn');
    if (idx === total - 1 && quizState.answers[idx] >= 0) {
        nextBtn.innerHTML = '<i class="fas fa-check"></i> 完成答题';
    } else {
        nextBtn.innerHTML = '下一题 <i class="fas fa-chevron-right"></i>';
    }

    quizState.selectedOption = -1;
    quizState.answered = quizState.answers[idx] >= 0;
}

function getBankQIdx(q) {
    const bank = questionBanks.find(b=>b.id===quizState.bankId);
    if (!bank) return -1;
    return bank.questions.findIndex(bq => bq.q === q.q); // 简单对比题目内容找原始索引
}

function selectOption(optIdx) {
    if (quizState.answered) return;

    const q = quizState.questions[quizState.currentIdx];
    quizState.answers[quizState.currentIdx] = optIdx;
    quizState.answered = true;

    // 统计
    appState.totalAnswered++;
    if (optIdx === q.ans) {
        appState.totalCorrect++;
    }

    // 错题本
    if (optIdx !== q.ans) {
        const bankQIdx = getBankQIdx(q);
        if (bankQIdx >= 0 && !appState.wrongBook.some(w => w.bankId === quizState.bankId && w.qIdx === bankQIdx)) {
            appState.wrongBook.push({ bankId: quizState.bankId, qIdx: bankQIdx });
        }
    }

    // 更新进度
    const progress = appState.bankProgress[quizState.bankId] || 0;
    const qIdxInBank = getBankQIdx(q);
    if (qIdxInBank >= 0) {
        appState.bankProgress[quizState.bankId] = Math.max(progress, qIdxInBank + 1);
    }

    checkAchievement('first_quiz');
    if (appState.totalAnswered >= 50) checkAchievement('quiz_50');
    if (appState.totalAnswered >= 200) checkAchievement('quiz_200');
    if (appState.totalAnswered >= 500) checkAchievement('quiz_500');

    saveState();
    saveQuizState();
    renderQuestion();
}

function toggleFlag() {
    const idx = quizState.currentIdx;
    quizState.flags[idx] = !quizState.flags[idx];
    saveQuizState();
    renderQuestion();
}

function toggleFavoriteQ() {
    const q = quizState.questions[quizState.currentIdx];
    const bankQIdx = getBankQIdx(q);
    const favKey = `${quizState.bankId}_${bankQIdx}`;
    const existIdx = appState.favorites.findIndex(f => f.key === favKey);

    if (existIdx >= 0) {
        appState.favorites.splice(existIdx, 1);
        showToast('已取消收藏', 'info');
    } else {
        appState.favorites.push({ key: favKey, bankId: quizState.bankId, qIdx: bankQIdx });
        showToast('已收藏', 'success');
    }

    if (appState.favorites.length >= 10) checkAchievement('fav_10');
    saveState();
    renderQuestion();
}

function prevQuestion() {
    if (quizState.currentIdx > 0) {
        quizState.currentIdx--;
        quizState.answered = quizState.answers[quizState.currentIdx] >= 0;
        saveQuizState();
        renderQuestion();
    }
}

function nextQuestion() {
    if (quizState.currentIdx < quizState.questions.length - 1) {
        quizState.currentIdx++;
        quizState.answered = quizState.answers[quizState.currentIdx] >= 0;
        saveQuizState();
        renderQuestion();
    } else if (quizState.answers[quizState.currentIdx] >= 0) {
        finishQuiz();
    }
}

function toggleAnswerGrid() {
    const panel = document.getElementById('answerGridPanel');
    if (panel.style.display === 'none') {
        panel.style.display = 'block';
        renderAnswerGrid();
    } else {
        panel.style.display = 'none';
    }
}

function renderAnswerGrid() {
    const grid = document.getElementById('answerGridItems');
    grid.innerHTML = '';
    quizState.questions.forEach((q, i) => {
        let cls = '';
        if (i === quizState.currentIdx) cls = 'current';
        if (quizState.answers[i] >= 0) cls = 'answered';
        if (quizState.flags[i]) cls = 'flagged';
        grid.innerHTML += `<div class="answer-grid-item ${cls}" onclick="jumpToQuestion(${i})">${i+1}</div>`;
    });
}

function jumpToQuestion(idx) {
    quizState.currentIdx = idx;
    quizState.answered = quizState.answers[idx] >= 0;
    saveQuizState();
    toggleAnswerGrid();
    renderQuestion();
}

function confirmQuitQuiz() {
    // 简单确认用模态
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
    <div class="modal-content">
        <h3 style="font-weight:700;margin-bottom:8px;">确认退出</h3>
        <p style="color:var(--fg2);margin-bottom:20px;">退出后当前答题进度可能丢失，确认退出吗？</p>
        <div style="display:flex;gap:12px;">
            <button class="g-btn g-btn-ghost" style="flex:1;" onclick="this.closest('.modal-overlay').remove()">继续答题</button>
            <button class="g-btn g-btn-warm" style="flex:1;" onclick="quitQuiz();this.closest('.modal-overlay').remove()">确认退出</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);
}

function quitQuiz() {
    clearInterval(timerInterval);
    goBack();
}

function submitQuiz() {
    const unanswered = quizState.answers.filter(a => a < 0).length;
    if (unanswered > 0) {
        showToast(`还有${unanswered}题未作答`, 'error');
        return;
    }
    finishQuiz();
}

function finishQuiz() {
    clearInterval(timerInterval);

    const correct = quizState.answers.reduce((sum, a, i) => {
        return sum + (a === quizState.questions[i].ans ? 1 : 0);
    }, 0);
    const total = quizState.questions.length;
    const accuracy = Math.round(correct / total * 100);
    const time = quizState.elapsed;

    // 保存历史
    appState.history.push({
        bankId: quizState.bankId,
        date: new Date().toLocaleDateString(),
        total,
        correct,
        time,
        accuracy
    });

    // 成就检查
    if (accuracy >= 80) checkAchievement('acc_80');
    if (accuracy === 100) checkAchievement('acc_100');

    saveState();
    // 存储最后一次的答题结果用于result页面读取
    localStorage.setItem('lastQuizResult', JSON.stringify({
        correct, total, time, accuracy
    }));

    window.location.href = 'result.html';
}

function renderResult() {
    const resultDataStr = localStorage.getItem('lastQuizResult');
    if (!resultDataStr) {
        window.location.href = 'index.html';
        return;
    }
    const { correct, total, time, accuracy } = JSON.parse(resultDataStr);

    // 环形进度
    const ring = document.getElementById('resultRing');
    const circumference = 2 * Math.PI * 68;
    ring.style.strokeDasharray = circumference;
    ring.style.strokeDashoffset = circumference;
    setTimeout(() => {
        ring.style.strokeDashoffset = circumference * (1 - accuracy / 100);
    }, 100);

    // 设置颜色
    if (accuracy >= 80) ring.style.stroke = 'var(--success)';
    else if (accuracy >= 60) ring.style.stroke = 'var(--warm)';
    else ring.style.stroke = 'var(--danger)';

    document.getElementById('resultScore').textContent = accuracy;
    document.getElementById('resultCorrect').textContent = correct;
    document.getElementById('resultWrong').textContent = total - correct;
    document.getElementById('resultTime').textContent = formatTime(time);
    document.getElementById('resultAccuracy').textContent = accuracy + '%';

    // 评语
    const title = document.getElementById('resultTitle');
    const sub = document.getElementById('resultSubtitle');
    if (accuracy === 100) { title.textContent = '完美通关！'; sub.textContent = '你太厉害了，全部答对！'; }
    else if (accuracy >= 80) { title.textContent = '表现优秀！'; sub.textContent = '继续保持这个势头！'; }
    else if (accuracy >= 60) { title.textContent = '还不错！'; sub.textContent = '再接再厉，争取更高分！'; }
    else { title.textContent = '继续努力！'; sub.textContent = '多加练习，下次一定行！'; }

    // 错题回顾按钮
    document.getElementById('reviewWrongBtn').style.display = (total - correct) > 0 ? 'flex' : 'none';
}

function reviewWrongQ() {
    // 重新进入答题模式，只显示错题
    const wrongIdxs = [];
    quizState.answers.forEach((a, i) => {
        if (a !== quizState.questions[i].ans) wrongIdxs.push(i);
    });

    if (wrongIdxs.length === 0) {
        showToast('没有错题', 'info');
        return;
    }

    const wrongQuestions = wrongIdxs.map(i => quizState.questions[i]);
    quizState = {
        bankId: quizState.bankId,
        questions: wrongQuestions,
        currentIdx: 0,
        answers: new Array(wrongQuestions.length).fill(-1),
        flags: new Array(wrongQuestions.length).fill(false),
        selectedOption: -1,
        answered: false,
        startTime: Date.now(),
        elapsed: 0,
        mode: 'practice'
    };
    saveQuizState();
    window.location.href = 'quiz.html';
}

function retryQuiz() {
    // 根据最初题库的原始ID重开
    const bankId = quizState.bankId;
    const bank = questionBanks.find(b => b.id === bankId);
    if (!bank) return;
    
    quizState = {
        bankId,
        questions: [...bank.questions],
        currentIdx: 0,
        answers: new Array(bank.questions.length).fill(-1),
        flags: new Array(bank.questions.length).fill(false),
        selectedOption: -1,
        answered: false,
        startTime: Date.now(),
        elapsed: 0,
        mode: 'practice'
    };
    saveQuizState();
    window.location.href = 'quiz.html';
}
