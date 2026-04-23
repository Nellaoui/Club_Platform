-- Student progress tracking table.
-- Students can log updates, upload final results, and compare progress.

CREATE TABLE IF NOT EXISTS public.student_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  notes text,
  progress_percent smallint NOT NULL CHECK (progress_percent >= 0 AND progress_percent <= 100),
  result_link text,
  is_final boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read progress board.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'student_progress'
      AND policyname = 'student_progress_read_authenticated'
  ) THEN
    CREATE POLICY student_progress_read_authenticated
      ON public.student_progress
      FOR SELECT
      USING (auth.uid() IS NOT NULL);
  END IF;
END
$$;

-- Students can insert their own progress updates.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'student_progress'
      AND policyname = 'student_progress_insert_own'
  ) THEN
    CREATE POLICY student_progress_insert_own
      ON public.student_progress
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

-- Students can update/delete their own entries.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'student_progress'
      AND policyname = 'student_progress_modify_own'
  ) THEN
    CREATE POLICY student_progress_modify_own
      ON public.student_progress
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'student_progress'
      AND policyname = 'student_progress_delete_own'
  ) THEN
    CREATE POLICY student_progress_delete_own
      ON public.student_progress
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_student_progress_user_created
  ON public.student_progress(user_id, created_at DESC);
