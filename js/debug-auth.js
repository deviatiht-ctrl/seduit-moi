// ============================================================
// DEBUG AUTH SCRIPT - Pou diagnostik erè database
// ============================================================

class AuthDebugger {
    constructor() {
        this.client = null;
    }

    async init() {
        try {
            this.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('[Debug] Supabase client initialized');
            return true;
        } catch(e) {
            console.error('[Debug] Failed to initialize Supabase:', e);
            return false;
        }
    }

    async checkTables() {
        if (!this.client) await this.init();
        
        console.log('[Debug] Checking if tables exist...');
        
        // Check profiles table
        try {
            const { data: profilesData, error: profilesError } = await this.client
                .from('seduis_moi_profiles')
                .select('id')
                .limit(1);
            
            if (profilesError) {
                console.error('[Debug] Profiles table error:', profilesError);
            } else {
                console.log('[Debug] ✅ Profiles table exists and is accessible');
            }
        } catch(e) {
            console.error('[Debug] Profiles table check failed:', e);
        }

        // Check users table
        try {
            const { data: usersData, error: usersError } = await this.client
                .from('seduis_moi_users')
                .select('id')
                .limit(1);
            
            if (usersError) {
                console.error('[Debug] Users table error:', usersError);
            } else {
                console.log('[Debug] ✅ Users table exists and is accessible');
            }
        } catch(e) {
            console.error('[Debug] Users table check failed:', e);
        }

        // Check games table
        try {
            const { data: gamesData, error: gamesError } = await this.client
                .from('seduis_moi_games')
                .select('id')
                .limit(1);
            
            if (gamesError) {
                console.error('[Debug] Games table error:', gamesError);
            } else {
                console.log('[Debug] ✅ Games table exists and is accessible');
            }
        } catch(e) {
            console.error('[Debug] Games table check failed:', e);
        }
    }

    async testRegister(email, password, name) {
        if (!this.client) await this.init();
        
        console.log('[Debug] Testing registration...');
        console.log('[Debug] Email:', email);
        console.log('[Debug] Name:', name);
        
        try {
            const { data: authData, error: authError } = await this.client.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name,
                        surname: '',
                        gender: 'other',
                        avatar_url: ''
                    }
                }
            });

            if (authError) {
                console.error('[Debug] Auth registration error:', authError);
                return { error: authError };
            }

            console.log('[Debug] ✅ Auth registration successful:', authData);

            if (authData.user) {
                // Try to insert profile
                try {
                    const { data: profileData, error: profileError } = await this.client
                        .from('seduis_moi_profiles')
                        .upsert({
                            id: authData.user.id,
                            email: authData.user.email,
                            name: name,
                            surname: '',
                            gender: 'other',
                            avatar_url: '',
                            is_online: true,
                            updated_at: new Date().toISOString()
                        });

                    if (profileError) {
                        console.error('[Debug] Profile insertion error:', profileError);
                        return { error: profileError };
                    }

                    console.log('[Debug] ✅ Profile creation successful:', profileData);
                    return { data: { auth: authData, profile: profileData } };
                } catch(e) {
                    console.error('[Debug] Profile insertion failed:', e);
                    return { error: e };
                }
            }

            return { data: authData };
        } catch(e) {
            console.error('[Debug] Registration test failed:', e);
            return { error: e };
        }
    }
}

// Create global debugger
window.authDebugger = new AuthDebugger();

// Auto-run on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Debug] Auth debugger loaded. Run: window.authDebugger.checkTables()');
});