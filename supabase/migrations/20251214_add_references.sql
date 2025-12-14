-- Migration for Reference_Layers Table
-- Safe to run multiple times
-- Note: Using "reference_layers" instead of "references" to avoid reserved keyword conflict

-- 1. Create Reference_Layers Table
create table if not exists public.reference_layers (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  reference_id text not null,  -- ID from references.json (e.g., "Ikea Cup")
  view_type text not null,     -- 'top', 'side', 'bottom'
  name text not null,
  width numeric not null,      -- pixels (converted from reference dimensions)
  height numeric not null,     -- pixels
  x numeric default 0,
  y numeric default 0,
  sort_order integer default 0,
  settings jsonb default '{}'::jsonb,  -- showMeasurements, opacity, physicalUnit, etc.
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable RLS
alter table public.reference_layers enable row level security;

-- 3. Create Policies (Drop first to avoid errors)
drop policy if exists "Users can view reference_layers of own projects." on public.reference_layers;
create policy "Users can view reference_layers of own projects." on public.reference_layers
  for select using (
    exists (
      select 1 from public.projects
      where projects.id = reference_layers.project_id
      and projects.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert reference_layers to own projects." on public.reference_layers;
create policy "Users can insert reference_layers to own projects." on public.reference_layers
  for insert with check (
    exists (
      select 1 from public.projects
      where projects.id = project_id
      and projects.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update reference_layers of own projects." on public.reference_layers;
create policy "Users can update reference_layers of own projects." on public.reference_layers
  for update using (
    exists (
      select 1 from public.projects
      where projects.id = reference_layers.project_id
      and projects.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete reference_layers of own projects." on public.reference_layers;
create policy "Users can delete reference_layers of own projects." on public.reference_layers
  for delete using (
    exists (
      select 1 from public.projects
      where projects.id = reference_layers.project_id
      and projects.user_id = auth.uid()
    )
  );

-- 4. Create index for efficient queries
create index if not exists reference_layers_project_id_idx on public.reference_layers(project_id);
create index if not exists reference_layers_project_sort_idx on public.reference_layers(project_id, sort_order);

-- 5. Add to Realtime Publication
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'reference_layers') then
    alter publication supabase_realtime add table public.reference_layers;
  end if;
end $$;
