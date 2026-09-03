// ============================================================
// AUTH-HELPER.JS — Seduit Moi Auth & Profile Management
// Supabase Auth (Email + Google OAuth) + Profile Storage
// ============================================================

class SeduitMoiAuth {
    constructor() {
        this.client = null;
        this.currentUser = null;
        this.profile = null;
    }

    init() {
        try {
            this.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            return true;
        } catch(e) {
            console.error('[SeduitAuth] init failed:', e);
            return false;
        }
    }

    // ── Get Current Session ──────────────────────────────────
    async getSession() {
        if (!this.client) this.init();
        const { data: { session }, error } = await this.client.auth.getSession();
        if (error || !session) return null;
        this.currentUser = session.user;
        await this.loadProfile(session.user.id);
        return session;
    }

    // ── Load User Profile ─────────────────────────────────────
    async loadProfile(userId) {
        if (!this.client) return null;
        const { data, error } = await this.client
            .from('seduis_moi_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (!error && data) {
            this.profile = data;
            // Sync to local storage
            localStorage.setItem('seduitMoiUserId', data.id);
            localStorage.setItem('seduitMoiName', data.name || data.email.split('@')[0]);
            localStorage.setItem('seduitMoiAvatar', data.avatar_url || this.getAvatarUrl(data.name));
            localStorage.setItem('seduitMoiGender', data.gender || 'other');

            const userData = JSON.parse(localStorage.getItem('seduitMoiData') || '{}');
            userData.name1 = data.name;
            localStorage.setItem('seduitMoiData', JSON.stringify(userData));

            return data;
        }
        return null;
    }

    // ── Register (Inscription) ───────────────────────────────
    async register(email, password, name, surname, gender, avatarBase64) {
        if (!this.client) this.init();

        const { data: authData, error: authError } = await this.client.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                    surname,
                    gender,
                    avatar_url: avatarBase64 || this.getAvatarUrl(name)
                }
            }
        });

        if (authError) throw authError;

        const user = authData.user;
        if (user) {
            const avatarUrl = avatarBase64 || this.getAvatarUrl(name);
            // Upsert profile into seduis_moi_profiles
            await this.client.from('seduis_moi_profiles').upsert({
                id: user.id,
                email: user.email,
                name: name,
                surname: surname || '',
                gender: gender || 'other',
                avatar_url: avatarUrl,
                is_online: true,
                updated_at: new Date().toISOString()
            });

            await this.loadProfile(user.id);
        }

        return authData;
    }

    // ── Login (Connexion) ────────────────────────────────────
    async login(email, password) {
        if (!this.client) this.init();

        const { data, error } = await this.client.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        if (data.user) {
            await this.loadProfile(data.user.id);
        }
        return data;
    }

    // ── Google OAuth Login ────────────────────────────────────
    async loginWithGoogle(redirectToRoom) {
        if (!this.client) this.init();
        let redirectUrl = window.location.origin + window.location.pathname.replace('auth.html', redirectToRoom ? `dashboard.html?room=${redirectToRoom}` : 'intro.html');

        const { data, error } = await this.client.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectUrl
            }
        });

        if (error) throw error;
        return data;
    }

    // ── Logout ────────────────────────────────────────────────
    async logout() {
        if (this.client) {
            await this.client.auth.signOut();
        }
        localStorage.removeItem('seduitMoiUserId');
        localStorage.removeItem('seduitMoiName');
        localStorage.removeItem('seduitMoiAvatar');
        localStorage.removeItem('seduitMoiRoom');
        localStorage.removeItem('seduitMoiRole');
        window.location.href = '../index.html';
    }

    // ── Avatar URL Helper ────────────────────────────────────
    getAvatarUrl(name) {
        const cleanName = encodeURIComponent(name || 'Player');
        return `https://ui-avatars.com/api/?name=${cleanName}&background=dc2626&color=fff&bold=true`;
    }
}

// ── Global Singleton ──────────────────────────────────────────
window.seduitAuth = new SeduitMoiAuth();
