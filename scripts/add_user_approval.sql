-- Add approval gate for user access.
-- New users default to approved = false and must be approved by an admin.

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS approved boolean;

-- Backfill existing users as approved so current members keep access.
UPDATE public.users
SET approved = true
WHERE approved IS NULL;

ALTER TABLE public.users
ALTER COLUMN approved SET DEFAULT false;

ALTER TABLE public.users
ALTER COLUMN approved SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_approved
  ON public.users(approved);
