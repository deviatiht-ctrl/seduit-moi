// ============================================================
// GAME-ONLINE-SYNC.JS — Shared online sync module for all games
// Included in every game HTML in online mode.
// ============================================================

(function () {
    // Detect room from URL
    const params = new URLSearchParams(window.location.search);
    const roomCode = params.get('room') || localStorage.getItem('seduitMoiRoom');
    const myRole = localStorage.getItem('seduitMoiRole'); // 'host' | 'guest'

    window._onlineMode = !!roomCode;
    window._onlineRoomCode = roomCode;
    window._myOnlineRole = myRole;

    if (!window._onlineMode) return; // nothing to do for local mode

    // ── Notify partner UI box ─────────────────────────────────
    function injectOnlineBanner() {
        const lang = (window.userData && window.userData.language) || 'fr';
        const myName = localStorage.getItem('seduitMoiName') || (lang === 'fr' ? 'Vous' : 'Ou');
        const data = JSON.parse(localStorage.getItem('seduitMoiData') || '{}');
        const partnerName = (myRole === 'host') ? data.name2 : data.name1;

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
                ${partnerName ? partnerName : (lang === 'fr' ? 'En attente...' : 'Ap tann...')}
            </span>
            <div style="margin-left:auto;display:flex;gap:8px;">
                <span id="_online_sync_dot" style="color:#22c55e;font-size:0.75rem;">● sync</span>
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
    window.addEventListener('load', function () {
        if (!window.seduitOnline) {
            console.warn('[GameSync] seduitOnline not available yet, retrying...');
            setTimeout(() => {
                if (window.seduitOnline) initOnlineSync();
            }, 500);
            return;
        }
        initOnlineSync();
    });

    function initOnlineSync() {
        const so = window.seduitOnline;

        // If already connected to same room, don't re-subscribe
        if (so.roomChannel && so.roomCode === roomCode && so.isConnected) {
            console.log('[GameSync] Already connected to room', roomCode);
            injectOnlineBanner();
            return;
        }

        // Disconnect old channel if switching rooms
        if (so.roomChannel && so.roomCode !== roomCode) {
            console.log('[GameSync] Disconnecting from old room', so.roomCode);
            so.disconnect().catch(() => {});
        }

        so.init();
        so.myRole = myRole;
        so.roomCode = roomCode;
        so.myName = localStorage.getItem('seduitMoiName') || '';
        so.myId = localStorage.getItem('seduitMoiPlayerId') || so._getOrCreateId();

        injectOnlineBanner();

        // Determine game ID from URL path
        const path = window.location.pathname;
        const gameId = path.split('/').pop().replace('.html', '');

        so.subscribeToRoom(roomCode, {
            onGameState: function ({ state, from, gameId: gId }) {
                // Only apply state from partner
                if (from === myRole) return;

                // Flash sync indicator
                const dot = document.getElementById('_online_sync_dot');
                if (dot) { dot.style.color = '#f59e0b'; setTimeout(() => dot.style.color = '#22c55e', 400); }

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

            onPartnerJoined: function (presences) {
                const el = document.getElementById('_online_partner_status');
                const lang = (window.userData && window.userData.language) || 'fr';
                const name = presences[0] && presences[0].name;
                if (el) el.textContent = name ? `${name} (Connecté)` : (lang === 'fr' ? 'Connecté' : 'Konekte');
                if (el) el.style.color = '#22c55e';
            },

            onPartnerLeft: function () {
                const el = document.getElementById('_online_partner_status');
                const lang = (window.userData && window.userData.language) || 'fr';
                if (el) el.textContent = lang === 'fr' ? 'Partenaire déconnecté' : 'Patnè dekonekte';
                if (el) el.style.color = '#f59e0b';
            },

            onConnected: function () {
                const dot = document.getElementById('_online_sync_dot');
                if (dot) dot.style.color = '#22c55e';
            }
        });

        // Re-track presence after a delay to ensure visibility
        setTimeout(async () => {
            if (so.roomChannel && so.isConnected) {
                try {
                    await so.roomChannel.track({
                        player_id: so.myId,
                        role: myRole,
                        name: so.myName || 'Joueur',
                        joined_at: new Date().toISOString(),
                        game: gameId
                    });
                    console.log('[GameSync] Re-tracked presence');
                } catch(e) {
                    console.warn('[GameSync] Re-track failed:', e);
                }
            }
        }, 1500);
    }

    // ── broadcastState helper for game files to call ──────────
    window._broadcastGameState = async function (gameId, state) {
        if (!window._onlineMode || !window.seduitOnline) return;
        await window.seduitOnline.broadcastState(gameId, state);
    };
})();
