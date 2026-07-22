-- =====================================================================
-- BeforeSpend Supabase Schema Fix — Run this in the SQL Editor
-- =====================================================================
-- Root cause: The `buckets` table was created with an `allocation_percentage`
-- column, but PostgREST's schema cache was stale, causing 400 errors.
-- A previous fix attempt also added a `percentage` alias column, which
-- created a NOT NULL violation because the sync only sends `allocation_percentage`.
--
-- This script permanently fixes the schema and clears the cache.
-- =====================================================================

-- STEP 1: Drop any stale duplicate 'percentage' column if it was accidentally added
ALTER TABLE public.buckets DROP COLUMN IF EXISTS percentage;

-- STEP 2: Ensure allocation_percentage exists with correct constraints
ALTER TABLE public.buckets
  ADD COLUMN IF NOT EXISTS allocation_percentage numeric(5, 2) NOT NULL DEFAULT 0
    CHECK (allocation_percentage >= 0 AND allocation_percentage <= 100);

-- STEP 3: Ensure other required columns exist
ALTER TABLE public.buckets
  ADD COLUMN IF NOT EXISTS destination_account text NOT NULL DEFAULT 'Default Account';

ALTER TABLE public.buckets
  ADD COLUMN IF NOT EXISTS target_bank text DEFAULT 'Default Bank';

ALTER TABLE public.buckets
  ADD COLUMN IF NOT EXISTS is_system boolean DEFAULT false NOT NULL;

ALTER TABLE public.buckets
  ADD COLUMN IF NOT EXISTS note text;

ALTER TABLE public.buckets
  ADD COLUMN IF NOT EXISTS color text DEFAULT 'emerald' NOT NULL;

ALTER TABLE public.buckets
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL;

-- STEP 4: Ensure milestones table has created_date
ALTER TABLE public.milestones
  ADD COLUMN IF NOT EXISTS created_date timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL;

-- STEP 5: Ensure unique constraint exists on (user_id, name) for buckets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_bucket_name'
  ) THEN
    ALTER TABLE public.buckets
      ADD CONSTRAINT unique_user_bucket_name UNIQUE (user_id, name);
  END IF;
END $$;

-- STEP 6: CRITICAL — Reload the PostgREST schema cache to clear 400 errors
NOTIFY pgrst, 'reload schema';

-- STEP 7: RLS policies (recursion-free admin bypass via JWT claims)
ALTER TABLE public.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public manage buckets" ON public.buckets;
CREATE POLICY "Public manage buckets" ON public.buckets
  FOR ALL USING (
    auth.uid() = user_id 
    OR auth.jwt() ->> 'email' IN ('admin@beforespend.app', 'admin@beforespend.xyz')
    OR auth.jwt() -> 'user_metadata' ->> 'role' = 'Platform Administrator'
  ) WITH CHECK (
    auth.uid() = user_id 
    OR auth.jwt() ->> 'email' IN ('admin@beforespend.app', 'admin@beforespend.xyz')
    OR auth.jwt() -> 'user_metadata' ->> 'role' = 'Platform Administrator'
  );

DROP POLICY IF EXISTS "Public manage profiles" ON public.profiles;
CREATE POLICY "Public manage profiles" ON public.profiles
  FOR ALL USING (
    auth.uid() = id 
    OR auth.jwt() ->> 'email' IN ('admin@beforespend.app', 'admin@beforespend.xyz')
    OR auth.jwt() -> 'user_metadata' ->> 'role' = 'Platform Administrator'
  ) WITH CHECK (
    auth.uid() = id 
    OR auth.jwt() ->> 'email' IN ('admin@beforespend.app', 'admin@beforespend.xyz')
    OR auth.jwt() -> 'user_metadata' ->> 'role' = 'Platform Administrator'
  );

DROP POLICY IF EXISTS "Public manage transactions" ON public.transactions;
CREATE POLICY "Public manage transactions" ON public.transactions
  FOR ALL USING (
    auth.uid() = user_id 
    OR auth.jwt() ->> 'email' IN ('admin@beforespend.app', 'admin@beforespend.xyz')
    OR auth.jwt() -> 'user_metadata' ->> 'role' = 'Platform Administrator'
  );

DROP POLICY IF EXISTS "Public manage payments" ON public.payments;
CREATE POLICY "Public manage payments" ON public.payments
  FOR ALL USING (
    auth.uid() = user_id 
    OR auth.jwt() ->> 'email' IN ('admin@beforespend.app', 'admin@beforespend.xyz')
    OR auth.jwt() -> 'user_metadata' ->> 'role' = 'Platform Administrator'
  ) WITH CHECK (
    auth.uid() = user_id 
    OR auth.jwt() ->> 'email' IN ('admin@beforespend.app', 'admin@beforespend.xyz')
    OR auth.jwt() -> 'user_metadata' ->> 'role' = 'Platform Administrator'
  );

DROP POLICY IF EXISTS "Public manage milestones" ON public.milestones;
CREATE POLICY "Public manage milestones" ON public.milestones
  FOR ALL USING (
    auth.uid() = user_id 
    OR auth.jwt() ->> 'email' IN ('admin@beforespend.app', 'admin@beforespend.xyz')
    OR auth.jwt() -> 'user_metadata' ->> 'role' = 'Platform Administrator'
  ) WITH CHECK (
    auth.uid() = user_id 
    OR auth.jwt() ->> 'email' IN ('admin@beforespend.app', 'admin@beforespend.xyz')
    OR auth.jwt() -> 'user_metadata' ->> 'role' = 'Platform Administrator'
  );

DROP POLICY IF EXISTS "Public manage reminders" ON public.reminders;
CREATE POLICY "Public manage reminders" ON public.reminders
  FOR ALL USING (
    auth.uid() = user_id 
    OR auth.jwt() ->> 'email' IN ('admin@beforespend.app', 'admin@beforespend.xyz')
    OR auth.jwt() -> 'user_metadata' ->> 'role' = 'Platform Administrator'
  ) WITH CHECK (
    auth.uid() = user_id 
    OR auth.jwt() ->> 'email' IN ('admin@beforespend.app', 'admin@beforespend.xyz')
    OR auth.jwt() -> 'user_metadata' ->> 'role' = 'Platform Administrator'
  );

DROP POLICY IF EXISTS "Public manage notifications" ON public.notifications;
CREATE POLICY "Public manage notifications" ON public.notifications
  FOR ALL USING (
    auth.uid() = user_id 
    OR auth.jwt() ->> 'email' IN ('admin@beforespend.app', 'admin@beforespend.xyz')
    OR auth.jwt() -> 'user_metadata' ->> 'role' = 'Platform Administrator'
  ) WITH CHECK (
    auth.uid() = user_id 
    OR auth.jwt() ->> 'email' IN ('admin@beforespend.app', 'admin@beforespend.xyz')
    OR auth.jwt() -> 'user_metadata' ->> 'role' = 'Platform Administrator'
  );

-- STEP 8: Storage buckets (safe upsert)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif','image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 5242880;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('receipts', 'receipts', true, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif','application/pdf'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 10485760;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('statements', 'statements', true, 20971520, ARRAY['text/csv','application/pdf','text/plain'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 20971520;

-- =====================================================================
-- Done. Schema is now fully correct and PostgREST cache refreshed.
-- All bucket sync errors should be resolved.
-- =====================================================================
