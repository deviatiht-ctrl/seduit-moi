-- ============================================================
-- SEDUIS MOI - Supabase SQL Schema
-- Prefiks: seduis_moi_ (pou evite konfli ak lot pwojè)
-- ============================================================

-- 1. TABLE GAMES_AVAILABLE (Jwet disponib pou seleksyon)
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
`
-- 2. TABLE CHANM (Rooms)
-- Chak koup kreye yon chanm avèk yon kòd 6 chif
CREATE TABLE IF NOT EXISTS seduis_moi_rooms (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code char(6) UNIQUE NOT NULL,
    host_player_id text NOT NULL,
    guest_player_id text,
    host_name text NOT NULL,
    guest_name text,
    language char(2) DEFAULT 'fr',
    situation text DEFAULT 'date',
    game_id text, -- Reference to game_id text from games table
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Migration: Add game_id column to existing rooms table if it doesn't exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'seduis_moi_rooms'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'seduis_moi_rooms' AND column_name = 'game_id'
    ) THEN
        ALTER TABLE seduis_moi_rooms ADD COLUMN game_id text;
    END IF;
END $$;

-- 3. TABLE USERS (Utilisateurs enregistres)
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

-- 3.5 TABLE PROFILES (Pour system auth existant)
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

-- 4. TABLE PREZANS GLOBAL (Online Presence)
-- Tracked via Supabase Realtime Presence (pa beswen DB)
-- Men nou mete yon tab pou statistik si nou vle

CREATE TABLE IF NOT EXISTS seduis_moi_presence (
    player_id text PRIMARY KEY,
    display_name text,
    room_code char(6),
    is_online boolean DEFAULT true,
    last_seen timestamptz DEFAULT now()
);

-- 5. TABLE ETA JWÈT (Game State - persistent backup)
-- Pwensipal sync via Realtime Broadcast, men backup la pou reconnexion
CREATE TABLE IF NOT EXISTS seduis_moi_game_state (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code char(6) NOT NULL,
    game_id text NOT NULL,
    state jsonb NOT NULL DEFAULT '{}',
    last_action_by text,
    updated_at timestamptz DEFAULT now()
);

-- 6. TABLE INVITATIONS (Demands/Invitations)
CREATE TABLE IF NOT EXISTS seduis_moi_invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id text NOT NULL, -- Using text to match player_id format
    receiver_id text NOT NULL, -- Using text to match player_id format
    room_code char(6), -- Foreign key constraint removed for safety
    game_id text, -- Reference to game_id text
    status text DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'expired'
    message text,
    created_at timestamptz DEFAULT now(),
    expires_at timestamptz DEFAULT now() + interval '24 hours'
);

-- 7. TABLE EVÈNMAN (Events log - optionnel)
CREATE TABLE IF NOT EXISTS seduis_moi_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code char(6) NOT NULL,
    sender_id text NOT NULL,
    event_type text NOT NULL,
    payload jsonb NOT NULL DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

-- ============================================================
-- INDEX pou pèfòmans
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_seduis_moi_rooms_code ON seduis_moi_rooms(code);
CREATE INDEX IF NOT EXISTS idx_seduis_moi_rooms_active ON seduis_moi_rooms(is_active, created_at DESC);

-- Add game_id index only if column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'seduis_moi_rooms' AND column_name = 'game_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_seduis_moi_rooms_game ON seduis_moi_rooms(game_id);
    END IF;
END $$;

-- Add game_state index only if table and columns exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'seduis_moi_game_state'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'seduis_moi_game_state' AND column_name = 'game_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_seduis_moi_game_state_room ON seduis_moi_game_state(room_code, game_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_seduis_moi_events_room ON seduis_moi_events(room_code, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seduis_moi_users_email ON seduis_moi_users(email);
CREATE INDEX IF NOT EXISTS idx_seduis_moi_users_username ON seduis_moi_users(username);
CREATE INDEX IF NOT EXISTS idx_seduis_moi_users_online ON seduis_moi_users(is_online, last_seen DESC);

-- Add profiles indexes only if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seduis_moi_profiles') THEN
        CREATE INDEX IF NOT EXISTS idx_seduis_moi_profiles_email ON seduis_moi_profiles(email);
        CREATE INDEX IF NOT EXISTS idx_seduis_moi_profiles_online ON seduis_moi_profiles(is_online, updated_at DESC);
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_seduis_moi_games_active ON seduis_moi_games(is_active);
CREATE INDEX IF NOT EXISTS idx_seduis_moi_invitations_receiver ON seduis_moi_invitations(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_seduis_moi_invitations_sender ON seduis_moi_invitations(sender_id, status);

-- Add invitations game_id index only if column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'seduis_moi_invitations' AND column_name = 'game_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_seduis_moi_invitations_game ON seduis_moi_invitations(game_id);
    END IF;
END $$;

-- ============================================================
-- AUTO-UPDATE updated_at pou rooms
-- ============================================================
CREATE OR REPLACE FUNCTION seduis_moi_update_timestamp()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers only if tables exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seduis_moi_rooms') THEN
        DROP TRIGGER IF EXISTS seduis_moi_rooms_updated_at ON seduis_moi_rooms;
        CREATE TRIGGER seduis_moi_rooms_updated_at
            BEFORE UPDATE ON seduis_moi_rooms
            FOR EACH ROW EXECUTE FUNCTION seduis_moi_update_timestamp();
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seduis_moi_users') THEN
        DROP TRIGGER IF EXISTS seduis_moi_users_updated_at ON seduis_moi_users;
        CREATE TRIGGER seduis_moi_users_updated_at
            BEFORE UPDATE ON seduis_moi_users
            FOR EACH ROW EXECUTE FUNCTION seduis_moi_update_timestamp();
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seduis_moi_games') THEN
        DROP TRIGGER IF EXISTS seduis_moi_games_updated_at ON seduis_moi_games;
        CREATE TRIGGER seduis_moi_games_updated_at
            BEFORE UPDATE ON seduis_moi_games
            FOR EACH ROW EXECUTE FUNCTION seduis_moi_update_timestamp();
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seduis_moi_profiles') THEN
        DROP TRIGGER IF EXISTS seduis_moi_profiles_updated_at ON seduis_moi_profiles;
        CREATE TRIGGER seduis_moi_profiles_updated_at
            BEFORE UPDATE ON seduis_moi_profiles
            FOR EACH ROW EXECUTE FUNCTION seduis_moi_update_timestamp();
    END IF;
END $$;

-- ============================================================
-- RLS (Row Level Security) - OBLIGATWA pou Supabase
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seduis_moi_rooms') THEN
        ALTER TABLE seduis_moi_rooms ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seduis_moi_presence') THEN
        ALTER TABLE seduis_moi_presence ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seduis_moi_game_state') THEN
        ALTER TABLE seduis_moi_game_state ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seduis_moi_events') THEN
        ALTER TABLE seduis_moi_events ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seduis_moi_users') THEN
        ALTER TABLE seduis_moi_users ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seduis_moi_games') THEN
        ALTER TABLE seduis_moi_games ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seduis_moi_invitations') THEN
        ALTER TABLE seduis_moi_invitations ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Tout moun ka LI chanm aktif yo (pou rejwenn)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seduis_moi_rooms') THEN
        DROP POLICY IF EXISTS "seduis_moi rooms select" ON seduis_moi_rooms;
        DROP POLICY IF EXISTS "seduis_moi rooms insert" ON seduis_moi_rooms;
        DROP POLICY IF EXISTS "seduis_moi rooms update" ON seduis_moi_rooms;

        CREATE POLICY "seduis_moi rooms select" ON seduis_moi_rooms
            FOR SELECT USING (is_active = true);

        CREATE POLICY "seduis_moi rooms insert" ON seduis_moi_rooms
            FOR INSERT WITH CHECK (true);

        CREATE POLICY "seduis_moi rooms update" ON seduis_moi_rooms
            FOR UPDATE USING (true);
    END IF;
END $$;

-- Presence: tout moun ka li ak ekri
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seduis_moi_presence') THEN
        DROP POLICY IF EXISTS "seduis_moi presence all" ON seduis_moi_presence;

        CREATE POLICY "seduis_moi presence all" ON seduis_moi_presence
            FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Game state: tout moun nan yon chanm ka li/ekri
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seduis_moi_game_state') THEN
        DROP POLICY IF EXISTS "seduis_moi game_state select" ON seduis_moi_game_state;
        DROP POLICY IF EXISTS "seduis_moi game_state insert" ON seduis_moi_game_state;
        DROP POLICY IF EXISTS "seduis_moi game_state update" ON seduis_moi_game_state;

        CREATE POLICY "seduis_moi game_state select" ON seduis_moi_game_state
            FOR SELECT USING (true);

        CREATE POLICY "seduis_moi game_state insert" ON seduis_moi_game_state
            FOR INSERT WITH CHECK (true);

        CREATE POLICY "seduis_moi game_state update" ON seduis_moi_game_state
            FOR UPDATE USING (true);
    END IF;
END $$;

-- Events: tout moun ka lis ak kreye
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seduis_moi_events') THEN
        DROP POLICY IF EXISTS "seduis_moi events select" ON seduis_moi_events;
        DROP POLICY IF EXISTS "seduis_moi events insert" ON seduis_moi_events;

        CREATE POLICY "seduis_moi events select" ON seduis_moi_events
            FOR SELECT USING (true);

        CREATE POLICY "seduis_moi events insert" ON seduis_moi_events
            FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- Users: tout moun ka li, sèlman pwopriyetè ka modifye
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seduis_moi_users') THEN
        DROP POLICY IF EXISTS "seduis_moi users select" ON seduis_moi_users;
        DROP POLICY IF EXISTS "seduis_moi users insert" ON seduis_moi_users;
        DROP POLICY IF EXISTS "seduis_moi users update" ON seduis_moi_users;

        CREATE POLICY "seduis_moi users select" ON seduis_moi_users
            FOR SELECT USING (true);

        CREATE POLICY "seduis_moi users insert" ON seduis_moi_users
            FOR INSERT WITH CHECK (true);

        CREATE POLICY "seduis_moi users update" ON seduis_moi_users
            FOR UPDATE USING (auth.uid()::text = id::text);
    END IF;
END $$;

-- Profiles: pour system auth existant
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seduis_moi_profiles') THEN
        ALTER TABLE seduis_moi_profiles ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "seduis_moi profiles select" ON seduis_moi_profiles;
        DROP POLICY IF EXISTS "seduis_moi profiles insert" ON seduis_moi_profiles;
        DROP POLICY IF EXISTS "seduis_moi profiles update" ON seduis_moi_profiles;

        CREATE POLICY "seduis_moi profiles select" ON seduis_moi_profiles
            FOR SELECT USING (auth.uid()::text = id::text);

        CREATE POLICY "seduis_moi profiles insert" ON seduis_moi_profiles
            FOR INSERT WITH CHECK (auth.uid()::text = id::text);

        CREATE POLICY "seduis_moi profiles update" ON seduis_moi_profiles
            FOR UPDATE USING (auth.uid()::text = id::text);
    END IF;
END $$;

-- Games: tout moun ka li jwet aktif yo
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seduis_moi_games') THEN
        DROP POLICY IF EXISTS "seduis_moi games select" ON seduis_moi_games;
        DROP POLICY IF EXISTS "seduis_moi games insert" ON seduis_moi_games;

        CREATE POLICY "seduis_moi games select" ON seduis_moi_games
            FOR SELECT USING (is_active = true);

        CREATE POLICY "seduis_moi games insert" ON seduis_moi_games
            FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- Invitations: sender ka kreye, receiver ka li/modifye
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seduis_moi_invitations') THEN
        DROP POLICY IF EXISTS "seduis_moi invitations select" ON seduis_moi_invitations;
        DROP POLICY IF EXISTS "seduis_moi invitations insert" ON seduis_moi_invitations;
        DROP POLICY IF EXISTS "seduis_moi invitations update" ON seduis_moi_invitations;

        CREATE POLICY "seduis_moi invitations select" ON seduis_moi_invitations
            FOR SELECT USING (true);

        CREATE POLICY "seduis_moi invitations insert" ON seduis_moi_invitations
            FOR INSERT WITH CHECK (true);

        CREATE POLICY "seduis_moi invitations update" ON seduis_moi_invitations
            FOR UPDATE USING (true);
    END IF;
END $$;

-- ============================================================
-- NETTOYAGE OTOMATIK (Chanm inaktif apre 24 è)
-- ============================================================
CREATE OR REPLACE FUNCTION seduis_moi_cleanup_old_rooms()
RETURNS void AS $$
BEGIN
    UPDATE seduis_moi_rooms
    SET is_active = false
    WHERE is_active = true
      AND updated_at < now() - interval '24 hours';
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- AKTIVE REALTIME pou chak tab
-- (Ajoute nan Supabase Dashboard → Database → Replication)
-- ============================================================
-- Ou ka tou fè sa manuèlman:
-- ALTER PUBLICATION supabase_realtime ADD TABLE seduis_moi_rooms;
-- ALTER PUBLICATION supabase_realtime ADD TABLE seduis_moi_game_state;
-- ALTER PUBLICATION supabase_realtime ADD TABLE seduis_moi_users;
-- ALTER PUBLICATION supabase_realtime ADD TABLE seduis_moi_invitations;

-- ============================================================
-- INITIAL GAME DATA (Jwet ki disponib)
-- ============================================================
INSERT INTO seduis_moi_games (game_id, game_name, game_description, game_category) VALUES
('truth_dare', 'Vérité ou Défi', 'Jwèt klasik ak kesyon ak defi', 'dating'),
('roleplay', 'Jeu de Rôle', 'Simile sitiyasyon romantik', 'dating'),
('flirty_questions', 'Questions Flirteuses', 'Kesyon pou brake glas', 'dating'),
('couple_quiz', 'Quiz Couple', 'Test konésans koup la', 'dating'),
('would_you_rather', 'Tu préférerais', 'Chwa difisil', 'dating')
ON CONFLICT (game_id) DO NOTHING;
