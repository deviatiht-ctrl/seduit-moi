// Game state for Devinettes
let gameState = {
    currentPhase: 'selection', // selection, riddle, result
    currentPlayer: 1,
    currentRiddle: 0,
    score: 0
};

// Riddles database
const gameData = {
    fr: [
        {
            question: "Je suis plus puissant que Dieu, plus méchant que le diable. Les pauvres m'ont, les riches en ont besoin. Si tu me manges, tu meurs. Qui suis-je?",
            answer: "rien",
            hint: "Pense à ce qui n'existe pas"
        },
        {
            question: "Je suis toujours devant toi, mais tu ne peux jamais me voir. Qui suis-je?",
            answer: "l'avenir",
            hint: "C'est ce qui va arriver"
        },
        {
            question: "Plus tu en enlèves, plus je deviens grand. Qui suis-je?",
            answer: "un trou",
            hint: "Pense à quelque chose de vide"
        },
        {
            question: "Je suis sans voix, mais je crie. Je n'ai pas d'ailes, mais je vole. Qui suis-je?",
            answer: "le vent",
            hint: "Tu peux le sentir mais pas le voir"
        },
        {
            question: "Je suis toujours faim, je dois toujours être nourri. Le doigt qui me touche va bientôt saigner. Qui suis-je?",
            answer: "le feu",
            hint: "Je brûle et je suis chaud"
        },
        {
            question: "Je suis léger comme une plume, mais même le plus fort des hommes ne peut me tenir plus d'une minute. Qui suis-je?",
            answer: "le souffle",
            hint: "C'est dans ton corps"
        },
        {
            question: "Je suis commencement de toute chose, et fin de toute chose. Je suis dans le jour et dans la nuit. Qui suis-je?",
            answer: "la lettre a",
            hint: "C'est une lettre de l'alphabet"
        },
        {
            question: "Je peux tomber sans être blessé, mais je peux blesser sans tomber. Qui suis-je?",
            answer: "la pluie",
            hint: "C'est de l'eau qui tombe du ciel"
        },
        {
            question: "Je suis toujours entre ciel et terre, mais je ne suis ni ciel ni terre. Qui suis-je?",
            answer: "l'horizon",
            hint: "C'est la ligne où le ciel rencontre la terre"
        },
        {
            question: "Je suis sans voix, mais je raconte des histoires. Je n'ai pas de corps, mais je peux être lu. Qui suis-je?",
            answer: "un livre",
            hint: "Tu me trouves dans une bibliothèque"
        }
    ],
    ht: [
        {
            question: "Mwen pi pwisan pase Bondye, pi mechan pase dyab. Pòv yo genyen m, rich yo bezwen m. Si w manje m, w ap mouri. Ki sa m ye?",
            answer: "anyen",
            hint: "Pouse lide w sou sa ki pa egziste"
        },
        {
            question: "Mwen toujou devan w, men w pa janm ka wè m ak je w. Ki sa m ye?",
            answer: "laveni",
            hint: "Se sa k ap vini an"
        },
        {
            question: "Plis ou fouye epi retire ladan m, se plis mwen vin gwo. Ki sa m ye?",
            answer: "yon twou",
            hint: "Panse ak yon kote ki vid"
        },
        {
            question: "Mwen pa gen vwa, men mwen souffle. Mwen pa gen zèl, men mwen vole. Ki sa m ye?",
            answer: "van",
            hint: "Ou ka santi m men w pa ka wè m"
        },
        {
            question: "Mwen toujou grangou, si w ba m bwa m ap grandri, men si w ban m dlo m ap mouri. Ki sa m ye?",
            answer: "dife",
            hint: "Mwen cho epi m ka brile"
        },
        {
            question: "Mwen lejè tankou yon plim, men menm moun ki pi fò a pa ka kenbe m plis pase yon minit. Ki sa m ye?",
            answer: "souf",
            hint: "Li anndan kò w"
        },
        {
            question: "Mwen kòmanse tout bagay, mwen fini tout bagay. Mwen nan nwit epi m nan jou. Ki sa m ye?",
            answer: "lèt a",
            hint: "Se yon lèt nan alfabè a"
        },
        {
            question: "Mwen ka tonbe san m pa gen blesi, epi m fè tout moun kouri rantre anba kay. Ki sa m ye?",
            answer: "lapli",
            hint: "Dlo ki sot nan syèl la"
        },
        {
            question: "Mwen toujou ant syèl ak tè, men m pa ni syèl ni tè. Ki sa m ye?",
            answer: "orizon",
            hint: "Liy kote syèl ak tè kontre a"
        },
        {
            question: "Mwen pa gen bouch pou m pale, men m rakonte anpil bèl istwa. Ki sa m ye?",
            answer: "yon liv",
            hint: "Ou ka jwenn mwen nan yon bibliyotèk"
        }
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

    document.getElementById('game-title').textContent = 'Devinettes';
    document.getElementById('game-subtitle').textContent = lang === 'fr' ? 'Testez votre intuition' : 'Teste entisyon ou';
    document.getElementById('select-player').textContent = lang === 'fr' ? 'Qui commence?' : 'Ki moun ki kòmanse?';
    document.getElementById('player1-btn').textContent = userData.name1 || 'Joueur 1';
    document.getElementById('player2-btn').textContent = userData.name2 || 'Joueur 2';
    document.getElementById('answer-label').textContent = lang === 'fr' ? 'Votre réponse' : 'Repons ou';
    document.getElementById('hint-btn').textContent = lang === 'fr' ? 'Indice' : 'Endis';
    document.getElementById('skip-btn').textContent = lang === 'fr' ? 'Passer' : 'Pase';
    document.getElementById('submit-btn').textContent = lang === 'fr' ? 'Vérifier' : 'Verifye';
    document.getElementById('next-btn').textContent = lang === 'fr' ? 'Devinette suivante' : 'Devinèt swivan';
}

// Select player
function selectPlayer(playerNum) {
    gameState.currentPlayer = playerNum;
    gameState.currentPhase = 'riddle';
    gameState.currentRiddle = 0;
    gameState.score = 0;
    updateUI();
}

// Show hint
function showHint() {
    const hintText = document.getElementById('hint-text');
    const riddles = gameData[userData.language];
    hintText.textContent = riddles[gameState.currentRiddle].hint;
    hintText.classList.remove('hidden');
}

// Skip riddle
function skipRiddle() {
    gameState.currentRiddle++;
    if (gameState.currentRiddle >= gameData[userData.language].length) {
        gameState.currentRiddle = 0;
        gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    }
    document.getElementById('answer-input').value = '';
    document.getElementById('hint-text').classList.add('hidden');
    updateUI();
}

// Submit answer
function submitAnswer() {
    const answerInput = document.getElementById('answer-input');
    const userAnswer = answerInput.value.trim().toLowerCase();
    const riddles = gameData[userData.language];
    const correctAnswer = riddles[gameState.currentRiddle].answer.toLowerCase();

    gameState.currentPhase = 'result';

    const resultMessage = document.getElementById('result-message');
    const correctAnswerDisplay = document.getElementById('correct-answer');

    if (userAnswer === correctAnswer || correctAnswer.includes(userAnswer)) {
        gameState.score++;
        resultMessage.textContent = userData.language === 'fr' ? 'Correct!' : 'Kòrèk!';
        resultMessage.style.color = 'var(--success)';
    } else {
        resultMessage.textContent = userData.language === 'fr' ? 'Pas tout à fait...' : 'Pa toutbon...';
        resultMessage.style.color = 'var(--danger)';
    }

    correctAnswerDisplay.textContent = `${userData.language === 'fr' ? 'La bonne réponse était:' : 'Repons kòrèk a te:'} ${riddles[gameState.currentRiddle].answer}`;

    updateUI();
}

// Next riddle
function nextRiddle() {
    gameState.currentRiddle++;
    if (gameState.currentRiddle >= gameData[userData.language].length) {
        gameState.currentRiddle = 0;
        gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    }
    gameState.currentPhase = 'riddle';
    document.getElementById('answer-input').value = '';
    document.getElementById('hint-text').classList.add('hidden');
    updateUI();
}

// Reset game
function resetGame() {
    gameState = {
        currentPhase: 'selection',
        currentPlayer: 1,
        currentRiddle: 0,
        score: 0
    };
    updateUI();
}

// Update UI based on current phase
function updateUI() {
    const selectionPhase = document.getElementById('player-selection');
    const riddlePhase = document.getElementById('riddle-phase');
    const resultPhase = document.getElementById('result-phase');

    // Hide all phases
    selectionPhase.classList.add('hidden');
    riddlePhase.classList.add('hidden');
    resultPhase.classList.add('hidden');

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

        case 'riddle':
            riddlePhase.classList.remove('hidden');
            document.getElementById('player-name').textContent = currentPlayerName;

            const riddles = gameData[lang];
            document.getElementById('riddle-text').textContent = riddles[gameState.currentRiddle].question;
            break;

        case 'result':
            resultPhase.classList.remove('hidden');
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
