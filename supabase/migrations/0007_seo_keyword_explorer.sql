-- Apply only after 0005. One reservation can issue at most three paid DataForSEO calls.
-- Uses the existing shared SEO hourly budget: 5 searches/user and 20 searches/global.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

create table public.seo_keyword_explorer_cache (
  target_keyword text primary key check (char_length(target_keyword) between 2 and 80),
  data jsonb,
  updated_at timestamptz,
  lease_token uuid,
  lease_expires_at timestamptz,
  cooldown_until timestamptz,
  constraint seo_keyword_cache_lease_check check ((lease_token is null) = (lease_expires_at is null))
);
alter table public.seo_keyword_explorer_cache enable row level security;
revoke all on public.seo_keyword_explorer_cache from public, anon, authenticated;
grant select, insert, update on public.seo_keyword_explorer_cache to service_role;

create function public.reserve_seo_keyword_explorer(p_keyword text, p_user uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_cache public.seo_keyword_explorer_cache%rowtype;
  v_bucket timestamptz := date_trunc('hour', clock_timestamp());
  v_global integer;
  v_user integer;
  v_token uuid;
  v_ttl interval;
begin
  if p_user is null or p_keyword is null or char_length(p_keyword) not between 2 and 80 then
    return jsonb_build_object('status', 'invalid');
  end if;
  insert into public.seo_keyword_explorer_cache(target_keyword) values (p_keyword)
    on conflict (target_keyword) do nothing;
  select * into v_cache from public.seo_keyword_explorer_cache
    where target_keyword = p_keyword for update;
  v_ttl := case when jsonb_array_length(coalesce(v_cache.data->'warnings', '[]'::jsonb)) > 0
    then interval '5 minutes' else interval '7 days' end;
  if v_cache.data is not null and v_cache.data->>'schemaVersion' = '1' and
      v_cache.updated_at > clock_timestamp() - v_ttl then
    return jsonb_build_object('status', 'cached', 'data', v_cache.data);
  end if;
  if v_cache.lease_expires_at > clock_timestamp() then return jsonb_build_object('status', 'busy'); end if;
  if v_cache.cooldown_until > clock_timestamp() then return jsonb_build_object('status', 'cooldown'); end if;

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
  update public.seo_site_explorer_global_usage set reservations = reservations + 1 where bucket_start = v_bucket;
  update public.seo_site_explorer_hourly_usage set reservations = reservations + 1
    where user_id = p_user and bucket_start = v_bucket;
  v_token := gen_random_uuid();
  update public.seo_keyword_explorer_cache
    set lease_token = v_token, lease_expires_at = clock_timestamp() + interval '60 seconds', cooldown_until = null
    where target_keyword = p_keyword;
  return jsonb_build_object('status', 'reserved', 'token', v_token);
end;
$$;

create function public.finish_seo_keyword_explorer(p_keyword text, p_token uuid, p_data jsonb)
returns boolean language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_updated integer;
begin
  if p_data is null or p_data->>'schemaVersion' <> '1' or p_data->>'keyword' <> p_keyword then return false; end if;
  update public.seo_keyword_explorer_cache
    set data = p_data, updated_at = clock_timestamp(), lease_token = null,
        lease_expires_at = null, cooldown_until = null
    where target_keyword = p_keyword and lease_token = p_token;
  get diagnostics v_updated = row_count;
  return v_updated = 1;
end;
$$;

create function public.fail_seo_keyword_explorer(p_keyword text, p_token uuid)
returns boolean language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_updated integer;
begin
  update public.seo_keyword_explorer_cache
    set lease_token = null, lease_expires_at = null, cooldown_until = clock_timestamp() + interval '15 seconds'
    where target_keyword = p_keyword and lease_token = p_token;
  get diagnostics v_updated = row_count;
  return v_updated = 1;
end;
$$;

revoke all on function public.reserve_seo_keyword_explorer(text, uuid) from public, anon, authenticated;
revoke all on function public.finish_seo_keyword_explorer(text, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.fail_seo_keyword_explorer(text, uuid) from public, anon, authenticated;
grant execute on function public.reserve_seo_keyword_explorer(text, uuid) to service_role;
grant execute on function public.finish_seo_keyword_explorer(text, uuid, jsonb) to service_role;
grant execute on function public.fail_seo_keyword_explorer(text, uuid) to service_role;
commit;
