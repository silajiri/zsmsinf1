# Kvíz o internetu a bezpečnosti

Webová aplikace pro hodinu informatiky (4. třída ZŠ) s výběrem sady otázek a ukládáním výsledků.

## Hlavní funkce
- přihlášení žáka podle jména/přezdívky
- výběr sady otázek (každý set je samostatný seznam)
- náhodné pořadí otázek i možností
- po dokončení se výsledek uloží do Firestore (Firebase) – stačí doplnit `config.js`

> Poznámka: samotný obsah sad (otázky) doplníme později.

## Struktura souborů
- `index.html` – hlavní rozhraní s více obrazovkami (login, výběr sady, kvíz, výsledek)
- `style.css` – styly pro nové komponenty
- `script.js` – logika aplikace (správa sad, načítání, Firebase)
- `config.js` – konfigurace Firebase (přidat vlastní údaje)

Výsledky ukládané do Firestore obsahují kromě jména žáka a skóre také název vybrané sady.

## Přidání otázek
V `script.js` je objekt `app.sets` obsahující klíče
de sady a pole otázek. Každou otázku definujte jako:

```js
{
    question: "Text otázky",
    answers: ["A","B","C","D"],
    correct: 2  // index správné odpovědi ve výše uvedeném poli
}
```

Když budete chtít přidat další sadu, přidejte nový klíč do `app.sets`.

## Spuštění
1. Otevřete `index.html` v prohlížeči (nebo spusťte jednoduchý lokální server, např. `python -m http.server`).
2. Zadejte jméno, vyberte sadu a odpovídejte na otázky.
3. Pokud je `config.js` správně vyplněn, výsledky se automaticky uloží na Firebase.


## Deployment
Aplikace poběží zcela staticky a lze ji nasadit např. na GitHub Pages v repozitáři `zsmsinf1`.

