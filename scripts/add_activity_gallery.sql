-- Add table for admin-posted activity gallery images.

CREATE TABLE IF NOT EXISTS public.activity_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text NOT NULL,
  event_date date,
  created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_images ENABLE ROW LEVEL SECURITY;

-- Admins can manage all rows.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'activity_images'
      AND policyname = 'activity_images_admin_all'
  ) THEN
    CREATE POLICY activity_images_admin_all
      ON public.activity_images
      FOR ALL
      USING (
        EXISTS (
          SELECT 1
          FROM public.users
          WHERE users.id = auth.uid() AND users.role = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.users
          WHERE users.id = auth.uid() AND users.role = 'admin'
        )
      );
  END IF;
END
$$;

-- Authenticated users can read gallery items.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'activity_images'
      AND policyname = 'activity_images_read_authenticated'
  ) THEN
    CREATE POLICY activity_images_read_authenticated
      ON public.activity_images
      FOR SELECT
      USING (auth.uid() IS NOT NULL);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_activity_images_created_at
  ON public.activity_images(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_images_event_date
  ON public.activity_images(event_date DESC);
