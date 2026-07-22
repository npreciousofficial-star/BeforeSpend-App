-- =====================================================================
-- BeforeSpend Supabase Data Wipe & Production Reset Script
-- =====================================================================
-- RUN THIS SCRIPT IN YOUR SUPABASE SQL EDITOR TO WIPE ALL DUMMY / TEST DATA
-- BEFORE GOING LIVE.
--
-- CAUTION: This will delete all user profiles, transactions, buckets, 
-- payment history, milestones, reminders, and auth user accounts.

BEGIN;

-- 1. Truncate all application data tables
TRUNCATE TABLE public.payments CASCADE;
TRUNCATE TABLE public.transactions CASCADE;
TRUNCATE TABLE public.milestones CASCADE;
TRUNCATE TABLE public.reminders CASCADE;
TRUNCATE TABLE public.notifications CASCADE;
TRUNCATE TABLE public.buckets CASCADE;
TRUNCATE TABLE public.profiles CASCADE;

-- 2. Delete registered users from Supabase Auth schema
DELETE FROM auth.users;

COMMIT;

-- Verification
SELECT 'Profiles Count' AS table_name, count(*) FROM public.profiles
UNION ALL
SELECT 'Payments Count', count(*) FROM public.payments
UNION ALL
SELECT 'Buckets Count', count(*) FROM public.buckets
UNION ALL
SELECT 'Auth Users Count', count(*) FROM auth.users;
