// Game state for Défis
let gameState = {
    currentPhase: 'selection', // selection, challenge, completion
    currentPlayer: 1,
    currentChallenge: 0,
    challengesCompleted: 0,
    timer: null,
    timeLeft: 30
};

// Challenges database
const gameData = {
    fr: [
        "Fais 10 sauts sur place en riant",
        "Imite un animal de ton choix pendant 15 secondes",
        "Chante une chanson que tu aimes fort",
        "Fais une danse de 30 secondes",
        "Raconte une blague drôle",
        "Fais un compliment sincère à l'autre personne",
        "Imite une célébrité pendant 20 secondes",
        "Fais une grimace amusante et garde-la 10 secondes",
        "Prends la main de l'autre personne et regarde-vous dans les yeux",
        "Fais un vœu à voix haute",
        "Imite le bruit d'un animal",
        "Fais une déclaration dramatique",
        "Chuchote quelque chose de romantique",
        "Fais une pose de modèle",
        "Imite une personne âgée",
        "Fais un câlin de 10 secondes",
        "Récite une poésie ou une chanson",
        "Fais une imitation de voix drôle",
        "Montre ta photo préférée sur ton téléphone",
        "Fais un bisou sur la joue de l'autre personne"
    ],
    ht: [
        "Fè 10 ti sote sou plas pandan w ap ri",
        "Imite yon bèt ou chwazi pandan 15 segonn",
        "Chante yon chante ou renmen ak tout vwa w",
        "Fè yon ti dans 30 segonn pou patnè w la",
        "Rakonte yon ti blag dròl",
        "Fè yon konpliman ki soti nan fon kè w bay patnè w la",
        "Imite yon moun selèb pandan 20 segonn",
        "Fè yon grimas dròl epi kenbe l 10 segonn",
        "Pran men patnè w la epi gade l dwat nan je",
        "Fè yon vœu ak tout vwa w",
        "Imite bri yon bèt amizan",
        "Fè yon ti deklarasyon dramatik ak anpil emosyon",
        "Chwuchote yon mo dous nan zòrèy patnè w la",
        "Pran yon poz modèl pou l foto w",
        "Imite fason yon grandèt ap mache oswa pale",
        "Fè yon gwo kalin 10 segonn san lache",
        "Resite yon ti poèm oswa yon chante dous",
        "Fè yon imitasyon vwa ki dròl",
        "Montre foto ou pi renmen sou telefòn ou",
        "Fè yon ti bisou sou bò figi patnè w la"
    ]
};

// Initialize game
function initGame() {
    loadUserData();
    applyGameTranslations();
    resetGame();
}

// Apply game-specific translations
function applyGameTranslations() {
    const lang = userData.language;

    document.getElementById('game-title').textContent = 'Défis';
    document.getElementById('game-subtitle').textContent = lang === 'fr' ? 'Petits défis amusants' : 'Ti defi amizan';
    document.getElementById('select-player').textContent = lang === 'fr' ? 'Qui commence les défis?' : 'Ki moun ki kòmanse defi yo?';
    document.getElementById('player1-btn').textContent = userData.name1 || 'Joueur 1';
    document.getElementById('player2-btn').textContent = userData.name2 || 'Joueur 2';
    document.getElementById('skip-btn').textContent = lang === 'fr' ? 'Passer' : 'Pase';
    document.getElementById('complete-btn').textContent = lang === 'fr' ? 'Défi accompli!' : 'Defi etap!';
    document.getElementById('completion-message').textContent = lang === 'fr' ? 'Session de défis terminée!' : 'Sesyon defi fini!';
    document.getElementById('challenges-completed').textContent = lang === 'fr' ? 'Défis accomplis: ' : 'Defi etap: ';
    document.getElementById('restart-btn').textContent = lang === 'fr' ? 'Nouvelle session' : 'Nouvo sesyon';
    document.getElementById('home-btn').textContent = lang === 'fr' ? 'Retour' : 'Retounen';
}

// Select player
function selectPlayer(playerNum) {
    gameState.currentPlayer = playerNum;
    gameState.currentPhase = 'challenge';
    gameState.currentChallenge = 0;
    gameState.challengesCompleted = 0;
    startTimer();
    updateUI();
}

// Start timer
function startTimer() {
    gameState.timeLeft = 30;
    updateTimerDisplay();

    if (gameState.timer) {
        clearInterval(gameState.timer);
    }

    gameState.timer = setInterval(() => {
        gameState.timeLeft--;
        updateTimerDisplay();

        if (gameState.timeLeft <= 0) {
            clearInterval(gameState.timer);
        }
    }, 1000);
}

// Update timer display
function updateTimerDisplay() {
    const timerDisplay = document.getElementById('timer-display');
    const lang = userData.language;
    timerDisplay.textContent = `⏱️ ${gameState.timeLeft} ${lang === 'fr' ? 'secondes' : 'segonn'}`;
}

// Skip challenge
function skipChallenge() {
    clearInterval(gameState.timer);
    gameState.currentChallenge++;
    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;

    if (gameState.currentChallenge >= gameData[userData.language].length) {
        gameState.currentPhase = 'completion';
    } else {
        startTimer();
    }
    updateUI();
}

// Complete challenge
function completeChallenge() {
    clearInterval(gameState.timer);
    gameState.challengesCompleted++;
    gameState.currentChallenge++;
    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;

    if (gameState.currentChallenge >= gameData[userData.language].length) {
        gameState.currentPhase = 'completion';
    } else {
        startTimer();
    }
    updateUI();
}

// Restart game
function restartGame() {
    clearInterval(gameState.timer);
    gameState = {
        currentPhase: 'selection',
        currentPlayer: 1,
        currentChallenge: 0,
        challengesCompleted: 0,
        timer: null,
        timeLeft: 30
    };
    updateUI();
}

// Reset game
function resetGame() {
    clearInterval(gameState.timer);
    gameState = {
        currentPhase: 'selection',
        currentPlayer: 1,
        currentChallenge: 0,
        challengesCompleted: 0,
        timer: null,
        timeLeft: 30
    };
    updateUI();
}

// Update UI based on current phase
function updateUI() {
    const selectionPhase = document.getElementById('player-selection');
    const challengePhase = document.getElementById('challenge-phase');
    const completionPhase = document.getElementById('completion-phase');

    // Hide all phases
    selectionPhase.classList.add('hidden');
    challengePhase.classList.add('hidden');
    completionPhase.classList.add('hidden');

    const lang = userData.language;
    const player1Name = userData.name1 || (lang === 'fr' ? 'Joueur 1' : 'Jwè 1');
    const player2Name = userData.name2 || (lang === 'fr' ? 'Joueur 2' : 'Jwè 2');
    const currentPlayerName = gameState.currentPlayer === 1 ? player1Name : player2Name;

    switch (gameState.currentPhase) {
        case 'selection':
            selectionPhase.classList.remove('hidden');
            document.getElementById('player1-btn').textContent = player1Name;
            document.getElementById('player2-btn').textContent = player2Name;
            break;

        case 'challenge':
            challengePhase.classList.remove('hidden');
            document.getElementById('player-name').textContent = currentPlayerName;

            const challenges = gameData[lang];
            document.getElementById('challenge-text').textContent = challenges[gameState.currentChallenge];
            break;

        case 'completion':
            completionPhase.classList.remove('hidden');
            document.getElementById('challenges-completed').textContent =
                (lang === 'fr' ? 'Défis accomplis: ' : 'Defi etap: ') +
                gameState.challengesCompleted;
            break;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initGame);

// Clean up timer when leaving page
window.addEventListener('beforeunload', () => {
    if (gameState.timer) {
        clearInterval(gameState.timer);
    }
});

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
