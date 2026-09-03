-- ============================================================
-- SEDUIS MOI - Supabase Chat SQL Schema
-- Prefiks: seduis_moi_ (pou evite konfli ak lot pwojè)
-- ============================================================

-- TABLE MESSAJ CHAT (Real-time Live Chat)
CREATE TABLE IF NOT EXISTS seduis_moi_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code char(6) NOT NULL,
    sender_id text NOT NULL,
    sender_name text NOT NULL,
    sender_role text NOT NULL, -- 'host' | 'guest'
    content text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- INDEX pou pèfòmans ak rechèch rapid
CREATE INDEX IF NOT EXISTS idx_seduis_moi_messages_room ON seduis_moi_messages(room_code, created_at ASC);

-- RLS (Row Level Security)
ALTER TABLE seduis_moi_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seduis_moi messages select" ON seduis_moi_messages
    FOR SELECT USING (true);

CREATE POLICY "seduis_moi messages insert" ON seduis_moi_messages
    FOR INSERT WITH CHECK (true);

-- REALTIME REPLICATION (Obligatwa pou mesaj yo rive an tan reyèl)
-- (Ou ka ranje sa nan Supabase Dashboard → Database → Replication, oswa fe:)
-- ALTER PUBLICATION supabase_realtime ADD TABLE seduis_moi_messages;
