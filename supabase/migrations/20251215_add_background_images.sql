-- Background Images for Artboards (Clipping Mask behavior)
-- Each background image belongs to an artboard and is clipped to its bounds

create table if not exists public.background_images (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  artboard_id uuid references public.artboards(id) on delete cascade not null,
  image_url text not null,
  natural_width numeric not null,
  natural_height numeric not null,
  x numeric default 0,
  y numeric default 0,
  width numeric not null,
  height numeric not null,
  settings jsonb default '{}'::jsonb,
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.background_images enable row level security;

-- RLS Policies
create policy "Users can view background_images of own projects." on public.background_images
  for select using (
    exists (
      select 1 from public.projects
      where projects.id = background_images.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can insert background_images to own projects." on public.background_images
  for insert with check (
    exists (
      select 1 from public.projects
      where projects.id = project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can update background_images of own projects." on public.background_images
  for update using (
    exists (
      select 1 from public.projects
      where projects.id = background_images.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can delete background_images of own projects." on public.background_images
  for delete using (
    exists (
      select 1 from public.projects
      where projects.id = background_images.project_id
      and projects.user_id = auth.uid()
    )
  );

-- Realtime
alter publication supabase_realtime add table public.background_images;
