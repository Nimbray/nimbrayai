-- V70 memory/projects schema draft
create table if not exists nimbray_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists nimbray_project_memories (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references nimbray_projects(id) on delete cascade,
  key text not null,
  value text not null,
  importance int default 1,
  created_at timestamptz default now()
);

create table if not exists nimbray_project_sources (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references nimbray_projects(id) on delete cascade,
  title text not null,
  source_type text default 'document',
  content text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
