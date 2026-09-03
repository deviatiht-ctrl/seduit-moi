const CACHE_NAME = 'seduit-moi-v7';
const ASSETS = [
    './',
    'index.html',
    'pages/intro.html',
    'pages/dashboard.html',
    'pages/online-lobby.html',
    'pages/auth.html',
    'css/style.css?v=2.0',
    'js/main.js?v=2.0',
    'js/icons.js?v=1.0',
    'js/online.js',
    'js/game-online-sync.js',
    'js/chat.js',
    'js/auth-helper.js',
    'js/lib/supabase-config.js',
    'js/games/action-verite.js?v=1.0',
    'js/games/apprend-moi.js?v=1.0',
    'js/games/defis.js?v=1.0',
    'js/games/devinettes.js?v=1.0',
    'js/games/dis-moi.js?v=1.0',
    'js/games/hot.js?v=1.0',
    'js/games/preferences.js?v=1.0',
    'js/games/tictactoe.js?v=1.0',
    'js/games/stickers.js?v=1.0',
    'js/games/meme.js?v=1.0',
    'js/games/dous-mo.js?v=1.0',
    'js/games/contact.js?v=1.0',
    'games/action-verite.html',
    'games/apprend-moi.html',
    'games/defis.html',
    'games/devinettes.html',
    'games/dis-moi.html',
    'games/hot.html',
    'games/preferences.html',
    'games/tictactoe.html',
    'games/stickers.html',
    'games/meme.html',
    'games/dous-mo.html',
    'games/contact.html',
    'images/stickers/love_cat.png',
    'images/stickers/love_kiss.png',
    'images/stickers/playful_wink.png',
    'images/stickers/funny_dog.png',
    'images/memes/blanket_thief.png',
    'images/memes/hungry_partner.png'
];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching assets for v7');
                return cache.addAll(ASSETS).catch(err => console.warn('Cache addAll non-fatal:', err));
            })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) {
                        console.log('Clearing old cache', key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const url = event.request.url;

    // Don't intercept Supabase, CDN or development server scripts
    if (url.includes('supabase.co') || url.includes('jsdelivr.net') || url.includes('unpkg.com') || url.includes('fiveserver')) {
        return;
    }

    // Network-first for HTML navigation requests (so updates appear immediately)
    const isHtml = event.request.mode === 'navigate' || (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html'));
    if (isHtml) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    if (response && response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
                    }
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Cache-first for other static assets
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(event.request).then(response => {
                    if (response && response.status === 200 && response.type === 'basic') {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return response;
                }).catch(() => {
                    // Offline fallback
                });
            })
    );
});
