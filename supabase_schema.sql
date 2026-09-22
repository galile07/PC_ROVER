-- ============================================================
-- PCROVERBALIWAG - Customer site migration
-- Run this in your Supabase Dashboard -> SQL Editor -> Run
-- Safe to run alongside the existing admin setup (same project).
-- ============================================================

-- ---------- 1. INVENTORY: add category ----------
-- The admin already manages this table. This adds a category
-- column (defaults to 'accessories' so existing admin inserts
-- keep working) and assigns the current items to categories.
alter table public.inventory
  add column if not exists category text not null default 'accessories';

update public.inventory
set category = 'computers'
where lower(name) in ('27" monitor', 'ssd 1tb', 'printer');

update public.inventory
set category = 'accessories'
where lower(name) in (
  'mechanical keyboard',
  'gaming mouse',
  'laptop stand',
  'gaming headset',
  'webcam hd',
  'bluetooth speaker',
  'usb-c hub',
  'mouse pad',
  'extension cord'
);

-- ---------- 2. PROFILES ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can create their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- 3. CREDENTIALS ----------
create table if not exists public.credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  phone text not null,
  address text not null,
  created_at timestamptz not null default now()
);

create index if not exists credentials_user_id_idx on public.credentials (user_id);

alter table public.credentials enable row level security;

create policy "Users can read their own credentials"
  on public.credentials for select
  using (auth.uid() = user_id);

create policy "Users can add their own credentials"
  on public.credentials for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own credentials"
  on public.credentials for update
  using (auth.uid() = user_id);

create policy "Users can delete their own credentials"
  on public.credentials for delete
  using (auth.uid() = user_id);

-- ---------- 4. ORDERS ----------
-- New table for customer orders. If the admin side should see
-- these, add an admin read policy or use the service_role key.
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  customer_name text,
  items jsonb not null default '[]'::jsonb,
  total numeric not null default 0,
  payment_method text not null default 'gcash',
  phone text,
  address text,
  status text not null default 'pending',
  cancel_reason text,
  cancelled_by text check (cancelled_by in ('user', 'seller')),
  payment_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders (user_id);

-- Extra gcash payout columns (added for PayMongo webhook):
-- Run these lines below in the SQL editor to add columns to an existing
-- orders table created before this change:
--   alter table public.orders add column if not exists payment_id text;
--   alter table public.orders add column if not exists paid_at timestamptz;

-- Only valid order statuses may be stored. Two naming conventions are
-- accepted so the admin and customer sides always agree:
--   pending         -> customer "Orders" section       (shown as "Pending")
--   paid            -> GCash payment confirmed         (shown as "Paid")
--   payment_failed  -> GCash payment failed            (shown as "Payment Failed")
--   completed       -> customer "To Ship" section      (shown as "Preparing")
--     (alias: preparing)
--   shipped         -> customer "To Receive" section   (shown as "Shipping")
--     (alias: shipping)
--   delivered       -> customer "Finished" section     (shown as "Finished")
--     (alias: finished)
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders
  add constraint orders_status_check
  check (status in ('pending', 'paid', 'payment_failed', 'completed', 'preparing', 'shipped', 'shipping', 'delivered', 'finished', 'cancelled'));

alter table public.orders enable row level security;

create policy "Users can read their own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Users can place their own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

create policy "Users can cancel their own pending orders"
  on public.orders for update
  using (auth.uid() = user_id and status = 'pending')
  with check (auth.uid() = user_id and status = 'cancelled');

-- When an order is cancelled without an explicit actor (e.g. the admin
-- panel or an inventory-sync job), assume the seller/store cancelled it.
create or replace function public.set_cancelled_by()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'cancelled' and new.cancelled_by is null then
    new.cancelled_by := 'seller';
  end if;
  return new;
end;
$$;

drop trigger if exists orders_set_cancelled_by on public.orders;
create trigger orders_set_cancelled_by
  before update on public.orders
  for each row execute procedure public.set_cancelled_by();

-- Purge cancelled orders after 30 days.
create extension if not exists pg_cron;
select cron.schedule(
  'purge-cancelled-orders',
  '0 3 * * *',
  $$ delete from public.orders where status = 'cancelled' and created_at < now() - interval '30 days' $$
);

-- ---------- 5. INVENTORY: readable by logged-in users ----------
-- The admin panel created RLS on inventory for the anon role only,
-- so authenticated (logged-in) users got an empty catalog.
-- This policy lets everyone (anon + authenticated) browse products.
create policy "Inventory is readable by everyone"
  on public.inventory for select
  using (true);
