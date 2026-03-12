// jednoduchá struktura a logika pro kvíz s výběrem sady a uložení výsledků

// Firebase / Firestore objekt
let db;

const app = {
    user: null,
    
    // připravené sady otázek – zde se budou později doplňovat skutečné otázky
    sets: {
        "Internet": [
            {
                question: "Příkladová otázka – později upravte",
                answers: ["Možnost A", "Možnost B", "Možnost C", "Možnost D"],
                correct: 0
            }
        ],
        "Bezpečnost": []
    },
    
    questions: [],
    currentIndex: 0,
    score: 0,

    init: () => {
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
    },

    showScreen: (id) => {
        document.querySelectorAll('.screen').forEach(el => el.classList.add('hidden'));
        document.getElementById(id).classList.remove('hidden');
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
        app.showScreen('screen-sets');
    },

    selectSet: (name) => {
        const list = app.sets[name] || [];
        if (list.length === 0) {
            alert('Tato sada zatím neobsahuje žádné otázky. Vyber jinou nebo přidej otázky.');
            return;
        }
        app.currentSet = name; // zapamatovat si
        // nakopírovat a promíchat
        app.questions = app.shuffle([...list]);
        app.currentIndex = 0;
        app.score = 0;
        app.showQuestion();
        app.showScreen('screen-quiz');
    },

    shuffle: (arr) => arr.sort(() => Math.random() - 0.5),

    showQuestion: () => {
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
                document.getElementById('next-btn').classList.remove('hidden');
            });
            label.appendChild(input);
            label.append(' ' + item.text);
            answersDiv.appendChild(label);
            answersDiv.appendChild(document.createElement('br'));
        });

        document.getElementById('next-btn').classList.add('hidden');
    },

    nextQuestion: () => {
        const selected = document.querySelector('input[name="answer"]:checked');
        if (!selected) return;
        const chosenIdx = parseInt(selected.value, 10);
        const currentQ = app.questions[app.currentIndex];
        if (chosenIdx === currentQ.correct) {
            app.score++;
        }
        app.currentIndex++;
        if (app.currentIndex < app.questions.length) {
            app.showQuestion();
        } else {
            app.finishQuiz();
        }
    },

    finishQuiz: () => {
        app.saveResult(app.score, app.questions.length);
        let text = `Správně: ${app.score} z ${app.questions.length}`;
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
    }
};

// inicializace po načtení stránky
window.addEventListener('DOMContentLoaded', () => {
    app.init();
});