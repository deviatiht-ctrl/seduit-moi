// Game state for Action ou Vérité
let gameState = {
    currentPhase: 'selection', // selection, choice, task
    currentPlayer: 1,
    currentTask: null,
    taskType: null // action or verite
};

// Questions and actions database
const gameData = {
    fr: {
        actions: [
            "Fais un compliment sincère à l'autre personne",
            "Imite ton animal préféré",
            "Chante une chanson que tu aimes",
            "Fais 10 sauts sur place",
            "Raconte une blague",
            "Fais une danse de 30 secondes",
            "Imite une célébrité",
            "Fais un câlin à l'autre personne",
            "Regarde l'autre personne dans les yeux pendant 30 secondes sans rire",
            "Fais une déclaration romantique",
            "Prends une pose de modèle",
            "Fais une imitation de voix drôle",
            "Donne un massage de 1 minute à l'autre personne",
            "Fais un bisou sur la joue de l'autre personne",
            "Chuchote quelque chose de romantique",
            "Prends la main de l'autre personne",
            "Fais un vœu à voix haute",
            "Montre ta photo préférée sur ton téléphone",
            "Partage un secret innocent",
            "Fais une grimace amusante"
        ],
        verites: [
            "Quelle est ta qualité préférée chez l'autre personne?",
            "Quel est ton souvenir le plus heureux?",
            "Qu'est-ce qui te fait le plus rire?",
            "Si tu pouvais voyager n'importe où, où irais-tu?",
            "Quelle est ta plus grande peur?",
            "Qu'est-ce que tu admires le plus chez l'autre personne?",
            "Quel est ton rêve le plus fou?",
            "Quelle est ta chose préférée à propos de aujourd'hui?",
            "Si tu pouvais changer une chose dans ta vie, ce serait quoi?",
            "Qu'est-ce qui te rend le plus heureux?",
            "Quel est ton plat préféré?",
            "Quelle est ta chanson préférée?",
            "Qu'est-ce que tu as toujours voulu essayer?",
            "Quel est ton film préféré?",
            "Qu'est-ce que tu apprécies le plus dans notre relation?",
            "Si tu pouvais avoir un super pouvoir, ce serait quoi?",
            "Quelle est la chose la plus romantique qu'on t'ait faite?",
            "Qu'est-ce qui t'attire le plus chez quelqu'un?",
            "Quel est ton souvenir d'enfance préféré?",
            "Si tu pouvais revivre un moment, ce serait lequel?"
        ]
    },
    ht: {
        actions: [
            "Fè yon konpliman ki soti nan fon kè w bay patnè w la",
            "Imite bèt ou pi renmen an",
            "Chante yon ti bout nan yon chante ou dous pou li",
            "Fè 10 ti sote sou plas",
            "Rakonte yon ti blag dròl",
            "Fè yon ti dans 30 segonn pou li",
            "Imite yon moun selèb",
            "Fè yon gwo kalin ak patnè w la",
            "Gade patnè w nan je pandan 30 segonn san w pa ri",
            "Fè yon deklarasyon lanmou ak anpil dousè",
            "Pran yon bèl poz modèl pou l foto w",
            "Fè yon bèl imitasyon vwa ki dròl",
            "Bay patnè w la yon ti masaj 1 minit sou zepòl li",
            "Fè yon ti bisou sou bò figi patnè w la",
            "Chwuchote yon ti mo dous nan zòrèy li",
            "Pran men patnè w la epi kenbe l dousman",
            "Fè yon ti vœu ak tout vwa w",
            "Montre foto ou pi renmen sou telefòn ou",
            "Pataje yon ti sekrè inosan sou ou",
            "Fè yon ti grimas ki dròl"
        ],
        verites: [
            "Ki sa w pi renmen nan patnè w la?",
            "Ki sa ki pi bèl bagay ki rive w nan lavi w?",
            "Ki sa ki pi fè w ri nan lavi w?",
            "Si w te ka vwayaje nenpòt kote nan monn nan, ki kote w ta ale?",
            "Ki sa ki pi fè w pè nan lavi a?",
            "Ki sa w pi admire lakay patnè w la?",
            "Ki sa ki rèv ki pi fou w genyen?",
            "Ki sa w pi renmen nan jounen jodi a?",
            "Si w te ka chanje yon sèl bagay nan lavi w, ki sa l ta ye?",
            "Ki sa ki pi fè kè w kontan?",
            "Ki plat ou pi renmen manje?",
            "Ki chante ki pi touche kè w?",
            "Ki sa w toujou dreamed pou w eseye fè?",
            "Ki fim ou pi renmen gade?",
            "Ki sa w pi apresye nan relasyon nou an?",
            "Si w te ka gen yon sipè pouvwa, ki sa l ta ye?",
            "Ki sa ki pi romantik yo te janm fè pou ou?",
            "Ki sa ki pi atire w nan yon moun?",
            "Ki pi bèl souvni w genyen depi w te piti?",
            "Si w te ka retounen viv yon sèl moman nan lavi w, ki moman sa a ta ye?"
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
    const t = gameData[lang];

    document.getElementById('game-title').textContent = lang === 'fr' ? 'Action ou Vérité' : 'Aksyon oswa Verite';
    document.getElementById('game-subtitle').textContent = lang === 'fr' ? 'Le classique pour tous les moments' : 'Klasik pou tout moman yo';
    document.getElementById('select-player').textContent = lang === 'fr' ? 'Sélectionnez le joueur qui commence' : 'Chwazi jwè ki kòmanse';
    document.getElementById('player1-btn').textContent = userData.name1 || 'Joueur 1';
    document.getElementById('player2-btn').textContent = userData.name2 || 'Joueur 2';
    document.getElementById('choice-question').textContent = lang === 'fr' ? 'Action ou Vérité?' : 'Aksyon oswa Verite?';
    document.getElementById('action-btn').textContent = lang === 'fr' ? 'Action' : 'Aksyon';
    document.getElementById('verite-btn').textContent = lang === 'fr' ? 'Vérité' : 'Verite';
    document.getElementById('skip-btn').textContent = lang === 'fr' ? 'Passer' : 'Pase';
    document.getElementById('complete-btn').textContent = lang === 'fr' ? 'Accompli' : 'Etap';
}

// Select player
function selectPlayer(playerNum) {
    gameState.currentPlayer = playerNum;
    gameState.currentPhase = 'choice';
    updateUI();
}

// Choose action
function chooseAction() {
    gameState.taskType = 'action';
    gameState.currentTask = getRandomTask('action');
    gameState.currentPhase = 'task';
    updateUI();
}

// Choose verite
function chooseVerite() {
    gameState.taskType = 'verite';
    gameState.currentTask = getRandomTask('verite');
    gameState.currentPhase = 'task';
    updateUI();
}

// Get random task
function getRandomTask(type) {
    const lang = userData.language;
    const tasks = gameData[lang][type + 's'];
    return tasks[Math.floor(Math.random() * tasks.length)];
}

// Skip task
function skipTask() {
    // Switch to other player
    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    gameState.currentPhase = 'choice';
    updateUI();
}

// Complete task
function completeTask() {
    // Switch to other player
    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    gameState.currentPhase = 'choice';
    updateUI();
}

// Reset game
function resetGame() {
    gameState = {
        currentPhase: 'selection',
        currentPlayer: 1,
        currentTask: null,
        taskType: null
    };
    updateUI();
}

// Update UI based on current phase
function updateUI() {
    const selectionPhase = document.getElementById('player-selection');
    const choicePhase = document.getElementById('choice-phase');
    const taskPhase = document.getElementById('task-phase');

    // Hide all phases
    selectionPhase.classList.add('hidden');
    choicePhase.classList.add('hidden');
    taskPhase.classList.add('hidden');

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

        case 'choice':
            choicePhase.classList.remove('hidden');
            document.getElementById('current-player-name').textContent = currentPlayerName;
            break;

        case 'task':
            taskPhase.classList.remove('hidden');
            document.getElementById('task-player-name').textContent = currentPlayerName;
            document.getElementById('task-type').textContent = lang === 'fr' ?
                (gameState.taskType === 'action' ? 'ACTION' : 'VÉRITÉ') :
                (gameState.taskType === 'action' ? 'AKSYON' : 'VERITE');
            document.getElementById('task-type').className = 'task-type ' + gameState.taskType;
            document.getElementById('task-content').textContent = gameState.currentTask;
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
