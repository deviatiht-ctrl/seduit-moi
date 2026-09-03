// Game state for Stickers
let gameState = {
    currentPlayer: 1,
    currentPromptIndex: 0,
    selectedSticker: null
};

// Prompts Database
const gameData = {
    fr: {
        prompts: [
            "Envoie un sticker pour montrer comment tu réagis quand je te regarde avec insistance.",
            "Choisis un sticker pour me demander un câlin chaud tout de suite.",
            "Quel sticker représente le mieux ton humeur romantique actuelle ?",
            "Choisis le sticker qui décrit ta réaction quand je te dis un secret coquin.",
            "Envoie un sticker pour exprimer à quel point tu aimes mes baisers.",
            "Quel sticker choisirais-tu si je te volais ta nourriture ?"
        ],
        reactions: {
            1: "Oh, c'est tellement mignon ! C'est le moment d'un gros câlin !",
            2: "Un tendre baiser ! Rapprochez-vous l'un de l'autre !",
            3: "Flirter fait monter la température... Un jeu séduisant commence !",
            4: "Oh la la ! Quelle surprise ! C'est trop drôle !"
        },
        labels: {
            1: "Câlin d'amour",
            2: "Bisou tendre",
            3: "Clin d'œil coquin",
            4: "Surprise drôle"
        },
        turnText: "Tour de:",
        nextBtn: "Défi Suivant",
        gameTitle: "Défi Stickers",
        gameSubtitle: "Exprimez vos sentiments avec nos stickers"
    },
    ht: {
        prompts: [
            "Voye yon sticker pou montre kijan w ap reyaji lè m gade w fiks nan je.",
            "Chwazi yon sticker pou mande m yon bèl kalin cho kounye a.",
            "Ki sticker ki pi byen dekri santiman amoure w anndan kò w kounye a?",
            "Chwazi sticker ki dekri reyaksyon w lè m di w yon ti sekrè entim dous.",
            "Voye yon sticker pou montre jan w renmen lè m ap ba w bisou.",
            "Ki sticker w ap chwazi si m ta vòlè moso manje nan plat ou?"
        ],
        reactions: {
            1: "Ala yon gwo dousè! Se lè pou yon gwo kalin kounye a!",
            2: "Yon ti bisou dous! Pwoche pi pre patnè w la!",
            3: "Ti flit sa a fè nivo a monte... Parfè pou sediksyon!",
            4: "Ala yon gwo sipriz amizan! Tèlman dròl!"
        },
        labels: {
            1: "Kalin lanmou",
            2: "Bisou dous",
            3: "Flit ak je",
            4: "Sezi amizan"
        },
        turnText: "Tou pa:",
        nextBtn: "Defi Swivan",
        gameTitle: "Defi Stickers",
        gameSubtitle: "Eksprime santiman w ak bèl ti stickers nou yo"
    }
};

// Initialize
function initGame() {
    loadUserData();
    applyTranslations();
    nextPrompt();
}

// Translations
function applyTranslations() {
    const lang = userData.language;
    const t = gameData[lang];

    document.getElementById('game-title').textContent = t.gameTitle;
    document.getElementById('game-subtitle').textContent = t.gameSubtitle;
    document.getElementById('next-btn-text').textContent = t.nextBtn;

    // Apply sticker labels
    document.getElementById('sticker-label-1').textContent = t.labels[1];
    document.getElementById('sticker-label-2').textContent = t.labels[2];
    document.getElementById('sticker-label-3').textContent = t.labels[3];
    document.getElementById('sticker-label-4').textContent = t.labels[4];
}

// Next prompt
function nextPrompt() {
    const lang = userData.language;
    const t = gameData[lang];

    // Hide reaction
    document.getElementById('reaction-area').classList.add('hidden');
    
    // Clear selection style
    document.querySelectorAll('.sticker-card').forEach(card => {
        card.style.borderColor = 'transparent';
        card.style.transform = 'none';
        card.style.background = 'var(--surface-light)';
    });

    // Toggle player
    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    const player1Name = userData.name1 || (lang === 'fr' ? 'Joueur 1' : 'Jwè 1');
    const player2Name = userData.name2 || (lang === 'fr' ? 'Joueur 2' : 'Jwè 2');
    const name = gameState.currentPlayer === 1 ? player1Name : player2Name;
    document.getElementById('player-name').textContent = name;

    // Get prompt
    const index = Math.floor(Math.random() * t.prompts.length);
    gameState.currentPromptIndex = index;
    document.getElementById('prompt-text').textContent = t.prompts[index];
}

// Select sticker
function selectSticker(num) {
    const lang = userData.language;
    const t = gameData[lang];
    gameState.selectedSticker = num;

    // Update border styling to show selected card
    document.querySelectorAll('.sticker-card').forEach((card, index) => {
        if (index + 1 === num) {
            card.style.borderColor = 'var(--primary)';
            card.style.background = 'rgba(220, 38, 38, 0.1)';
            card.style.transform = 'scale(1.05)';
        } else {
            card.style.borderColor = 'transparent';
            card.style.transform = 'none';
            card.style.background = 'var(--surface-light)';
        }
    });

    // Display reaction
    const reactionDiv = document.getElementById('reaction-area');
    const reactionMsg = document.getElementById('reaction-message');
    reactionMsg.textContent = t.reactions[num];
    reactionDiv.classList.remove('hidden');
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
