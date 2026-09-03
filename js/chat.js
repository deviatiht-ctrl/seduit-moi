// ============================================================
// CHAT.JS — Seduit Moi Realtime Chat & Host Sync Engine
// Persistent WhatsApp-style chat drawer across all online pages
// ============================================================

class SeduitMoiChat {
    constructor() {
        this.isOpen = false;
        this.unreadCount = 0;
        this.messages = [];
        this.roomCode = null;
        this.myRole = null;
        this.myId = null;
        this.myName = null;
        this.partnerName = null;
        this.client = null;
        this.channel = null;
    }

    init() {
        const roomCode = new URLSearchParams(window.location.search).get('room')
                        || localStorage.getItem('seduitMoiRoom');
        if (!roomCode) return; // Only active in online mode

        this.roomCode = roomCode;
        this.myRole = localStorage.getItem('seduitMoiRole') || 'host';
        this.myId = localStorage.getItem('seduitMoiPlayerId') || 'p_anon';
        this.myName = localStorage.getItem('seduitMoiName') || 'Moi';

        const data = JSON.parse(localStorage.getItem('seduitMoiData') || '{}');
        this.partnerName = (this.myRole === 'host') ? (data.name2 || 'Patnè') : (data.name1 || 'Patnè');

        if (window.supabase && typeof window.supabase.createClient === 'function') {
            this.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        }

        this.injectUI();
        this.loadMessageHistory();
        this.subscribeRealtime();
        this.listenHostNavigation();
    }

    // ── Inject Floating Chat Trigger & Drawer ──────────────────
    injectUI() {
        if (document.getElementById('sm-chat-trigger')) return;

        // Add CSS styles for chat drawer
        const style = document.createElement('style');
        style.textContent = `
            #sm-chat-trigger {
                position: fixed; bottom: 24px; right: 24px; z-index: 10000;
                width: 56px; height: 56px; border-radius: 50%;
                background: linear-gradient(135deg, #dc2626, #991b1b);
                color: white; border: none; box-shadow: 0 8px 24px rgba(220,38,38,0.5);
                cursor: pointer; display: flex; align-items: center; justify-content: center;
                transition: transform 0.25s, box-shadow 0.25s;
            }
            #sm-chat-trigger:hover { transform: scale(1.08); box-shadow: 0 10px 28px rgba(220,38,38,0.6); }
            #sm-chat-badge {
                position: absolute; top: -2px; right: -2px;
                background: #22c55e; color: white; font-size: 0.75rem; font-weight: 800;
                min-width: 20px; height: 20px; border-radius: 10px; padding: 0 6px;
                display: none; align-items: center; justify-content: center; border: 2px solid var(--background);
            }

            #sm-chat-drawer {
                position: fixed; bottom: 90px; right: 24px; z-index: 10001;
                width: 360px; max-width: calc(100vw - 32px); height: 480px; max-height: calc(100vh - 120px);
                background: var(--surface, #1e1e24); border: 1px solid var(--surface-light, #2a2a32);
                border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.6);
                display: flex; flex-direction: column; overflow: hidden;
                transform: translateY(20px) scale(0.95); opacity: 0; pointer-events: none;
                transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
            }
            #sm-chat-drawer.active { transform: translateY(0) scale(1); opacity: 1; pointer-events: auto; }

            .sm-chat-header {
                padding: 14px 18px; background: rgba(0,0,0,0.3); border-bottom: 1px solid var(--surface-light, #2a2a32);
                display: flex; align-items: center; justify-content: space-between;
            }
            .sm-chat-header .title-wrap { display: flex; align-items: center; gap: 10px; }
            .sm-chat-header .p-avatar {
                width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, #dc2626, #991b1b);
                display: flex; align-items: center; justify-content: center; font-weight: 700; color: white; font-size: 0.9rem;
            }
            .sm-chat-header .p-name { font-weight: 700; font-size: 0.95rem; }
            .sm-chat-header .p-status { font-size: 0.75rem; color: #22c55e; }
            .sm-chat-close { background: none; border: none; color: var(--text-muted, #aaa); cursor: pointer; padding: 4px; border-radius: 6px; }
            .sm-chat-close:hover { color: white; background: rgba(255,255,255,0.1); }

            .sm-chat-messages {
                flex: 1; padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px;
                scroll-behavior: smooth;
            }
            .sm-msg { max-width: 80%; padding: 10px 14px; border-radius: 16px; font-size: 0.9rem; line-height: 1.4; word-break: break-word; }
            .sm-msg.sent {
                align-self: flex-end; background: linear-gradient(135deg, #dc2626, #991b1b); color: white;
                border-bottom-right-radius: 4px;
            }
            .sm-msg.received {
                align-self: flex-start; background: var(--background, #121216); color: var(--text, #eee);
                border: 1px solid var(--surface-light, #2a2a32); border-bottom-left-radius: 4px;
            }
            .sm-msg-time { font-size: 0.68rem; opacity: 0.7; margin-top: 4px; text-align: right; }

            .sm-chat-input-row {
                padding: 12px; background: rgba(0,0,0,0.2); border-top: 1px solid var(--surface-light, #2a2a32);
                display: flex; gap: 8px; align-items: center;
            }
            .sm-chat-input {
                flex: 1; padding: 10px 14px; background: var(--background, #121216); border: 1px solid var(--surface-light, #2a2a32);
                border-radius: 20px; color: var(--text, #fff); font-size: 0.9rem; transition: border-color 0.2s;
            }
            .sm-chat-input:focus { outline: none; border-color: #dc2626; }
            .sm-chat-send {
                width: 38px; height: 38px; border-radius: 50%; background: #dc2626; color: white; border: none;
                display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: background 0.2s;
            }
            .sm-chat-send:hover { background: #b91c1c; }
        `;
        document.head.appendChild(style);

        // Inject Trigger Button
        const trigger = document.createElement('button');
        trigger.id = 'sm-chat-trigger';
        trigger.setAttribute('aria-label', 'Chat');
        trigger.innerHTML = `
            <i data-icon="message-circle" style="width:26px;height:26px;"></i>
            <span id="sm-chat-badge">0</span>
        `;
        trigger.onclick = () => this.toggleDrawer();
        document.body.appendChild(trigger);

        // Inject Drawer Modal
        const drawer = document.createElement('div');
        drawer.id = 'sm-chat-drawer';
        drawer.innerHTML = `
            <div class="sm-chat-header">
                <div class="title-wrap">
                    <div class="p-avatar">${(this.partnerName || '?')[0].toUpperCase()}</div>
                    <div>
                        <div class="p-name">${this.partnerName || 'Patnè'}</div>
                        <div class="p-status">En ligne</div>
                    </div>
                </div>
                <button class="sm-chat-close" onclick="window.seduitChat.toggleDrawer()"><i data-icon="x"></i></button>
            </div>
            <div class="sm-chat-messages" id="sm-chat-list">
                <p style="text-align:center; color:var(--text-muted,#aaa); font-size:0.8rem; margin:auto;">Chargement des messages...</p>
            </div>
            <div class="sm-chat-input-row">
                <input class="sm-chat-input" id="sm-chat-input" placeholder="Écrivez un message..." maxlength="500" onkeydown="if(event.key==='Enter') window.seduitChat.sendMessage()">
                <button class="sm-chat-send" onclick="window.seduitChat.sendMessage()"><i data-icon="send" style="width:18px;height:18px;"></i></button>
            </div>
        `;
        document.body.appendChild(drawer);

        if (typeof createIcons === 'function') createIcons();
    }

    toggleDrawer() {
        this.isOpen = !this.isOpen;
        const drawer = document.getElementById('sm-chat-drawer');
        if (drawer) drawer.classList.toggle('active', this.isOpen);

        if (this.isOpen) {
            this.unreadCount = 0;
            this.updateBadge();
            this.scrollToBottom();
            const input = document.getElementById('sm-chat-input');
            if (input) input.focus();
        }
    }

    updateBadge() {
        const badge = document.getElementById('sm-chat-badge');
        if (!badge) return;
        if (this.unreadCount > 0) {
            badge.textContent = this.unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }

    // ── Load Past Messages from Supabase ─────────────────────
    async loadMessageHistory() {
        if (!this.client) return;
        try {
            const { data, error } = await this.client
                .from('seduis_moi_messages')
                .select('*')
                .eq('room_code', this.roomCode)
                .order('created_at', { ascending: true })
                .limit(50);

            if (!error && data) {
                this.messages = data;
                this.renderMessages();
            }
        } catch(e) {
            console.warn('[SeduitChat] Load history error:', e);
        }
    }

    // ── Subscribe to Realtime Messages ────────────────────────
    subscribeRealtime() {
        if (!this.client) return;

        // 1. Broadcast channel listener for instant speed
        const roomChan = window.seduitOnline && window.seduitOnline.roomChannel;
        if (roomChan) {
            roomChan.on('broadcast', { event: 'chat_msg' }, ({ payload }) => {
                if (payload.sender_id !== this.myId) {
                    this.onMessageReceived(payload);
                }
            });
        }

        // 2. Postgres Changes listener as persistent backup
        this.client.channel(`chat-${this.roomCode}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'seduis_moi_messages',
                filter: `room_code=eq.${this.roomCode}`
            }, (payload) => {
                const msg = payload.new;
                if (msg.sender_id !== this.myId) {
                    // Check if already in list to avoid duplicates
                    if (!this.messages.some(m => m.id === msg.id)) {
                        this.onMessageReceived(msg);
                    }
                }
            })
            .subscribe();
    }

    // ── Send Message ──────────────────────────────────────────
    async sendMessage() {
        const input = document.getElementById('sm-chat-input');
        if (!input) return;
        const text = input.value.trim();
        if (!text) return;

        input.value = '';

        const newMsg = {
            room_code: this.roomCode,
            sender_id: this.myId,
            sender_name: this.myName,
            sender_role: this.myRole,
            content: text,
            created_at: new Date().toISOString()
        };

        // Add to local state and UI immediately
        this.messages.push(newMsg);
        this.renderMessages();
        this.scrollToBottom();

        // 1. Broadcast via Realtime Broadcast
        if (window.seduitOnline && window.seduitOnline.roomChannel) {
            window.seduitOnline.roomChannel.send({
                type: 'broadcast',
                event: 'chat_msg',
                payload: newMsg
            });
        }

        // 2. Insert into Supabase DB for persistence
        if (this.client) {
            await this.client.from('seduis_moi_messages').insert(newMsg);
        }
    }

    onMessageReceived(msg) {
        this.messages.push(msg);
        this.renderMessages();

        if (!this.isOpen) {
            this.unreadCount++;
            this.updateBadge();
        } else {
            this.scrollToBottom();
        }
    }

    renderMessages() {
        const list = document.getElementById('sm-chat-list');
        if (!list) return;

        if (this.messages.length === 0) {
            const lang = (userData && userData.language) || 'fr';
            list.innerHTML = `<p style="text-align:center; color:var(--text-muted,#aaa); font-size:0.8rem; margin:auto;">${lang === 'fr' ? 'Aucun message. Dites bonjour !' : 'Okenn mesaj. Di yon ti bonjou!'}</p>`;
            return;
        }

        list.innerHTML = this.messages.map(m => {
            const isSent = (m.sender_id === this.myId) || (m.sender_role === this.myRole);
            const timeStr = new Date(m.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return `
                <div class="sm-msg ${isSent ? 'sent' : 'received'}">
                    <div>${this.escapeHTML(m.content)}</div>
                    <div class="sm-msg-time">${timeStr}</div>
                </div>`;
        }).join('');

        this.scrollToBottom();
    }

    scrollToBottom() {
        const list = document.getElementById('sm-chat-list');
        if (list) list.scrollTop = list.scrollHeight;
    }

    escapeHTML(str) {
        return (str || '').replace(/[&<>"']/g, match => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[match]);
    }

    // ── HOST NAVIGATION SYNC (Host controls game choice) ──────
    listenHostNavigation() {
        if (!window.seduitOnline) return;

        const roomChan = window.seduitOnline.roomChannel;
        if (roomChan) {
            roomChan.on('broadcast', { event: 'host_navigation' }, ({ payload }) => {
                // If I am Guest, follow Host's navigation!
                if (this.myRole === 'guest' && payload.url) {
                    window.location.href = payload.url;
                }
            });
        }
    }

    // Call this when Host clicks a game card
    broadcastHostNavigation(url) {
        if (this.myRole !== 'host' || !window.seduitOnline || !window.seduitOnline.roomChannel) return;
        window.seduitOnline.roomChannel.send({
            type: 'broadcast',
            event: 'host_navigation',
            payload: { url, from: 'host' }
        });
    }
}

// ── Global Singleton & Auto-Init ──────────────────────────────
window.seduitChat = new SeduitMoiChat();

window.addEventListener('load', function () {
    setTimeout(() => {
        window.seduitChat.init();
    }, 300);
});
