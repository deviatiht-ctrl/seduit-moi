-- ============================================================
-- SEDUIS MOI - Supabase Auth, Profiles & Invitations Schema
-- Prefiks: seduis_moi_
-- ============================================================

-- 1. TABLE PROFIL (seduis_moi_profiles)
CREATE TABLE IF NOT EXISTS seduis_moi_profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text,
    name text NOT NULL,
    surname text,
    gender text DEFAULT 'other', -- 'male', 'female', 'other'
    avatar_url text,
    is_online boolean DEFAULT true,
    last_seen timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. TABLE ENVITASYON (seduis_moi_invitations)
CREATE TABLE IF NOT EXISTS seduis_moi_invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code char(6) NOT NULL,
    sender_id uuid NOT NULL REFERENCES seduis_moi_profiles(id) ON DELETE CASCADE,
    sender_name text NOT NULL,
    sender_avatar text,
    receiver_id uuid NOT NULL REFERENCES seduis_moi_profiles(id) ON DELETE CASCADE,
    status text DEFAULT 'pending', -- 'pending' | 'accepted' | 'declined'
    created_at timestamptz DEFAULT now()
);

-- ============================================================
-- INDEX
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_seduis_moi_profiles_online ON seduis_moi_profiles(is_online, last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_seduis_moi_invitations_receiver ON seduis_moi_invitations(receiver_id, status);

-- ============================================================
-- TRIGGER: Otomatik kreye profil lè yon moun enskri via Supabase Auth
-- ============================================================
CREATE OR REPLACE FUNCTION seduis_moi_handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO seduis_moi_profiles (id, email, name, surname, gender, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'surname', ''),
        COALESCE(NEW.raw_user_meta_data->>'gender', 'other'),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, seduis_moi_profiles.name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, seduis_moi_profiles.avatar_url);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_seduis_moi_user_created ON auth.users;
CREATE TRIGGER on_seduis_moi_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION seduis_moi_handle_new_user();

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE seduis_moi_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE seduis_moi_invitations ENABLE ROW LEVEL SECURITY;

-- Profiles: tout moun ka li profil yo (pou chèche zanmi en ligne)
CREATE POLICY "seduis_moi profiles select" ON seduis_moi_profiles
    FOR SELECT USING (true);

CREATE POLICY "seduis_moi profiles insert" ON seduis_moi_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "seduis_moi profiles update" ON seduis_moi_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Invitations: moun ki voye oswa moun ki resevwa ka li/ekri
CREATE POLICY "seduis_moi invitations select" ON seduis_moi_invitations
    FOR SELECT USING (true);

CREATE POLICY "seduis_moi invitations insert" ON seduis_moi_invitations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "seduis_moi invitations update" ON seduis_moi_invitations
    FOR UPDATE USING (true);

-- REALTIME REPLICATION (pou resevwa envitasyon san rafrechi paj la)
-- ALTER PUBLICATION supabase_realtime ADD TABLE seduis_moi_invitations;
-- ALTER PUBLICATION supabase_realtime ADD TABLE seduis_moi_profiles;
