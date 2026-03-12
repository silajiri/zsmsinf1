// jednoduchá struktura a logika pro kvíz s výběrem sady a uložení výsledků

// Firebase / Firestore objekt
let db;

const app = {
    user: null,
    
    // sady otázek se načtou z JSON souborů
    sets: {},
    
    questions: [],
    currentIndex: 0,
    score: 0,
    currentSet: null,

    init: async () => {
        // inicializace Firebase (pokud jsou SDK a config dostupné)
        if (typeof firebase !== 'undefined' && typeof firebaseConfig !== 'undefined') {
            try {
                firebase.initializeApp(firebaseConfig);
                db = firebase.firestore();
                console.log('✅ Firebase inicializován');
            } catch (e) {
                console.error('Chyba při inicializaci Firebase:', e);
            }
        } else {
            console.warn('⚠ Firebase není dostupné (chybí SDK nebo config). Výsledky nebudou ukládány.');
        }
        
        // Načtení sad otázek z JSON souborů
        await app.loadQuestionSets();
    },

    loadQuestionSets: async () => {
        try {
            const response1 = await fetch('data/set1.json');
            const response2 = await fetch('data/set2.json');
            
            if (!response1.ok || !response2.ok) {
                throw new Error('Nepodařilo se načíst JSON soubory');
            }
            
            app.sets['Test 1'] = await response1.json();
            app.sets['Test 2'] = await response2.json();
            
            console.log('✅ Sady otázek načteny');
        } catch (e) {
            console.error('Chyba při načítání sad otázek:', e);
            app.sets = {
                'Test 1': [],
                'Test 2': []
            };
        }
    },

    showScreen: (id) => {
        document.querySelectorAll('.screen').forEach(el => el.classList.add('hidden'));
        document.getElementById(id).classList.remove('hidden');
        
        // Zobrazit help ikonu na login, výběr sad a žebříčku
        const helpIcon = document.getElementById('help-icon');
        const screensWithHelp = ['screen-login', 'screen-sets', 'screen-leaderboard'];
        if (screensWithHelp.includes(id)) {
            helpIcon.style.display = 'flex';
        } else {
            helpIcon.style.display = 'none';
        }
    },

    login: () => {
        const name = document.getElementById('username-input').value.trim();
        if (!name) {
            alert('Zadej jméno.');
            return;
        }
        app.user = name;
        document.getElementById('current-username').textContent = name;
        document.getElementById('user-display').classList.remove('hidden');
        app.showSets();
    },

    showSets: () => {
        const container = document.getElementById('sets-container');
        container.innerHTML = '';
        Object.keys(app.sets).forEach(setName => {
            const btn = document.createElement('button');
            btn.className = 'big-btn primary';
            btn.textContent = setName;
            btn.onclick = () => app.selectSet(setName);
            container.appendChild(btn);
        });
        
        // Přidat tlačítko pro žebříček
        const leaderboardBtn = document.createElement('button');
        leaderboardBtn.className = 'big-btn secondary';
        leaderboardBtn.textContent = '🏆 Žebříček';
        leaderboardBtn.onclick = () => app.showLeaderboard();
        container.appendChild(leaderboardBtn);
        
        app.showScreen('screen-sets');
    },

    selectSet: (name) => {
        const list = app.sets[name] || [];
        if (list.length === 0) {
            alert('Tato sada zatím neobsahuje žádné otázky. Vyber jinou nebo přidej otázky.');
            return;
        }
        app.currentSet = name;
        app.questions = app.shuffle([...list]);
        app.currentIndex = 0;
        app.score = 0;
        
        // Nastavit počet otázek v počítadle
        document.getElementById('current-q').textContent = 1;
        document.getElementById('total-q').textContent = app.questions.length;
        
        app.showQuestion();
        app.showScreen('screen-quiz');
    },

    shuffle: (arr) => arr.sort(() => Math.random() - 0.5),

    showQuestion: () => {
        // Aktualizovat počítadlo otázek
        document.getElementById('current-q').textContent = app.currentIndex + 1;
        
        const q = app.questions[app.currentIndex];
        document.getElementById('question-container').textContent = q.question;
        const answersDiv = document.getElementById('answers-container');
        answersDiv.innerHTML = '';

        // zobrazit možnosti v náhodném pořadí
        const opts = app.shuffle(q.answers.map((text, idx) => ({text, idx})));
        opts.forEach(item => {
            const label = document.createElement('label');
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = 'answer';
            input.value = item.idx; // index původní odpovědi
            input.addEventListener('change', () => {
                // po výběru - ukaž feedback
                app.showFeedback(item.idx, q.correct);
                document.getElementById('next-btn').classList.remove('hidden');
            });
            label.appendChild(input);
            label.append(' ' + item.text);
            answersDiv.appendChild(label);
        });

        document.getElementById('next-btn').classList.add('hidden');
    },

    showFeedback: (chosenIdx, correctIdx) => {
        const labels = document.querySelectorAll('#answers-container label');
        labels.forEach(label => {
            const input = label.querySelector('input');
            const idx = parseInt(input.value, 10);
            
            // Zakázat další výběr
            input.disabled = true;
            
            if (idx === correctIdx) {
                // Správná odpověď - zelená
                label.classList.add('correct');
                label.classList.remove('incorrect');
            } else if (idx === chosenIdx && chosenIdx !== correctIdx) {
                // Chybná odpověď - červená
                label.classList.add('incorrect');
                label.classList.remove('correct');
            }
        });
        
        // Zvýšit skóre pokud správně
        if (chosenIdx === correctIdx) {
            app.score++;
        }
    },

    nextQuestion: () => {
        app.currentIndex++;
        if (app.currentIndex < app.questions.length) {
            app.showQuestion();
        } else {
            app.finishQuiz();
        }
    },

    finishQuiz: () => {
        app.saveResult(app.score, app.questions.length);
        
        // Vypočítat procento správných odpovědí
        const percentage = (app.score / app.questions.length) * 100;
        let category = '';
        let maxGifs = 0;
        
        if (percentage >= 76) {
            category = 'winner';
            maxGifs = 4;
        } else if (percentage >= 26) {
            category = 'well_done';
            maxGifs = 4;
        } else {
            category = 'looser';
            maxGifs = 7;
        }
        
        // Random GIF z kategorie
        const randomNum = Math.floor(Math.random() * maxGifs) + 1;
        const gifFileName = `${category}_${randomNum}.gif`;
        const gifPath = `assets/images/${gifFileName}`;
        
        // Nastavit GIF
        document.getElementById('result-gif').src = gifPath;
        
        let text = `Správně: ${app.score} z ${app.questions.length} (${percentage.toFixed(0)}%)`;
        if (app.currentSet) {
            text = `Sada: ${app.currentSet} – ` + text;
        }
        document.getElementById('result-text').textContent = text;
        app.showScreen('screen-result');
    },

    saveResult: async (score, total) => {
        if (!db || !app.user) return;
        try {
            const payload = {
                name: app.user,
                score: score,
                total: total,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
            if (app.currentSet) payload.set = app.currentSet;
            await db.collection('results').add(payload);
            console.log('Výsledek uložen na Firestore.');
        } catch (e) {
            console.error('Chyba při ukládání výsledku:', e);
        }
    },

    showLeaderboard: async () => {
        if (!db) {
            alert('Firebase není dostupné. Žebříček nelze načíst.');
            return;
        }
        
        try {
            const snapshot = await db.collection('results')
                .orderBy('timestamp', 'desc')
                .limit(50)
                .get();
            
            const tbody = document.getElementById('leaderboard-body');
            tbody.innerHTML = '';
            
            let position = 1;
            snapshot.forEach(doc => {
                const data = doc.data();
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${position}</td>
                    <td>${data.name || 'Neznámý'}</td>
                    <td>${data.score} / ${data.total}</td>
                    <td>${data.set || '?'}</td>
                `;
                tbody.appendChild(row);
                position++;
            });
            
            if (snapshot.empty) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">Zatím žádné výsledky</td></tr>';
            }
            
            app.showScreen('screen-leaderboard');
        } catch (e) {
            console.error('Chyba při načítání žebříčku:', e);
            alert('Chyba při načítání žebříčku.');
        }
    },

    openHelpModal: () => {
        const modal = document.getElementById('help-modal');
        modal.classList.remove('hidden');
        
        // Pokud nejsou taby vykresleny, vykreslíme je
        if (!document.querySelector('.help-tab-btn')) {
            app.renderHelpTabs();
        }
    },

    closeHelpModal: () => {
        const modal = document.getElementById('help-modal');
        modal.classList.add('hidden');
    },

    renderHelpTabs: () => {
        const tabsButtons = document.getElementById('help-tabs-buttons');
        const tabsContent = document.getElementById('help-tabs-content');
        
        tabsButtons.innerHTML = '';
        tabsContent.innerHTML = '';
        
        let isFirst = true;
        
        // Vykreslení taba pro každou sadu otázek
        Object.keys(app.sets).forEach(setName => {
            // Tlačítko tabu
            const btn = document.createElement('button');
            btn.className = `help-tab-btn ${isFirst ? 'active' : ''}`;
            btn.textContent = setName;
            btn.onclick = () => app.switchHelpTab(setName);
            tabsButtons.appendChild(btn);
            
            // Obsah tabu
            const pane = document.createElement('div');
            pane.className = `help-tab-pane ${isFirst ? 'active' : ''}`;
            pane.id = `help-tab-${setName.replace(/\s+/g, '-')}`;
            pane.setAttribute('data-set', setName);
            
            // Vykreslení otázek
            const questions = app.sets[setName];
            let html = '';
            
            questions.forEach((q, idx) => {
                html += `<div class="help-question">
                    <div class="help-question-text">${idx + 1}. ${q.question}</div>`;
                
                // Vykreslení odpovědí
                q.answers.forEach((answer, ansIdx) => {
                    const isCorrect = ansIdx === q.correct;
                    html += `<div class="help-answer ${isCorrect ? 'correct' : ''}">
                        ${isCorrect ? '✓ ' : '• '}${answer}
                    </div>`;
                });
                
                html += `</div>`;
            });
            
            pane.innerHTML = html;
            tabsContent.appendChild(pane);
            
            isFirst = false;
        });
    },

    switchHelpTab: (setName) => {
        // Deaktivace všech tlačítek a panelů
        document.querySelectorAll('.help-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.help-tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        
        // Aktivace vybraného tabu
        event.target.classList.add('active');
        const tabId = `help-tab-${setName.replace(/\s+/g, '-')}`;
        const pane = document.getElementById(tabId);
        if (pane) {
            pane.classList.add('active');
        }
    }
};

// inicializace po načtení stránky
window.addEventListener('DOMContentLoaded', async () => {
    await app.init();
});