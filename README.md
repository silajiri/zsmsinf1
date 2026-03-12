# 🎓 Internetový Kvíz – ZŠ a MŠ Lípa nad Orlicí

Webová aplikace pro hodinu informatiky (4. třída základní školy) zaměřená na otázky z tématu **Internet a bezpečnost na internetu**.

🌐 **Live aplikace:** [https://silajiri.github.io/zsmsinf1/](https://silajiri.github.io/zsmsinf1/)

---

## 📋 Hlavní funkce

### Přihlášení a výběr
- ✅ Přihlášení žáka podle jména/přezdívky
- ✅ Výběr sady otázek (Test 1, Test 2)

### Průběh kvízu
- ✅ Náhodné pořadí otázek i odpovědí
- ✅ Zobrazení počítadla otázek (Otázka X / Y)
- ✅ Okamžitá zpětná vazba:
  - 🟢 **Zelená** – správná odpověď
  - 🔴 **Červená** – zvolená špatná odpověď
  - 🟢 **Zelená** – správná odpověď (k nápravě)

### Výsledky
- ✅ Zobrazení skóre v procentech
- ✅ Animovaný GIF podle výkonu:
  - 🏆 **winner** – 76% a více správných
  - 👍 **well_done** – 26–75% správných
  - 😅 **looser** – méně než 25% správných
- ✅ Uložení výsledků do Firebase Firestore

### Žebříček
- ✅ Zobrazení všech výsledků (jméno, skóre, sada otázek)
- ✅ Seřazení podle nejnovějších výsledků
- ✅ Přehledná tabulka

---

## 🛠 Technologie

- **HTML5** – struktura aplikace
- **CSS3** – moderní design s gradienty a responzivitou
- **JavaScript** – logika kvízu
- **Firebase Firestore** – ukládání výsledků
- **GitHub Pages** – hostování aplikace

---

## 📁 Struktura souborů

```
zsmsinf1/
├── index.html           # Hlavní stránka
├── style.css            # Styly aplikace
├── script.js            # Logika kvízu
├── config.js            # Firebase konfigurace
├── README.md            # Tato dokumentace
├── data/
│   ├── set1.json        # Sada otázek Test 1
│   └── set2.json        # Sada otázek Test 2
└── assets/
    └── images/
        ├── zsms_logo.png    # Logo školy
        ├── winner_*.gif     # GIFy pro vítěze
        ├── well_done_*.gif  # GIFy pro dobré výsledky
        └── looser_*.gif     # GIFy pro nižší výsledky
```

---

## 📝 Formát otázek

Otázky jsou uložené v JSON souborech (`data/set1.json` a `data/set2.json`):

```json
{
  "question": "Otázka?",
  "answers": [
    "Možnost A",
    "Možnost B",
    "Možnost C",
    "Možnost D"
  ],
  "correct": 1
}
```

- `question` – text otázky
- `answers` – pole **přesně 4** možností
- `correct` – index správné odpovědi (0 = první, 1 = druhá, atd.)

---

## 🚀 Jak spustit

### Lokálně
```bash
# Jednoduše otevřete index.html v prohlížeči
# nebo spusťte lokální server:
python -m http.server
# poté otevřete http://localhost:8000
```

### Online
Aplikace je nasazena na GitHub Pages:  
🌐 **[https://silajiri.github.io/zsmsinf1/](https://silajiri.github.io/zsmsinf1/)**

---

## 🔒 Bezpečnost

- ✅ Firebase API klíč je omezen na doménu `silajiri.github.io`
- ✅ Firestore databáze má nastavena pravidla zabezpečení:
  - Kdokoli může **číst** výsledky (pro žebříček)
  - Kdokoli může **přidat** nový výsledek
  - **Nikdo** nemůže mazat ani upravovat existující výsledky

---

## 📊 Firebase Firestore

Kolekce `results` obsahuje záznamy s:
- `name` – jméno žáka
- `score` – počet správných odpovědí
- `total` – celkový počet otázek
- `set` – název sady (Test 1 / Test 2)
- `timestamp` – čas dokončení

---

## 🎯 Použití v hodinách

1. Otevřete aplikaci: [https://silajiri.github.io/zsmsinf1/](https://silajiri.github.io/zsmsinf1/)
2. Žáci si zapamatují nebo si přidají do záložek
3. Každý si přihlásí svým jménem
4. Vybere sadu otázek a absolvuje test
5. Výsledky se automaticky uloží
6. V menu si mohou prohlédnout **Žebříček** se všemi výsledky

---

## 📝 Poznámky pro výuku

- Aplikace je **offline-ready** – po prvním načtení funguje i bez internetu
- **Respondivní design** – funguje na PC, tabletu i mobilu
- **Přátelské rozhraní** – vhodné pro 4. třídu
- **Motivační prvky** – GIFy a žebříček povzbuzují soutěžení

---

**Verze:** 1.0  
**Poslední aktualizace:** březen 2026

