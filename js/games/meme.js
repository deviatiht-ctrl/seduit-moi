// ============================================================
// MEME GAME — Integrated with Imgflip API (https://api.imgflip.com/get_memes)
// Real-time online sync supported. Zero emojis.
// ============================================================

let gameState = {
    currentMemeIndex: 0,
    hasVoted: false,
    lastVoteYes: null,
    votesCount: { yes: 0, no: 0 },
    remoteMemes: []
};

// Fallback / Curated Couple Situations
const coupleSituations = {
    fr: [
        {
            situation: "Quand ton partenaire dit qu'il n'a pas faim, mais finit par manger toutes tes frites.",
            caption: "Le voleur de frites !",
            yesReply: "Totalement nous ! C'est un classique absolu.",
            noReply: "Incroyable, vous respectez les assiettes de chacun !"
        },
        {
            situation: "Quand l'un de vous vole toute la couverture au milieu de la nuit.",
            caption: "Le burrito de couverture en pleine nuit...",
            yesReply: "Nous aussi ! Dormir au froid fait partie de notre vie.",
            noReply: "Magnifique, vous partagez équitablement la chaleur !"
        },
        {
            situation: "Quand je dis que je suis prêt(e) dans 5 minutes, mais que je suis encore en serviette.",
            caption: "Le fameux '5 minutes' qui dure 40 minutes.",
            yesReply: "Oui ! Les 5 minutes durent souvent une demi-heure.",
            noReply: "Vous êtes d'une ponctualité exemplaire !"
        },
        {
            situation: "Quand on commence un film ensemble, et que l'un de nous s'endort après 10 minutes.",
            caption: "Le générique n'est même pas fini...",
            yesReply: "Toujours ! Le canapé est beaucoup trop confortable.",
            noReply: "Vous regardez vraiment des films en entier ?"
        },
        {
            situation: "Quand ton partenaire boude et que tu commences à l'embrasser partout pour le faire rire.",
            caption: "La technique imparable du bisou !",
            yesReply: "C'est la meilleure méthode ! Personne ne résiste aux bisous.",
            noReply: "Vous préférez discuter calmement, c'est très mature !"
        },
        {
            situation: "Quand on cherche quoi manger pendant 1 heure et qu'on finit par commander des pizzas.",
            caption: "'Comme tu veux'... 'Non, comme tu veux !'",
            yesReply: "Un classique ! Le débat éternel du dîner.",
            noReply: "Vous savez toujours exactement ce que vous voulez manger !"
        },
        {
            situation: "Quand tu envoies un meme drôle et que l'autre personne est juste à côté de toi sur le canapé.",
            caption: "Communication moderne 2.0 !",
            yesReply: "On le fait tout le temps ! C'est notre langage secret.",
            noReply: "Vous vous parlez de vive voix, c'est plus authentique !"
        }
    ],
    ht: [
        {
            situation: "Lè patnè w di li pa grangou, epi finalman l manje tout fri (fries) nan plat ou a.",
            caption: "Vòlè fri a nan aksyon !",
            yesReply: "Se nou nèt! Yon klasik nan tout koup.",
            noReply: "Etonan, nou chak respekte plat lòt la!"
        },
        {
            situation: "Lè yonn nan nou rale tout dra a sou li nan mitan lannwit lan.",
            caption: "Teknik burrito dra a nan gwo fredi...",
            yesReply: "Se nou sa! Tremble nan fredi fè pati relasyon an.",
            noReply: "Bèl bagay, nou separe chalè a mwatye pou mwatye!"
        },
        {
            situation: "Lè m di m ap pare nan 5 minit epi m toujou anba sèvyèt.",
            caption: "5 minit lejandè ki tounen 40 minit...",
            yesReply: "Wi nèt! 5 minit sa a toujou tounen yon demèdtan.",
            noReply: "Nou trè egzak sou lè, sa se yon gwo kalite!"
        },
        {
            situation: "Lè n ap gade yon fim ansanm epi yonn nan nou gentan ap ronfle apre 10 minit.",
            caption: "Générique la poko menm fini l gentan nan yon lòt mond...",
            yesReply: "Sa rive chak fwa! Kanape a tèlman dous.",
            noReply: "Nou gade tout fim yo nèt? Nou gen anpil pasyans!"
        },
        {
            situation: "Lè patnè w ap boude epi w kòmanse bo l tout kote pou fè l ri.",
            caption: "Teknik majik dousè a!",
            yesReply: "Se pi bon fason! Pèsonn pa ka rete fache ak ti bisou dous.",
            noReply: "Nou pito pale dousman ak tèt poze, sa trè matir!"
        },
        {
            situation: "Lè n ap chèche sa pou n manje pandan 1 èdtan epi n fini nan kòmande menm bagay la.",
            caption: "'Sa w vle a'... 'Non, sa w vle pito !'",
            yesReply: "Se yon gwo klasik! Deba kizin lan pa janm fini.",
            noReply: "Nou toujou konnen sa n ap manje san pèdi tan!"
        },
        {
            situation: "Lè w voye yon meme dròl bay patnè w epi l chita kòt a kòt avèk ou sou menm kabann lan.",
            caption: "Komunikasyon modèn an dirèk !",
            yesReply: "Nou fè sa tout tan! Se fason pa n pou n ri ansanm.",
            noReply: "Nou pito pale nan bouch an dirèk, sa pi natirèl!"
        }
    ]
};

// Default fallback meme images
const localMemeImages = [
    "../images/memes/hungry_partner.png",
    "../images/memes/blanket_thief.png"
];

// Fetch Imgflip Memes from API
async function fetchImgflipMemes() {
    try {
        const response = await fetch('https://api.imgflip.com/get_memes');
        if (!response.ok) throw new Error('Imgflip API offline');
        const json = await response.json();
        if (json.success && json.data && json.data.memes && json.data.memes.length > 0) {
            gameState.remoteMemes = json.data.memes;
            console.log('[MemeGame] Loaded', json.data.memes.length, 'memes from Imgflip API');
        }
    } catch(e) {
        console.warn('[MemeGame] Using local meme collection:', e.message);
    }
}

// Init game
async function initGame() {
    loadUserData();
    applyTranslations();
    await fetchImgflipMemes();
    showMeme();
}

function applyTranslations() {
    const lang = userData ? userData.language : 'fr';
    const isHt = lang === 'ht';

    document.getElementById('game-title').textContent = isHt ? 'Meme Nou Yo' : 'Nos Memes';
    document.getElementById('game-subtitle').textContent = isHt ?
        'Ri ansanm ak ti moman dròl n ap viv nan koup la' :
        'Riez ensemble de vos habitudes de couple';

    document.getElementById('vote-yes-text').textContent = isHt ? 'Wi, se nou nèt!' : "Oui, c'est nous !";
    document.getElementById('vote-no-text').textContent = isHt ? 'Non, se pa nou!' : 'Non, pas du tout !';
    document.getElementById('next-btn-text').textContent = isHt ? 'Meme Swivan' : 'Meme Suivant';
}

function showMeme() {
    const lang = userData ? userData.language : 'fr';
    const situations = coupleSituations[lang] || coupleSituations.fr;
    const situationIndex = gameState.currentMemeIndex % situations.length;
    const curr = situations[situationIndex];

    // Reset UI state
    gameState.hasVoted = false;
    document.getElementById('vote-result').classList.add('hidden');
    document.getElementById('voting-buttons').style.opacity = '1';
    document.getElementById('voting-buttons').style.pointerEvents = 'auto';

    // Show situation text
    document.getElementById('meme-situation').textContent = curr.situation;

    const imgEl = document.getElementById('meme-image');
    const fallbackEl = document.getElementById('meme-vector-fallback');

    // Pick image URL: from Imgflip API if available, else local fallback
    let imageUrl = '';
    if (gameState.remoteMemes && gameState.remoteMemes.length > 0) {
        const memeObj = gameState.remoteMemes[gameState.currentMemeIndex % gameState.remoteMemes.length];
        imageUrl = memeObj ? memeObj.url : '';
    } else {
        imageUrl = localMemeImages[gameState.currentMemeIndex % localMemeImages.length] || '';
    }

    if (imageUrl) {
        imgEl.src = imageUrl;
        imgEl.style.display = 'block';
        fallbackEl.style.display = 'none';
        imgEl.onerror = () => {
            imgEl.style.display = 'none';
            fallbackEl.style.display = 'flex';
        };
    } else {
        imgEl.style.display = 'none';
        fallbackEl.style.display = 'flex';
    }

    document.getElementById('vector-caption').textContent = curr.caption;

    if (typeof createIcons === 'function') createIcons();
}

function vote(isYes) {
    if (gameState.hasVoted) return;

    gameState.hasVoted = true;
    gameState.lastVoteYes = isYes;

    const lang = userData ? userData.language : 'fr';
    const situations = coupleSituations[lang] || coupleSituations.fr;
    const curr = situations[gameState.currentMemeIndex % situations.length];

    // Lock buttons
    document.getElementById('voting-buttons').style.opacity = '0.5';
    document.getElementById('voting-buttons').style.pointerEvents = 'none';

    // Generate random funny compatibility %
    let percentage = isYes ? (Math.floor(Math.random() * 25) + 75) : (Math.floor(Math.random() * 30) + 10);
    const resultText = isYes ? curr.yesReply : curr.noReply;

    const resultDiv = document.getElementById('vote-result');
    document.getElementById('result-text').textContent = resultText;
    document.getElementById('compatibility-percent').textContent = `${percentage}% ` + (lang === 'ht' ? 'nan koup yo' : 'des couples');
    resultDiv.classList.remove('hidden');

    // Online Broadcast
    updateUI();
}

function nextMeme() {
    const lang = userData ? userData.language : 'fr';
    const situations = coupleSituations[lang] || coupleSituations.fr;

    gameState.currentMemeIndex++;
    if (gameState.currentMemeIndex >= 50) {
        gameState.currentMemeIndex = 0;
    }

    showMeme();
    updateUI();
}

function updateUI() {
    if (window._onlineMode && typeof window._broadcastGameState === 'function') {
        window._broadcastGameState('meme', gameState);
    }
}

document.addEventListener('DOMContentLoaded', initGame);
