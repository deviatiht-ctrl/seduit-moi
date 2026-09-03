// Game state for Preferences
let gameState = {
    currentPhase: 'selection', // selection, preference, discussion, completion
    currentPlayer: 1,
    currentPreference: 0
};

// Preferences database - "Would you rather" style questions
const gameData = {
    fr: [
        {
            question: "Préfères-tu...",
            option1: "Un repas romantique au restaurant",
            option2: "Un cuisiné ensemble à la maison"
        },
        {
            question: "Préfères-tu...",
            option1: "Un weekend à la montagne",
            option2: "Un weekend à la plage"
        },
        {
            question: "Préfères-tu...",
            option1: "Les surprises spontanées",
            option2: "Les plans bien organisés"
        },
        {
            question: "Préfères-tu...",
            option1: "Les câlins prolongés",
            option2: "Les conversations profondes"
        },
        {
            question: "Préfères-tu...",
            option1: "Partager un dessert",
            option2: "Avoir ton propre dessert"
        },
        {
            question: "Préfères-tu...",
            option1: "Les messages du matin",
            option2: "Les appels du soir"
        },
        {
            question: "Préfères-tu...",
            option1: "Rire ensemble",
            option2: "Pleurer ensemble"
        },
        {
            question: "Préfères-tu...",
            option1: "Les compliments verbaux",
            option2: "Les gestes affectueux"
        },
        {
            question: "Préfères-tu...",
            option1: "Une aventure nouvelle",
            option2: "Une tradition familière"
        },
        {
            question: "Préfères-tu...",
            option1: "Être le leader",
            option2: "Suivre le lead"
        }
    ],
    ht: [
        {
            question: "Ou prefere...",
            option1: "Yon manje romantik nan yon bèl restoran",
            option2: "Kwit yon bèl manje ansanm nan kay la"
        },
        {
            question: "Ou prefere...",
            option1: "Yon fen semèn sou mòn nan fredi",
            option2: "Yon fen semèn bò lanmè / sou plaj"
        },
        {
            question: "Ou prefere...",
            option1: "Ti sipriz dous san atann",
            option2: "Plan byen òganize alavans"
        },
        {
            question: "Ou prefere...",
            option1: "Gwo kalin ki dire lontan",
            option2: "Konvèsasyon pwofon ki touche kè w"
        },
        {
            question: "Ou prefere...",
            option1: "Pataje menm desè a ansanm",
            option2: "Chak moun gen desè pa l"
        },
        {
            question: "Ou prefere...",
            option1: "Ti mesaj dous chak maten lè w leve",
            option2: "Gwo ti kozé ak apèl chak swa anvan w dòmi"
        },
        {
            question: "Ou prefere...",
            option1: "Ri ansanm joustan vant nou fè n mal",
            option2: "Koute epi konsole youn lòt lè n tris"
        },
        {
            question: "Ou prefere...",
            option1: "Konpliman ak ti mo dous nan bouch",
            option2: "Ti jes ak atansyon chak jou"
        },
        {
            question: "Ou prefere...",
            option1: "Eskplore yon nouvo avanti ak eksitasyon",
            option2: "Rete nan abitid dous nou deja konnen yo"
        },
        {
            question: "Ou prefere...",
            option1: "Pran devan pou gide relasyon an",
            option2: "Kite patnè w la gide w ak dousè"
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

    document.getElementById('game-title').textContent = 'Préférences';
    document.getElementById('game-subtitle').textContent = lang === 'fr' ? 'Ce que vous préférez vraiment' : 'Sa ou renmen anpil';
    document.getElementById('select-player').textContent = lang === 'fr' ? 'Qui répond en premier?' : 'Ki moun ki reponn an premye?';
    document.getElementById('player1-btn').textContent = userData.name1 || 'Joueur 1';
    document.getElementById('player2-btn').textContent = userData.name2 || 'Joueur 2';
    document.getElementById('discussion-text').textContent = lang === 'fr' ? 'Discutez de vos choix!' : 'Diskite sou chwa ou yo!';
    document.getElementById('next-btn').textContent = lang === 'fr' ? 'Suivant' : 'Swivan';
    document.getElementById('completion-message').textContent = lang === 'fr' ? 'Vous avez exploré vos préférences!' : 'Ou eksplore preferans ou yo!';
    document.getElementById('restart-btn').textContent = lang === 'fr' ? 'Recommencer' : 'Rekòmanse';
    document.getElementById('home-btn').textContent = lang === 'fr' ? 'Retour' : 'Retounen';
}

// Select player
function selectPlayer(playerNum) {
    gameState.currentPlayer = playerNum;
    gameState.currentPhase = 'preference';
    gameState.currentPreference = 0;
    updateUI();
}

// Select option
function selectOption(optionNum) {
    gameState.currentPhase = 'discussion';
    updateUI();
}

// Next preference
function nextPreference() {
    gameState.currentPreference++;
    if (gameState.currentPreference >= gameData[userData.language].length) {
        gameState.currentPhase = 'completion';
    } else {
        gameState.currentPhase = 'preference';
        gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    }
    updateUI();
}

// Restart game
function restartGame() {
    gameState = {
        currentPhase: 'selection',
        currentPlayer: 1,
        currentPreference: 0
    };
    updateUI();
}

// Reset game
function resetGame() {
    gameState = {
        currentPhase: 'selection',
        currentPlayer: 1,
        currentPreference: 0
    };
    updateUI();
}

// Update UI based on current phase
function updateUI() {
    const selectionPhase = document.getElementById('player-selection');
    const preferencePhase = document.getElementById('preference-phase');
    const discussionPhase = document.getElementById('discussion-phase');
    const completionPhase = document.getElementById('completion-phase');

    // Hide all phases
    selectionPhase.classList.add('hidden');
    preferencePhase.classList.add('hidden');
    discussionPhase.classList.add('hidden');
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

        case 'preference':
            preferencePhase.classList.remove('hidden');
            document.getElementById('player-name').textContent = currentPlayerName;

            const preferences = gameData[lang];
            const currentPref = preferences[gameState.currentPreference];

            document.getElementById('preference-question').textContent = currentPref.question;
            document.getElementById('option1').textContent = currentPref.option1;
            document.getElementById('option2').textContent = currentPref.option2;
            break;

        case 'discussion':
            preferencePhase.classList.remove('hidden');
            discussionPhase.classList.remove('hidden');
            document.getElementById('player-name').textContent = currentPlayerName;

            const prefData = gameData[lang];
            const pref = prefData[gameState.currentPreference];

            document.getElementById('preference-question').textContent = pref.question;
            document.getElementById('option1').textContent = pref.option1;
            document.getElementById('option2').textContent = pref.option2;
            break;

        case 'completion':
            completionPhase.classList.remove('hidden');
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
