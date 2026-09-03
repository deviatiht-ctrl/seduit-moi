// Game state for Hot questions
let gameState = {
    currentPhase: 'introduction', // introduction, game, completion
    currentPlayer: 1,
    currentLevel: 1,
    currentQuestion: 0,
    maxLevel: 5
};

// Hot questions organized by intensity level
const gameData = {
    fr: {
        level1: [
            "Quelle est ta partie préférée de mon corps?",
            "Qu'est-ce qui t'attire le plus chez moi?",
            "Décris ton baiser idéal",
            "Quel est ton fantasme le plus innocent?",
            "Qu'est-ce que tu préfères: câlins ou bisous?"
        ],
        level2: [
            "Où est ton endroit sensible?",
            "Quelle est ta position préférée pour embrasser?",
            "Décris ta première impression de moi",
            "Qu'est-ce qui te fait battre le cœur plus vite?",
            "Quel genre de bisous préfères-tu?"
        ],
        level3: [
            "Qu'est-ce que tu voudrais essayer avec moi?",
            "Décris ta nuit idéale avec moi",
            "Quelle est la chose la plus sexy que j'ai faite?",
            "Qu'est-ce qui t'excite intellectuellement chez moi?",
            "Où aimerais-tu que je te touche?"
        ],
        level4: [
            "Quelle est ta fantaisie secrète?",
            "Décris ce que tu veux me faire maintenant",
            "Qu'est-ce que tu as toujours voulu me demander?",
            "Quel est ton souvenir le plus chaud de nous?",
            "Quelle est la chose la plus audacieuse que tu voudrais faire?"
        ],
        level5: [
            "Qu'est-ce qui te rend fou de désir?",
            "Décris exactement ce que tu veux faire avec moi",
            "Quelle est ta limite et comment la repousser?",
            "Qu'est-ce que tu n'as jamais osé demander?",
            "Quelle est la chose la plus interdite qui t'attire?"
        ]
    },
    ht: {
        level1: [
            "Ki pati nan kò m ke w pi renmen?",
            "Ki sa ki pi atire w anpil lakay mwen?",
            "Dekri pou mwen ki jan ti bisou ideyal ou ye.",
            "Ki sa ki pi inosan nan fantazi w yo?",
            "Ki sa w pi pito: ti kalin dous oswa bisou cho?"
        ],
        level2: [
            "Ki kote sou kò w ki pi sansib lè m ap manyen w?",
            "Nan ki pozisyon w pi renmen lè n ap bay bisou?",
            "Dekri pou mwen ki premye enpresyon w te genyen sou mwen lè n te rankontre.",
            "Ki sa m fè ki toujou fè kè w bat pi vit?",
            "Ki kalite bisou w pi renmen anpil?"
        ],
        level3: [
            "Ki sa w ta renmen nou eseye fè ansanm ke n poko janm fè?",
            "Dekri pou mwen ki jan yon bèl nuit ideyal ansanm avè m ta ye.",
            "Ki sa ki pi sèksi m te janm fè devan w?",
            "Ki sa ki atire lespri w ak lespri pa m ansanm?",
            "Ki kote sou kò w w ta renmen m karesse w kounye a?"
        ],
        level4: [
            "Ki sa ki ti fantazi sekrè w gen anndan kè w?",
            "Dekri m sa w ta renmen m fè w la kounye a kounye a.",
            "Ki sa w te toujou gen anvi mande m men w pa t janm ko gen kouraj?",
            "Ki pi cho souvni w genyen sou nou de a?",
            "Ki bagay ki pi osé w ta renmen n reyalize ansanm?"
        ],
        level5: [
            "Ki sa ki fè w vin fou ak anvi lè w avè m?",
            "Dekri m egzakteman sa w ta renmen n fè ansanm sware sa a.",
            "Ki kote limit ou ye epi ki jan n ka depase l ansanm?",
            "Ki sa w pa t janm osé mande m nan lavi w?",
            "Ki sa ki atire w anpil menm si l ka parèt yon ti jan entèdi?"
        ]
    }
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

    document.getElementById('game-title').textContent = 'Hot';
    document.getElementById('game-subtitle').textContent = lang === 'fr' ? 'Questions pour monter le niveau' : 'Kesyon pou monte nivo a';
    document.getElementById('intro-text').textContent = lang === 'fr' ?
        'Cet espace est pour des questions plus intimes. Le niveau augmente progressivement.' :
        'Espas sa a pou kesyon pi entim. Nivo a monte prograssivman.';
    document.getElementById('warning-text').textContent = lang === 'fr' ? 'Pour adultes consentants' : 'Pour adilt ki konsanti';
    document.getElementById('start-btn').textContent = lang === 'fr' ? 'Commencer' : 'Kòmanse';
    document.getElementById('skip-btn').textContent = lang === 'fr' ? 'Passer' : 'Pase';
    document.getElementById('next-btn').textContent = lang === 'fr' ? 'Question suivante' : 'Kesyon swivan';
    document.getElementById('completion-message').textContent = lang === 'fr' ? 'Vous avez atteint le niveau maximum!' : 'Ou rive nivo maksimòm!';
    document.getElementById('restart-btn').textContent = lang === 'fr' ? 'Recommencer' : 'Rekòmanse';
    document.getElementById('home-btn').textContent = lang === 'fr' ? 'Retour' : 'Retounen';
}

// Start hot game
function startHotGame() {
    gameState.currentPhase = 'game';
    gameState.currentLevel = 1;
    gameState.currentQuestion = 0;
    updateUI();
}

// Skip question
function skipQuestion() {
    gameState.currentQuestion++;
    if (gameState.currentQuestion >= 5) {
        gameState.currentQuestion = 0;
        gameState.currentLevel++;

        if (gameState.currentLevel > gameState.maxLevel) {
            gameState.currentPhase = 'completion';
        }
    }
    updateUI();
}

// Next question
function nextQuestion() {
    gameState.currentQuestion++;
    if (gameState.currentQuestion >= 5) {
        gameState.currentQuestion = 0;
        gameState.currentLevel++;

        if (gameState.currentLevel > gameState.maxLevel) {
            gameState.currentPhase = 'completion';
        }
    }
    updateUI();
}

// Restart game
function restartGame() {
    gameState = {
        currentPhase: 'introduction',
        currentPlayer: 1,
        currentLevel: 1,
        currentQuestion: 0,
        maxLevel: 5
    };
    updateUI();
}

// Reset game
function resetGame() {
    gameState = {
        currentPhase: 'introduction',
        currentPlayer: 1,
        currentLevel: 1,
        currentQuestion: 0,
        maxLevel: 5
    };
    updateUI();
}

// Update UI based on current phase
function updateUI() {
    const introduction = document.getElementById('introduction');
    const gamePhase = document.getElementById('game-phase');
    const completionPhase = document.getElementById('completion-phase');

    // Hide all phases
    introduction.classList.add('hidden');
    gamePhase.classList.add('hidden');
    completionPhase.classList.add('hidden');

    const lang = userData.language;
    const player1Name = userData.name1 || (lang === 'fr' ? 'Joueur 1' : 'Jwè 1');
    const player2Name = userData.name2 || (lang === 'fr' ? 'Joueur 2' : 'Jwè 2');
    const currentPlayerName = gameState.currentPlayer === 1 ? player1Name : player2Name;

    switch (gameState.currentPhase) {
        case 'introduction':
            introduction.classList.remove('hidden');
            break;

        case 'game':
            gamePhase.classList.remove('hidden');
            document.getElementById('player-name').textContent = currentPlayerName;

            // Update intensity meter
            const intensity = (gameState.currentLevel / gameState.maxLevel) * 100;
            document.getElementById('intensity-fill').style.width = intensity + '%';
            document.getElementById('level-display').textContent = `${lang === 'fr' ? 'Niveau' : 'Nivo'} ${gameState.currentLevel}/${gameState.maxLevel}`;

            // Display current question
            const levelKey = 'level' + gameState.currentLevel;
            const questions = gameData[lang][levelKey];
            document.getElementById('hot-question').textContent = questions[gameState.currentQuestion];
            break;

        case 'completion':
            completionPhase.classList.remove('hidden');
            document.getElementById('final-level-display').textContent = `${lang === 'fr' ? 'Niveau final' : 'Nivo final'}: ${gameState.maxLevel}`;
            break;
    }
}

// Initialize on page load
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
