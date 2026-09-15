// ============================================================
// GAME-ONLINE-SYNC.JS — Shared online sync module for all games
// Included in every game HTML in online mode.
// ============================================================

(function () {
    // Detect room from URL
    const params = new URLSearchParams(window.location.search);
    const roomCode = params.get('room') || localStorage.getItem('seduitMoiRoom');
    let myRole = localStorage.getItem('seduitMoiRole'); // 'host' | 'guest'

    window._onlineMode = !!roomCode;
    window._onlineRoomCode = roomCode;
    window._myOnlineRole = myRole;

    if (!window._onlineMode) return; // nothing to do for local mode

    // ── Notify partner UI box ─────────────────────────────────
    function injectOnlineBanner() {
        const lang = (window.userData && window.userData.language) || 'fr';

        const banner = document.createElement('div');
        banner.id = 'online-game-banner';
        banner.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
            background: linear-gradient(90deg, rgba(30,30,30,0.95) 0%, rgba(50,10,10,0.95) 100%);
            padding: 8px 16px; display: flex; align-items: center; gap: 12px;
            border-bottom: 1px solid rgba(220,38,38,0.4); font-size: 0.85rem;
            backdrop-filter: blur(10px);
        `;
        banner.innerHTML = `
            <div style="width:8px;height:8px;border-radius:50%;background:#22c55e;animation:smPulse 1.4s infinite;flex-shrink:0;"></div>
            <span style="color:#ef4444;font-weight:700;letter-spacing:1px;">ROOM ${roomCode}</span>
            <span id="_online_partner_status" style="color:#aaa;font-size:0.8rem;">
                ${lang === 'fr' ? 'En attente...' : 'Ap tann...'}
            </span>
            <div style="margin-left:auto;display:flex;gap:8px;">
                <span id="_online_sync_dot" style="color:#aaa;font-size:0.75rem;">${lang === 'fr' ? 'Connexion...' : 'Koneksyon...'}</span>
            </div>
        `;
        document.body.prepend(banner);

        // Adjust body padding
        document.body.style.paddingTop = '38px';

        // Add pulse keyframe
        const style = document.createElement('style');
        style.textContent = `@keyframes smPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`;
        document.head.appendChild(style);
    }

    // ── Initialize online sync after game loads ───────────────
    window.addEventListener('load', async function () {
        injectOnlineBanner();
        try {
            if (!window.seduitOnline) {
                console.warn('[GameSync] seduitOnline not available yet, retrying...');
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            if (!window.seduitOnline) throw new Error('online_unavailable');
            await initOnlineSync();
        } catch (error) {
            console.error('[GameSync] Initialization failed:', error);
            const dot = document.getElementById('_online_sync_dot');
            const lang = (window.userData && window.userData.language) || 'fr';
            if (dot) {
                dot.textContent = lang === 'fr' ? 'Votre connexion est indisponible' : 'Koneksyon ou pa disponib';
                dot.style.color = '#f59e0b';
            }
        }
    });

    async function initOnlineSync() {
        const so = window.seduitOnline;

        // Always disconnect old channel before subscribing on a new page
        if (so.roomChannel) {
            console.log('[GameSync] Disconnecting from old room', so.roomCode);
            try { await so.disconnect(); } catch(e) {}
        }

        so.init();
        await so.joinRoom(roomCode, localStorage.getItem('seduitMoiName') || '');
        myRole = so.myRole;
        window._myOnlineRole = myRole;
        let partnerLeftTimeout = null;
        let connectionAvailable = true;
        const lang = (window.userData && window.userData.language) || 'fr';
        const updateConnectionStatus = function (status) {
            connectionAvailable = status === 'SUBSCRIBED';
            const dot = document.getElementById('_online_sync_dot');
            if (dot) {
                dot.textContent = connectionAvailable ? '● sync' : (lang === 'fr' ? 'Votre connexion est indisponible' : 'Koneksyon ou pa disponib');
                dot.style.color = connectionAvailable ? '#22c55e' : '#f59e0b';
            }
            if (!connectionAvailable) {
                clearTimeout(partnerLeftTimeout);
                partnerLeftTimeout = null;
                const el = document.getElementById('_online_partner_status');
                if (el) {
                    el.textContent = lang === 'fr' ? 'En attente...' : 'Ap tann...';
                    el.style.color = '#aaa';
                }
            }
        };

        // Determine game ID from URL path
        const path = window.location.pathname;
        const gameId = path.split('/').pop().replace('.html', '');

        await so.subscribeToRoom(roomCode, {
            onGameState: function ({ state, from, gameId: gId }) {
                // Only apply state from partner
                if (from === myRole || gId !== gameId) return;

                // Flash sync indicator
                const dot = document.getElementById('_online_sync_dot');
                if (dot && connectionAvailable) { dot.style.color = '#f59e0b'; setTimeout(() => { if (connectionAvailable) dot.style.color = '#22c55e'; }, 400); }

                // Apply game state
                if (window.gameState !== undefined) {
                    window.gameState = state;

                    // Trigger render functions across games
                    if (typeof window.updateBoard === 'function') try { window.updateBoard(); } catch(e) {}
                    if (typeof window.showMeme === 'function') try { window.showMeme(); } catch(e) {}
                    if (typeof window.showQuestion === 'function') try { window.showQuestion(); } catch(e) {}
                    if (typeof window.showPrompt === 'function') try { window.showPrompt(); } catch(e) {}
                    if (typeof window.updateScores === 'function') try { window.updateScores(); } catch(e) {}
                    if (typeof window.updateUI === 'function') try { window.updateUI(); } catch(e) {}
                }
            },

            onPresenceSync: function (presences) {
                if (!connectionAvailable) return;
                const el = document.getElementById('_online_partner_status');
                const oppositeRole = myRole === 'host' ? 'guest' : 'host';
                const partner = presences.find(player => player.role === oppositeRole && player.player_id && player.player_id !== so.myId);
                if (partner) {
                    clearTimeout(partnerLeftTimeout);
                    partnerLeftTimeout = null;
                    const connected = lang === 'fr' ? 'Connecté' : 'Konekte';
                    if (el) {
                        el.textContent = partner.name ? `${partner.name} (${connected})` : connected;
                        el.style.color = '#22c55e';
                    }
                } else if (partnerLeftTimeout === null) {
                    partnerLeftTimeout = setTimeout(() => {
                        partnerLeftTimeout = null;
                        if (!connectionAvailable) return;
                        if (el) {
                            el.textContent = lang === 'fr' ? 'Partenaire déconnecté' : 'Patnè dekonekte';
                            el.style.color = '#f59e0b';
                        }
                    }, 4000);
                }
            },

            onConnectionStatus: updateConnectionStatus,

            onConnected: function () {
                updateConnectionStatus('SUBSCRIBED');
            },

            onHostNavigation: function (url) {
                console.log('[GameSync] Following host to:', url);
                if (myRole === 'guest' && url) {
                    so.followHostNavigation(url);
                }
            }
        });

        // Re-track presence after a delay to ensure visibility
        if (myRole === 'guest') await so.watchRoomGame(roomCode);
    }

    // ── broadcastState helper for game files to call ──────────
    window._broadcastGameState = async function (gameId, state) {
        if (!window._onlineMode || !window.seduitOnline) return;
        await window.seduitOnline.broadcastState(gameId, state);
    };
})();
