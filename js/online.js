// ============================================================
// ONLINE.JS - Seduit Moi Online Multiplayer Engine
// Supabase Realtime: Broadcast + Presence
// ============================================================

class SeduitMoiOnline {
    constructor() {
        this.client = null;
        this.roomChannel = null;
        this.globalChannel = null;
        this.roomCode = null;
        this.myRole = null;        // 'host' | 'guest'
        this.myId = null;
        this.myName = null;
        this.partnerName = null;
        this.isConnected = false;
        this._callbacks = {};
    }

    // ── Init ──────────────────────────────────────────────
    init() {
        try {
            this.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            this.myId = this._getOrCreateId();
            return true;
        } catch(e) {
            console.error('[SeduitOnline] init failed:', e);
            return false;
        }
    }

    _getOrCreateId() {
        let id = localStorage.getItem('seduitMoiPlayerId');
        if (!id) {
            id = 'p_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
            localStorage.setItem('seduitMoiPlayerId', id);
        }
        return id;
    }

    // ── Room Code ─────────────────────────────────────────
    generateCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        return Array.from({length: 6}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    }

    // ── CREATE Room ───────────────────────────────────────
    async createRoom(hostName, language, situation) {
        let code, tries = 0;
        while (tries < 5) {
            code = this.generateCode();
            const { error } = await this.client
                .from('seduis_moi_rooms')
                .insert({
                    code,
                    host_player_id: this.myId,
                    host_name: hostName,
                    language: language || 'fr',
                    situation: situation || 'date',
                    is_active: true
                });
            if (!error) break;
            tries++;
        }
        if (tries >= 5) throw new Error('Could not create room');

        this.roomCode = code;
        this.myRole = 'host';
        this.myName = hostName;
        localStorage.setItem('seduitMoiRoom', code);
        localStorage.setItem('seduitMoiRole', 'host');
        localStorage.setItem('seduitMoiName', hostName);
        return code;
    }

    // ── JOIN Room ─────────────────────────────────────────
    async joinRoom(code, guestName) {
        code = code.trim().toUpperCase();

        // Fetch room
        const { data: room, error: selectError } = await this.client
            .from('seduis_moi_rooms')
            .select('*')
            .eq('code', code)
            .eq('is_active', true)
            .single();

        if (selectError || !room) throw new Error('room_not_found');

        // Case A: You are the Host of this room
        if (room.host_player_id === this.myId) {
            this.roomCode = code;
            this.myRole = 'host';
            this.myName = guestName || room.host_name;
            this.partnerName = room.guest_name || '';
            localStorage.setItem('seduitMoiRoom', code);
            localStorage.setItem('seduitMoiRole', 'host');
            localStorage.setItem('seduitMoiName', this.myName);

            // Update host_name if provided
            if (guestName && guestName !== room.host_name) {
                await this.client
                    .from('seduis_moi_rooms')
                    .update({ host_name: guestName })
                    .eq('code', code);
            }
            return room;
        }

        // Case B: You are ALREADY the registered Guest of this room
        if (room.guest_player_id === this.myId) {
            this.roomCode = code;
            this.myRole = 'guest';
            this.myName = guestName || room.guest_name;
            this.partnerName = room.host_name || '';
            localStorage.setItem('seduitMoiRoom', code);
            localStorage.setItem('seduitMoiRole', 'guest');
            localStorage.setItem('seduitMoiName', this.myName);

            if (guestName && guestName !== room.guest_name) {
                await this.client
                    .from('seduis_moi_rooms')
                    .update({ guest_name: guestName })
                    .eq('code', code);
            }

            const savedData = localStorage.getItem('seduitMoiData');
            if (savedData) {
                const d = JSON.parse(savedData);
                d.name1 = room.host_name;
                d.name2 = this.myName;
                d.language = room.language || 'fr';
                d.situation = room.situation || 'date';
                localStorage.setItem('seduitMoiData', JSON.stringify(d));
            }
            return room;
        }

        // Case C: Room is open for a new Guest
        if (!room.guest_player_id || room.guest_player_id === '' || room.guest_player_id === this.myId) {
            const { error: updateError } = await this.client
                .from('seduis_moi_rooms')
                .update({ guest_player_id: this.myId, guest_name: guestName })
                .eq('code', code);

            if (updateError) throw new Error('join_failed');

            this.roomCode = code;
            this.myRole = 'guest';
            this.myName = guestName;
            this.partnerName = room.host_name;
            localStorage.setItem('seduitMoiRoom', code);
            localStorage.setItem('seduitMoiRole', 'guest');
            localStorage.setItem('seduitMoiName', guestName);

            // Save partner info to userData
            const savedData = localStorage.getItem('seduitMoiData');
            if (savedData) {
                const d = JSON.parse(savedData);
                d.name1 = room.host_name;
                d.name2 = guestName;
                d.language = room.language || 'fr';
                d.situation = room.situation || 'date';
                localStorage.setItem('seduitMoiData', JSON.stringify(d));
            }

            return room;
        }

        // Case D: Room already has a different guest
        throw new Error('room_full');
    }

    // ── SUBSCRIBE to Room Channel ─────────────────────────
    subscribeToRoom(roomCode, callbacks) {
        this.roomCode = roomCode;
        this._callbacks = callbacks || {};

        const channel = this.client.channel(`seduit-room-${roomCode}`, {
            config: { presence: { key: this.myId } }
        });

        // Listen for game state from partner
        channel.on('broadcast', { event: 'game_state' }, ({ payload }) => {
            if (payload.from !== this.myRole && this._callbacks.onGameState) {
                this._callbacks.onGameState(payload);
            }
        });

        // Listen for room events (partner joined, etc.)
        channel.on('broadcast', { event: 'room_event' }, ({ payload }) => {
            if (this._callbacks.onRoomEvent) {
                this._callbacks.onRoomEvent(payload);
            }
        });

        // Presence: track who's in the room
        channel.on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState();
            const players = Object.values(state).flat();
            if (this._callbacks.onPresenceSync) {
                this._callbacks.onPresenceSync(players);
            }
        });

        channel.on('presence', { event: 'join' }, ({ newPresences }) => {
            if (this._callbacks.onPartnerJoined) {
                this._callbacks.onPartnerJoined(newPresences);
            }
        });

        channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
            if (this._callbacks.onPartnerLeft) {
                this._callbacks.onPartnerLeft(leftPresences);
            }
        });

        channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                this.isConnected = true;
                await channel.track({
                    player_id: this.myId,
                    role: this.myRole,
                    name: this.myName || localStorage.getItem('seduitMoiName') || 'Joueur',
                    joined_at: new Date().toISOString()
                });
                if (this._callbacks.onConnected) this._callbacks.onConnected();
            }
        });

        this.roomChannel = channel;
        return channel;
    }

    // ── BROADCAST Game State ──────────────────────────────
    async broadcastState(gameId, state) {
        if (!this.roomChannel || !this.isConnected) return;
        try {
            await this.roomChannel.send({
                type: 'broadcast',
                event: 'game_state',
                payload: {
                    gameId,
                    state,
                    from: this.myRole,
                    ts: Date.now()
                }
            });
        } catch(e) {
            console.warn('[SeduitOnline] broadcast failed:', e);
        }
    }

    // ── BROADCAST Room Event ──────────────────────────────
    async broadcastRoomEvent(type, data) {
        if (!this.roomChannel) return;
        await this.roomChannel.send({
            type: 'broadcast',
            event: 'room_event',
            payload: { type, data, from: this.myRole }
        });
    }

    // ── GLOBAL PRESENCE (who's online on the site) ────────
    subscribeToGlobalPresence(onUpdate) {
        const channel = this.client.channel('seduit-global-presence', {
            config: { presence: { key: this.myId } }
        });

        channel.on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState();
            const online = Object.values(state).flat();
            if (onUpdate) onUpdate(online);
        });

        channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.track({
                    player_id: this.myId,
                    name: localStorage.getItem('seduitMoiName') || '?',
                    room: this.roomCode || null,
                    since: new Date().toISOString()
                });
            }
        });

        this.globalChannel = channel;
        return channel;
    }

    // ── SEND INVITATION DIRECTLY ──────────────────────────────
    async sendInvitation(receiverId, roomCode) {
        if (!this.client) return;
        const senderName = localStorage.getItem('seduitMoiName') || 'Un ami';
        const senderAvatar = localStorage.getItem('seduitMoiAvatar') || '';

        const { data, error } = await this.client
            .from('seduis_moi_invitations')
            .insert({
                room_code: roomCode,
                sender_id: this.myId,
                sender_name: senderName,
                sender_avatar: senderAvatar,
                receiver_id: receiverId,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // ── LISTEN FOR LIVE INVITATIONS ───────────────────────────
    listenForInvitations(onInviteReceived) {
        if (!this.client || !this.myId) return;

        this.client.channel(`invites-${this.myId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'seduis_moi_invitations',
                filter: `receiver_id=eq.${this.myId}`
            }, (payload) => {
                if (payload.new && payload.new.status === 'pending') {
                    if (onInviteReceived) onInviteReceived(payload.new);
                }
            })
            .subscribe();
    }

    // ── GET Active Rooms ──────────────────────────────────
    async getActiveRooms() {
        const { data } = await this.client
            .from('seduis_moi_rooms')
            .select('code, host_name, guest_name, created_at')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(10);
        return data || [];
    }

    // ── WATCH room for guest joining ──────────────────────
    async watchForGuest(roomCode, onGuestJoined) {
        if (!this.client) this.init();

        // 1. Immediate check in case guest is already connected
        try {
            const { data: currentRoom } = await this.client
                .from('seduis_moi_rooms')
                .select('*')
                .eq('code', roomCode)
                .single();

            if (currentRoom && currentRoom.guest_name && currentRoom.guest_name.trim() !== '') {
                onGuestJoined(currentRoom);
            }
        } catch(e) {
            console.warn('Initial room check error:', e);
        }

        // 2. Realtime listener for when guest updates the room
        const sub = this.client
            .channel(`watch-${roomCode}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'seduis_moi_rooms',
                filter: `code=eq.${roomCode}`
            }, (payload) => {
                if (payload.new && payload.new.guest_name && payload.new.guest_name.trim() !== '') {
                    onGuestJoined(payload.new);
                }
            })
            .subscribe();
        return sub;
    }

    // ── CLEANUP ───────────────────────────────────────────
    async disconnect() {
        if (this.roomChannel) {
            await this.client.removeChannel(this.roomChannel);
            this.roomChannel = null;
        }
        if (this.globalChannel) {
            await this.client.removeChannel(this.globalChannel);
            this.globalChannel = null;
        }
        this.isConnected = false;
    }

    // ── UTILS ─────────────────────────────────────────────
    isHost() { return this.myRole === 'host'; }
    isGuest() { return this.myRole === 'guest'; }

    getRoomFromURL() {
        return new URLSearchParams(window.location.search).get('room');
    }
    getRoomFromStorage() {
        return localStorage.getItem('seduitMoiRoom');
    }
    getRoleFromStorage() {
        return localStorage.getItem('seduitMoiRole');
    }
    clearRoom() {
        localStorage.removeItem('seduitMoiRoom');
        localStorage.removeItem('seduitMoiRole');
    }
}

// ── Global Singleton ──────────────────────────────────────
window.seduitOnline = new SeduitMoiOnline();

// ── Online Mode Detection Helper ──────────────────────────
window._onlineRoomCode = new URLSearchParams(window.location.search).get('room') 
                         || localStorage.getItem('seduitMoiRoom');
window._onlineMode = !!window._onlineRoomCode;
window._myOnlineRole = localStorage.getItem('seduitMoiRole'); // 'host' | 'guest'
