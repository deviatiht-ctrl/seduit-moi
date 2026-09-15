BEGIN;

ALTER TABLE public.seduis_moi_rooms
    ADD COLUMN IF NOT EXISTS game_id text;

ALTER TABLE public.seduis_moi_invitations
    ADD COLUMN IF NOT EXISTS sender_name text,
    ADD COLUMN IF NOT EXISTS sender_avatar text;

DO $$
DECLARE
    table_name text;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        RAISE EXCEPTION 'Publication supabase_realtime introuvable. Vérifiez la configuration Realtime du projet Supabase.';
    END IF;

    FOREACH table_name IN ARRAY ARRAY['seduis_moi_rooms', 'seduis_moi_invitations']
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime'
              AND schemaname = 'public'
              AND tablename = table_name
        ) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', table_name);
        END IF;
    END LOOP;
END;
$$;

COMMIT;

SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND schemaname = 'public'
  AND tablename IN ('seduis_moi_rooms', 'seduis_moi_invitations')
ORDER BY tablename;
