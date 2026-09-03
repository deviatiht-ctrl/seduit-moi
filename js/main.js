// Language translations
const translations = {
    fr: {
        introTitle: "Présentation",
        introSubtitle: "Commençons par faire connaissance",
        labelName1: "Votre nom",
        labelName2: "Nom de votre partenaire",
        labelSituation: "Quelle est votre situation?",
        btnStart: "Commencer",
        welcomeTitle: "Bienvenue",
        welcomeSubtitle: "Choisissez une activité pour commencer",
        game1Title: "Dis moi ce que tu veux pas me dire",
        game1Desc: "Révélez vos secrets les plus profonds",
        game2Title: "Action ou Vérité",
        game2Desc: "Le classique des jeux de soirée",
        game3Title: "Apprends-moi à te connaître",
        game3Desc: "Questions pour mieux vous comprendre",
        game4Title: "Tic-Tac-Toe",
        game4Desc: "Jeu de stratégie pour deux",
        game5Title: "Hot",
        game5Desc: "Questions pour monter le niveau",
        game6Title: "Devinettes",
        game6Desc: "Testez votre intuition",
        game7Title: "Préférences",
        game7Desc: "Ce que vous préférez vraiment",
        game8Title: "Défis",
        game8Desc: "Petits défis amusants",
        game9Title: "Défi Stickers",
        game9Desc: "Réagissez avec de superbes stickers romantiques et drôles",
        game10Title: "Nos Memes",
        game10Desc: "Riez ensemble en découvrant vos habitudes de couple",
        game11Title: "Doux Mots",
        game11Desc: "Partagez des compliments chaleureux et des questions complices",
        game12Title: "Jeu de Contact",
        game12Desc: "Connectez-vous physiquement avec des mini-jeux tactiles amusants",
        situationDate: "Date",
        situationFriends: "Amis",
        situationCouple: "En couple",
        situationNew: "Nouvelle rencontre"
    },
    ht: {
        introTitle: "Prezantasyon",
        introSubtitle: "Ann kòmanse pou nou pi byen konnen youn lòt",
        labelName1: "Non pa w",
        labelName2: "Non patnè w la",
        labelSituation: "Ki sitiyasyon nou?",
        btnStart: "Kòmanse",
        welcomeTitle: "Byenvini",
        welcomeSubtitle: "Chwazi yon aktivite pou n kòmanse amize nou",
        game1Title: "Di m sa w pa vle di m nan",
        game1Desc: "Revele sekrè ki pi fon nan kè w",
        game2Title: "Aksyon oswa Verite",
        game2Desc: "Jwèt klasik pou ti sware amizan",
        game3Title: "Aprann konnen m pi byen",
        game3Desc: "Kesyon pou nou pi byen konprann youn lòt",
        game4Title: "Tic-Tac-Toe",
        game4Desc: "Jwèt estrateji pou de moun",
        game5Title: "Hot (Cho)",
        game5Desc: "Kesyon pou monte chalè a",
        game6Title: "Devinèt",
        game6Desc: "Mete entuisyon w ak lespri w an mas",
        game7Title: "Preferans",
        game7Desc: "Sa w pi renmen toutbon an",
        game8Title: "Defi",
        game8Desc: "Ti defi amizan pou fè nou ri",
        game9Title: "Defi Stickers",
        game9Desc: "Eksprime vrasanblans ou ak bèl ti stickers dous ak amizan",
        game10Title: "Meme Nou Yo",
        game10Desc: "Ri ansanm ak ti moman dròl n ap viv nan koup la",
        game11Title: "Dous Mo",
        game11Desc: "Konpliman dous ak ti kesyon entim pou pwoche nou pi pre",
        game12Title: "Kontak",
        game12Desc: "Jwèt fizik ak ti touch dous pou nou konekte",
        situationDate: "Premye waka / Ranvous",
        situationFriends: "Zanmi pi pre",
        situationCouple: "An koup",
        situationNew: "Nouvo rankont"
    }
};

// User data storage
let userData = {
    language: 'fr',
    name1: '',
    name2: '',
    situation: 'date'
};

// Load user data from localStorage
function loadUserData() {
    const savedData = localStorage.getItem('seduitMoiData');
    if (savedData) {
        userData = JSON.parse(savedData);
        applyLanguage();
    }
}

// Save user data to localStorage
function saveUserData() {
    localStorage.setItem('seduitMoiData', JSON.stringify(userData));
}

// Select language
function selectLanguage(lang) {
    userData.language = lang;
    saveUserData();
    window.location.href = 'pages/intro.html';
}

// Apply language to current page
function applyLanguage() {
    const lang = userData.language;
    const t = translations[lang];

    // Update intro page
    if (document.getElementById('intro-title')) {
        document.getElementById('intro-title').textContent = t.introTitle;
        document.getElementById('intro-subtitle').textContent = t.introSubtitle;
        document.getElementById('label-name1').textContent = t.labelName1;
        document.getElementById('label-name2').textContent = t.labelName2;
        document.getElementById('label-situation').textContent = t.labelSituation;
        document.getElementById('btn-start').textContent = t.btnStart;

        // Update situation options
        const situationSelect = document.getElementById('situation');
        if (situationSelect) {
            situationSelect.innerHTML = `
                <option value="date">${t.situationDate}</option>
                <option value="friends">${t.situationFriends}</option>
                <option value="couple">${t.situationCouple}</option>
                <option value="new">${t.situationNew}</option>
            `;
        }
    }

    // Update dashboard page
    if (document.getElementById('welcome-title')) {
        document.getElementById('welcome-title').textContent = t.welcomeTitle;
        document.getElementById('welcome-subtitle').textContent = t.welcomeSubtitle;
        document.getElementById('game1-title').textContent = t.game1Title;
        document.getElementById('game1-desc').textContent = t.game1Desc;
        document.getElementById('game2-title').textContent = t.game2Title;
        document.getElementById('game2-desc').textContent = t.game2Desc;
        document.getElementById('game3-title').textContent = t.game3Title;
        document.getElementById('game3-desc').textContent = t.game3Desc;
        document.getElementById('game4-title').textContent = t.game4Title;
        document.getElementById('game4-desc').textContent = t.game4Desc;
        document.getElementById('game5-title').textContent = t.game5Title;
        document.getElementById('game5-desc').textContent = t.game5Desc;
        document.getElementById('game6-title').textContent = t.game6Title;
        document.getElementById('game6-desc').textContent = t.game6Desc;
        document.getElementById('game7-title').textContent = t.game7Title;
        document.getElementById('game7-desc').textContent = t.game7Desc;
        document.getElementById('game8-title').textContent = t.game8Title;
        document.getElementById('game8-desc').textContent = t.game8Desc;
        
        // Update new games
        if (document.getElementById('game9-title')) {
            document.getElementById('game9-title').textContent = t.game9Title;
            document.getElementById('game9-desc').textContent = t.game9Desc;
            document.getElementById('game10-title').textContent = t.game10Title;
            document.getElementById('game10-desc').textContent = t.game10Desc;
            document.getElementById('game11-title').textContent = t.game11Title;
            document.getElementById('game11-desc').textContent = t.game11Desc;
            document.getElementById('game12-title').textContent = t.game12Title;
            document.getElementById('game12-desc').textContent = t.game12Desc;
        }
    }
}

// Start experience
function startExperience() {
    const name1 = document.getElementById('name1').value.trim();
    const name2 = document.getElementById('name2').value.trim();
    const situation = document.getElementById('situation').value;

    if (!name1 || !name2) {
        alert(userData.language === 'fr' ? 'Veuillez entrer les deux noms' : 'Tanpri antre non yo');
        return;
    }

    userData.name1 = name1;
    userData.name2 = name2;
    userData.situation = situation;
    saveUserData();

    window.location.href = 'dashboard.html';
}

// Go back to previous page
function goBack() {
    if (document.referrer && (document.referrer.includes(window.location.host) || document.referrer.startsWith('file://'))) {
        window.history.back();
    } else {
        // Determine the correct path based on current location
        const currentPath = window.location.pathname;
        if (currentPath.includes('/games/') || currentPath.includes('\\games\\')) {
            window.location.href = '../pages/dashboard.html';
        } else if (currentPath.includes('/pages/') || currentPath.includes('\\pages\\')) {
            window.location.href = '../index.html';
        } else {
            window.location.href = 'index.html';
        }
    }
}

// Open game
function openGame(gamePath) {
    // Check if we're currently in the pages directory
    const currentPath = window.location.pathname;
    const isInPages = currentPath.includes('/pages/') || currentPath.includes('\\pages\\');

    if (gamePath.startsWith('../') || gamePath.startsWith('/')) {
        // Already a full path, use it directly
        window.location.href = gamePath;
    } else if (isInPages) {
        // We're in pages/, need to go up one level then to games
        window.location.href = `../games/${gamePath}.html`;
    } else {
        // We're at root level, go directly to games
        window.location.href = `games/${gamePath}.html`;
    }
}

// Display user names on dashboard
function displayNames() {
    const namesDisplay = document.getElementById('display-names');
    if (namesDisplay && userData.name1 && userData.name2) {
        namesDisplay.textContent = `${userData.name1} & ${userData.name2}`;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
    applyLanguage();
    displayNames();

    // Register Service Worker for offline support
    if ('serviceWorker' in navigator) {
        const currentPath = window.location.pathname;
        let swPath = 'sw.js';
        if (currentPath.includes('/pages/') || currentPath.includes('\\pages\\') || 
            currentPath.includes('/games/') || currentPath.includes('\\games\\')) {
            swPath = '../sw.js';
        }
        navigator.serviceWorker.register(swPath)
            .then(reg => console.log('Service Worker registered with scope:', reg.scope))
            .catch(err => console.error('Service Worker registration failed:', err));
    }
});