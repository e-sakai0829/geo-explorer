-- Run only against an isolated PostgreSQL database after migrations 0005 and 0007.
begin;

do $$
declare
  v_user uuid := '00000000-0000-0000-0000-000000000001';
  v_claim jsonb;
  v_token uuid;
  v_result jsonb := '{"schemaVersion":1,"keyword":"梱包資材","location":"JP","language":"ja","fetchedAt":"2026-09-29T00:00:00.000Z","source":"dataforseo","overview":{"keyword":"梱包資材","volume":0,"difficulty":0,"cpc":0,"intent":null},"related":[],"organicResults":[],"warnings":[]}'::jsonb;
begin
  if has_function_privilege('authenticated', 'public.reserve_seo_keyword_explorer(text,uuid)', 'EXECUTE') then
    raise exception 'authenticated role can call reservation function';
  end if;
  if has_table_privilege('authenticated', 'public.seo_keyword_explorer_cache', 'SELECT') then
    raise exception 'authenticated role can read cache';
  end if;

  v_claim := public.reserve_seo_keyword_explorer('梱包資材', v_user);
  if v_claim->>'status' <> 'reserved' then raise exception 'first claim failed: %', v_claim; end if;
  v_token := (v_claim->>'token')::uuid;
  if public.reserve_seo_keyword_explorer('梱包資材', v_user)->>'status' <> 'busy' then
    raise exception 'duplicate request was not blocked';
  end if;
  if public.finish_seo_keyword_explorer('梱包資材', gen_random_uuid(), v_result) then
    raise exception 'incorrect lease token was accepted';
  end if;
  if not public.finish_seo_keyword_explorer('梱包資材', v_token, v_result) then
    raise exception 'valid result was not committed';
  end if;
  if public.reserve_seo_keyword_explorer('梱包資材', v_user)->>'status' <> 'cached' then
    raise exception 'second search missed cache';
  end if;

  -- Four further new keywords reach the shared five-reservation user cap.
  for i in 1..4 loop
    v_claim := public.reserve_seo_keyword_explorer('test keyword ' || i, v_user);
    if v_claim->>'status' <> 'reserved' then raise exception 'reservation % failed: %', i, v_claim; end if;
  end loop;
  if public.reserve_seo_site_explorer('example.com', v_user)->>'status' <> 'limited' then
    raise exception 'site explorer did not observe shared user cap';
  end if;
  if public.reserve_seo_keyword_explorer('sixth keyword', v_user)->>'status' <> 'limited' then
    raise exception 'keyword explorer exceeded shared user cap';
  end if;
  raise notice 'PASS lease, token, cache, privileges, shared hourly cap';
end $$;

rollback;
