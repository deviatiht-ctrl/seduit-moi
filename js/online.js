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
        this.myId = null;          // Player ID (for anonymous players)
        this.userId = null;        // User ID (for registered users)
        this.myName = null;
        this.partnerName = null;
        this.isConnected = false;
        this._callbacks = {};
    }

    // ── Init ──────────────────────────────────────────────
    init() {
        try {
            this.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

            // Restore myId from localStorage if already exists, don't regenerate
            const savedPlayerId = localStorage.getItem('seduitMoiPlayerId');
            if (savedPlayerId) {
                this.myId = savedPlayerId;
            } else {
                this.myId = this._getOrCreateId();
            }

            // Check if user is logged in
            const savedUserId = localStorage.getItem('seduitMoiUserId');
            if (savedUserId) {
                this.userId = savedUserId;
            }

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
    async createRoom(hostName, language, situation, gameId = null) {
        let code, tries = 0;

        // Use registered user ID if available, otherwise use player ID
        const hostId = this.userId || this.myId;

        while (tries < 5) {
            code = this.generateCode();
            const { error } = await this.client
                .from('seduis_moi_rooms')
                .insert({
                    code,
                    host_player_id: hostId,
                    host_name: hostName,
                    language: language || 'fr',
                    situation: situation || 'date',
                    game_id: gameId,
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
        localStorage.setItem('seduitMoiGameId', gameId || 'default');
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
    async sendInvitation(receiverId, roomCode, gameId = null) {
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
                game_id: gameId,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // ── SEND GAME INVITATION ───────────────────────────────
    async sendGameInvitation(receiverUsername, roomCode, gameId = null) {
        if (!this.client || !this.myId) return { error: 'not_authenticated' };

        // Find receiver by username
        const { data: receiver, error: findError } = await this.client
            .from('seduis_moi_users')
            .select('id')
            .eq('username', receiverUsername)
            .single();

        if (findError || !receiver) return { error: 'user_not_found' };

        const senderName = localStorage.getItem('seduitMoiDisplayName') || 'Un ami';
        const senderAvatar = localStorage.getItem('seduitMoiAvatar') || '';

        const { data, error } = await this.client
            .from('seduis_moi_invitations')
            .insert({
                room_code: roomCode,
                sender_id: this.myId,
                sender_name: senderName,
                sender_avatar: senderAvatar,
                receiver_id: receiver.id,
                game_id: gameId,
                status: 'pending'
            })
            .select()
            .single();

        if (error) return { error };
        return { data };
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
            .select('code, host_name, guest_name, created_at, game_id')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(10);
        return data || [];
    }

    // ── GET Available Games ───────────────────────────────
    async getAvailableGames() {
        const { data } = await this.client
            .from('seduis_moi_games')
            .select('*')
            .eq('is_active', true)
            .order('game_name');
        return data || [];
    }

    // ── GET Online Users ──────────────────────────────────
    async getOnlineUsers() {
        const { data } = await this.client
            .from('seduis_moi_users')
            .select('id, username, display_name, avatar_url, is_online, last_seen')
            .eq('is_online', true)
            .order('last_seen', { ascending: false })
            .limit(20);
        return data || [];
    }

    // ── USER REGISTRATION ─────────────────────────────────
    async registerUser(email, username, password, displayName = null) {
        if (!this.client) return { error: 'client_not_initialized' };

        const passwordHash = btoa(password); // Simple base64 for demo

        const { data, error } = await this.client
            .from('seduis_moi_users')
            .insert({
                email,
                username,
                password_hash: passwordHash,
                display_name: displayName || username
            })
            .select()
            .single();

        if (error) return { error };

        this.userId = data.id;
        localStorage.setItem('seduitMoiUserId', data.id);
        localStorage.setItem('seduitMoiUsername', data.username);
        localStorage.setItem('seduitMoiDisplayName', data.display_name);

        return { data };
    }

    // ── USER LOGIN ───────────────────────────────────────
    async loginUser(email, password) {
        if (!this.client) return { error: 'client_not_initialized' };

        const passwordHash = btoa(password);

        const { data, error } = await this.client
            .from('seduis_moi_users')
            .select('*')
            .eq('email', email)
            .eq('password_hash', passwordHash)
            .single();

        if (error) return { error };

        await this.updateUserOnlineStatus(true);

        this.userId = data.id;
        localStorage.setItem('seduitMoiUserId', data.id);
        localStorage.setItem('seduitMoiUsername', data.username);
        localStorage.setItem('seduitMoiDisplayName', data.display_name);
        localStorage.setItem('seduitMoiAvatar', data.avatar_url || '');

        return { data };
    }

    // ── USER LOGOUT ───────────────────────────────────────
    async logoutUser() {
        if (this.userId) {
            await this.updateUserOnlineStatus(false);
        }

        localStorage.removeItem('seduitMoiUserId');
        localStorage.removeItem('seduitMoiUsername');
        localStorage.removeItem('seduitMoiDisplayName');
        localStorage.removeItem('seduitMoiAvatar');

        this.userId = null;
    }

    // ── GET CURRENT USER ─────────────────────────────────
    getCurrentUser() {
        const userId = localStorage.getItem('seduitMoiUserId');
        const username = localStorage.getItem('seduitMoiUsername');
        const displayName = localStorage.getItem('seduitMoiDisplayName');
        const avatar = localStorage.getItem('seduitMoiAvatar');

        if (userId) {
            return {
                id: userId,
                username,
                display_name: displayName,
                avatar_url: avatar,
                is_registered: true
            };
        }

        return {
            id: this.myId,
            display_name: localStorage.getItem('seduitMoiName') || 'Joueur',
            is_registered: false
        };
    }

    // ── UPDATE User Online Status ─────────────────────────
    async updateUserOnlineStatus(isOnline) {
        if (!this.client || !this.userId) return;

        const { error } = await this.client
            .from('seduis_moi_users')
            .update({
                is_online: isOnline,
                last_seen: new Date().toISOString()
            })
            .eq('id', this.userId);

        if (error) console.warn('[SeduitOnline] Failed to update online status:', error);
    }

    // ── GET USER INVITATIONS ─────────────────────────────
    async getUserInvitations() {
        if (!this.client || !this.myId) return [];

        const { data } = await this.client
            .from('seduis_moi_invitations')
            .select('*')
            .eq('receiver_id', this.myId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        return data || [];
    }

    // ── RESPOND TO INVITATION ────────────────────────────
    async respondToInvitation(invitationId, response) {
        if (!this.client) return { error: 'client_not_initialized' };

        const { data, error } = await this.client
            .from('seduis_moi_invitations')
            .update({ status: response })
            .eq('id', invitationId)
            .select()
            .single();

        if (error) return { error };

        if (response === 'accepted' && data.room_code) {
            const currentUser = this.getCurrentUser();
            await this.joinRoom(data.room_code, currentUser?.display_name || 'Joueur');
        }

        return { data };
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
