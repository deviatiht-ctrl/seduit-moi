// Game state for "Apprends-moi à te connaître"
let gameState = {
    currentPhase: 'selection', // selection, question, completion
    currentPlayer: 1,
    currentQuestion: 0,
    questionsAnswered: 0,
    totalQuestions: 20
};

// Questions database - 20 questions for getting to know each other
const gameData = {
    fr: [
        "Quelle est ta chose préférée à faire le weekend?",
        "Si tu pouvais avoir n'importe quel super pouvoir, ce serait quoi?",
        "Quel est ton souvenir d'enfance préféré?",
        "Quelle est ta cuisine préférée?",
        "Si tu pouvais voyager n'importe où dans le monde, où irais-tu?",
        "Qu'est-ce qui te fait le plus rire?",
        "Quel est ton film ou série préférée?",
        "Quelle est la chose la plus aventureuse que tu aies faite?",
        "Si tu pouvais rencontrer n'importe qui, vivant ou mort, qui ce serait?",
        "Quelle est ta plus grande fierté?",
        "Quel est ton animal préféré et pourquoi?",
        "Qu'est-ce que tu apprécies le plus dans nos conversations?",
        "Si tu pouvais changer une chose dans le monde, ce serait quoi?",
        "Quel est ton hobby ou intérêt le plus inhabituel?",
        "Quelle est la meilleure blague que tu connaisses?",
        "Si tu gagnais à la loterie, quelle est la première chose que tu ferais?",
        "Quel est ton rêve le plus fou?",
        "Qu'est-ce qui te rend le plus heureux?",
        "Si tu pouvais vivre dans n'importe quelle époque, quand choisirais-tu?",
        "Quelle est la chose la plus importante que tu cherches chez quelqu'un?"
    ],
    ht: [
        "Ki sa w pi renmen fè nan fen semèn (weekend) yo?",
        "Si w te ka gen nenpòt ki sipè pouvwa, ki sa l ta ye?",
        "Ki pi bèl souvni depi w te piti ou pi renmen?",
        "Ki plat ou pi renmen manje?",
        "Si w te ka vwayaje nenpòt kote nan monn lan, kote w ta ale?",
        "Ki sa ki pi fè w ri nan lavi a?",
        "Ki fim oswa seri ki pi touche w?",
        "Ki sa ki pi brav oswa avantirye w te janm fè?",
        "Si w te ka rankontre nenpòt moun nan monn lan (vivan oswa mouri), ki moun l ta ye?",
        "Ki sa ki pi gwo fyète w nan lavi w?",
        "Ki bèt ou pi renmen epi poukisa?",
        "Ki sa w pi apresye nan fason n ap pale ansanm yo?",
        "Si w te ka chanje yon sèl bagay nan monn lan, ki sa l ta ye?",
        "Ki pasyon oswa hobi ou genyen ki yon ti jan inik?",
        "Ki pi bon ti blag ou konnen ki toujou fè moun ri?",
        "Si w te genyen gwo lotri a jodi a, ki premye bagay w ta fè?",
        "Ki rèv ki pi fou w ta renmen reyalize?",
        "Ki sa ki pi fè kè w kontan anpil?",
        "Si w te ka viv nan nenpòt ki epòk nan tan lontan oswa kap vini, ki epòk w ta chwazi?",
        "Ki sa ki pi enpòtan pou ou lakay yon moun ke w renmen?"
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

    document.getElementById('game-title').textContent = lang === 'fr' ? 'Apprends-moi à te connaître' : 'Aprann m konnen ou';
    document.getElementById('game-subtitle').textContent = lang === 'fr' ? 'Questions pour mieux vous comprendre' : 'Kesyon pou pi byen konprann nou';
    document.getElementById('select-player').textContent = lang === 'fr' ? 'Qui répond aux questions?' : 'Ki moun ki reponn kesyon yo?';
    document.getElementById('player1-btn').textContent = userData.name1 || 'Joueur 1';
    document.getElementById('player2-btn').textContent = userData.name2 || 'Joueur 2';
    document.getElementById('skip-btn').textContent = lang === 'fr' ? 'Passer' : 'Pase';
    document.getElementById('next-btn').textContent = lang === 'fr' ? 'Question suivante' : 'Kesyon swivan';
    document.getElementById('completion-message').textContent = lang === 'fr' ? 'Félicitations! Vous avez terminé toutes les questions.' : 'Felisitasyon! Ou fini tout kesyon yo.';
    document.getElementById('restart-btn').textContent = lang === 'fr' ? 'Recommencer avec l\'autre joueur' : 'Rekòmanse ak lòt jwè a';
    document.getElementById('home-btn').textContent = lang === 'fr' ? 'Retour' : 'Retounen';
}

// Select player
function selectPlayer(playerNum) {
    gameState.currentPlayer = playerNum;
    gameState.currentPhase = 'question';
    gameState.currentQuestion = 0;
    gameState.questionsAnswered = 0;
    updateUI();
}

// Skip question
function skipQuestion() {
    gameState.currentQuestion++;
    if (gameState.currentQuestion >= gameState.totalQuestions) {
        gameState.currentPhase = 'completion';
    }
    updateUI();
}

// Next question
function nextQuestion() {
    gameState.currentQuestion++;
    gameState.questionsAnswered++;
    if (gameState.currentQuestion >= gameState.totalQuestions) {
        gameState.currentPhase = 'completion';
    }
    updateUI();
}

// Restart with other player
function restartWithOtherPlayer() {
    const otherPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    selectPlayer(otherPlayer);
}

// Reset game
function resetGame() {
    gameState = {
        currentPhase: 'selection',
        currentPlayer: 1,
        currentQuestion: 0,
        questionsAnswered: 0,
        totalQuestions: 20
    };
    updateUI();
}

// Update UI based on current phase
function updateUI() {
    const selectionPhase = document.getElementById('player-selection');
    const questionPhase = document.getElementById('question-phase');
    const completionPhase = document.getElementById('completion-phase');

    // Hide all phases
    selectionPhase.classList.add('hidden');
    questionPhase.classList.add('hidden');
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

        case 'question':
            questionPhase.classList.remove('hidden');
            document.getElementById('respondent-name').textContent = currentPlayerName;

            // Update progress
            const progress = ((gameState.currentQuestion + 1) / gameState.totalQuestions) * 100;
            document.getElementById('progress-fill').style.width = progress + '%';
            document.getElementById('question-counter').textContent = `${gameState.currentQuestion + 1}/${gameState.totalQuestions}`;

            // Display current question
            const questions = gameData[lang];
            document.getElementById('question-text').textContent = questions[gameState.currentQuestion];
            break;

        case 'completion':
            completionPhase.classList.remove('hidden');
            document.getElementById('questions-answered').textContent =
                (lang === 'fr' ? 'Questions répondues: ' : 'Kesyon reponn: ') +
                `${gameState.questionsAnswered}/${gameState.totalQuestions}`;
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
