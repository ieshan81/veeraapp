-- VEERA mobile app — additive migration (run after Reference/schema.sql)
-- Enables authenticated users to read active catalog, resolve QR via RPC,
-- read catalog images, and manage their own user_plants / user_plant_progress.
-- Admin policies remain unchanged (OR with new SELECT policies).

-- -----------------------------------------------------------------------------
-- User-owned tables
-- -----------------------------------------------------------------------------
create table if not exists public.user_plants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plant_id uuid not null references public.plants (id) on delete restrict,
  nickname text,
  room text,
  acquired_at date,
  notes text,
  reminder_enabled boolean not null default false,
  reminder_time time without time zone,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_plants_user_id_idx on public.user_plants (user_id);
create index if not exists user_plants_plant_id_idx on public.user_plants (plant_id);

drop trigger if exists user_plants_set_updated_at on public.user_plants;
create trigger user_plants_set_updated_at
before update on public.user_plants
for each row execute function public.set_updated_at();

create table if not exists public.user_plant_progress (
  id uuid primary key default gen_random_uuid(),
  user_plant_id uuid not null references public.user_plants (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  note text,
  health_tag text,
  issue_tag text,
  height_estimate numeric,
  photo_storage_path text,
  created_at timestamptz not null default now()
);

create index if not exists user_plant_progress_user_plant_id_idx
  on public.user_plant_progress (user_plant_id);
create index if not exists user_plant_progress_user_id_idx
  on public.user_plant_progress (user_id);
create index if not exists user_plant_progress_created_at_idx
  on public.user_plant_progress (user_plant_id, created_at desc);

alter table public.user_plants enable row level security;
alter table public.user_plant_progress enable row level security;

drop policy if exists user_plants_select_own on public.user_plants;
create policy user_plants_select_own on public.user_plants
for select using (auth.uid() = user_id);

drop policy if exists user_plants_insert_own on public.user_plants;
create policy user_plants_insert_own on public.user_plants
for insert with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.plants pl
    where pl.id = user_plants.plant_id and pl.status = 'active'::public.plant_status
  )
);

drop policy if exists user_plants_update_own on public.user_plants;
create policy user_plants_update_own on public.user_plants
for update using (auth.uid() = user_id);

drop policy if exists user_plants_delete_own on public.user_plants;
create policy user_plants_delete_own on public.user_plants
for delete using (auth.uid() = user_id);

drop policy if exists user_plant_progress_select_own on public.user_plant_progress;
create policy user_plant_progress_select_own on public.user_plant_progress
for select using (
  auth.uid() = user_id
  and exists (
    select 1 from public.user_plants up
    where up.id = user_plant_progress.user_plant_id and up.user_id = auth.uid()
  )
);

drop policy if exists user_plant_progress_insert_own on public.user_plant_progress;
create policy user_plant_progress_insert_own on public.user_plant_progress
for insert with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.user_plants up
    where up.id = user_plant_progress.user_plant_id and up.user_id = auth.uid()
  )
);

drop policy if exists user_plant_progress_update_own on public.user_plant_progress;
create policy user_plant_progress_update_own on public.user_plant_progress
for update using (
  auth.uid() = user_id
  and exists (
    select 1 from public.user_plants up
    where up.id = user_plant_progress.user_plant_id and up.user_id = auth.uid()
  )
);

drop policy if exists user_plant_progress_delete_own on public.user_plant_progress;
create policy user_plant_progress_delete_own on public.user_plant_progress
for delete using (
  auth.uid() = user_id
  and exists (
    select 1 from public.user_plants up
    where up.id = user_plant_progress.user_plant_id and up.user_id = auth.uid()
  )
);

-- -----------------------------------------------------------------------------
-- Catalog read for authenticated app users (active catalog only)
-- -----------------------------------------------------------------------------
drop policy if exists plants_select_active_authenticated on public.plants;
create policy plants_select_active_authenticated on public.plants
for select using (
  auth.role() = 'authenticated'
  and status = 'active'::public.plant_status
);

drop policy if exists plant_catalog_photos_select_authenticated on public.plant_catalog_photos;
create policy plant_catalog_photos_select_authenticated on public.plant_catalog_photos
for select using (
  auth.role() = 'authenticated'
  and exists (
    select 1 from public.plants p
    where p.id = plant_catalog_photos.plant_id
      and p.status = 'active'::public.plant_status
  )
);

drop policy if exists plant_tags_select_active_authenticated on public.plant_tags;
create policy plant_tags_select_active_authenticated on public.plant_tags
for select using (auth.role() = 'authenticated' and is_active = true);

drop policy if exists plant_tag_assignments_select_authenticated on public.plant_tag_assignments;
create policy plant_tag_assignments_select_authenticated on public.plant_tag_assignments
for select using (
  auth.role() = 'authenticated'
  and exists (
    select 1 from public.plants p
    where p.id = plant_tag_assignments.plant_id
      and p.status = 'active'::public.plant_status
  )
);

drop policy if exists plant_content_sections_select_authenticated on public.plant_content_sections;
create policy plant_content_sections_select_authenticated on public.plant_content_sections
for select using (
  auth.role() = 'authenticated'
  and is_active = true
  and exists (
    select 1 from public.plants p
    where p.id = plant_content_sections.plant_id
      and p.status = 'active'::public.plant_status
  )
);

-- -----------------------------------------------------------------------------
-- QR resolution (no direct read of plant_qr_codes for clients)
-- -----------------------------------------------------------------------------
create or replace function public.resolve_plant_qr(p_payload text)
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_token text;
  v_plant_id uuid;
  v_raw text;
begin
  v_raw := nullif(trim(coalesce(p_payload, '')), '');
  if v_raw is null then
    return null;
  end if;

  v_token := v_raw;
  if v_raw ~ '[?&]t=' then
    v_token := (regexp_match(v_raw, '[?&]t=([^&\s#]+)'))[1];
    if v_token is not null then
      v_token := trim(v_token);
    end if;
  end if;
  if v_token is null or v_token = '' then
    v_token := v_raw;
  end if;

  select q.plant_id into v_plant_id
  from public.plant_qr_codes q
  inner join public.plants p on p.id = q.plant_id
  where q.is_active = true
    and q.status = 'ready'::public.plant_qr_status
    and p.status = 'active'::public.plant_status
    and (q.qr_token = v_token or q.qr_value = v_raw)
  limit 1;

  return v_plant_id;
end;
$$;

revoke all on function public.resolve_plant_qr(text) from public;
grant execute on function public.resolve_plant_qr(text) to authenticated;

-- -----------------------------------------------------------------------------
-- Storage: catalog photos when storage_path matches object name (active plant)
-- -----------------------------------------------------------------------------
drop policy if exists storage_plant_photos_select_catalog on storage.objects;
create policy storage_plant_photos_select_catalog on storage.objects
for select to authenticated
using (
  bucket_id = 'plant-photos'
  and exists (
    select 1
    from public.plant_catalog_photos cp
    join public.plants pl on pl.id = cp.plant_id and pl.status = 'active'::public.plant_status
    where cp.storage_path = name
  )
);

-- -----------------------------------------------------------------------------
-- User progress photos bucket
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('user-plant-progress', 'user-plant-progress', false)
on conflict (id) do nothing;

drop policy if exists storage_user_progress_select on storage.objects;
create policy storage_user_progress_select on storage.objects
for select to authenticated
using (
  bucket_id = 'user-plant-progress'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists storage_user_progress_insert on storage.objects;
create policy storage_user_progress_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'user-plant-progress'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists storage_user_progress_update on storage.objects;
create policy storage_user_progress_update on storage.objects
for update to authenticated
using (
  bucket_id = 'user-plant-progress'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists storage_user_progress_delete on storage.objects;
create policy storage_user_progress_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'user-plant-progress'
  and (storage.foldername(name))[1] = auth.uid()::text
);
