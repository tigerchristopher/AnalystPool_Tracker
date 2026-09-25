create table if not exists public.task_entries (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null,
  member text not null,
  requestor text not null,
  entry_type text not null check (entry_type in ('Task performed', 'No Task', 'Leave')),
  task text,
  created_at timestamptz not null default now()
);

alter table public.task_entries enable row level security;

drop policy if exists "Anyone can read task entries" on public.task_entries;
create policy "Anyone can read task entries" on public.task_entries for select to anon, authenticated using (true);

drop policy if exists "Anyone can submit task entries" on public.task_entries;
create policy "Anyone can submit task entries" on public.task_entries for insert to anon, authenticated with check (true);

create index if not exists task_entries_entry_date_idx on public.task_entries (entry_date);
