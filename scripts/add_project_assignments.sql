-- Create projects and assignment model so progress can be tied to assigned projects.

CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  difficulty text NOT NULL DEFAULT 'Beginner' CHECK (difficulty IN ('Beginner', 'Medium', 'Advanced')),
  subject_tag text NOT NULL DEFAULT 'Coding' CHECK (subject_tag IN ('Coding', 'Robotics', 'AI', 'Game Development', 'STEM', 'Competition')),
  club_category text NOT NULL DEFAULT 'Beginner Club' CHECK (club_category IN ('Beginner Club', 'Coding Club', 'Robotics Club', 'AI Club', 'Competition Zone')),
  due_date date,
  featured_order smallint,
  created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);

-- Create the progress table here too so this migration can be run by itself.
CREATE TABLE IF NOT EXISTS public.student_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id uuid,
  title text NOT NULL,
  notes text,
  teacher_comment text,
  teacher_commented_at timestamptz,
  progress_percent smallint NOT NULL CHECK (progress_percent >= 0 AND progress_percent <= 100),
  result_link text,
  is_final boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  media_url text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
  caption text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  badge_name text NOT NULL,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, project_id, badge_name)
);

CREATE TABLE IF NOT EXISTS public.student_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  certificate_title text NOT NULL,
  certificate_url text,
  issued_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, project_id, certificate_title)
);

CREATE TABLE IF NOT EXISTS public.project_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, name)
);

CREATE TABLE IF NOT EXISTS public.project_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.project_teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);

ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS difficulty text NOT NULL DEFAULT 'Beginner';

ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS subject_tag text NOT NULL DEFAULT 'Coding';

ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS club_category text NOT NULL DEFAULT 'Beginner Club';

ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS due_date date;

ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS featured_order smallint;

ALTER TABLE public.student_progress
ADD COLUMN IF NOT EXISTS teacher_comment text;

ALTER TABLE public.student_progress
ADD COLUMN IF NOT EXISTS teacher_commented_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'projects_title_key'
  ) THEN
    ALTER TABLE public.projects
    ADD CONSTRAINT projects_title_key UNIQUE (title);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'projects_difficulty_check'
  ) THEN
    ALTER TABLE public.projects
    ADD CONSTRAINT projects_difficulty_check CHECK (difficulty IN ('Beginner', 'Medium', 'Advanced'));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'projects_subject_tag_check'
  ) THEN
    ALTER TABLE public.projects
    ADD CONSTRAINT projects_subject_tag_check CHECK (subject_tag IN ('Coding', 'Robotics', 'AI', 'Game Development', 'STEM', 'Competition'));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'projects_club_category_check'
  ) THEN
    ALTER TABLE public.projects
    ADD CONSTRAINT projects_club_category_check CHECK (club_category IN ('Beginner Club', 'Coding Club', 'Robotics Club', 'AI Club', 'Competition Zone'));
  END IF;
END
$$;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_team_members ENABLE ROW LEVEL SECURITY;

-- Read access for authenticated users on projects and assignments.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'projects'
      AND policyname = 'projects_read_authenticated'
  ) THEN
    CREATE POLICY projects_read_authenticated
      ON public.projects
      FOR SELECT
      USING (auth.uid() IS NOT NULL);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'project_media'
      AND policyname = 'project_media_read_authenticated'
  ) THEN
    CREATE POLICY project_media_read_authenticated
      ON public.project_media
      FOR SELECT
      USING (auth.uid() IS NOT NULL);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'student_badges'
      AND policyname = 'student_badges_read_authenticated'
  ) THEN
    CREATE POLICY student_badges_read_authenticated
      ON public.student_badges
      FOR SELECT
      USING (auth.uid() IS NOT NULL);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'student_certificates'
      AND policyname = 'student_certificates_read_authenticated'
  ) THEN
    CREATE POLICY student_certificates_read_authenticated
      ON public.student_certificates
      FOR SELECT
      USING (auth.uid() IS NOT NULL);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'project_teams'
      AND policyname = 'project_teams_read_authenticated'
  ) THEN
    CREATE POLICY project_teams_read_authenticated
      ON public.project_teams
      FOR SELECT
      USING (auth.uid() IS NOT NULL);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'project_team_members'
      AND policyname = 'project_team_members_read_authenticated'
  ) THEN
    CREATE POLICY project_team_members_read_authenticated
      ON public.project_team_members
      FOR SELECT
      USING (auth.uid() IS NOT NULL);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'project_assignments'
      AND policyname = 'project_assignments_read_authenticated'
  ) THEN
    CREATE POLICY project_assignments_read_authenticated
      ON public.project_assignments
      FOR SELECT
      USING (auth.uid() IS NOT NULL);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'project_media'
      AND policyname = 'project_media_owner_or_admin_write'
  ) THEN
    CREATE POLICY project_media_owner_or_admin_write
      ON public.project_media
      FOR ALL
      USING (
        auth.uid() = user_id
        OR EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid() AND users.role = 'admin'
        )
      )
      WITH CHECK (
        auth.uid() = user_id
        OR EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid() AND users.role = 'admin'
        )
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'student_badges'
      AND policyname = 'student_badges_admin_write'
  ) THEN
    CREATE POLICY student_badges_admin_write
      ON public.student_badges
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid() AND users.role = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid() AND users.role = 'admin'
        )
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'student_certificates'
      AND policyname = 'student_certificates_admin_write'
  ) THEN
    CREATE POLICY student_certificates_admin_write
      ON public.student_certificates
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid() AND users.role = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid() AND users.role = 'admin'
        )
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'project_teams'
      AND policyname = 'project_teams_admin_write'
  ) THEN
    CREATE POLICY project_teams_admin_write
      ON public.project_teams
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid() AND users.role = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid() AND users.role = 'admin'
        )
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'project_team_members'
      AND policyname = 'project_team_members_admin_write'
  ) THEN
    CREATE POLICY project_team_members_admin_write
      ON public.project_team_members
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid() AND users.role = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid() AND users.role = 'admin'
        )
      );
  END IF;
END
$$;

-- Admin write access for projects and assignments.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'projects'
      AND policyname = 'projects_admin_write'
  ) THEN
    CREATE POLICY projects_admin_write
      ON public.projects
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid() AND users.role = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid() AND users.role = 'admin'
        )
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'project_assignments'
      AND policyname = 'project_assignments_admin_write'
  ) THEN
    CREATE POLICY project_assignments_admin_write
      ON public.project_assignments
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid() AND users.role = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid() AND users.role = 'admin'
        )
      );
  END IF;
END
$$;

-- Link student progress entries to assigned projects.
ALTER TABLE public.student_progress
ADD COLUMN IF NOT EXISTS project_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'student_progress'
      AND constraint_name = 'student_progress_project_id_fkey'
  ) THEN
    ALTER TABLE public.student_progress
    ADD CONSTRAINT student_progress_project_id_fkey
    FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_project_assignments_user_id
  ON public.project_assignments(user_id);

CREATE INDEX IF NOT EXISTS idx_student_progress_project_id
  ON public.student_progress(project_id);

CREATE INDEX IF NOT EXISTS idx_projects_subject_tag
  ON public.projects(subject_tag);

CREATE INDEX IF NOT EXISTS idx_projects_club_category
  ON public.projects(club_category);

CREATE INDEX IF NOT EXISTS idx_project_media_project_id
  ON public.project_media(project_id);

CREATE INDEX IF NOT EXISTS idx_student_badges_user_id
  ON public.student_badges(user_id);

CREATE INDEX IF NOT EXISTS idx_student_certificates_user_id
  ON public.student_certificates(user_id);

-- Seed the 34 requested projects. Uses the first admin as creator.
WITH admin_user AS (
  SELECT id FROM public.users WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1
)
INSERT INTO public.projects (title, description, difficulty, subject_tag, club_category, created_by, featured_order)
SELECT seed.title, seed.description, seed.difficulty, seed.subject_tag, seed.club_category, admin_user.id, seed.featured_order
FROM admin_user,
(
  VALUES
    ('Build a Line-Following Robot', 'Robot uses sensors to follow a black line track.', 'Beginner', 'Robotics', 'Robotics Club', 1),
    ('Obstacle Avoiding Smart Car', 'Robot car detects walls and changes direction automatically.', 'Beginner', 'Robotics', 'Robotics Club', 2),
    ('Smart Traffic Light System', 'Create traffic lights with LEDs and timers.', 'Beginner', 'Robotics', 'Robotics Club', NULL),
    ('Robot Arm Pick and Place', 'Program robotic arm to move objects.', 'Advanced', 'Robotics', 'Robotics Club', NULL),
    ('Bluetooth Controlled Car', 'Control robot with phone app.', 'Medium', 'Robotics', 'Robotics Club', NULL),
    ('Maze Solving Robot', 'Robot finds exit path in maze.', 'Advanced', 'Robotics', 'Competition Zone', NULL),
    ('Automatic Plant Watering System', 'Soil sensor waters plant when dry.', 'Beginner', 'STEM', 'Beginner Club', 6),
    ('Smart Door Lock with Password', 'Use keypad and servo lock.', 'Medium', 'Robotics', 'Robotics Club', 10),
    ('Build a School Website', 'Students create HTML and CSS website.', 'Beginner', 'Coding', 'Coding Club', 3),
    ('Quiz Game App', 'Create quiz with score system.', 'Beginner', 'Coding', 'Coding Club', 4),
    ('Calculator Application', 'Simple desktop or web calculator.', 'Beginner', 'Coding', 'Coding Club', NULL),
    ('Attendance Tracker', 'Student database plus attendance tracking.', 'Medium', 'Coding', 'Coding Club', 8),
    ('Weather App', 'Gets live weather data online.', 'Medium', 'Coding', 'Coding Club', NULL),
    ('Typing Speed Tester', 'Measure typing speed.', 'Beginner', 'Coding', 'Coding Club', NULL),
    ('Digital Clock with Alarm', 'Clock app with alarms.', 'Beginner', 'Coding', 'Coding Club', NULL),
    ('Create a Maze Game', 'Player escapes maze.', 'Medium', 'Game Development', 'Coding Club', NULL),
    ('Space Shooter Game', 'Classic shooting game.', 'Medium', 'Game Development', 'Coding Club', 7),
    ('Flappy Bird Clone', 'Fun physics game.', 'Medium', 'Game Development', 'Coding Club', NULL),
    ('Math Challenge Game', 'Solve equations fast.', 'Beginner', 'Game Development', 'Coding Club', NULL),
    ('Multiplayer Quiz Battle', 'Students compete live.', 'Advanced', 'Game Development', 'Competition Zone', NULL),
    ('AI Poster Generator', 'Create posters with AI.', 'Beginner', 'AI', 'AI Club', 5),
    ('Make a Cartoon Video', 'Use AI tools for animation.', 'Medium', 'AI', 'AI Club', NULL),
    ('Voice Assistant Bot', 'Basic chatbot with speech.', 'Medium', 'AI', 'AI Club', NULL),
    ('Face Recognition Attendance', 'Camera recognizes students.', 'Advanced', 'AI', 'AI Club', NULL),
    ('AI Story Generator', 'Generate stories with prompts.', 'Beginner', 'AI', 'AI Club', NULL),
    ('Solar Powered Fan', 'Use solar panel energy.', 'Beginner', 'STEM', 'Beginner Club', NULL),
    ('Earthquake Alarm Sensor', 'Vibration sensor alerts.', 'Medium', 'STEM', 'Beginner Club', NULL),
    ('Mini Weather Station', 'Temperature and humidity display.', 'Beginner', 'STEM', 'Beginner Club', 9),
    ('Water Level Alarm', 'Tank overflow detector.', 'Beginner', 'STEM', 'Beginner Club', NULL),
    ('Wind Turbine Generator', 'Build small turbine.', 'Advanced', 'STEM', 'Competition Zone', NULL),
    ('Battle Bot Challenge', 'Robots push opponents.', 'Advanced', 'Competition', 'Competition Zone', NULL),
    ('Fastest Line Robot Race', 'Speed competition.', 'Advanced', 'Competition', 'Competition Zone', NULL),
    ('Best Smart City Model', 'Teams build future city.', 'Advanced', 'Competition', 'Competition Zone', NULL),
    ('Innovation Challenge', 'Solve school problem using tech.', 'Advanced', 'Competition', 'Competition Zone', NULL)
) AS seed(title, description, difficulty, subject_tag, club_category, featured_order)
ON CONFLICT (title) DO UPDATE
SET
  description = EXCLUDED.description,
  difficulty = EXCLUDED.difficulty,
  subject_tag = EXCLUDED.subject_tag,
  club_category = EXCLUDED.club_category,
  featured_order = EXCLUDED.featured_order,
  updated_at = now();
