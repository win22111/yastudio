-- blocked_days: dates that the admin has marked as closed.
-- Customers will see no available slots on these days.
create table if not exists public.blocked_days (
  date    date primary key,
  reason  text,
  created_at timestamptz not null default now()
);

-- Only authenticated admin users (via RLS policies) can insert/delete.
-- Public (anon) can SELECT so the booking page can check.
alter table public.blocked_days enable row level security;

-- Anyone can read (needed by the public booking page)
create policy "blocked_days: public read"
  on public.blocked_days for select
  using (true);

-- Only admins can insert / update / delete
create policy "blocked_days: admin write"
  on public.blocked_days for all
  using (
    exists (
      select 1
      from public.user_roles
      where user_id = auth.uid()
        and role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.user_roles
      where user_id = auth.uid()
        and role = 'admin'
    )
  );
