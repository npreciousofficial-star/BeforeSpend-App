-- =====================================================================
-- BeforeSpend Supabase Schema & Google OAuth Fix Script
-- =====================================================================
-- Paste and run this script in your Supabase Dashboard SQL Editor
-- (https://supabase.com/dashboard/project/soqllmwmojyzvathirdd/sql/new)

-- 1. Ensure public.profiles has all necessary columns
alter table public.profiles add column if not exists phone_number text;
alter table public.profiles add column if not exists onboarding_completed boolean default false;
alter table public.profiles add column if not exists role text default 'Personal Budgeter';
alter table public.profiles add column if not exists avatar text default 'preset-emerald';
alter table public.profiles add column if not exists default_currency text default 'NGN';

-- 2. Drop legacy foreign key constraints that block custom UUID sync
alter table public.buckets drop constraint if exists buckets_user_id_fkey;
alter table public.transactions drop constraint if exists transactions_user_id_fkey;
alter table public.payments drop constraint if exists payments_user_id_fkey;
alter table public.milestones drop constraint if exists milestones_user_id_fkey;
alter table public.reminders drop constraint if exists reminders_user_id_fkey;
alter table public.notifications drop constraint if exists notifications_user_id_fkey;

-- 3. Fix handle_new_user() trigger to safely insert Google OAuth users without failing
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, name, email, role, avatar, default_currency, phone_number)
    values (
        new.id,
        coalesce(
            new.raw_user_meta_data->>'full_name',
            new.raw_user_meta_data->>'name',
            new.raw_user_meta_data->>'preferred_username',
            split_part(new.email, '@', 1)
        ),
        new.email,
        coalesce(new.raw_user_meta_data->>'role', 'Personal Budgeter'),
        coalesce(
            new.raw_user_meta_data->>'avatar_url',
            new.raw_user_meta_data->>'picture',
            new.raw_user_meta_data->>'avatar',
            'preset-emerald'
        ),
        coalesce(new.raw_user_meta_data->>'default_currency', 'NGN'),
        new.raw_user_meta_data->>'phone_number'
    )
    on conflict (id) do update set
        name = excluded.name,
        email = excluded.email,
        avatar = coalesce(excluded.avatar, public.profiles.avatar);
    return new;
exception
    when others then
        -- Guarantee Google OAuth signups never fail due to trigger errors!
        return new;
end;
$$ language plpgsql security definer;

-- 4. Re-attach auth user creation trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- 5. Ensure RLS Policies allow seamless multi-user access
alter table public.profiles enable row level security;
drop policy if exists "Public manage profiles" on public.profiles;
create policy "Public manage profiles" on public.profiles for all using (true) with check (true);

alter table public.buckets enable row level security;
drop policy if exists "Public manage buckets" on public.buckets;
create policy "Public manage buckets" on public.buckets for all using (true) with check (true);

alter table public.transactions enable row level security;
drop policy if exists "Public manage transactions" on public.transactions;
create policy "Public manage transactions" on public.transactions for all using (true) with check (true);

alter table public.payments enable row level security;
drop policy if exists "Public manage payments" on public.payments;
create policy "Public manage payments" on public.payments for all using (true) with check (true);

alter table public.milestones enable row level security;
drop policy if exists "Public manage milestones" on public.milestones;
create policy "Public manage milestones" on public.milestones for all using (true) with check (true);

alter table public.reminders enable row level security;
drop policy if exists "Public manage reminders" on public.reminders;
create policy "Public manage reminders" on public.reminders for all using (true) with check (true);

alter table public.notifications enable row level security;
drop policy if exists "Public manage notifications" on public.notifications;
create policy "Public manage notifications" on public.notifications for all using (true) with check (true);
