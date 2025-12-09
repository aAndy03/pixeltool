-- Migration to add sort_order to artboards
-- This allows for layer ordering logic

-- Add sort_order column if it doesn't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'artboards' and column_name = 'sort_order') then
    alter table public.artboards add column sort_order integer default 0;
  end if;
end $$;
