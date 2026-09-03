// Game state for Doux Mots (Dous Mo)
let gameState = {
    currentPlayer: 1,
    currentPromptIndex: 0
};

// Compliments Database
const gameData = {
    fr: {
        prompts: [
            "Regarde ton partenaire dans les yeux et dis-lui la première chose qui t'a attiré chez lui.",
            "Quel est ton souvenir préféré avec ton partenaire ?",
            "Quelles sont les trois qualités de ton partenaire que tu admires le plus ?",
            "Fais un câlin chaleureux à ton partenaire et chuchote-lui ce que tu aimes le plus chez lui.",
            "Décris un moment de la semaine passée où tu t'es senti(e) particulièrement proche de ton partenaire.",
            "Quelle est la chose la plus douce que ton partenaire ait faite pour toi ?",
            "Dis à ton partenaire une petite habitude amusante qu'il a et qui te fait toujours sourire.",
            "Si tu devais décrire ton partenaire en trois mots d'amour, lesquels choisirais-tu ?"
        ],
        turnText: "Tour de:",
        nextBtn: "Doux Mot Suivant",
        gameTitle: "Doux Mots",
        gameSubtitle: "Échangez des compliments chaleureux et des questions intimes"
    },
    ht: {
        prompts: [
            "Gade patnè w dwat nan je epi di l premye bagay ki te atire w sou li.",
            "Ki pi bèl souvni w genyen anndan kè w ansanm ak patnè w la?",
            "Bay twa bèl kalite nan patnè w ke w pi admire.",
            "Fè patnè w yon gwo kalin cho epi chwuchote nan zòrèy li sa w pi renmen lakay li.",
            "Dekri yon ti moman nan semèn nan kote w te santi w trè trè pre patnè w.",
            "Ki sa ki pi dous bagay patnè w te janm fè pou ou jous jodi a?",
            "Di patnè w yon ti abitid amizan l genyen ki toujou fè w souri.",
            "Si w ta dwe dekri patnè w ak twa ti mo dous, ki mo w ta chwazi?"
        ],
        turnText: "Tou pa:",
        nextBtn: "Dous Mo Swivan",
        gameTitle: "Dous Mo",
        gameSubtitle: "Echanje bèl konpliman dous ak ti kesyon entim ki enteresan"
    }
};

// Initialize
function initGame() {
    loadUserData();
    applyTranslations();
    nextCompliment();
}

// Translations
function applyTranslations() {
    const lang = userData.language;
    const t = gameData[lang];

    document.getElementById('game-title').textContent = t.gameTitle;
    document.getElementById('game-subtitle').textContent = t.gameSubtitle;
    document.getElementById('next-btn-text').textContent = t.nextBtn;
}

// Next compliment
function nextCompliment() {
    const lang = userData.language;
    const t = gameData[lang];

    // Toggle player
    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    const player1Name = userData.name1 || (lang === 'fr' ? 'Joueur 1' : 'Jwè 1');
    const player2Name = userData.name2 || (lang === 'fr' ? 'Joueur 2' : 'Jwè 2');
    const name = gameState.currentPlayer === 1 ? player1Name : player2Name;
    document.getElementById('player-name').textContent = name;

    // Get prompt
    const index = Math.floor(Math.random() * t.prompts.length);
    gameState.currentPromptIndex = index;
    document.getElementById('compliment-text').textContent = t.prompts[index];
}

// Page load
document.addEventListener('DOMContentLoaded', initGame);


// -- ONLINE SYNC PATCH ---------------------------------------
// Auto-broadcast gameState after every UI update in online mode
(function() {
    const _origUpdateUI = typeof updateUI === 'function' ? updateUI : null;
    if (!_origUpdateUI) return;
    const _gameId = window.location.pathname.split('/').pop().replace('.html', '');
    window.updateUI = function() {
        _origUpdateUI.apply(this, arguments);
        if (window._onlineMode && typeof window._broadcastGameState === 'function') {
            // Small debounce to avoid flood
            clearTimeout(window._broadcastTimer);
            window._broadcastTimer = setTimeout(() => {
                window._broadcastGameState(_gameId, window.gameState);
            }, 80);
        }
    };
})();
