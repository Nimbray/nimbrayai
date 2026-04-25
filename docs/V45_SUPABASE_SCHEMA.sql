-- NimbrayAI V45 — Supabase Platform Schema
-- À exécuter dans Supabase SQL Editor.
-- Le mode local reste disponible si tu n'actives pas ENABLE_SERVER_STORAGE.

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  owner_ref text unique not null,
  display_name text,
  beta_email text,
  preferred_tone text default 'humain',
  main_goal text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  owner_ref text not null,
  project_id uuid,
  title text default 'Nouvelle discussion',
  summary text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  owner_ref text not null,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  provider text,
  model text,
  created_at timestamptz default now()
);

create table if not exists memory_items (
  id uuid primary key default gen_random_uuid(),
  owner_ref text not null,
  project_id uuid,
  content text not null,
  category text default 'general',
  sensitivity text default 'normal',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  owner_ref text not null,
  project_id uuid,
  title text not null,
  category text default 'general',
  content text not null,
  tags text[] default '{}',
  reliability text default 'unknown',
  sensitivity text default 'normal',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  owner_ref text not null,
  name text not null,
  description text,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists beta_feedback (
  id uuid primary key default gen_random_uuid(),
  owner_ref text default 'guest',
  type text default 'general',
  message text not null,
  page text default 'app',
  severity text default 'normal',
  created_at timestamptz default now()
);

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_ref text not null,
  title text default 'Workspace NimbrayAI',
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_conversations_owner on conversations(owner_ref);
create index if not exists idx_messages_conversation on messages(conversation_id);
create index if not exists idx_memory_owner on memory_items(owner_ref);
create index if not exists idx_sources_owner on sources(owner_ref);
create index if not exists idx_projects_owner on projects(owner_ref);
create index if not exists idx_feedback_owner on beta_feedback(owner_ref);
