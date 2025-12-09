-- Migration for Artboards Table
-- Safe to run multiple times

-- 1. Create Artboards Table
create table if not exists public.artboards (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  name text not null,
  width numeric not null,
  height numeric not null,
  x numeric default 0,
  y numeric default 0,
  settings jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable RLS
alter table public.artboards enable row level security;

-- 3. Create Policies (Drop first to avoid errors)
drop policy if exists "Users can view artboards of own projects." on public.artboards;
create policy "Users can view artboards of own projects." on public.artboards
  for select using (
    exists (
      select 1 from public.projects
      where projects.id = artboards.project_id
      and projects.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert artboards to own projects." on public.artboards;
create policy "Users can insert artboards to own projects." on public.artboards
  for insert with check (
    exists (
      select 1 from public.projects
      where projects.id = project_id
      and projects.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update artboards of own projects." on public.artboards;
create policy "Users can update artboards of own projects." on public.artboards
  for update using (
    exists (
      select 1 from public.projects
      where projects.id = artboards.project_id
      and projects.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete artboards of own projects." on public.artboards;
create policy "Users can delete artboards of own projects." on public.artboards
  for delete using (
    exists (
      select 1 from public.projects
      where projects.id = artboards.project_id
      and projects.user_id = auth.uid()
    )
  );

-- 4. Add to Realtime Publication
-- Alter publication can fail if already added, but usually safe to re-run or wrap in DO block.
-- We'll just try it, typically safe in pgSQL if idempotent or ignore error.
-- Actually 'alter publication ... add table' errors if duplicate.
-- We can do a check.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'artboards') then
    alter publication supabase_realtime add table public.artboards;
  end if;
end $$;
