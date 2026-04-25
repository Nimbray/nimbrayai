-- NimbrayAI V17 — Supabase Auth & Cloud Beta schema
-- À exécuter dans Supabase SQL Editor si tu veux activer le mode cloud.

create extension if not exists pgcrypto;

create table if not exists public.nimbray_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  beta_role text default 'tester',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.nimbray_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null default 'Nouvelle discussion',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.nimbray_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.nimbray_conversations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text check (role in ('user','assistant','system')) not null,
  content text not null,
  provider text,
  model text,
  created_at timestamptz default now()
);

create table if not exists public.nimbray_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  memory text not null,
  tags text[] default '{}',
  created_at timestamptz default now()
);

create table if not exists public.nimbray_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  source_type text default 'user',
  content text not null,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create table if not exists public.nimbray_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  feedback text not null,
  context jsonb default '{}',
  created_at timestamptz default now()
);

alter table public.nimbray_profiles enable row level security;
alter table public.nimbray_conversations enable row level security;
alter table public.nimbray_messages enable row level security;
alter table public.nimbray_memory enable row level security;
alter table public.nimbray_sources enable row level security;
alter table public.nimbray_feedback enable row level security;

create policy if not exists "profiles own" on public.nimbray_profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy if not exists "conversations own" on public.nimbray_conversations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists "messages own" on public.nimbray_messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists "memory own" on public.nimbray_memory for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists "sources own" on public.nimbray_sources for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists "feedback insert" on public.nimbray_feedback for insert with check (auth.uid() = user_id or user_id is null);
