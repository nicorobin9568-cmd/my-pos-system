-- Fix for RLS recursion issues and Super Admin access

-- 1. Drop old functions
drop function if exists get_my_tenant_id();
drop function if exists get_my_role();

-- 2. Create more robust helper functions with SECURITY DEFINER
-- This allows the functions to query the profiles table even when RLS is enabled on it
create or replace function get_my_tenant_id()
returns uuid as $$
  declare
    tid uuid;
  begin
    select tenant_id into tid from profiles where id = auth.uid();
    return tid;
  end;
$$ language plpgsql security definer;

create or replace function get_my_role()
returns text as $$
  declare
    r text;
  begin
    select role into r from profiles where id = auth.uid();
    return r;
  end;
$$ language plpgsql security definer;

-- 3. Update Policies to use the new functions
-- Profile policies
drop policy if exists "super_admin_all_profiles" on profiles;
create policy "super_admin_all_profiles" on profiles
  for all using (get_my_role() = 'super_admin');

-- Tenant policies
drop policy if exists "super_admin_all_tenants" on tenants;
create policy "super_admin_all_tenants" on tenants
  for all using (get_my_role() = 'super_admin');

-- Product policies for Super Admin
drop policy if exists "super_admin_all_products" on products;
create policy "super_admin_all_products" on products
  for all using (get_my_role() = 'super_admin');
