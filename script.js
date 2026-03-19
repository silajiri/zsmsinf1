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
    wrongAnswers: [], // sledování chybných odpovědí

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
            // Nejprve načíst seznam setů
            const setsResponse = await fetch('data/sets.json');
            if (!setsResponse.ok) {
                throw new Error('Nepodařilo se načíst sets.json');
            }
            const setConfigs = await setsResponse.json();
            
            app.sets = {};
            
            for (const config of setConfigs) {
                const { name, file } = config;
                try {
                    const response = await fetch(`data/${file}`);
                    if (response.ok) {
                        const data = await response.json();
                        app.sets[name] = data;
                        console.log(`✅ ${name} načten z ${file}`);
                    } else {
                        console.warn(`⚠ Soubor ${file} nenalezen nebo chyba při načítání`);
                    }
                } catch (e) {
                    console.warn(`⚠ Chyba při načítání ${file}:`, e);
                }
            }
            
            if (Object.keys(app.sets).length === 0) {
                throw new Error('Žádné sady otázek nebyly načteny');
            }
            
            console.log('✅ Sady otázek načteny');
        } catch (e) {
            console.error('Chyba při načítání sad otázek:', e);
            app.sets = {
                'Test 1': [],
                'Test 2': [],
                'Test 3': []
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
        app.wrongAnswers = []; // resetovat sledování chybných odpovědí
        
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
        } else {
            // Sledovat chybnou odpověď
            const currentQuestion = app.questions[app.currentIndex];
            app.wrongAnswers.push({
                question: currentQuestion.question,
                chosenAnswer: currentQuestion.answers[chosenIdx],
                correctAnswer: currentQuestion.answers[correctIdx],
                questionIndex: app.currentIndex
            });
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
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                wrongAnswers: app.wrongAnswers // uložit chybné odpovědi
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
            
            // Převedeme snapshot na pole a seřadíme dle úspěšnosti (score/total)
            const results = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                results.push({
                    name: data.name || 'Neznámý',
                    score: data.score,
                    total: data.total,
                    set: data.set || '?',
                    percentage: data.total > 0 ? (data.score / data.total) * 100 : 0,
                    wrongAnswers: data.wrongAnswers || []
                });
            });
            
            // Vykreslit tabs pro žebříček
            app.renderLeaderboardTabs(results);
            
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
    },

    renderLeaderboardTabs: (results) => {
        const tabsButtons = document.getElementById('leaderboard-tabs-buttons');
        const tabsContent = document.getElementById('leaderboard-tabs-content');
        
        tabsButtons.innerHTML = '';
        tabsContent.innerHTML = '';
        
        // Vytvořit tab pro minden test sadu
        const setNames = Object.keys(app.sets);
        let isFirst = true;
        
        setNames.forEach(setName => {
            // Tlačítko tabu
            const btn = document.createElement('button');
            btn.className = `leaderboard-tab-btn ${isFirst ? 'active' : ''}`;
            btn.textContent = setName;
            btn.onclick = () => app.switchLeaderboardTab(setName);
            tabsButtons.appendChild(btn);
            
            // Pane pro daný test
            const pane = document.createElement('div');
            pane.className = `leaderboard-tab-pane ${isFirst ? 'active' : ''}`;
            pane.id = `leaderboard-tab-${setName.replace(/\s+/g, '-')}`;
            pane.setAttribute('data-set', setName);
            tabsContent.appendChild(pane);
            
            // Vykreslit výsledky pro daný test
            app.renderResultsTab(results, pane, setName);
            
            isFirst = false;
        });
    },

    renderResultsTab: (results, container, setName) => {
        // Filtrovat výsledky pouze pro daný test
        const filteredResults = results.filter(r => r.set === setName);
        
        // Seřadíme dle procentuální úspěšnosti sestupně
        filteredResults.sort((a, b) => b.percentage - a.percentage);
        
        const table = document.createElement('table');
        table.className = 'leaderboard-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Pořadí</th>
                    <th>Jméno</th>
                    <th>Skóre</th>
                    <th>Procento</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        
        const tbody = table.querySelector('tbody');
        
        if (filteredResults.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">Zatím žádné výsledky pro tento test</td></tr>';
        } else {
            let position = 1;
            filteredResults.forEach(result => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${position}</td>
                    <td>${result.name}</td>
                    <td>${result.score} / ${result.total}</td>
                    <td>${result.percentage.toFixed(0)}%</td>
                `;
                tbody.appendChild(row);
                position++;
            });
        }
        
        container.appendChild(table);
        
        // Přidat tabulku s nejčastějšími chybami pro tento set
        app.renderMistakesTabForSet(filteredResults, container, setName);
    },

    renderMistakesTabForSet: (results, container, setName) => {
        // Spočítat nejčastější chyby pouze pro tento set
        const mistakeCounts = {};
        
        results.forEach(result => {
            if (result.wrongAnswers && result.wrongAnswers.length > 0) {
                result.wrongAnswers.forEach(wrong => {
                    const key = wrong.question;
                    if (!mistakeCounts[key]) {
                        mistakeCounts[key] = {
                            question: wrong.question,
                            count: 0,
                            examples: []
                        };
                    }
                    mistakeCounts[key].count++;
                    
                    // Uložit příklady chybných odpovědí (max 2)
                    if (mistakeCounts[key].examples.length < 2) {
                        mistakeCounts[key].examples.push({
                            chosen: wrong.chosenAnswer,
                            correct: wrong.correctAnswer
                        });
                    }
                });
            }
        });
        
        // Převést na pole a seřadit sestupně podle počtu chyb, vzít top 5
        const sortedMistakes = Object.values(mistakeCounts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        
        if (sortedMistakes.length === 0) {
            return; // Žádné chyby k zobrazení
        }
        
        // Nadpis pro sekci chyb
        const mistakesTitle = document.createElement('h3');
        mistakesTitle.textContent = 'Nejčastější chyby v tomto testu';
        mistakesTitle.style.marginTop = '2rem';
        mistakesTitle.style.marginBottom = '1rem';
        container.appendChild(mistakesTitle);
        
        const table = document.createElement('table');
        table.className = 'mistakes-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Pořadí</th>
                    <th>Otázka</th>
                    <th>Počet chyb</th>
                    <th>Příklady chybných odpovědí</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        
        const tbody = table.querySelector('tbody');
        
        let position = 1;
        sortedMistakes.forEach(mistake => {
            const row = document.createElement('tr');
            
            // Zkrátit otázku pokud je příliš dlouhá
            const shortQuestion = mistake.question.length > 80 
                ? mistake.question.substring(0, 80) + '...' 
                : mistake.question;
            
            // Vytvořit příklady chybných odpovědí
            const examplesHtml = mistake.examples.map(example => 
                `<div style="margin-bottom: 0.3rem; font-size: 0.9em;">
                    <strong>Špatně:</strong> ${example.chosen}<br>
                    <strong>Správně:</strong> ${example.correct}
                </div>`
            ).join('');
            
            row.innerHTML = `
                <td>${position}</td>
                <td title="${mistake.question}">${shortQuestion}</td>
                <td>${mistake.count}</td>
                <td>${examplesHtml || 'N/A'}</td>
            `;
            tbody.appendChild(row);
            position++;
        });
        
        container.appendChild(table);
    },

    switchLeaderboardTab: (setName) => {
        // Deaktivace všech tlačítek a panelů
        document.querySelectorAll('.leaderboard-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.leaderboard-tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        
        // Aktivace vybraného tabu
        event.target.classList.add('active');
        const tabId = `leaderboard-tab-${setName.replace(/\s+/g, '-')}`;
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