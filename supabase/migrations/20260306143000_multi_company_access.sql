do $$
begin
  create type public.company_status as enum ('active', 'inactive');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.company_user_role as enum ('admin', 'member');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.company_user_status as enum ('active', 'inactive', 'deleted');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status public.company_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint companies_name_length check (char_length(trim(name)) between 1 and 120)
);

create table if not exists public.company_users (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  role public.company_user_role not null,
  status public.company_user_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint company_users_name_length check (char_length(trim(name)) between 1 and 120),
  constraint company_users_email_length check (char_length(trim(email)) between 3 and 160)
);

create index if not exists company_users_company_role_idx
  on public.company_users (company_id, role, status);

create index if not exists company_users_company_email_idx
  on public.company_users (company_id, email);

drop trigger if exists companies_set_updated_at on public.companies;
create trigger companies_set_updated_at
before update on public.companies
for each row
execute function public.set_updated_at();

drop trigger if exists company_users_set_updated_at on public.company_users;
create trigger company_users_set_updated_at
before update on public.company_users
for each row
execute function public.set_updated_at();

create temporary table tmp_user_company_map on commit drop as
select
  u.id as user_id,
  gen_random_uuid() as company_id,
  coalesce(
    nullif(trim(coalesce(u.raw_user_meta_data ->> 'company_name', '')), ''),
    concat('Empresa ', initcap(replace(split_part(coalesce(u.email, u.id::text), '@', 1), '.', ' ')))
  ) as company_name,
  coalesce(
    nullif(trim(coalesce(u.raw_user_meta_data ->> 'name', '')), ''),
    initcap(replace(split_part(coalesce(u.email, u.id::text), '@', 1), '.', ' '))
  ) as display_name,
  coalesce(u.email, concat(u.id::text, '@local.invalid')) as email
from auth.users u;

insert into public.companies (id, name, status)
select
  company_id,
  company_name,
  'active'::public.company_status
from tmp_user_company_map;

insert into public.company_users (
  company_id,
  auth_user_id,
  name,
  email,
  role,
  status
)
select
  company_id,
  user_id,
  display_name,
  email,
  'admin'::public.company_user_role,
  'active'::public.company_user_status
from tmp_user_company_map;

alter table public.stages
  add column if not exists company_id uuid references public.companies (id) on delete cascade;

alter table public.contacts
  add column if not exists company_id uuid references public.companies (id) on delete cascade;

alter table public.deals
  add column if not exists company_id uuid references public.companies (id) on delete cascade,
  add column if not exists assigned_user_id uuid references auth.users (id) on delete set null;

alter table public.notes
  rename column owner_user_id to author_user_id;

alter table public.notes
  alter column author_user_id drop not null;

alter table public.notes
  add column if not exists author_name text not null default 'Sistema';

alter table public.notes
  add constraint notes_author_name_length
  check (char_length(trim(author_name)) between 1 and 120);

update public.stages as stages
set company_id = map.company_id
from tmp_user_company_map as map
where stages.owner_user_id = map.user_id;

update public.contacts as contacts
set company_id = map.company_id
from tmp_user_company_map as map
where contacts.owner_user_id = map.user_id;

update public.deals as deals
set company_id = map.company_id
from tmp_user_company_map as map
where deals.owner_user_id = map.user_id;

update public.notes as notes
set author_name = map.display_name
from tmp_user_company_map as map
where notes.author_user_id = map.user_id;

alter table public.stages
  alter column company_id set not null;

alter table public.contacts
  alter column company_id set not null;

alter table public.deals
  alter column company_id set not null;

drop trigger if exists deals_validate_relations on public.deals;
drop trigger if exists notes_validate_relations on public.notes;
drop function if exists public.ensure_deal_relations();
drop function if exists public.ensure_note_relations();

drop policy if exists "stages_select_own" on public.stages;
drop policy if exists "stages_insert_own" on public.stages;
drop policy if exists "stages_update_own" on public.stages;
drop policy if exists "stages_delete_own" on public.stages;
drop policy if exists "contacts_select_own" on public.contacts;
drop policy if exists "contacts_insert_own" on public.contacts;
drop policy if exists "contacts_update_own" on public.contacts;
drop policy if exists "contacts_delete_own" on public.contacts;
drop policy if exists "deals_select_own" on public.deals;
drop policy if exists "deals_insert_own" on public.deals;
drop policy if exists "deals_update_own" on public.deals;
drop policy if exists "deals_delete_own" on public.deals;
drop policy if exists "notes_select_own" on public.notes;
drop policy if exists "notes_insert_own" on public.notes;
drop policy if exists "notes_update_own" on public.notes;
drop policy if exists "notes_delete_own" on public.notes;

drop index if exists contacts_owner_phone_normalized_unique;
drop index if exists stages_owner_position_idx;
drop index if exists deals_owner_stage_moved_idx;
drop index if exists notes_owner_deal_created_idx;

alter table public.stages
  drop column owner_user_id;

alter table public.contacts
  drop column owner_user_id;

alter table public.deals
  drop column owner_user_id;

create unique index if not exists contacts_company_phone_normalized_unique
  on public.contacts (company_id, phone_normalized);

create index if not exists stages_company_position_idx
  on public.stages (company_id, position);

create index if not exists deals_company_stage_moved_idx
  on public.deals (company_id, stage_id, moved_at desc);

create index if not exists deals_company_assigned_idx
  on public.deals (company_id, assigned_user_id);

create index if not exists notes_deal_created_idx
  on public.notes (deal_id, created_at desc);

create or replace function public.seed_company_stages(p_company_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.stages
    where company_id = p_company_id
  ) then
    return;
  end if;

  insert into public.stages (company_id, name, position)
  values
    (p_company_id, 'Prospeccao', 0),
    (p_company_id, 'Contato', 1),
    (p_company_id, 'Proposta', 2),
    (p_company_id, 'Fechado', 3);
end;
$$;

create or replace function public.ensure_deal_relations()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.contacts
    where id = new.contact_id
      and company_id = new.company_id
  ) then
    raise exception 'contact_id does not belong to the deal company';
  end if;

  if not exists (
    select 1
    from public.stages
    where id = new.stage_id
      and company_id = new.company_id
  ) then
    raise exception 'stage_id does not belong to the deal company';
  end if;

  if new.assigned_user_id is not null and not exists (
    select 1
    from public.company_users
    where auth_user_id = new.assigned_user_id
      and company_id = new.company_id
      and status = 'active'
  ) then
    raise exception 'assigned_user_id is not active in this company';
  end if;

  return new;
end;
$$;

create trigger deals_validate_relations
before insert or update on public.deals
for each row
execute function public.ensure_deal_relations();

create or replace function public.ensure_note_relations()
returns trigger
language plpgsql
as $$
declare
  v_company_id uuid;
begin
  select company_id
  into v_company_id
  from public.deals
  where id = new.deal_id;

  if v_company_id is null then
    raise exception 'deal_id does not exist';
  end if;

  if new.author_user_id is not null and not exists (
    select 1
    from public.company_users
    where auth_user_id = new.author_user_id
      and company_id = v_company_id
      and status = 'active'
  ) then
    raise exception 'author_user_id is not active in this company';
  end if;

  return new;
end;
$$;

create trigger notes_validate_relations
before insert or update on public.notes
for each row
execute function public.ensure_note_relations();

create or replace function public.current_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select cu.company_id
  from public.company_users cu
  join public.companies c on c.id = cu.company_id
  where cu.auth_user_id = auth.uid()
    and cu.status = 'active'
    and c.status = 'active'
  limit 1;
$$;

create or replace function public.is_company_member(p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_users cu
    join public.companies c on c.id = cu.company_id
    where cu.auth_user_id = auth.uid()
      and cu.company_id = p_company_id
      and cu.status = 'active'
      and c.status = 'active'
  );
$$;

create or replace function public.is_company_admin(p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_users cu
    join public.companies c on c.id = cu.company_id
    where cu.auth_user_id = auth.uid()
      and cu.company_id = p_company_id
      and cu.role = 'admin'
      and cu.status = 'active'
      and c.status = 'active'
  );
$$;

alter table public.companies enable row level security;
alter table public.company_users enable row level security;

create policy "companies_select_member"
on public.companies
for select
to authenticated
using (public.is_company_member(id));

create policy "company_users_select_member"
on public.company_users
for select
to authenticated
using (public.is_company_member(company_id));

create policy "company_users_insert_member_admin"
on public.company_users
for insert
to authenticated
with check (
  role = 'member'
  and public.is_company_admin(company_id)
);

create policy "company_users_update_member_admin"
on public.company_users
for update
to authenticated
using (
  role = 'member'
  and public.is_company_admin(company_id)
)
with check (
  role = 'member'
  and public.is_company_admin(company_id)
);

create policy "stages_select_company"
on public.stages
for select
to authenticated
using (public.is_company_member(company_id));

create policy "stages_insert_company_admin"
on public.stages
for insert
to authenticated
with check (public.is_company_admin(company_id));

create policy "stages_update_company_admin"
on public.stages
for update
to authenticated
using (public.is_company_admin(company_id))
with check (public.is_company_admin(company_id));

create policy "stages_delete_company_admin"
on public.stages
for delete
to authenticated
using (public.is_company_admin(company_id));

create policy "contacts_select_company"
on public.contacts
for select
to authenticated
using (public.is_company_member(company_id));

create policy "contacts_insert_company"
on public.contacts
for insert
to authenticated
with check (public.is_company_member(company_id));

create policy "contacts_update_company"
on public.contacts
for update
to authenticated
using (public.is_company_member(company_id))
with check (public.is_company_member(company_id));

create policy "contacts_delete_company"
on public.contacts
for delete
to authenticated
using (public.is_company_member(company_id));

create policy "deals_select_company"
on public.deals
for select
to authenticated
using (public.is_company_member(company_id));

create policy "deals_insert_company"
on public.deals
for insert
to authenticated
with check (public.is_company_member(company_id));

create policy "deals_update_company"
on public.deals
for update
to authenticated
using (public.is_company_member(company_id))
with check (public.is_company_member(company_id));

create policy "deals_delete_company"
on public.deals
for delete
to authenticated
using (public.is_company_member(company_id));

create policy "notes_select_company"
on public.notes
for select
to authenticated
using (
  exists (
    select 1
    from public.deals
    where deals.id = notes.deal_id
      and public.is_company_member(deals.company_id)
  )
);

create policy "notes_insert_company"
on public.notes
for insert
to authenticated
with check (
  (author_user_id is null or author_user_id = auth.uid())
  and exists (
    select 1
    from public.deals
    where deals.id = notes.deal_id
      and public.is_company_member(deals.company_id)
  )
);

drop function if exists public.create_contact_with_deal(
  text,
  text,
  text,
  text,
  text,
  uuid
);

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
