// ============ 收藏夹 ============

function renderFavorites() {
    const list = document.getElementById('favList');
    const empty = document.getElementById('favEmpty');

    if (appState.favorites.length === 0) {
        list.innerHTML = '';
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';
    list.innerHTML = '';

    appState.favorites.forEach((f, i) => {
        const bank = questionBanks.find(b => b.id === f.bankId);
        if (!bank) return;
        const q = bank.questions[f.qIdx];
        if (!q) return;

        list.innerHTML += `
        <div class="g-card" style="margin-bottom:12px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                <i class="${bank.icon}" style="color:${bank.color};"></i>
                <span style="font-size:12px;color:var(--muted);">${bank.name}</span>
            </div>
            <div style="font-size:15px;font-weight:500;line-height:1.6;margin-bottom:10px;">${q.q}</div>
            <div style="display:flex;gap:8px;">
                <button onclick="doFavQuiz('${bank.id}', ${f.qIdx})" style="flex:1;padding:8px;border-radius:8px;background:rgba(13,148,136,0.1);border:none;color:var(--accent2);cursor:pointer;font-size:13px;">
                    <i class="fas fa-play"></i> 重做
                </button>
                <button onclick="removeFav(${i})" style="padding:8px 14px;border-radius:8px;background:rgba(239,68,68,0.1);border:none;color:var(--danger);cursor:pointer;font-size:13px;">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>`;
    });
}

function doFavQuiz(bankId, qIdx) {
    const bank = questionBanks.find(b => b.id === bankId);
    if (!bank) return;
    
    quizState = {
        bankId,
        questions: [bank.questions[qIdx]],
        currentIdx: 0,
        answers: [-1],
        flags: [false],
        selectedOption: -1,
        answered: false,
        startTime: Date.now(),
        elapsed: 0,
        mode: 'practice'
    };
    saveQuizState();
    window.location.href = 'quiz.html';
}

function removeFav(idx) {
    appState.favorites.splice(idx, 1);
    saveState();
    renderFavorites();
    showToast('已取消收藏', 'info');
}
