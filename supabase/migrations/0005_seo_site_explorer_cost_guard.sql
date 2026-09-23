-- Local proposal only. Apply to production after the ordinary DB rollout gate.
-- One request reserves up to three DataForSEO Live calls. A reservation is not refunded:
-- after a network timeout the provider may still have charged for the request.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

create table if not exists public.seo_site_explorer_cache (
  target_domain text primary key,
  data jsonb,
  updated_at timestamptz,
  lease_token uuid,
  lease_expires_at timestamptz,
  cooldown_until timestamptz,
  constraint seo_cache_domain_check check (target_domain ~ '^[a-z0-9.-]{3,253}$'),
  constraint seo_cache_lease_check check ((lease_token is null) = (lease_expires_at is null))
);

-- An older cache table may exist with a different shape. Reject it before
-- privileges/functions change; the transaction rolls back in full.
do $$
declare
  v_missing text;
begin
  select string_agg(required.name, ', ' order by required.name) into v_missing
  from (values ('target_domain'), ('data'), ('updated_at'), ('lease_token'),
    ('lease_expires_at'), ('cooldown_until')) as required(name)
  where not exists (
    select 1 from information_schema.columns c
    where c.table_schema = 'public' and c.table_name = 'seo_site_explorer_cache'
      and c.column_name = required.name
  );
  if v_missing is not null then
    raise exception 'seo_site_explorer_cache incompatible; missing columns: %', v_missing;
  end if;
  if exists (
    select 1 from information_schema.columns c
    where c.table_schema = 'public' and c.table_name = 'seo_site_explorer_cache'
      and c.column_name in ('data', 'updated_at') and c.is_nullable = 'NO'
  ) then
    raise exception 'seo_site_explorer_cache incompatible; data and updated_at must allow NULL for leases';
  end if;
end $$;

create table if not exists public.seo_site_explorer_hourly_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  bucket_start timestamptz not null,
  reservations integer not null default 0 check (reservations >= 0),
  primary key (user_id, bucket_start)
);

create table if not exists public.seo_site_explorer_global_usage (
  bucket_start timestamptz primary key,
  reservations integer not null default 0 check (reservations >= 0)
);

alter table public.seo_site_explorer_cache enable row level security;
alter table public.seo_site_explorer_hourly_usage enable row level security;
alter table public.seo_site_explorer_global_usage enable row level security;
revoke all on public.seo_site_explorer_cache from public, anon, authenticated;
revoke all on public.seo_site_explorer_hourly_usage from public, anon, authenticated;
revoke all on public.seo_site_explorer_global_usage from public, anon, authenticated;
grant select, insert, update on public.seo_site_explorer_cache to service_role;
grant select, insert, update on public.seo_site_explorer_hourly_usage to service_role;
grant select, insert, update on public.seo_site_explorer_global_usage to service_role;

create or replace function public.reserve_seo_site_explorer(p_domain text, p_user uuid)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_cache public.seo_site_explorer_cache%rowtype;
  v_bucket timestamptz := date_trunc('hour', clock_timestamp());
  v_global integer;
  v_user integer;
  v_token uuid;
  v_ttl interval;
begin
  if p_user is null or p_domain is null or p_domain !~ '^[a-z0-9.-]{3,253}$' then
    return jsonb_build_object('status', 'invalid');
  end if;
  insert into public.seo_site_explorer_cache(target_domain) values (p_domain)
    on conflict (target_domain) do nothing;
  select * into v_cache from public.seo_site_explorer_cache
    where target_domain = p_domain for update;

  v_ttl := case when jsonb_array_length(coalesce(v_cache.data->'warnings', '[]'::jsonb)) > 0
    then interval '5 minutes' else interval '7 days' end;
  if v_cache.data is not null and v_cache.data->>'schemaVersion' = '3' and
      v_cache.updated_at > clock_timestamp() - v_ttl then
    return jsonb_build_object('status', 'cached', 'data', v_cache.data);
  end if;
  if v_cache.lease_expires_at > clock_timestamp() then
    return jsonb_build_object('status', 'busy');
  end if;
  if v_cache.cooldown_until > clock_timestamp() then
    return jsonb_build_object('status', 'cooldown');
  end if;

  -- Every claimant locks in the same order: domain, global hour, user hour.
  insert into public.seo_site_explorer_global_usage(bucket_start) values (v_bucket)
    on conflict (bucket_start) do nothing;
  select reservations into v_global from public.seo_site_explorer_global_usage
    where bucket_start = v_bucket for update;
  if v_global >= 20 then return jsonb_build_object('status', 'limited'); end if;

  insert into public.seo_site_explorer_hourly_usage(user_id, bucket_start)
    values (p_user, v_bucket) on conflict (user_id, bucket_start) do nothing;
  select reservations into v_user from public.seo_site_explorer_hourly_usage
    where user_id = p_user and bucket_start = v_bucket for update;
  if v_user >= 5 then return jsonb_build_object('status', 'limited'); end if;

  update public.seo_site_explorer_global_usage set reservations = reservations + 1
    where bucket_start = v_bucket;
  update public.seo_site_explorer_hourly_usage set reservations = reservations + 1
    where user_id = p_user and bucket_start = v_bucket;
  v_token := gen_random_uuid();
  update public.seo_site_explorer_cache
    set lease_token = v_token, lease_expires_at = clock_timestamp() + interval '45 seconds', cooldown_until = null
    where target_domain = p_domain;
  return jsonb_build_object('status', 'reserved', 'token', v_token);
end;
$$;

create or replace function public.finish_seo_site_explorer(p_domain text, p_token uuid, p_data jsonb)
returns boolean
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_updated integer;
begin
  if p_data is null or p_data->>'schemaVersion' <> '3' or p_data->>'domain' <> p_domain then
    return false;
  end if;
  update public.seo_site_explorer_cache
    set data = p_data, updated_at = clock_timestamp(), lease_token = null,
        lease_expires_at = null, cooldown_until = null
    where target_domain = p_domain and lease_token = p_token;
  get diagnostics v_updated = row_count;
  return v_updated = 1;
end;
$$;

create or replace function public.fail_seo_site_explorer(p_domain text, p_token uuid)
returns boolean
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_updated integer;
begin
  update public.seo_site_explorer_cache
    set lease_token = null, lease_expires_at = null,
        cooldown_until = clock_timestamp() + interval '15 seconds'
    where target_domain = p_domain and lease_token = p_token;
  get diagnostics v_updated = row_count;
  return v_updated = 1;
end;
$$;

revoke all on function public.reserve_seo_site_explorer(text, uuid) from public, anon, authenticated;
revoke all on function public.finish_seo_site_explorer(text, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.fail_seo_site_explorer(text, uuid) from public, anon, authenticated;
grant execute on function public.reserve_seo_site_explorer(text, uuid) to service_role;
grant execute on function public.finish_seo_site_explorer(text, uuid, jsonb) to service_role;
grant execute on function public.fail_seo_site_explorer(text, uuid) to service_role;
commit;
