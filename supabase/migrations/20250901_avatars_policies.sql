-- Buckets/Policies para avatars (idempotente)

-- Tornar público (caso não esteja)
update storage.buckets set public = true where id = 'avatars';

-- Leitura pública
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read avatars'
  ) THEN
    CREATE POLICY "Public read avatars"
    ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'avatars');
  END IF;
END $$;

-- Upload autenticado (próprio diretório)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated upload avatars (own folder)'
  ) THEN
    CREATE POLICY "Authenticated upload avatars (own folder)"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = 'avatars'
      AND name LIKE auth.uid()::text || '/%'
    );
  END IF;
END $$;

-- Update autenticado (próprio diretório)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated update avatars (own folder)'
  ) THEN
    CREATE POLICY "Authenticated update avatars (own folder)"
    ON storage.objects FOR UPDATE TO authenticated
    USING (
      bucket_id = 'avatars'
      AND name LIKE auth.uid()::text || '/%'
    )
    WITH CHECK (
      bucket_id = 'avatars'
      AND name LIKE auth.uid()::text || '/%'
    );
  END IF;
END $$;

-- Delete autenticado (próprio diretório)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated delete avatars (own folder)'
  ) THEN
    CREATE POLICY "Authenticated delete avatars (own folder)"
    ON storage.objects FOR DELETE TO authenticated
    USING (
      bucket_id = 'avatars'
      AND name LIKE auth.uid()::text || '/%'
    );
  END IF;
END $$;


