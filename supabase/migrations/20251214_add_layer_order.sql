-- Migration for Unified Layer Ordering
-- Supports cross-type layer ordering (artboards, references, future types)
-- Safe to run multiple times

-- 1. Create layer_order table
create table if not exists public.layer_order (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  layer_id uuid not null,           -- ID of the layer (artboard, reference, etc.)
  layer_type text not null,          -- 'artboard', 'reference', 'image', etc.
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Unique constraint: one entry per layer per project
  unique(project_id, layer_id)
);

-- 2. Enable RLS
alter table public.layer_order enable row level security;

-- 3. Create Policies
drop policy if exists "Users can view layer_order of own projects." on public.layer_order;
create policy "Users can view layer_order of own projects." on public.layer_order
  for select using (
    exists (
      select 1 from public.projects
      where projects.id = layer_order.project_id
      and projects.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert layer_order to own projects." on public.layer_order;
create policy "Users can insert layer_order to own projects." on public.layer_order
  for insert with check (
    exists (
      select 1 from public.projects
      where projects.id = project_id
      and projects.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update layer_order of own projects." on public.layer_order;
create policy "Users can update layer_order of own projects." on public.layer_order
  for update using (
    exists (
      select 1 from public.projects
      where projects.id = layer_order.project_id
      and projects.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete layer_order of own projects." on public.layer_order;
create policy "Users can delete layer_order of own projects." on public.layer_order
  for delete using (
    exists (
      select 1 from public.projects
      where projects.id = layer_order.project_id
      and projects.user_id = auth.uid()
    )
  );

-- 4. Create indexes
create index if not exists layer_order_project_id_idx on public.layer_order(project_id);
create index if not exists layer_order_project_sort_idx on public.layer_order(project_id, sort_order desc);

-- 5. Add to Realtime Publication
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'layer_order') then
    alter publication supabase_realtime add table public.layer_order;
  end if;
end $$;
