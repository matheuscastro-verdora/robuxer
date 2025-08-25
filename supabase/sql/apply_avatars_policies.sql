-- Tornar bucket avatars público (leitura anônima via CDN) e criar políticas de escrita.
update storage.buckets set public = true where id = 'avatars';

-- Políticas idempotentes
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated upload avatars'
  ) THEN
    CREATE POLICY "Authenticated upload avatars"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'avatars');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated update avatars'
  ) THEN
    CREATE POLICY "Authenticated update avatars"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'avatars')
    WITH CHECK (bucket_id = 'avatars');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated delete avatars'
  ) THEN
    CREATE POLICY "Authenticated delete avatars"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'avatars');
  END IF;
END $$;
