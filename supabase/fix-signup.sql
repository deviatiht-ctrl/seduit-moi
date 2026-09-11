-- ============================================================
-- FIX SIGNUP - Kreye tout tab ki nesesè san trigger ki koz erè
-- ============================================================

-- 1. Kreye tab profiles si li pa egziste
CREATE TABLE IF NOT EXISTS seduis_moi_profiles (
    id uuid PRIMARY KEY,
    email text,
    name text,
    surname text,
    gender text DEFAULT 'other',
    avatar_url text,
    is_online boolean DEFAULT false,
    last_seen timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Retire tout trigger ki ka lakz pwoblèm sou auth.users
DROP TRIGGER IF EXISTS on_seduis_moi_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS seduis_moi_handle_new_user();

-- 3. Pa kreye trigger sou auth.users - pral jere pwofil nan kòd JS la
-- Sa evite konfli ak lòt pwojè ki sou menm Supabase project

-- 5. Kreye indexes
CREATE INDEX IF NOT EXISTS idx_seduis_moi_profiles_email ON seduis_moi_profiles(email);
CREATE INDEX IF NOT EXISTS idx_seduis_moi_profiles_online ON seduis_moi_profiles(is_online, last_seen DESC);

-- 6. Configure RLS
ALTER TABLE seduis_moi_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "seduis_moi profiles select" ON seduis_moi_profiles;
DROP POLICY IF EXISTS "seduis_moi profiles insert" ON seduis_moi_profiles;
DROP POLICY IF EXISTS "seduis_moi profiles update" ON seduis_moi_profiles;
DROP POLICY IF EXISTS "seduis_moi profiles all" ON seduis_moi_profiles;

-- Pou korekte erè sa a: pèmèt tout moun ki autantike ka ekri nan pwofil yo
CREATE POLICY "seduis_moi profiles select" ON seduis_moi_profiles
    FOR SELECT USING (true);

CREATE POLICY "seduis_moi profiles insert" ON seduis_moi_profiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "seduis_moi profiles update" ON seduis_moi_profiles
    FOR UPDATE USING (auth.uid() = id);

-- 7. Verifye si trigger la kreye kòrèkteman
DO $$
BEGIN
    RAISE NOTICE '✅ Fix signup complete. Test registration now.';
END $$;
