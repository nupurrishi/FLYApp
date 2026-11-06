-- FLYApp public signup: Models and Designers only.
-- Existing Supabase Auth users remain managed by Supabase; this table stores app roles.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text not null default '',
  role text not null default 'model',
  created_at timestamptz not null default now(),
  constraint profiles_role_allowed check (role in ('model', 'designer', 'manager', 'admin'))
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text not null default '';
alter table public.profiles add column if not exists role text not null default 'model';
alter table public.profiles enable row level security;

-- A user can read only their own profile. Role changes are intentionally not
-- granted to regular authenticated users; managers/admins are provisioned privately.
drop policy if exists "Users can read their own FLYApp profile" on public.profiles;
create policy "Users can read their own FLYApp profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create or replace function public.handle_flyapp_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text;
begin
  requested_role := coalesce(new.raw_user_meta_data ->> 'role', 'model');
  if requested_role not in ('model', 'designer') then
    requested_role := 'model';
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    requested_role
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name;

  return new;
end;
$$;

drop trigger if exists on_flyapp_auth_user_created on auth.users;
create trigger on_flyapp_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_flyapp_new_user();

-- Existing accounts with no profile are backfilled as ordinary model accounts.
insert into public.profiles (id, email, full_name, role)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'full_name', ''),
  case
    when u.raw_user_meta_data ->> 'role' = 'designer' then 'designer'
    when u.raw_user_meta_data ->> 'role' = 'admin' then 'admin'
    when u.raw_user_meta_data ->> 'role' = 'manager' then 'manager'
    else 'model'
  end
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

-- IMPORTANT: do not add a client INSERT/UPDATE policy for profiles. This prevents
-- public users from promoting themselves to Manager or Admin.
