create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.stages (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  position integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint stages_name_length check (char_length(trim(name)) between 1 and 80),
  constraint stages_position_non_negative check (position >= 0)
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  phone text not null,
  phone_normalized text not null,
  email text,
  origin text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint contacts_name_length check (char_length(trim(name)) between 1 and 120),
  constraint contacts_phone_length check (char_length(phone_normalized) between 10 and 20),
  constraint contacts_origin_length check (origin is null or char_length(trim(origin)) <= 80),
  constraint contacts_email_length check (email is null or char_length(trim(email)) <= 120)
);

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  contact_id uuid not null references public.contacts (id) on delete cascade,
  stage_id uuid not null references public.stages (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  moved_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  deal_id uuid not null references public.deals (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint notes_body_length check (char_length(trim(body)) between 1 and 1000)
);

create unique index if not exists contacts_owner_phone_normalized_unique
  on public.contacts (owner_user_id, phone_normalized);

create unique index if not exists deals_contact_id_unique
  on public.deals (contact_id);

create index if not exists stages_owner_position_idx
  on public.stages (owner_user_id, position);

create index if not exists deals_owner_stage_moved_idx
  on public.deals (owner_user_id, stage_id, moved_at desc);

create index if not exists notes_owner_deal_created_idx
  on public.notes (owner_user_id, deal_id, created_at desc);

drop trigger if exists stages_set_updated_at on public.stages;
create trigger stages_set_updated_at
before update on public.stages
for each row
execute function public.set_updated_at();

drop trigger if exists contacts_set_updated_at on public.contacts;
create trigger contacts_set_updated_at
before update on public.contacts
for each row
execute function public.set_updated_at();

create or replace function public.ensure_deal_relations()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.contacts
    where id = new.contact_id
      and owner_user_id = new.owner_user_id
  ) then
    raise exception 'contact_id does not belong to the authenticated owner';
  end if;

  if not exists (
    select 1
    from public.stages
    where id = new.stage_id
      and owner_user_id = new.owner_user_id
  ) then
    raise exception 'stage_id does not belong to the authenticated owner';
  end if;

  return new;
end;
$$;

drop trigger if exists deals_validate_relations on public.deals;
create trigger deals_validate_relations
before insert or update on public.deals
for each row
execute function public.ensure_deal_relations();

create or replace function public.ensure_note_relations()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.deals
    where id = new.deal_id
      and owner_user_id = new.owner_user_id
  ) then
    raise exception 'deal_id does not belong to the authenticated owner';
  end if;

  return new;
end;
$$;

drop trigger if exists notes_validate_relations on public.notes;
create trigger notes_validate_relations
before insert or update on public.notes
for each row
execute function public.ensure_note_relations();

alter table public.stages enable row level security;
alter table public.contacts enable row level security;
alter table public.deals enable row level security;
alter table public.notes enable row level security;

drop policy if exists "stages_select_own" on public.stages;
create policy "stages_select_own"
on public.stages
for select
to authenticated
using (owner_user_id = auth.uid());

drop policy if exists "stages_insert_own" on public.stages;
create policy "stages_insert_own"
on public.stages
for insert
to authenticated
with check (owner_user_id = auth.uid());

drop policy if exists "stages_update_own" on public.stages;
create policy "stages_update_own"
on public.stages
for update
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists "stages_delete_own" on public.stages;
create policy "stages_delete_own"
on public.stages
for delete
to authenticated
using (owner_user_id = auth.uid());

drop policy if exists "contacts_select_own" on public.contacts;
create policy "contacts_select_own"
on public.contacts
for select
to authenticated
using (owner_user_id = auth.uid());

drop policy if exists "contacts_insert_own" on public.contacts;
create policy "contacts_insert_own"
on public.contacts
for insert
to authenticated
with check (owner_user_id = auth.uid());

drop policy if exists "contacts_update_own" on public.contacts;
create policy "contacts_update_own"
on public.contacts
for update
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists "contacts_delete_own" on public.contacts;
create policy "contacts_delete_own"
on public.contacts
for delete
to authenticated
using (owner_user_id = auth.uid());

drop policy if exists "deals_select_own" on public.deals;
create policy "deals_select_own"
on public.deals
for select
to authenticated
using (owner_user_id = auth.uid());

drop policy if exists "deals_insert_own" on public.deals;
create policy "deals_insert_own"
on public.deals
for insert
to authenticated
with check (owner_user_id = auth.uid());

drop policy if exists "deals_update_own" on public.deals;
create policy "deals_update_own"
on public.deals
for update
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists "deals_delete_own" on public.deals;
create policy "deals_delete_own"
on public.deals
for delete
to authenticated
using (owner_user_id = auth.uid());

drop policy if exists "notes_select_own" on public.notes;
create policy "notes_select_own"
on public.notes
for select
to authenticated
using (owner_user_id = auth.uid());

drop policy if exists "notes_insert_own" on public.notes;
create policy "notes_insert_own"
on public.notes
for insert
to authenticated
with check (owner_user_id = auth.uid());

drop policy if exists "notes_update_own" on public.notes;
create policy "notes_update_own"
on public.notes
for update
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists "notes_delete_own" on public.notes;
create policy "notes_delete_own"
on public.notes
for delete
to authenticated
using (owner_user_id = auth.uid());

create or replace function public.create_contact_with_deal(
  p_name text,
  p_phone text,
  p_phone_normalized text,
  p_email text default null,
  p_origin text default null,
  p_stage_id uuid default null
)
returns table (contact_id uuid, deal_id uuid)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_contact_id uuid;
  v_deal_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  if p_stage_id is null then
    raise exception 'stage is required';
  end if;

  if not exists (
    select 1
    from public.stages
    where id = p_stage_id
      and owner_user_id = v_user_id
  ) then
    raise exception 'invalid stage';
  end if;

  insert into public.contacts (
    owner_user_id,
    name,
    phone,
    phone_normalized,
    email,
    origin
  )
  values (
    v_user_id,
    trim(p_name),
    trim(p_phone),
    trim(p_phone_normalized),
    nullif(trim(p_email), ''),
    nullif(trim(p_origin), '')
  )
  returning id into v_contact_id;

  insert into public.deals (
    owner_user_id,
    contact_id,
    stage_id
  )
  values (
    v_user_id,
    v_contact_id,
    p_stage_id
  )
  returning id into v_deal_id;

  return query
  select v_contact_id, v_deal_id;
end;
$$;

revoke all on function public.create_contact_with_deal(
  text,
  text,
  text,
  text,
  text,
  uuid
) from public;

grant execute on function public.create_contact_with_deal(
  text,
  text,
  text,
  text,
  text,
  uuid
) to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.stages (owner_user_id, name, position)
  values
    (new.id, 'Prospeccao', 0),
    (new.id, 'Contato', 1),
    (new.id, 'Proposta', 2),
    (new.id, 'Fechado', 3);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();
