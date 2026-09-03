// Game state for Tic-Tac-Toe
let gameState = {
    board: ['', '', '', '', '', '', '', '', ''],
    currentPlayer: 'X',
    gameActive: true,
    scores: { X: 0, O: 0 }
};

// Winning combinations
const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]              // Diagonals
];

// Initialize game
function initGame() {
    loadUserData();
    applyGameTranslations();
    loadScores();
    resetGame();
}

// Apply game-specific translations
function applyGameTranslations() {
    const lang = userData.language;

    document.getElementById('game-title').textContent = 'Tic-Tac-Toe';
    document.getElementById('game-subtitle').textContent = lang === 'fr' ? 'Jeu de stratégie pour deux' : 'Jwet estrateji pou de moun';
    document.getElementById('reset-btn').textContent = lang === 'fr' ? 'Nouvelle partie' : 'Nouvo pati';
    document.getElementById('reset-scores-btn').textContent = lang === 'fr' ? 'Réinitialiser scores' : 'Reyinisyalize skò';

    // Update player names
    const player1Name = userData.name1 || (lang === 'fr' ? 'Joueur 1' : 'Jwè 1');
    const player2Name = userData.name2 || (lang === 'fr' ? 'Joueur 2' : 'Jwè 2');

    document.getElementById('player1-name').textContent = `${player1Name} (X)`;
    document.getElementById('player2-name').textContent = `${player2Name} (O)`;
}

// Make a move
function makeMove(index) {
    if (!gameState.gameActive || gameState.board[index] !== '') {
        return;
    }

    // Online mode: enforce turns — host=X, guest=O
    if (window._onlineMode) {
        const isMyTurn = (gameState.currentPlayer === 'X' && window._myOnlineRole === 'host') ||
                         (gameState.currentPlayer === 'O' && window._myOnlineRole === 'guest');
        if (!isMyTurn) return;
    }

    gameState.board[index] = gameState.currentPlayer;
    updateBoard();

    if (checkWin()) {
        gameState.gameActive = false;
        gameState.scores[gameState.currentPlayer]++;
        saveScores();
        updateScores();
        showResult(winMessage());
    } else if (checkDraw()) {
        gameState.gameActive = false;
        showResult(drawMessage());
    } else {
        gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
        updateTurnDisplay();
    }
}


// Update board display
function updateBoard() {
    const cells = document.querySelectorAll('.tictactoe-cell');
    cells.forEach((cell, index) => {
        cell.textContent = gameState.board[index];
        cell.classList.remove('x', 'o', 'winner');

        if (gameState.board[index] === 'X') {
            cell.classList.add('x');
        } else if (gameState.board[index] === 'O') {
            cell.classList.add('o');
        }
    });
}

// Check for win
function checkWin() {
    return winningCombinations.some(combination => {
        return combination.every(index => {
            return gameState.board[index] === gameState.currentPlayer;
        });
    });
}

// Check for draw
function checkDraw() {
    return gameState.board.every(cell => cell !== '');
}

// Win message
function winMessage() {
    const lang = userData.language;
    const playerName = gameState.currentPlayer === 'X' ? userData.name1 : userData.name2;
    const defaultName = gameState.currentPlayer === 'X' ?
        (lang === 'fr' ? 'Joueur 1' : 'Jwè 1') :
        (lang === 'fr' ? 'Joueur 2' : 'Jwè 2');

    return lang === 'fr' ?
        `${playerName || defaultName} a gagné!` :
        `${playerName || defaultName} genyen!`;
}

// Draw message
function drawMessage() {
    const lang = userData.language;
    return lang === 'fr' ? 'Match nul!' : 'Match nul!';
}

// Show result
function showResult(message) {
    const resultDiv = document.getElementById('game-result');
    const resultMessage = document.getElementById('result-message');

    resultDiv.classList.remove('hidden');
    resultMessage.textContent = message;
    resultMessage.style.color = 'var(--success)';
}

// Update turn display
function updateTurnDisplay() {
    const lang = userData.language;
    const playerName = gameState.currentPlayer === 'X' ? userData.name1 : userData.name2;
    const defaultName = gameState.currentPlayer === 'X' ?
        (lang === 'fr' ? 'Joueur 1' : 'Jwè 1') :
        (lang === 'fr' ? 'Joueur 2' : 'Jwè 2');

    document.getElementById('current-player-display').textContent = playerName || defaultName;
}

// Update scores display
function updateScores() {
    document.getElementById('player1-score').textContent = gameState.scores.X;
    document.getElementById('player2-score').textContent = gameState.scores.O;
}

// Save scores to localStorage
function saveScores() {
    localStorage.setItem('seduitMoiTicTacToeScores', JSON.stringify(gameState.scores));
}

// Load scores from localStorage
function loadScores() {
    const savedScores = localStorage.getItem('seduitMoiTicTacToeScores');
    if (savedScores) {
        gameState.scores = JSON.parse(savedScores);
        updateScores();
    }
}

// Reset game
function resetGame() {
    gameState.board = ['', '', '', '', '', '', '', '', ''];
    gameState.currentPlayer = 'X';
    gameState.gameActive = true;

    document.getElementById('game-result').classList.add('hidden');
    updateBoard();
    updateTurnDisplay();
}

// Reset scores
function resetScores() {
    gameState.scores = { X: 0, O: 0 };
    saveScores();
    updateScores();
    resetGame();
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
