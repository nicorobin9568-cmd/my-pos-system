-- ============================================================
-- Multi-Tenant POS System - Initial Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Tenants (shops)
create table if not exists tenants (
  id            uuid primary key default gen_random_uuid(),
  shop_name     text not null,
  business_type text not null check (business_type in ('pharmacy','bakery','grocery','restaurant','clothing','general')),
  status        text not null default 'pending' check (status in ('pending','approved','suspended')),
  created_at    timestamptz default now()
);

-- 2. Profiles (all users)
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  tenant_id   uuid references tenants(id) on delete cascade,
  role        text not null check (role in ('super_admin','shop_admin','cashier')),
  status      text not null default 'pending' check (status in ('pending','approved')),
  name        text not null,
  created_at  timestamptz default now()
);

-- 3. Products
create table if not exists products (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid references tenants(id) on delete cascade not null,
  name          text not null,
  barcode       text,
  price         numeric not null,
  cost          numeric,
  stock_qty     integer not null default 0,
  category      text,
  expiry_date   date,
  image_url     text,
  updated_at    timestamptz default now()
);

-- 4. Sales
create table if not exists sales (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid references tenants(id) on delete cascade not null,
  cashier_id      uuid references profiles(id) not null,
  total           numeric not null,
  payment_method  text check (payment_method in ('cash','card','other')),
  sync_status     text default 'synced' check (sync_status in ('pending','synced')),
  created_at      timestamptz default now()
);

-- 5. Sale Items
create table if not exists sale_items (
  id          uuid primary key default gen_random_uuid(),
  sale_id     uuid references sales(id) on delete cascade not null,
  product_id  uuid references products(id) not null,
  qty         integer not null,
  unit_price  numeric not null
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table tenants enable row level security;
alter table profiles enable row level security;
alter table products enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;

-- Helper function: get current user's tenant_id
create or replace function get_my_tenant_id()
returns uuid as $$
  select tenant_id from profiles where id = auth.uid()
$$ language sql security definer stable;

-- Helper function: get current user's role
create or replace function get_my_role()
returns text as $$
  select role from profiles where id = auth.uid()
$$ language sql security definer stable;

-- ---- TENANTS policies ----
-- Super admin can see all tenants
create policy "super_admin_all_tenants" on tenants
  for all using (get_my_role() = 'super_admin');

-- Shop admin/cashier can see their own tenant
create policy "tenant_members_see_own" on tenants
  for select using (id = get_my_tenant_id());

-- Anyone can insert (for signup flow)
create policy "anyone_insert_tenant" on tenants
  for insert with check (true);

-- ---- PROFILES policies ----
-- Super admin can see all profiles
create policy "super_admin_all_profiles" on profiles
  for all using (get_my_role() = 'super_admin');

-- Shop admin can see profiles in their tenant
create policy "shop_admin_tenant_profiles" on profiles
  for all using (
    get_my_role() = 'shop_admin' and tenant_id = get_my_tenant_id()
  );

-- Users can see their own profile
create policy "own_profile" on profiles
  for select using (id = auth.uid());

-- Anyone can insert profile (for signup)
create policy "anyone_insert_profile" on profiles
  for insert with check (id = auth.uid());

-- ---- PRODUCTS policies ----
create policy "tenant_products" on products
  for all using (tenant_id = get_my_tenant_id());

-- ---- SALES policies ----
create policy "tenant_sales" on sales
  for all using (tenant_id = get_my_tenant_id());

-- ---- SALE_ITEMS policies ----
create policy "tenant_sale_items" on sale_items
  for all using (
    sale_id in (select id from sales where tenant_id = get_my_tenant_id())
  );

-- ============================================================
-- Atomic Stock Decrement RPC
-- ============================================================
create or replace function decrement_stock(p_product_id uuid, p_qty integer)
returns void as $$
  update products
  set stock_qty = stock_qty - p_qty,
      updated_at = now()
  where id = p_product_id;
$$ language sql;

-- ============================================================
-- Super Admin Setup
-- Run this AFTER creating your super admin account in Supabase Auth
-- Replace 'YOUR_SUPER_ADMIN_USER_ID' with the actual UUID
-- ============================================================
-- insert into profiles (id, tenant_id, role, status, name)
-- values ('YOUR_SUPER_ADMIN_USER_ID', null, 'super_admin', 'approved', 'Super Admin');
