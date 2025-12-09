-- Enable RLS
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;

-- Profiles: Publicly viewable, editable by owner
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint username_length check (char_length(username) >= 3)
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);

-- Projects: Private by default
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  settings jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.projects enable row level security;

create policy "Users can view own projects." on public.projects
  for select using (auth.uid() = user_id);

create policy "Users can insert own projects." on public.projects
  for insert with check (auth.uid() = user_id);

create policy "Users can update own projects." on public.projects
  for update using (auth.uid() = user_id);

create policy "Users can delete own projects." on public.projects
  for delete using (auth.uid() = user_id);

-- Artboards: Belong to a project
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

alter table public.artboards enable row level security;

-- Policies for Artboards:
-- We can check project ownership via subquery or join, but standard Supabase practice 
-- often duplicates user_id or does a check.
-- Simple check: User can access artboards if they can access the parent project.

create policy "Users can view artboards of own projects." on public.artboards
  for select using (
    exists (
      select 1 from public.projects
      where projects.id = artboards.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can insert artboards to own projects." on public.artboards
  for insert with check (
    exists (
      select 1 from public.projects
      where projects.id = project_id -- 'project_id' from new row
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can update artboards of own projects." on public.artboards
  for update using (
    exists (
      select 1 from public.projects
      where projects.id = artboards.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can delete artboards of own projects." on public.artboards
  for delete using (
    exists (
      select 1 from public.projects
      where projects.id = artboards.project_id
      and projects.user_id = auth.uid()
    )
  );


-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Realtime
alter publication supabase_realtime add table public.projects;
alter publication supabase_realtime add table public.artboards;
