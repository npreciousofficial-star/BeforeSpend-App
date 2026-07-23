-- =====================================================================
-- BeforeSpend Supabase Production Data Wipe Script
-- Wipes all test/dummy user data while preserving the Admin Account
-- =====================================================================
-- Run this in your Supabase SQL Editor to reset your production database cleanly.

BEGIN;

-- 1. Truncate all transactional & user state tables
TRUNCATE TABLE public.payments CASCADE;
TRUNCATE TABLE public.transactions CASCADE;
TRUNCATE TABLE public.milestones CASCADE;
TRUNCATE TABLE public.reminders CASCADE;
TRUNCATE TABLE public.notifications CASCADE;
TRUNCATE TABLE public.buckets CASCADE;

-- 2. Delete all non-admin user profiles from profiles table
DELETE FROM public.profiles 
WHERE email NOT IN ('admin@beforespend.app', 'admin@beforespend.xyz', 'admin@beforespend.com');

-- 3. Delete all non-admin auth user accounts
DELETE FROM auth.users 
WHERE email NOT IN ('admin@beforespend.app', 'admin@beforespend.xyz', 'admin@beforespend.com');

COMMIT;

-- Verification: Output remaining counts
SELECT 'Profiles Count' AS table_name, count(*) FROM public.profiles
UNION ALL
SELECT 'Payments Count', count(*) FROM public.payments
UNION ALL
SELECT 'Transactions Count', count(*) FROM public.transactions
UNION ALL
SELECT 'Buckets Count', count(*) FROM public.buckets
UNION ALL
SELECT 'Auth Users Count', count(*) FROM auth.users;
