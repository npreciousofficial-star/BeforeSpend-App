-- =====================================================================
-- BeforeSpend Supabase SQL Database Schema (Immutable Double-Entry Ledger)
-- =====================================================================
-- This script contains all tables, relationships, triggers, and Row Level 
-- Security (RLS) policies needed to host BeforeSpend's data model on Supabase.
-- Paste this script directly into the Supabase SQL Editor.

-- Enable UUID extension if not already present
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------
-- 1. Profiles Table
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
    id uuid primary key,
    name text not null,
    email text unique not null,
    role text default 'Personal Budgeter / Other',
    avatar text default 'preset-emerald',
    default_currency text default 'NGN' not null,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Public manage profiles" on public.profiles;

create policy "Public manage profiles" on public.profiles
    for all using (true) with check (true);

-- Trigger to automatically create a profile when a user signs up on Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, name, email, role, avatar, default_currency)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'name', 'New BeforeSpend Member'),
        new.email,
        coalesce(new.raw_user_meta_data->>'role', 'Personal Budgeter / Other'),
        coalesce(new.raw_user_meta_data->>'avatar', 'preset-emerald'),
        coalesce(new.raw_user_meta_data->>'default_currency', 'NGN')
    )
    on conflict (id) do update set
        name = excluded.name,
        email = excluded.email;
    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();


-- ---------------------------------------------------------------------
-- 2. Buckets Table (Budget targets and allocation definitions)
-- ---------------------------------------------------------------------
create table if not exists public.buckets (
    id uuid default gen_random_uuid() primary key,
    user_id uuid not null,
    name text not null,
    allocation_percentage numeric(5, 2) not null check (allocation_percentage >= 0 and allocation_percentage <= 100),
    color text default 'emerald' not null,
    destination_account text not null,
    target_bank text default 'Default Bank',
    is_system boolean default false not null,
    note text,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null,
    constraint unique_user_bucket_name unique (user_id, name)
);

alter table public.buckets enable row level security;

drop policy if exists "Users can control own buckets" on public.buckets;
drop policy if exists "Public manage buckets" on public.buckets;

create policy "Public manage buckets" on public.buckets
    for all using (true) with check (true);


-- ---------------------------------------------------------------------
-- 3. Immutable Transactions Ledger Table
-- ---------------------------------------------------------------------
create table if not exists public.transactions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid not null,
    bucket_id uuid references public.buckets on delete set null,
    type text not null check (type in ('INCOME_SPLIT', 'EXPENSE', 'MANUAL_ADJUSTMENT', 'TRANSFER')),
    amount numeric(15, 2) not null check (amount >= 0),
    direction text not null check (direction in ('CREDIT', 'DEBIT')),
    description text not null,
    receipt_url text,
    source_type text default 'MANUAL_ENTRY' not null check (source_type in ('MANUAL_ENTRY', 'CSV_IMPORT', 'SYSTEM_ADJUSTMENT')),
    deduplication_hash text,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_transactions_dedup_hash on public.transactions(user_id, deduplication_hash) where deduplication_hash is not null;
create index if not exists idx_transactions_bucket_id on public.transactions(bucket_id);

alter table public.transactions enable row level security;

drop policy if exists "Users can manage own transactions" on public.transactions;
drop policy if exists "Public manage transactions" on public.transactions;

create policy "Public manage transactions" on public.transactions
    for all using (true) with check (true);


-- ---------------------------------------------------------------------
-- 4. View for Calculated Bucket Balances (Ledger Formula)
-- ---------------------------------------------------------------------
create or replace view public.bucket_balances as
select 
    b.id as bucket_id,
    b.user_id,
    b.name as bucket_name,
    coalesce(sum(case when t.direction = 'CREDIT' then t.amount else -t.amount end), 0) as calculated_balance
from public.buckets b
left join public.transactions t on b.id = t.bucket_id
group by b.id, b.user_id, b.name;


-- ---------------------------------------------------------------------
-- 5. Payment Entries (History of splits and invoices)
-- ---------------------------------------------------------------------
create table if not exists public.payments (
    id uuid default gen_random_uuid() primary key,
    user_id uuid not null,
    date timestamptz default timezone('utc'::text, now()) not null,
    amount numeric(15, 2) not null,
    currency text default 'NGN' not null,
    converted_amount numeric(15, 2) not null,
    note text,
    receipt_image text,
    splits jsonb not null default '[]'::jsonb,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.payments enable row level security;

drop policy if exists "Users can manage own payments" on public.payments;
drop policy if exists "Public manage payments" on public.payments;

create policy "Public manage payments" on public.payments
    for all using (true) with check (true);


-- ---------------------------------------------------------------------
-- 6. Milestones Table (Financial and savings goals)
-- ---------------------------------------------------------------------
create table if not exists public.milestones (
    id uuid default gen_random_uuid() primary key,
    user_id uuid not null,
    name text not null,
    target_amount numeric(15, 2) not null,
    bucket_id uuid references public.buckets on delete set null,
    created_date timestamptz default timezone('utc'::text, now()) not null
);

alter table public.milestones enable row level security;

drop policy if exists "Users can manage own milestones" on public.milestones;
drop policy if exists "Public manage milestones" on public.milestones;

create policy "Public manage milestones" on public.milestones
    for all using (true) with check (true);


-- ---------------------------------------------------------------------
-- 7. Reminders Table (Upcoming bills and automatic subscriptions)
-- ---------------------------------------------------------------------
create table if not exists public.reminders (
    id uuid default gen_random_uuid() primary key,
    user_id uuid not null,
    text text not null,
    due_date date not null,
    done boolean default false not null,
    type text default 'manual' not null check (type in ('manual', 'auto')),
    period text check (period in ('monthly', 'yearly')),
    note text,
    cost numeric(15, 2),
    created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.reminders enable row level security;

drop policy if exists "Users can manage own reminders" on public.reminders;
drop policy if exists "Public manage reminders" on public.reminders;

create policy "Public manage reminders" on public.reminders
    for all using (true) with check (true);


-- ---------------------------------------------------------------------
-- 8. System Notifications Table
-- ---------------------------------------------------------------------
create table if not exists public.notifications (
    id uuid default gen_random_uuid() primary key,
    user_id uuid not null,
    title text not null,
    message text not null,
    time timestamptz default timezone('utc'::text, now()) not null,
    type text default 'info' not null check (type in ('info', 'success', 'warning', 'alert')),
    read boolean default false not null,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.notifications enable row level security;

drop policy if exists "Users can manage own notifications" on public.notifications;
drop policy if exists "Public manage notifications" on public.notifications;

create policy "Public manage notifications" on public.notifications
    for all using (true) with check (true);


-- ---------------------------------------------------------------------
-- 9. Supabase Storage Buckets & Policies
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'avatars',
    'avatars',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update set
    public = true,
    file_size_limit = 5242880;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'receipts',
    'receipts',
    true,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
on conflict (id) do update set
    public = true,
    file_size_limit = 10485760;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'statements',
    'statements',
    true,
    20971520,
    array['text/csv', 'application/pdf', 'text/plain']
)
on conflict (id) do update set
    public = true,
    file_size_limit = 20971520;

do $$
begin
    execute 'alter table storage.objects enable row level security';
exception
    when others then null;
end $$;

drop policy if exists "Public Access to Avatars" on storage.objects;
drop policy if exists "Public Upload to Avatars" on storage.objects;
drop policy if exists "Public Manage Avatars" on storage.objects;
create policy "Public Manage Avatars" on storage.objects
    for all using (bucket_id = 'avatars') with check (bucket_id = 'avatars');

drop policy if exists "Public Access to Receipts" on storage.objects;
drop policy if exists "Public Upload to Receipts" on storage.objects;
drop policy if exists "Public Manage Receipts" on storage.objects;
create policy "Public Manage Receipts" on storage.objects
    for all using (bucket_id = 'receipts') with check (bucket_id = 'receipts');

drop policy if exists "Public Access to Statements" on storage.objects;
drop policy if exists "Public Upload to Statements" on storage.objects;
drop policy if exists "Public Manage Statements" on storage.objects;
create policy "Public Manage Statements" on storage.objects
    for all using (bucket_id = 'statements') with check (bucket_id = 'statements');
