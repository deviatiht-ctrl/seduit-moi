-- ============================================================
-- SEDUIS MOI - Supabase SQL Schema
-- Prefiks: seduis_moi_ (pou evite konfli ak lot pwojè)
-- ============================================================

-- 1. TABLE CHANM (Rooms)
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
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. TABLE PREZANS GLOBAL (Online Presence)
-- Tracked via Supabase Realtime Presence (pa beswen DB)
-- Men nou mete yon tab pou statistik si nou vle

CREATE TABLE IF NOT EXISTS seduis_moi_presence (
    player_id text PRIMARY KEY,
    display_name text,
    room_code char(6),
    is_online boolean DEFAULT true,
    last_seen timestamptz DEFAULT now()
);

-- 3. TABLE ETA JWÈT (Game State - persistent backup)
-- Pwensipal sync via Realtime Broadcast, men backup la pou reconnexion
CREATE TABLE IF NOT EXISTS seduis_moi_game_state (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code char(6) NOT NULL,
    game_id text NOT NULL,
    state jsonb NOT NULL DEFAULT '{}',
    last_action_by text,
    updated_at timestamptz DEFAULT now()
);

-- 4. TABLE EVÈNMAN (Events log - optionnel)
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
CREATE INDEX IF NOT EXISTS idx_seduis_moi_game_state_room ON seduis_moi_game_state(room_code, game_id);
CREATE INDEX IF NOT EXISTS idx_seduis_moi_events_room ON seduis_moi_events(room_code, created_at DESC);

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

DROP TRIGGER IF EXISTS seduis_moi_rooms_updated_at ON seduis_moi_rooms;
CREATE TRIGGER seduis_moi_rooms_updated_at
    BEFORE UPDATE ON seduis_moi_rooms
    FOR EACH ROW EXECUTE FUNCTION seduis_moi_update_timestamp();

-- ============================================================
-- RLS (Row Level Security) - OBLIGATWA pou Supabase
-- ============================================================
ALTER TABLE seduis_moi_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE seduis_moi_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE seduis_moi_game_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE seduis_moi_events ENABLE ROW LEVEL SECURITY;

-- Tout moun ka LI chanm aktif yo (pou rejwenn)
CREATE POLICY "seduis_moi rooms select" ON seduis_moi_rooms
    FOR SELECT USING (is_active = true);

-- Tout moun ka KREYE yon chanm
CREATE POLICY "seduis_moi rooms insert" ON seduis_moi_rooms
    FOR INSERT WITH CHECK (true);

-- Sèlman mete a jou chanm yo (pou guest rejwenn)
CREATE POLICY "seduis_moi rooms update" ON seduis_moi_rooms
    FOR UPDATE USING (true);

-- Presence: tout moun ka li ak ekri
CREATE POLICY "seduis_moi presence all" ON seduis_moi_presence
    FOR ALL USING (true) WITH CHECK (true);

-- Game state: tout moun nan yon chanm ka li/ekri
CREATE POLICY "seduis_moi game_state select" ON seduis_moi_game_state
    FOR SELECT USING (true);

CREATE POLICY "seduis_moi game_state insert" ON seduis_moi_game_state
    FOR INSERT WITH CHECK (true);

CREATE POLICY "seduis_moi game_state update" ON seduis_moi_game_state
    FOR UPDATE USING (true);

-- Events: tout moun ka lis ak kreye
CREATE POLICY "seduis_moi events select" ON seduis_moi_events
    FOR SELECT USING (true);

CREATE POLICY "seduis_moi events insert" ON seduis_moi_events
    FOR INSERT WITH CHECK (true);

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
