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

        const avatarUrl = avatarBase64 || this.getAvatarUrl(name);

        // Step 1: Create Supabase Auth account
        // The DB trigger `on_auth_user_created` will automatically create the profile row
        const { data: authData, error: authError } = await this.client.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                    surname: surname || '',
                    gender: gender || 'other',
                    avatar_url: avatarUrl
                }
            }
        });

        if (authError) {
            console.error('[SeduitAuth] signUp error:', authError);
            throw new Error(this._friendlyAuthError(authError.message));
        }

        const user = authData.user;
        if (!user) {
            throw new Error('Kont lan kreye men li bezwen verifikasyon email. Tcheke imèl ou.');
        }

        // Step 2: Profile is created by DB trigger automatically.
        // We also try an explicit upsert as fallback (in case trigger is not set up).
        // We do NOT throw on this error — the trigger should handle it.
        try {
            const { error: profileError } = await this.client.from('seduis_moi_profiles').upsert({
                id: user.id,
                email: user.email,
                name: name,
                surname: surname || '',
                gender: gender || 'other',
                avatar_url: avatarUrl,
                is_online: true,
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });

            if (profileError) {
                console.warn('[SeduitAuth] Profile upsert non-fatal (trigger should handle it):', profileError.message);
            }
        } catch(e) {
            console.warn('[SeduitAuth] Profile upsert exception (non-fatal):', e);
        }

        // Step 3: Load the profile (created by trigger or upsert)
        // Wait a moment for the trigger to run
        await new Promise(resolve => setTimeout(resolve, 600));
        await this.loadProfile(user.id);

        // Step 4: Store name immediately in localStorage so rest of app can use it
        localStorage.setItem('seduitMoiName', name);
        localStorage.setItem('seduitMoiUserId', user.id);
        localStorage.setItem('seduitMoiAvatar', avatarUrl);

        const userData = JSON.parse(localStorage.getItem('seduitMoiData') || '{}');
        userData.name1 = name;
        localStorage.setItem('seduitMoiData', JSON.stringify(userData));

        return authData;
    }

    // ── Login (Connexion) ────────────────────────────────────
    async login(email, password) {
        if (!this.client) this.init();

        const { data, error } = await this.client.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            throw new Error(this._friendlyAuthError(error.message));
        }
        if (data.user) {
            await this.loadProfile(data.user.id);
        }
        return data;
    }

    // ── Google OAuth Login ────────────────────────────────────
    async loginWithGoogle(redirectToRoom) {
        if (!this.client) this.init();
        const basePath = window.location.pathname.replace(/pages\/auth\.html$|auth\.html$/, '');
        let redirectUrl;
        if (redirectToRoom) {
            redirectUrl = `${window.location.origin}${basePath}pages/auth.html?room=${encodeURIComponent(redirectToRoom)}`;
        } else {
            redirectUrl = `${window.location.origin}${basePath}pages/intro.html`;
        }

        const { data, error } = await this.client.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: redirectUrl }
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
        localStorage.removeItem('seduitMoiGender');
        const basePath = window.location.pathname.replace(/pages\/[^/]+$/, '');
        window.location.href = basePath + 'index.html';
    }

    // ── Friendly error messages ───────────────────────────────
    _friendlyAuthError(msg) {
        if (!msg) return 'Erè enkoni. Eseye ankò.';
        const m = msg.toLowerCase();
        if (m.includes('already registered') || m.includes('user already exists')) {
            return 'Adrès imèl sa a deja itilize. Eseye konekte oswa itilize yon lòt imèl.';
        }
        if (m.includes('invalid login credentials') || m.includes('invalid credentials')) {
            return 'Imèl oswa modpas la pa kòrèk.';
        }
        if (m.includes('email not confirmed')) {
            return 'Tanpri konfime imèl ou anvan ou konekte.';
        }
        if (m.includes('password')) {
            return 'Modpas la dwe gen omwen 6 karaktè.';
        }
        if (m.includes('rate limit')) {
            return 'Twòp tantativ. Eseye ankò nan kèk minit.';
        }
        return msg;
    }

    // ── Avatar URL Helper ────────────────────────────────────
    getAvatarUrl(name) {
        const cleanName = encodeURIComponent(name || 'Player');
        return `https://ui-avatars.com/api/?name=${cleanName}&background=dc2626&color=fff&bold=true`;
    }
}

// ── Global Singleton ──────────────────────────────────────────
window.seduitAuth = new SeduitMoiAuth();
