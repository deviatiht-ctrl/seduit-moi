-- ============================================================
-- FIX AUTH SYSTEM - SQL Script pou kreye itilizatè san erè
-- Kouri sa nan Supabase SQL Editor pou fixer enskripsyon
-- ============================================================

-- 1. Verify ou kreye tab seduis_moi_profiles si li pa egziste
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'seduis_moi_profiles'
    ) THEN
        CREATE TABLE seduis_moi_profiles (
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
        RAISE NOTICE '✅ Tab seduis_moi_profiles kreye siksèfuleman';
    ELSE
        RAISE NOTICE '✅ Tab seduis_moi_profiles deja egziste';
    END IF;
END $$;

-- 2. Verify si kolòn nouvo yo egziste epi ajoute yo si yo pa la
DO $$
BEGIN
    -- Verify si tab egziste
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'seduis_moi_profiles'
    ) THEN
        -- Add kolòn si yo pa egziste
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'seduis_moi_profiles' AND column_name = 'email'
        ) THEN
            ALTER TABLE seduis_moi_profiles ADD COLUMN email text NOT NULL;
            RAISE NOTICE '✅ Kolòn email ajoute';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'seduis_moi_profiles' AND column_name = 'name'
        ) THEN
            ALTER TABLE seduis_moi_profiles ADD COLUMN name text;
            RAISE NOTICE '✅ Kolòn name ajoute';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'seduis_moi_profiles' AND column_name = 'surname'
        ) THEN
            ALTER TABLE seduis_moi_profiles ADD COLUMN surname text;
            RAISE NOTICE '✅ Kolòn surname ajoute';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'seduis_moi_profiles' AND column_name = 'gender'
        ) THEN
            ALTER TABLE seduis_moi_profiles ADD COLUMN gender text DEFAULT 'other';
            RAISE NOTICE '✅ Kolòn gender ajoute';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'seduis_moi_profiles' AND column_name = 'avatar_url'
        ) THEN
            ALTER TABLE seduis_moi_profiles ADD COLUMN avatar_url text;
            RAISE NOTICE '✅ Kolòn avatar_url ajoute';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'seduis_moi_profiles' AND column_name = 'is_online'
        ) THEN
            ALTER TABLE seduis_moi_profiles ADD COLUMN is_online boolean DEFAULT false;
            RAISE NOTICE '✅ Kolòn is_online ajoute';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'seduis_moi_profiles' AND column_name = 'created_at'
        ) THEN
            ALTER TABLE seduis_moi_profiles ADD COLUMN created_at timestamptz DEFAULT now();
            RAISE NOTICE '✅ Kolòn created_at ajoute';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'seduis_moi_profiles' AND column_name = 'updated_at'
        ) THEN
            ALTER TABLE seduis_moi_profiles ADD COLUMN updated_at timestamptz DEFAULT now();
            RAISE NOTICE '✅ Kolòn updated_at ajoute';
        END IF;
    END IF;
END $$;

-- 3. Active RLS si li pa deja active
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'seduis_moi_profiles'
    ) THEN
        -- Verify si RLS deja active
        IF NOT EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE tablename = 'seduis_moi_profiles' AND rowsecurity = true
        ) THEN
            ALTER TABLE seduis_moi_profiles ENABLE ROW LEVEL SECURITY;
            RAISE NOTICE '✅ RLS active pou seduis_moi_profiles';
        ELSE
            RAISE NOTICE '✅ RLS deja active pou seduis_moi_profiles';
        END IF;
    END IF;
END $$;

-- 4. Kreye RLS policies pou sekirite
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'seduis_moi_profiles'
    ) THEN
        -- DROP ansyen policies si yo egziste
        DROP POLICY IF EXISTS "seduis_moi profiles select" ON seduis_moi_profiles;
        DROP POLICY IF EXISTS "seduis_moi profiles insert" ON seduis_moi_profiles;
        DROP POLICY IF EXISTS "seduis_moi profiles update" ON seduis_moi_profiles;
        DROP POLICY IF EXISTS "seduis_moi profiles delete" ON seduis_moi_profiles;

        -- Kreye nouvo policies
        CREATE POLICY "seduis_moi profiles select" ON seduis_moi_profiles
            FOR SELECT USING (auth.uid()::text = id::text);

        CREATE POLICY "seduis_moi profiles insert" ON seduis_moi_profiles
            FOR INSERT WITH CHECK (auth.uid()::text = id::text);

        CREATE POLICY "seduis_moi profiles update" ON seduis_moi_profiles
            FOR UPDATE USING (auth.uid()::text = id::text);

        CREATE POLICY "seduis_moi profiles delete" ON seduis_moi_profiles
            FOR DELETE USING (auth.uid()::text = id::text);

        RAISE NOTICE '✅ RLS policies kreye pou seduis_moi_profiles';
    END IF;
END $$;

-- 5. Kreye indexes pou performans
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'seduis_moi_profiles'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_seduis_moi_profiles_id ON seduis_moi_profiles(id);
        CREATE INDEX IF NOT EXISTS idx_seduis_moi_profiles_email ON seduis_moi_profiles(email);
        CREATE INDEX IF NOT EXISTS idx_seduis_moi_profiles_online ON seduis_moi_profiles(is_online, updated_at DESC);
        RAISE NOTICE '✅ Indexes kreye pou seduis_moi_profiles';
    END IF;
END $$;

-- 6. Kreye trigger pou updated_at
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'seduis_moi_profiles'
    ) THEN
        -- Verify si function egziste
        IF NOT EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = 'seduis_moi_update_timestamp'
        ) THEN
            CREATE OR REPLACE FUNCTION seduis_moi_update_timestamp()
            RETURNS trigger AS $$
            BEGIN
                NEW.updated_at = now();
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        END IF;

        -- Kreye trigger
        DROP TRIGGER IF EXISTS seduis_moi_profiles_updated_at ON seduis_moi_profiles;
        CREATE TRIGGER seduis_moi_profiles_updated_at
            BEFORE UPDATE ON seduis_moi_profiles
            FOR EACH ROW EXECUTE FUNCTION seduis_moi_update_timestamp();

        RAISE NOTICE '✅ Trigger updated_at kreye pou seduis_moi_profiles';
    END IF;
END $$;

-- 7. Verify si tab a aksesib
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'seduis_moi_profiles'
    ) THEN
        -- Test yon query senp
        PERFORM 1 FROM seduis_moi_profiles LIMIT 1;
        RAISE NOTICE '✅ Tab seduis_moi_profiles aksesib';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Erè lè tese akses tab: %', SQLERRM;
END $$;

-- 8. Verify lòt tab ki bezwen
DO $$
BEGIN
    -- Verify seduis_moi_games
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'seduis_moi_games'
    ) THEN
        CREATE TABLE seduis_moi_games (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            game_id text UNIQUE NOT NULL,
            game_name text NOT NULL,
            game_description text,
            game_category text DEFAULT 'dating',
            is_active boolean DEFAULT true,
            created_at timestamptz DEFAULT now(),
            updated_at timestamptz DEFAULT now()
        );
        RAISE NOTICE '✅ Tab seduis_moi_games kreye';
    END IF;

    -- Verify seduis_moi_users
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'seduis_moi_users'
    ) THEN
        CREATE TABLE seduis_moi_users (
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
        RAISE NOTICE '✅ Tab seduis_moi_users kreye';
    END IF;
END $$;

-- 9. Verify seduis_moi_rooms game_id kolòn
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
        RAISE NOTICE '✅ Kolòn game_id ajoute nan seduis_moi_rooms';
    END IF;
END $$;

-- 10. Ajoute done jwet inisyal si yo pa la
INSERT INTO seduis_moi_games (game_id, game_name, game_description, game_category) VALUES
('truth_dare', 'Vérité ou Défi', 'Jwèt klasik ak kesyon ak defi', 'dating'),
('roleplay', 'Jeu de Rôle', 'Simile sitiyasyon romantik', 'dating'),
('flirty_questions', 'Questions Flirteuses', 'Kesyon pou brake glas', 'dating'),
('couple_quiz', 'Quiz Couple', 'Test konésans koup la', 'dating'),
('would_you_rather', 'Tu préférerais', 'Chwa difisil', 'dating')
ON CONFLICT (game_id) DO NOTHING;

RAISE NOTICE '✅ Done jwet inisyal verifye/ajoute';

-- ============================================================
-- REZIME
-- ============================================================
RAISE NOTICE '🎉 Fix Auth System complete! Fòm enskripsyon dwe travay kounye a.';