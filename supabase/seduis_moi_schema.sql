-- ============================================================
-- SEDUIS MOI - Supabase SQL Schema (Complete)
-- ============================================================

-- 1. TABLE CHANM (Rooms)
CREATE TABLE IF NOT EXISTS seduis_moi_rooms (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code char(6) UNIQUE NOT NULL,
    host_player_id text NOT NULL,
    guest_player_id text,
    host_name text NOT NULL,
    guest_name text,
    language char(2) DEFAULT 'fr',
    situation text DEFAULT 'date',
    game_id text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. TABLE PREZANS GLOBAL (Online Presence)
CREATE TABLE IF NOT EXISTS seduis_moi_presence (
    player_id text PRIMARY KEY,
    display_name text,
    room_code char(6),
    is_online boolean DEFAULT true,
    last_seen timestamptz DEFAULT now()
);

-- 3. TABLE PROFILES (Sistèm auth ki deja egziste)
CREATE TABLE IF NOT EXISTS seduis_moi_profiles (
    id uuid PRIMARY KEY,
    email text NOT NULL,
    name text,
    surname text,
    gender text DEFAULT 'other',
    avatar_url text,
    is_online boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 4. TABLE GAMES
CREATE TABLE IF NOT EXISTS seduis_moi_games (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id text UNIQUE NOT NULL,
    game_name text NOT NULL,
    game_description text,
    game_category text DEFAULT 'dating',
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 5. TABLE USERS
CREATE TABLE IF NOT EXISTS seduis_moi_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    username text UNIQUE NOT NULL,
    password_hash text NOT NULL,
    display_name text,
    avatar_url text,
    is_online boolean DEFAULT false,
    last_seen timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 6. TABLE INVITATIONS
CREATE TABLE IF NOT EXISTS seduis_moi_invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id text NOT NULL,
    receiver_id text NOT NULL,
    room_code char(6),
    game_id text,
    status text DEFAULT 'pending',
    message text,
    created_at timestamptz DEFAULT now(),
    expires_at timestamptz DEFAULT now() + interval '24 hours'
);

-- 7. TABLE ETA JWÈT (Game State)
CREATE TABLE IF NOT EXISTS seduis_moi_game_state (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code char(6) NOT NULL,
    game_id text NOT NULL,
    state jsonb NOT NULL DEFAULT '{}',
    last_action_by text,
    updated_at timestamptz DEFAULT now()
);

-- 8. TABLE EVÈNMAN
CREATE TABLE IF NOT EXISTS seduis_moi_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code char(6) NOT NULL,
    sender_id text NOT NULL,
    event_type text NOT NULL,
    payload jsonb NOT NULL DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_seduis_moi_rooms_code ON seduis_moi_rooms(code);
CREATE INDEX IF NOT EXISTS idx_seduis_moi_rooms_active ON seduis_moi_rooms(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seduis_moi_game_state_room ON seduis_moi_game_state(room_code, game_id);
CREATE INDEX IF NOT EXISTS idx_seduis_moi_events_room ON seduis_moi_events(room_code, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seduis_moi_profiles_email ON seduis_moi_profiles(email);
CREATE INDEX IF NOT EXISTS idx_seduis_moi_games_active ON seduis_moi_games(is_active);
CREATE INDEX IF NOT EXISTS idx_seduis_moi_invitations_receiver ON seduis_moi_invitations(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_seduis_moi_invitations_sender ON seduis_moi_invitations(sender_id, status);

-- AUTO-UPDATE TRIGGERS
CREATE OR REPLACE FUNCTION seduis_moi_update_timestamp()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS seduis_moi_rooms_updated_at ON seduis_moi_rooms;
CREATE TRIGGER seduis_moi_rooms_updated_at
    BEFORE UPDATE ON seduis_moi_rooms
    FOR EACH ROW EXECUTE FUNCTION seduis_moi_update_timestamp();

DROP TRIGGER IF EXISTS seduis_moi_profiles_updated_at ON seduis_moi_profiles;
CREATE TRIGGER seduis_moi_profiles_updated_at
    BEFORE UPDATE ON seduis_moi_profiles
    FOR EACH ROW EXECUTE FUNCTION seduis_moi_update_timestamp();

DROP TRIGGER IF EXISTS seduis_moi_games_updated_at ON seduis_moi_games;
CREATE TRIGGER seduis_moi_games_updated_at
    BEFORE UPDATE ON seduis_moi_games
    FOR EACH ROW EXECUTE FUNCTION seduis_moi_update_timestamp();

DROP TRIGGER IF EXISTS seduis_moi_users_updated_at ON seduis_moi_users;
CREATE TRIGGER seduis_moi_users_updated_at
    BEFORE UPDATE ON seduis_moi_users
    FOR EACH ROW EXECUTE FUNCTION seduis_moi_update_timestamp();

-- RLS - Row Level Security
ALTER TABLE seduis_moi_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE seduis_moi_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE seduis_moi_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE seduis_moi_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE seduis_moi_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE seduis_moi_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE seduis_moi_game_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE seduis_moi_events ENABLE ROW LEVEL SECURITY;

-- Rooms policies
DROP POLICY IF EXISTS "seduis_moi rooms select" ON seduis_moi_rooms;
DROP POLICY IF EXISTS "seduis_moi rooms insert" ON seduis_moi_rooms;
DROP POLICY IF EXISTS "seduis_moi rooms update" ON seduis_moi_rooms;

CREATE POLICY "seduis_moi rooms select" ON seduis_moi_rooms
    FOR SELECT USING (is_active = true);

CREATE POLICY "seduis_moi rooms insert" ON seduis_moi_rooms
    FOR INSERT WITH CHECK (true);

CREATE POLICY "seduis_moi rooms update" ON seduis_moi_rooms
    FOR UPDATE USING (true);

-- Presence policies
DROP POLICY IF EXISTS "seduis_moi presence all" ON seduis_moi_presence;

CREATE POLICY "seduis_moi presence all" ON seduis_moi_presence
    FOR ALL USING (true) WITH CHECK (true);

-- Profiles policies - IMPORTANT for auth system
DROP POLICY IF EXISTS "seduis_moi profiles select" ON seduis_moi_profiles;
DROP POLICY IF EXISTS "seduis_moi profiles insert" ON seduis_moi_profiles;
DROP POLICY IF EXISTS "seduis_moi profiles update" ON seduis_moi_profiles;

CREATE POLICY "seduis_moi profiles select" ON seduis_moi_profiles
    FOR SELECT USING (true);

CREATE POLICY "seduis_moi profiles insert" ON seduis_moi_profiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "seduis_moi profiles update" ON seduis_moi_profiles
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Games policies
DROP POLICY IF EXISTS "seduis_moi games select" ON seduis_moi_games;
DROP POLICY IF EXISTS "seduis_moi games insert" ON seduis_moi_games;

CREATE POLICY "seduis_moi games select" ON seduis_moi_games
    FOR SELECT USING (is_active = true);

CREATE POLICY "seduis_moi games insert" ON seduis_moi_games
    FOR INSERT WITH CHECK (true);

-- Users policies
DROP POLICY IF EXISTS "seduis_moi users select" ON seduis_moi_users;
DROP POLICY IF EXISTS "seduis_moi users insert" ON seduis_moi_users;
DROP POLICY IF EXISTS "seduis_moi users update" ON seduis_moi_users;

CREATE POLICY "seduis_moi users select" ON seduis_moi_users
    FOR SELECT USING (true);

CREATE POLICY "seduis_moi users insert" ON seduis_moi_users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "seduis_moi users update" ON seduis_moi_users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Invitations policies
DROP POLICY IF EXISTS "seduis_moi invitations select" ON seduis_moi_invitations;
DROP POLICY IF EXISTS "seduis_moi invitations insert" ON seduis_moi_invitations;
DROP POLICY IF EXISTS "seduis_moi invitations update" ON seduis_moi_invitations;

CREATE POLICY "seduis_moi invitations select" ON seduis_moi_invitations
    FOR SELECT USING (true);

CREATE POLICY "seduis_moi invitations insert" ON seduis_moi_invitations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "seduis_moi invitations update" ON seduis_moi_invitations
    FOR UPDATE USING (true);

-- Game state policies
DROP POLICY IF EXISTS "seduis_moi game_state select" ON seduis_moi_game_state;
DROP POLICY IF EXISTS "seduis_moi game_state insert" ON seduis_moi_game_state;
DROP POLICY IF EXISTS "seduis_moi game_state update" ON seduis_moi_game_state;

CREATE POLICY "seduis_moi game_state select" ON seduis_moi_game_state
    FOR SELECT USING (true);

CREATE POLICY "seduis_moi game_state insert" ON seduis_moi_game_state
    FOR INSERT WITH CHECK (true);

CREATE POLICY "seduis_moi game_state update" ON seduis_moi_game_state
    FOR UPDATE USING (true);

-- Events policies
DROP POLICY IF EXISTS "seduis_moi events select" ON seduis_moi_events;
DROP POLICY IF EXISTS "seduis_moi events insert" ON seduis_moi_events;

CREATE POLICY "seduis_moi events select" ON seduis_moi_events
    FOR SELECT USING (true);

CREATE POLICY "seduis_moi events insert" ON seduis_moi_events
    FOR INSERT WITH CHECK (true);

-- NETTOYAGE OTOMATIK
CREATE OR REPLACE FUNCTION seduis_moi_cleanup_old_rooms()
RETURNS void AS $$
BEGIN
    UPDATE seduis_moi_rooms
    SET is_active = false
    WHERE is_active = true
      AND updated_at < now() - interval '24 hours';
END;
$$ LANGUAGE plpgsql;

-- AKTIVE REALTIME
-- ALTER PUBLICATION supabase_realtime ADD TABLE seduis_moi_rooms;
-- ALTER PUBLICATION supabase_realtime ADD TABLE seduis_moi_game_state;
-- ALTER PUBLICATION supabase_realtime ADD TABLE seduis_moi_users;
-- ALTER PUBLICATION supabase_realtime ADD TABLE seduis_moi_invitations;

-- DONE JWÈT INISYAL
INSERT INTO seduis_moi_games (game_id, game_name, game_description, game_category) VALUES
('truth_dare', 'Vérité ou Défi', 'Jwèt klasik ak kesyon ak defi', 'dating'),
('roleplay', 'Jeu de Rôle', 'Simile sitiyasyon romantik', 'dating'),
('flirty_questions', 'Questions Flirteuses', 'Kesyon pou brake glas', 'dating'),
('couple_quiz', 'Quiz Couple', 'Test konésans koup la', 'dating'),
('would_you_rather', 'Tu préférerais', 'Chwa difisil', 'dating')
ON CONFLICT (game_id) DO NOTHING;
