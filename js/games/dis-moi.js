// Game state for "Dis moi ce que tu veux pas me dire"
let gameState = {
    currentPhase: 'write', // write, guess, result
    currentPlayer: 1,
    secretMessage: '',
    revealedLetters: 0,
    correctGuess: false
};

// Translations for this game
const gameTranslations = {
    fr: {
        gameTitle: "Dis moi ce que tu veux pas me dire",
        gameSubtitle: "Écrivez quelque chose, laissez l'autre deviner",
        currentPlayer: "Tour de:",
        writeLabel: "Écrivez ce que vous voulez dire mais ne pouvez pas dire à voix haute",
        submitBtn: "Envoyer",
        guesserPlayer: "Tour de:",
        hintText: "L'autre personne a écrit quelque chose...",
        guessLabel: "Devinez ce que c'est",
        revealBtn: "Révéler une lettre",
        guessBtn: "Soumettre devinette",
        correctGuess: "Correct! Vous avez deviné!",
        wrongGuess: "Pas tout à fait... Essayez encore!",
        secretReveal: "Le message secret était:",
        resetBtn: "Rejouer",
        homeBtn: "Retour",
        player1: "Joueur 1",
        player2: "Joueur 2"
    },
    ht: {
        gameTitle: "Di m sa w pa vle di m nan",
        gameSubtitle: "Ekri yon bagay dous oswa yon sekrè, epi kite patnè w devine l",
        currentPlayer: "Tou pa:",
        writeLabel: "Ekri yon bagay ou gen nan kè w ke w pa ka di ak gwo vwa",
        submitBtn: "Voye sekrè a",
        guesserPlayer: "Tou pa:",
        hintText: "Patnè w la ekri yon ti mesaj sekrè...",
        guessLabel: "Eseye devine sa l ekri a",
        revealBtn: "Montre yon lèt",
        guessBtn: "Voye devinèt pa w la",
        correctGuess: "Bravo! Ou devine l ak siksè!",
        wrongGuess: "Ou pa fin jwenn li... Re-eseye ankò!",
        secretReveal: "Mesaj sekrè a te:",
        resetBtn: "Rejwe ankò",
        homeBtn: "Retounen",
        player1: "Jwè 1",
        player2: "Jwè 2"
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
    const t = gameTranslations[lang];

    document.getElementById('game-title').textContent = t.gameTitle;
    document.getElementById('game-subtitle').textContent = t.gameSubtitle;
    document.getElementById('write-label').textContent = t.writeLabel;
    document.getElementById('btn-submit').textContent = t.submitBtn;
    document.getElementById('guess-label').textContent = t.guessLabel;
    document.getElementById('btn-reveal').textContent = t.revealBtn;
    document.getElementById('btn-guess').textContent = t.guessBtn;
    document.getElementById('btn-reset').textContent = t.resetBtn;
    document.getElementById('btn-home').textContent = t.homeBtn;

    // Update player names
    const player1Name = userData.name1 || t.player1;
    const player2Name = userData.name2 || t.player2;

    document.getElementById('player-name').textContent = player1Name;
    document.getElementById('guesser-name').textContent = player2Name;
}

// Submit secret message
function submitSecret() {
    const secretInput = document.getElementById('secret-message');
    const message = secretInput.value.trim();

    if (!message) {
        alert(userData.language === 'fr' ? 'Veuillez écrire un message' : 'Tanpri ekri yon mesaj');
        return;
    }

    gameState.secretMessage = message;
    gameState.currentPhase = 'guess';
    gameState.currentPlayer = 2;

    updateUI();
}

// Reveal one letter
function revealLetter() {
    if (gameState.revealedLetters < gameState.secretMessage.length) {
        gameState.revealedLetters++;
        updateLetterReveal();
    }
}

// Update letter reveal display
function updateLetterReveal() {
    const revealDiv = document.getElementById('letter-reveal');
    let revealed = '';

    for (let i = 0; i < gameState.secretMessage.length; i++) {
        if (i < gameState.revealedLetters) {
            revealed += gameState.secretMessage[i];
        } else if (gameState.secretMessage[i] === ' ') {
            revealed += ' ';
        } else {
            revealed += '_';
        }
        revealed += ' ';
    }

    revealDiv.textContent = revealed;
    revealDiv.style.fontSize = '1.5rem';
    revealDiv.style.fontFamily = 'monospace';
    revealDiv.style.letterSpacing = '5px';
    revealDiv.style.marginTop = '20px';
}

// Submit guess
function submitGuess() {
    const guessInput = document.getElementById('guess-input');
    const guess = guessInput.value.trim().toLowerCase();
    const secret = gameState.secretMessage.toLowerCase();

    if (!guess) {
        alert(userData.language === 'fr' ? 'Veuillez faire une devinette' : 'Tanpri fè yon devinèt');
        return;
    }

    if (guess === secret || secret.includes(guess)) {
        gameState.correctGuess = true;
    }

    gameState.currentPhase = 'result';
    updateUI();
}

// Reset game
function resetGame() {
    gameState = {
        currentPhase: 'write',
        currentPlayer: 1,
        secretMessage: '',
        revealedLetters: 0,
        correctGuess: false
    };

    document.getElementById('secret-message').value = '';
    document.getElementById('guess-input').value = '';
    document.getElementById('letter-reveal').textContent = '';

    updateUI();
}

// Update UI based on current phase
function updateUI() {
    const writePhase = document.getElementById('write-phase');
    const guessPhase = document.getElementById('guess-phase');
    const resultPhase = document.getElementById('result-phase');

    // Hide all phases
    writePhase.classList.add('hidden');
    guessPhase.classList.add('hidden');
    resultPhase.classList.add('hidden');

    const lang = userData.language;
    const t = gameTranslations[lang];

    switch (gameState.currentPhase) {
        case 'write':
            writePhase.classList.remove('hidden');
            document.getElementById('current-player').textContent = `${t.currentPlayer} ${userData.name1 || t.player1}`;
            break;

        case 'guess':
            guessPhase.classList.remove('hidden');
            document.getElementById('guesser-player').textContent = `${t.guesserPlayer} ${userData.name2 || t.player2}`;
            updateLetterReveal();
            break;

        case 'result':
            resultPhase.classList.remove('hidden');
            const resultMessage = document.getElementById('result-message');
            const secretReveal = document.getElementById('secret-reveal');

            if (gameState.correctGuess) {
                resultMessage.textContent = t.correctGuess;
                resultMessage.style.color = 'var(--success)';
            } else {
                resultMessage.textContent = t.wrongGuess;
                resultMessage.style.color = 'var(--danger)';
            }

            secretReveal.textContent = `${t.secretReveal} "${gameState.secretMessage}"`;
            secretReveal.classList.add('secret-reveal');
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
