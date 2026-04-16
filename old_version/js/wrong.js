// ============ 错题本 ============

let currentFilter = 'all';

function renderWrongBook() {
    const list = document.getElementById('wrongList');
    const empty = document.getElementById('wrongEmpty');

    let displayWrong = appState.wrongBook;
    if (currentFilter !== 'all') {
        displayWrong = appState.wrongBook.filter(w => {
            const bank = questionBanks.find(b => b.id === w.bankId);
            return bank && bank.type === currentFilter;
        });
    }

    if (displayWrong.length === 0) {
        list.innerHTML = '';
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';
    list.innerHTML = '';

    displayWrong.forEach((w, displayIdx) => {
        // find actual index in appState.wrongBook
        const actualIdx = appState.wrongBook.indexOf(w);
        
        const bank = questionBanks.find(b => b.id === w.bankId);
        if (!bank) return;
        const q = bank.questions[w.qIdx];
        if (!q) return;

        list.innerHTML += `
        <div class="g-card" style="margin-bottom:12px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                <span class="g-tag type-${bank.type}" style="font-size:10px;">${bank.typeName}</span>
                <span style="font-size:12px;color:var(--muted);">${bank.name}</span>
            </div>
            <div style="font-size:15px;font-weight:500;line-height:1.6;margin-bottom:12px;">${q.q}</div>
            <div style="display:flex;flex-direction:column;gap:6px;">
                ${q.opts.map((opt, oi) => `
                    <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:8px;font-size:13px;
                        ${oi === q.ans ? 'background:rgba(34,197,94,0.1);color:var(--success);' : ''}">
                        <span style="font-weight:600;">${['A','B','C','D'][oi]}.</span>
                        ${opt}
                        ${oi === q.ans ? '<i class="fas fa-check-circle" style="margin-left:auto;"></i>' : ''}
                    </div>
                `).join('')}
            </div>
            <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border);font-size:13px;color:var(--fg2);line-height:1.6;">
                <i class="fas fa-lightbulb" style="color:var(--warm);"></i> ${q.exp}
            </div>
            <div style="display:flex;gap:8px;margin-top:10px;">
                <button onclick="removeWrong(${actualIdx})" style="flex:1;padding:8px;border-radius:8px;background:rgba(34,197,94,0.1);border:none;color:var(--success);cursor:pointer;font-size:13px;">
                    <i class="fas fa-check"></i> 已掌握
                </button>
            </div>
        </div>`;
    });

    updateWrongBadge();
}

function filterWrong(cat, btn) {
    currentFilter = cat;
    document.querySelectorAll('.wrong-filter').forEach(b => {
        b.style.background = 'var(--card)';
        b.style.color = 'var(--fg2)';
    });
    btn.style.background = 'var(--accent)';
    btn.style.color = '#fff';
    renderWrongBook();
}

function removeWrong(idx) {
    appState.wrongBook.splice(idx, 1);
    if (appState.wrongBook.length === 0) checkAchievement('wrong_clear');
    saveState();
    renderWrongBook();
    showToast('已从错题本移除', 'success');
}

function clearWrongBook() {
    if (appState.wrongBook.length === 0) {
        showToast('错题本已经是空的', 'info');
        return;
    }
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
    <div class="modal-content">
        <h3 style="font-weight:700;margin-bottom:8px;">清空错题本</h3>
        <p style="color:var(--fg2);margin-bottom:20px;">确定要清空所有错题记录吗？此操作不可恢复。</p>
        <div style="display:flex;gap:12px;">
            <button class="g-btn g-btn-ghost" style="flex:1;" onclick="this.closest('.modal-overlay').remove()">取消</button>
            <button class="g-btn g-btn-warm" style="flex:1;" onclick="appState.wrongBook=[];saveState();renderWrongBook();checkAchievement('wrong_clear');showToast('错题本已清空','success');this.closest('.modal-overlay').remove()">确认清空</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);
}
