-- Vexo Save beta schema
-- Run this in Supabase SQL Editor.

create extension if not exists "pgcrypto";

-- =========================
-- TABLES
-- =========================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  url text not null,
  title text not null,
  thumbnail_url text,
  category_id uuid,
  reminder_date timestamptz,
  created_at timestamptz not null default now()
);

-- =========================
-- CONSTRAINTS
-- =========================

alter table public.categories
  drop constraint if exists categories_id_user_id_unique;

alter table public.categories
  add constraint categories_id_user_id_unique
  unique (id, user_id);

alter table public.saved_items
  drop constraint if exists saved_items_category_id_fkey;

alter table public.saved_items
  drop constraint if exists saved_items_category_user_fkey;

alter table public.saved_items
  add constraint saved_items_category_user_fkey
  foreign key (category_id, user_id)
  references public.categories(id, user_id)
  on delete no action;

-- =========================
-- INDEXES
-- =========================

create index if not exists categories_user_id_idx
  on public.categories(user_id);

create index if not exists saved_items_user_id_idx
  on public.saved_items(user_id);

create index if not exists saved_items_category_id_idx
  on public.saved_items(category_id);

create index if not exists saved_items_reminder_date_idx
  on public.saved_items(reminder_date);

-- =========================
-- ROW LEVEL SECURITY
-- =========================

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.saved_items enable row level security;

-- =========================
-- PROFILES RLS
-- =========================

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles
  for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- =========================
-- CATEGORIES RLS
-- =========================

drop policy if exists "categories_select_own" on public.categories;
create policy "categories_select_own"
  on public.categories
  for select
  using (auth.uid() = user_id);

drop policy if exists "categories_insert_own" on public.categories;
create policy "categories_insert_own"
  on public.categories
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "categories_update_own" on public.categories;
create policy "categories_update_own"
  on public.categories
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "categories_delete_own" on public.categories;
create policy "categories_delete_own"
  on public.categories
  for delete
  using (auth.uid() = user_id);

-- =========================
-- SAVED ITEMS RLS
-- =========================

drop policy if exists "saved_items_select_own" on public.saved_items;
create policy "saved_items_select_own"
  on public.saved_items
  for select
  using (auth.uid() = user_id);

drop policy if exists "saved_items_insert_own" on public.saved_items;
create policy "saved_items_insert_own"
  on public.saved_items
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "saved_items_update_own" on public.saved_items;
create policy "saved_items_update_own"
  on public.saved_items
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "saved_items_delete_own" on public.saved_items;
create policy "saved_items_delete_own"
  on public.saved_items
  for delete
  using (auth.uid() = user_id);

-- =========================
-- AUTO PROFILE CREATION
-- =========================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'full_name'
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    )
  )
  on conflict (id) do update set
    email = excluded.email,
    name = excluded.name,
    avatar_url = excluded.avatar_url;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();