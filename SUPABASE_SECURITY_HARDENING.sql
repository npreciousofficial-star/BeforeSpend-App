-- =====================================================================
-- BeforeSpend Database & Storage Security Hardening Script
-- =====================================================================
-- Run this script in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/soqllmwmojyzvathirdd/sql/new
--
-- This script replaces permissive "USING (true) WITH CHECK (true)" policies
-- with strict, authenticated, user-isolated Row Level Security (RLS) rules.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. PROFILES TABLE RLS
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "Public manage profiles" on public.profiles;
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;

-- Users can read their own profile; admins can read all profiles
create policy "Users can view own profile"
    on public.profiles for select
    using (
        auth.uid() = id
        or exists (
            select 1 from public.profiles
            where id = auth.uid() and role = 'Platform Administrator'
        )
    );

-- Users can insert their own profile on registration
create policy "Users can insert own profile"
    on public.profiles for insert
    with check (auth.uid() = id);

-- Users can update their own profile; non-admins cannot elevate their own role
create policy "Users can update own profile"
    on public.profiles for update
    using (auth.uid() = id)
    with check (
        auth.uid() = id
        and (
            role = (select p.role from public.profiles p where p.id = auth.uid())
            or exists (
                select 1 from public.profiles p
                where p.id = auth.uid() and p.role = 'Platform Administrator'
            )
        )
    );

-- Only admins can delete profiles
create policy "Admins can delete profiles"
    on public.profiles for delete
    using (
        exists (
            select 1 from public.profiles
            where id = auth.uid() and role = 'Platform Administrator'
        )
    );


-- ---------------------------------------------------------------------
-- 2. BUCKETS TABLE RLS
-- ---------------------------------------------------------------------
alter table public.buckets enable row level security;

drop policy if exists "Public manage buckets" on public.buckets;
drop policy if exists "Users can control own buckets" on public.buckets;
drop policy if exists "Admins can view all buckets" on public.buckets;

create policy "Users can control own buckets"
    on public.buckets for all
    using (
        auth.uid() = user_id
        or exists (
            select 1 from public.profiles
            where id = auth.uid() and role = 'Platform Administrator'
        )
    )
    with check (auth.uid() = user_id);


-- ---------------------------------------------------------------------
-- 3. TRANSACTIONS LEDGER TABLE RLS
-- ---------------------------------------------------------------------
alter table public.transactions enable row level security;

drop policy if exists "Public manage transactions" on public.transactions;
drop policy if exists "Users can manage own transactions" on public.transactions;

create policy "Users can manage own transactions"
    on public.transactions for all
    using (
        auth.uid() = user_id
        or exists (
            select 1 from public.profiles
            where id = auth.uid() and role = 'Platform Administrator'
        )
    )
    with check (auth.uid() = user_id);


-- ---------------------------------------------------------------------
-- 4. PAYMENTS TABLE RLS
-- ---------------------------------------------------------------------
alter table public.payments enable row level security;

drop policy if exists "Public manage payments" on public.payments;
drop policy if exists "Users can manage own payments" on public.payments;

create policy "Users can manage own payments"
    on public.payments for all
    using (
        auth.uid() = user_id
        or exists (
            select 1 from public.profiles
            where id = auth.uid() and role = 'Platform Administrator'
        )
    )
    with check (auth.uid() = user_id);


-- ---------------------------------------------------------------------
-- 5. MILESTONES TABLE RLS
-- ---------------------------------------------------------------------
alter table public.milestones enable row level security;

drop policy if exists "Public manage milestones" on public.milestones;
drop policy if exists "Users can manage own milestones" on public.milestones;

create policy "Users can manage own milestones"
    on public.milestones for all
    using (
        auth.uid() = user_id
        or exists (
            select 1 from public.profiles
            where id = auth.uid() and role = 'Platform Administrator'
        )
    )
    with check (auth.uid() = user_id);


-- ---------------------------------------------------------------------
-- 6. REMINDERS TABLE RLS
-- ---------------------------------------------------------------------
alter table public.reminders enable row level security;

drop policy if exists "Public manage reminders" on public.reminders;
drop policy if exists "Users can manage own reminders" on public.reminders;

create policy "Users can manage own reminders"
    on public.reminders for all
    using (
        auth.uid() = user_id
        or exists (
            select 1 from public.profiles
            where id = auth.uid() and role = 'Platform Administrator'
        )
    )
    with check (auth.uid() = user_id);


-- ---------------------------------------------------------------------
-- 7. NOTIFICATIONS TABLE RLS
-- ---------------------------------------------------------------------
alter table public.notifications enable row level security;

drop policy if exists "Public manage notifications" on public.notifications;
drop policy if exists "Users can manage own notifications" on public.notifications;

create policy "Users can manage own notifications"
    on public.notifications for all
    using (
        auth.uid() = user_id
        or exists (
            select 1 from public.profiles
            where id = auth.uid() and role = 'Platform Administrator'
        )
    )
    with check (
        auth.uid() = user_id
        or exists (
            select 1 from public.profiles
            where id = auth.uid() and role = 'Platform Administrator'
        )
    );


-- ---------------------------------------------------------------------
-- 8. EXPENSES TABLE RLS
-- ---------------------------------------------------------------------
alter table public.expenses enable row level security;

drop policy if exists "Public manage expenses" on public.expenses;
drop policy if exists "Users can manage own expenses" on public.expenses;

create policy "Users can manage own expenses"
    on public.expenses for all
    using (
        auth.uid() = user_id
        or exists (
            select 1 from public.profiles
            where id = auth.uid() and role = 'Platform Administrator'
        )
    )
    with check (auth.uid() = user_id);


-- ---------------------------------------------------------------------
-- 9. STORAGE OBJECTS SECURITY POLICIES
-- ---------------------------------------------------------------------
-- Avatars: Public read (for profile photos), authenticated write/delete restricted to own folder
drop policy if exists "Public Manage Avatars" on storage.objects;
drop policy if exists "Public Access to Avatars" on storage.objects;
drop policy if exists "Users can manage own avatar" on storage.objects;

create policy "Public Access to Avatars"
    on storage.objects for select
    using (bucket_id = 'avatars');

create policy "Users can manage own avatar"
    on storage.objects for all
    using (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
    )
    with check (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

-- Receipts: Authenticated read/upload/delete restricted strictly to own user folder or platform administrator
drop policy if exists "Public Manage Receipts" on storage.objects;
drop policy if exists "Users can manage own receipts" on storage.objects;

create policy "Users can manage own receipts"
    on storage.objects for all
    using (
        bucket_id = 'receipts'
        and (
            (storage.foldername(name))[1] = auth.uid()::text
            or exists (
                select 1 from public.profiles
                where id = auth.uid() and role = 'Platform Administrator'
            )
        )
    )
    with check (
        bucket_id = 'receipts'
        and (
            (storage.foldername(name))[1] = auth.uid()::text
            or exists (
                select 1 from public.profiles
                where id = auth.uid() and role = 'Platform Administrator'
            )
        )
    );

-- Statements: Authenticated read/upload/delete restricted strictly to own user folder or platform administrator
drop policy if exists "Public Manage Statements" on storage.objects;
drop policy if exists "Users can manage own statements" on storage.objects;

create policy "Users can manage own statements"
    on storage.objects for all
    using (
        bucket_id = 'statements'
        and (
            (storage.foldername(name))[1] = auth.uid()::text
            or exists (
                select 1 from public.profiles
                where id = auth.uid() and role = 'Platform Administrator'
            )
        )
    )
    with check (
        bucket_id = 'statements'
        and (
            (storage.foldername(name))[1] = auth.uid()::text
            or exists (
                select 1 from public.profiles
                where id = auth.uid() and role = 'Platform Administrator'
            )
        )
    );

