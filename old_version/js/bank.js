// ============ 题库列表 ============

function renderBankList() {
    // 分类
    const categories = document.getElementById('bankCategories');
    if (!categories) return; // 如果在详情页就不执行

    const cats = [
        { key: 'all', name: '全部' },
        { key: 'exam', name: '考试类' },
        { key: 'skill', name: '技能类' },
        { key: 'license', name: '资格类' },
        { key: 'language', name: '语言类' },
        { key: 'interest', name: '兴趣类' }
    ];
    categories.innerHTML = '';
    cats.forEach(c => {
        categories.innerHTML += `<button onclick="filterBankCategory('${c.key}',this)" class="g-tag" style="cursor:pointer;border:none;padding:6px 14px;${appState.currentBankCategory===c.key?'background:var(--accent);color:#fff;':'background:var(--card);color:var(--fg2);'}">${c.name}</button>`;
    });

    renderBankItems();
}

function filterBankCategory(cat, btn) {
    appState.currentBankCategory = cat;
    document.querySelectorAll('#bankCategories .g-tag').forEach(b => {
        b.style.background = 'var(--card)';
        b.style.color = 'var(--fg2)';
    });
    btn.style.background = 'var(--accent)';
    btn.style.color = '#fff';
    renderBankItems();
    saveState();
}

function filterBanks() {
    renderBankItems();
}

function renderBankItems() {
    const search = document.getElementById('bankSearch')?.value?.toLowerCase() || '';
    const cat = appState.currentBankCategory;
    const list = document.getElementById('bankList');
    if (!list) return;

    const filtered = questionBanks.filter(b => {
        if (cat !== 'all' && b.type !== cat) return false;
        if (search && !b.name.toLowerCase().includes(search) && !b.desc.toLowerCase().includes(search)) return false;
        return true;
    });

    list.innerHTML = '';
    if (filtered.length === 0) {
        list.innerHTML = `<div style="text-align:center;padding:60px 20px;color:var(--muted);">未找到相关题库</div>`;
        return;
    }

    filtered.forEach((bank, i) => {
        const progress = appState.bankProgress[bank.id] || 0;
        const pct = Math.round(progress / bank.questions.length * 100);
        const typeClass = `type-${bank.type}`;
        const diffClass = bank.difficulty === '简单' ? 'diff-easy' : bank.difficulty === '中等' ? 'diff-medium' : 'diff-hard';
        list.innerHTML += `
        <div class="g-card fade-up" style="margin-bottom:12px;cursor:pointer;animation-delay:${i*0.05}s;" onclick="navigateTo('bank-detail.html?id=${bank.id}')">
            <div style="display:flex;align-items:flex-start;gap:14px;">
                <div style="width:48px;height:48px;border-radius:14px;background:${bank.color}22;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <i class="${bank.icon}" style="font-size:22px;color:${bank.color};"></i>
                </div>
                <div style="flex:1;min-width:0;">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                        <span style="font-weight:700;font-size:15px;">${bank.name}</span>
                        <span class="g-tag ${typeClass}">${bank.typeName}</span>
                    </div>
                    <div style="font-size:13px;color:var(--fg2);margin-bottom:8px;line-height:1.5;">${bank.desc}</div>
                    <div style="display:flex;align-items:center;gap:16px;font-size:12px;color:var(--muted);">
                        <span><i class="fas fa-list-ol"></i> ${bank.total}题</span>
                        <span class="${diffClass}"><i class="fas fa-signal"></i> ${bank.difficulty}</span>
                        <span><i class="fas fa-check-circle"></i> 已做${progress}题</span>
                    </div>
                </div>
            </div>
        </div>`;
    });
}

// ============ 题库详情 ============

function openBankDetail(bankId) {
    const bank = questionBanks.find(b => b.id === bankId);
    if (!bank) return;

    const titleEl = document.getElementById('bankDetailTitle');
    if (titleEl) titleEl.textContent = bank.name;
    
    const content = document.getElementById('bankDetailContent');
    if (!content) return;

    const progress = appState.bankProgress[bank.id] || 0;
    const pct = Math.round(progress / bank.questions.length * 100);
    const wrongCount = appState.wrongBook.filter(w => w.bankId === bankId).length;

    content.innerHTML = `
    <div class="g-card" style="border-left:3px solid ${bank.color};margin-bottom:16px;">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:12px;">
            <i class="${bank.icon}" style="font-size:28px;color:${bank.color};"></i>
            <div>
                <div style="font-weight:700;font-size:18px;">${bank.name}</div>
                <div style="font-size:13px;color:var(--fg2);">${bank.desc}</div>
            </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px;">
            <div style="text-align:center;">
                <div style="font-size:20px;font-weight:700;">${bank.questions.length}</div>
                <div style="font-size:11px;color:var(--muted);">总题数</div>
            </div>
            <div style="text-align:center;">
                <div style="font-size:20px;font-weight:700;color:var(--accent2);">${progress}</div>
                <div style="font-size:11px;color:var(--muted);">已完成</div>
            </div>
            <div style="text-align:center;">
                <div style="font-size:20px;font-weight:700;color:var(--danger);">${wrongCount}</div>
                <div style="font-size:11px;color:var(--muted);">错题数</div>
            </div>
        </div>
        <div class="progress-bar">
            <div class="progress-fill" style="width:${pct}%;"></div>
        </div>
        <div style="font-size:11px;color:var(--muted);margin-top:4px;">完成度 ${pct}%</div>
    </div>

    <div style="display:flex;flex-direction:column;gap:12px;">
        <button class="g-btn g-btn-primary" style="width:100%;padding:16px;" onclick="startQuizRoute('${bankId}','all')">
            <i class="fas fa-play"></i> 开始练习（全部题目）
        </button>
        <button class="g-btn g-btn-warm" style="width:100%;padding:16px;" onclick="startQuizRoute('${bankId}','wrong')">
            <i class="fas fa-redo"></i> 错题重练（${wrongCount}题）
        </button>
        <button class="g-btn g-btn-ghost" style="width:100%;padding:16px;" onclick="startQuizRoute('${bankId}','random')">
            <i class="fas fa-random"></i> 随机练习（10题）
        </button>
    </div>

    <div style="margin-top:24px;">
        <h3 style="font-weight:700;margin-bottom:12px;">章节目录</h3>
        <div style="display:flex;flex-direction:column;gap:8px;">
            ${bank.questions.map((q, i) => {
                const isDone = i < progress;
                return `<div class="g-card" style="padding:12px;display:flex;align-items:center;gap:12px;cursor:pointer;opacity:${isDone?0.7:1};" onclick="startQuizRoute('${bankId}','single',${i})">
                    <div style="width:28px;height:28px;border-radius:8px;background:${isDone?'var(--accent)':'var(--card2)'};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:${isDone?'#fff':'var(--muted)'};">${i+1}</div>
                    <span style="flex:1;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${q.q}</span>
                    ${isDone?'<i class="fas fa-check-circle" style="color:var(--success);"></i>':''}
                </div>`;
            }).join('')}
        </div>
    </div>`;
}

function startQuizRoute(bankId, mode, singleIdx = -1) {
    const bank = questionBanks.find(b => b.id === bankId);
    if (!bank) return;

    let questions = [...bank.questions];

    if (mode === 'wrong') {
        const wrongQs = appState.wrongBook.filter(w => w.bankId === bankId);
        if (wrongQs.length === 0) {
            showToast('该题库暂无错题', 'info');
            return;
        }
        questions = wrongQs.map(w => bank.questions[w.qIdx]);
    } else if (mode === 'random') {
        questions = [...bank.questions].sort(() => Math.random() - 0.5).slice(0, 10);
    } else if (mode === 'single' && singleIdx >= 0) {
        questions = [bank.questions[singleIdx]];
    }

    quizState = {
        bankId,
        questions,
        currentIdx: 0,
        answers: new Array(questions.length).fill(-1),
        flags: new Array(questions.length).fill(false),
        selectedOption: -1,
        answered: false,
        startTime: Date.now(),
        elapsed: 0,
        mode: 'practice'
    };

    saveQuizState();
    window.location.href = 'quiz.html';
}
