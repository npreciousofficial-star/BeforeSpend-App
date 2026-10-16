-- =====================================================================
-- BeforeSpend Database & Storage Security Hardening Script (Fixed & Hardened)
-- =====================================================================
-- Run this script in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/soqllmwmojyzvathirdd/sql/new
--
-- Fixes:
-- 1. Eliminates PostgreSQL 42P17 infinite recursion bug by using a SECURITY DEFINER
--    is_admin() function to check admin roles safely.
-- 2. Creates an automated trigger on auth.users to ensure public.profiles is ALWAYS
--    created cleanly upon registration or Google OAuth, preventing missing profiles.
-- 3. Enforces strict, user-isolated Row Level Security (RLS) across all 8 tables and storage.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. ADMIN & ROLE HELPER FUNCTIONS (Prevents Infinite Recursion)
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'Platform Administrator'
  );
$$;

create or replace function public.get_my_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Grant execution to authenticated and anon roles
grant execute on function public.is_admin() to authenticated, anon;
grant execute on function public.get_my_role() to authenticated, anon;

-- ---------------------------------------------------------------------
-- 0.1 AUTOMATED PROFILE CREATION TRIGGER ON AUTH SIGNUP
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, 
    email, 
    name, 
    role, 
    default_currency, 
    avatar, 
    phone_number, 
    country, 
    updated_at
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case 
      when new.email in ('admin@beforespend.app', 'admin@beforespend.xyz') then 'Platform Administrator'
      when new.raw_user_meta_data->>'role' = 'Platform Administrator' then 'Personal Budgeter'
      else coalesce(new.raw_user_meta_data->>'role', 'Personal Budgeter')
    end,
    coalesce(new.raw_user_meta_data->>'default_currency', 'NGN'),
    'preset-emerald',
    new.raw_user_meta_data->>'phone_number',
    new.raw_user_meta_data->>'country',
    now()
  )
  on conflict (id) do update set
    name = coalesce(excluded.name, public.profiles.name),
    email = excluded.email,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------
-- 1. PROFILES TABLE RLS
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "Public manage profiles" on public.profiles;
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Admins can delete profiles" on public.profiles;

-- Users can read their own profile; admins can read all profiles
create policy "Users can view own profile"
    on public.profiles for select
    using (auth.uid() = id or public.is_admin());

-- Users can insert their own profile on registration (or admins)
create policy "Users can insert own profile"
    on public.profiles for insert
    with check (auth.uid() = id or public.is_admin());

-- Users can update their own profile; non-admins cannot elevate their own role
create policy "Users can update own profile"
    on public.profiles for update
    using (auth.uid() = id or public.is_admin())
    with check (
        public.is_admin()
        or (
            auth.uid() = id 
            and (role = public.get_my_role() or role is null or public.get_my_role() is null)
        )
    );

-- Only admins can delete profiles
create policy "Admins can delete profiles"
    on public.profiles for delete
    using (public.is_admin());


-- ---------------------------------------------------------------------
-- 2. BUCKETS TABLE RLS
-- ---------------------------------------------------------------------
alter table public.buckets enable row level security;

drop policy if exists "Public manage buckets" on public.buckets;
drop policy if exists "Users can control own buckets" on public.buckets;
drop policy if exists "Admins can view all buckets" on public.buckets;

create policy "Users can control own buckets"
    on public.buckets for all
    using (auth.uid() = user_id or public.is_admin())
    with check (auth.uid() = user_id or public.is_admin());


-- ---------------------------------------------------------------------
-- 3. TRANSACTIONS LEDGER TABLE RLS
-- ---------------------------------------------------------------------
alter table public.transactions enable row level security;

drop policy if exists "Public manage transactions" on public.transactions;
drop policy if exists "Users can manage own transactions" on public.transactions;

create policy "Users can manage own transactions"
    on public.transactions for all
    using (auth.uid() = user_id or public.is_admin())
    with check (auth.uid() = user_id or public.is_admin());


-- ---------------------------------------------------------------------
-- 4. PAYMENTS TABLE RLS
-- ---------------------------------------------------------------------
alter table public.payments enable row level security;

drop policy if exists "Public manage payments" on public.payments;
drop policy if exists "Users can manage own payments" on public.payments;

create policy "Users can manage own payments"
    on public.payments for all
    using (auth.uid() = user_id or public.is_admin())
    with check (auth.uid() = user_id or public.is_admin());


-- ---------------------------------------------------------------------
-- 5. MILESTONES TABLE RLS
-- ---------------------------------------------------------------------
alter table public.milestones enable row level security;

drop policy if exists "Public manage milestones" on public.milestones;
drop policy if exists "Users can manage own milestones" on public.milestones;

create policy "Users can manage own milestones"
    on public.milestones for all
    using (auth.uid() = user_id or public.is_admin())
    with check (auth.uid() = user_id or public.is_admin());


-- ---------------------------------------------------------------------
-- 6. REMINDERS TABLE RLS
-- ---------------------------------------------------------------------
alter table public.reminders enable row level security;

drop policy if exists "Public manage reminders" on public.reminders;
drop policy if exists "Users can manage own reminders" on public.reminders;

create policy "Users can manage own reminders"
    on public.reminders for all
    using (auth.uid() = user_id or public.is_admin())
    with check (auth.uid() = user_id or public.is_admin());


-- ---------------------------------------------------------------------
-- 7. NOTIFICATIONS TABLE RLS
-- ---------------------------------------------------------------------
alter table public.notifications enable row level security;

drop policy if exists "Public manage notifications" on public.notifications;
drop policy if exists "Users can manage own notifications" on public.notifications;

create policy "Users can manage own notifications"
    on public.notifications for all
    using (auth.uid() = user_id or public.is_admin())
    with check (auth.uid() = user_id or public.is_admin());


-- ---------------------------------------------------------------------
-- 8. EXPENSES TABLE RLS
-- ---------------------------------------------------------------------
alter table public.expenses enable row level security;

drop policy if exists "Public manage expenses" on public.expenses;
drop policy if exists "Users can manage own expenses" on public.expenses;

create policy "Users can manage own expenses"
    on public.expenses for all
    using (auth.uid() = user_id or public.is_admin())
    with check (auth.uid() = user_id or public.is_admin());


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
        and (
            (storage.foldername(name))[1] = auth.uid()::text
            or public.is_admin()
        )
    )
    with check (
        bucket_id = 'avatars'
        and (
            (storage.foldername(name))[1] = auth.uid()::text
            or public.is_admin()
        )
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
            or public.is_admin()
        )
    )
    with check (
        bucket_id = 'receipts'
        and (
            (storage.foldername(name))[1] = auth.uid()::text
            or public.is_admin()
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
            or public.is_admin()
        )
    )
    with check (
        bucket_id = 'statements'
        and (
            (storage.foldername(name))[1] = auth.uid()::text
            or public.is_admin()
        )
    );
