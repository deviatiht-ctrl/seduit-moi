// Game state for Contact
let gameState = {
    currentPlayer: 1,
    currentPromptIndex: 0,
    timer: null,
    timeLeft: 30
};

// Database
const gameData = {
    fr: {
        prompts: [
            "Ferme les yeux. Ton partenaire doit tracer une lettre sur ton dos avec son doigt. Devine quelle est cette lettre !",
            "Ferme les yeux. Ton partenaire va doucement toucher trois points différents (par exemple ton bras, ton cou, ta main). Devine l'ordre des touches !",
            "Mettez vos mains paume contre paume et fermez les yeux. Essayez de communiquer une émotion (joie, tristesse, amour) uniquement par le toucher.",
            "Mettez-vous dos à dos et essayez de synchroniser votre respiration pendant 30 secondes.",
            "Faites un jeu de pouces (bras de fer de pouces) ! Celui qui perd doit donner un bisou à l'autre.",
            "Ferme les yeux. Ton partenaire écrit un mot d'amour sur ta main avec son doigt. Devine le mot !"
        ],
        turnText: "Tour de:",
        timerBtn: "Lancer 30s",
        nextBtn: "Défi Suivant",
        secText: "secondes restantes",
        doneText: "Temps écoulé !",
        gameTitle: "Jeu de Contact",
        gameSubtitle: "Connectez-vous physiquement avec des défis tactiles amusants"
    },
    ht: {
        prompts: [
            "Fèmen je ou. Patnè ou dwe trase yon lèt sou do ou ak dwèt li. Devine ki lèt li trase a !",
            "Fèmen je ou. Patnè ou pral manyen twa kote diferan dousman (pa egzanp bra w, kou w, men w). Devine lòd li manyen yo a !",
            "Mete men nou pla kont pla epi fèmen je nou. Eseye kominike yon emosyon (kè kontan, tristès, renmen) sèlman nan fason n ap manyen men nou.",
            "Mete do nou kont do epi eseye senkronize souf nou pandan 30 segonn.",
            "Fè yon jwèt pous (batay ak gwo dwèt men) ! Moun ki pèdi a dwe bay lòt la yon bisou.",
            "Fèmen je ou. Patnè ou ap ekri yon mo dous sou pla men ou ak dwèt li. Devine ki mo sa a !"
        ],
        turnText: "Tou:",
        timerBtn: "Kòmanse 30s",
        nextBtn: "Defi Swivan",
        secText: "segonn ki rete",
        doneText: "Tan an fini !",
        gameTitle: "Kontak",
        gameSubtitle: "Konekte fizikman ak ti jwèt kontak ki amizan"
    }
};

// Initialize
function initGame() {
    loadUserData();
    applyTranslations();
    nextContact();
}

// Translations
function applyTranslations() {
    const lang = userData.language;
    const t = gameData[lang];

    document.getElementById('game-title').textContent = t.gameTitle;
    document.getElementById('game-subtitle').textContent = t.gameSubtitle;
    document.getElementById('timer-btn-text').textContent = t.timerBtn;
    document.getElementById('next-btn-text').textContent = t.nextBtn;
}

// Start Timer
function startTimer() {
    const lang = userData.language;
    const t = gameData[lang];

    gameState.timeLeft = 30;
    document.getElementById('contact-timer-display').textContent = `⏱️ ${gameState.timeLeft} ${lang === 'fr' ? 'secondes' : 'segonn'}`;

    if (gameState.timer) {
        clearInterval(gameState.timer);
    }

    gameState.timer = setInterval(() => {
        gameState.timeLeft--;
        if (gameState.timeLeft > 0) {
            document.getElementById('contact-timer-display').textContent = `${gameState.timeLeft} ${lang === 'fr' ? 'secondes' : 'segonn'}`;
        } else {
            clearInterval(gameState.timer);
            document.getElementById('contact-timer-display').textContent = t.doneText;
        }
    }, 1000);
}

// Next Contact
function nextContact() {
    const lang = userData.language;
    const t = gameData[lang];

    // Clear timer
    if (gameState.timer) {
        clearInterval(gameState.timer);
        gameState.timer = null;
    }
    document.getElementById('contact-timer-display').textContent = "";

    // Toggle player
    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    const player1Name = userData.name1 || (lang === 'fr' ? 'Joueur 1' : 'Jwè 1');
    const player2Name = userData.name2 || (lang === 'fr' ? 'Joueur 2' : 'Jwè 2');
    const name = gameState.currentPlayer === 1 ? player1Name : player2Name;
    document.getElementById('player-name').textContent = name;

    // Get prompt
    const index = Math.floor(Math.random() * t.prompts.length);
    gameState.currentPromptIndex = index;
    document.getElementById('contact-instruction').textContent = t.prompts[index];
}

// Page load
document.addEventListener('DOMContentLoaded', initGame);

// Clean up timer when leaving page
window.addEventListener('beforeunload', () => {
    if (gameState.timer) {
        clearInterval(gameState.timer);
    }
});
