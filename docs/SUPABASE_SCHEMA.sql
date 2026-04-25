-- NimbrayAI V18 - Supabase schema
-- Execute this SQL in Supabase SQL editor.

create table if not exists public.nimbray_workspaces (
  id uuid primary key default gen_random_uuid(),
  workspace_id text unique not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.nimbray_feedback (
  id uuid primary key default gen_random_uuid(),
  workspace_id text,
  profile jsonb not null default '{}'::jsonb,
  feedback text not null,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists nimbray_workspaces_workspace_id_idx on public.nimbray_workspaces(workspace_id);
create index if not exists nimbray_feedback_workspace_id_idx on public.nimbray_feedback(workspace_id);
create index if not exists nimbray_feedback_created_at_idx on public.nimbray_feedback(created_at desc);

-- For a private beta, keep RLS enabled and access through server routes only.
alter table public.nimbray_workspaces enable row level security;
alter table public.nimbray_feedback enable row level security;
