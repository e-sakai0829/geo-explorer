-- ============================================================
-- GEO Explorer SaaS: 商用マルチテナント DB スキーマ (Supabase PostgreSQL)
-- ============================================================

-- 1. 組織テーブル
create table if not exists public.organizations (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null default 'マイ組織',
    plan text not null default 'starter' check (plan in ('starter', 'growth', 'agency', 'enterprise')),
    monthly_credits integer not null default 10,
    used_credits integer not null default 0,
    stripe_customer_id text,
    stripe_subscription_id text,
    credits_reset_at timestamp with time zone default (now() + interval '30 days') not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. プロジェクトテーブル (業界不問の汎用プレースホルダー)
create table if not exists public.projects (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid references public.organizations(id) on delete cascade not null,
    name text not null default '自社ブランド',
    domain text not null default 'https://example.com',
    competitors text[] default array[]::text[],
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. 追跡プロンプトテーブル
create table if not exists public.tracked_prompts (
    id uuid primary key default gen_random_uuid(),
    project_id uuid references public.projects(id) on delete cascade not null,
    prompt_text text not null,
    target_locale text not null default 'ja-JP',
    check_frequency text not null default 'weekly' check (check_frequency in ('daily', 'weekly', 'manual')),
    last_scanned_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. 解析ログテーブル
create table if not exists public.prompt_analysis_logs (
    id uuid primary key default gen_random_uuid(),
    prompt_id uuid references public.tracked_prompts(id) on delete cascade not null,
    ai_overview_present boolean not null default false,
    brand_mentioned boolean not null default false,
    brand_cited boolean not null default false,
    raw_response text,
    fanout_queries text[] default array[]::text[],
    citation_sources jsonb default '[]'::jsonb,
    competitor_mentions jsonb default '{}'::jsonb,
    -- PRD v3.0 ATS & 動的診断フィールド
    target_ats_score integer default 0,
    competitor_ats_scores jsonb default '{}'::jsonb,
    primary_source_type text,
    diagnostic_advice jsonb default '{}'::jsonb,
    scanned_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. AEO記事テーブル
create table if not exists public.aeo_articles (
    id uuid primary key default gen_random_uuid(),
    project_id uuid references public.projects(id) on delete cascade not null,
    target_prompt text not null,
    language text not null default 'ja',
    title text not null,
    content_markdown text not null,
    fanout_queries_covered text[] default array[]::text[],
    aeo_score integer default 90,
    status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. RLS の有効化 & 厳格なポリシー設定
alter table public.organizations enable row level security;
alter table public.projects enable row level security;
alter table public.tracked_prompts enable row level security;
alter table public.prompt_analysis_logs enable row level security;
alter table public.aeo_articles enable row level security;

create policy "organizations_policy" on public.organizations
    for all using (auth.uid() = user_id);

create policy "projects_policy" on public.projects
    for all using (
        organization_id in (select id from public.organizations where user_id = auth.uid())
    );

create policy "tracked_prompts_policy" on public.tracked_prompts
    for all using (
        project_id in (
            select p.id from public.projects p
            join public.organizations o on p.organization_id = o.id
            where o.user_id = auth.uid()
        )
    );

create policy "prompt_analysis_logs_policy" on public.prompt_analysis_logs
    for all using (
        prompt_id in (
            select tp.id from public.tracked_prompts tp
            join public.projects p on tp.project_id = p.id
            join public.organizations o on p.organization_id = o.id
            where o.user_id = auth.uid()
        )
    );

create policy "aeo_articles_policy" on public.aeo_articles
    for all using (
        project_id in (
            select p.id from public.projects p
            join public.organizations o on p.organization_id = o.id
            where o.user_id = auth.uid()
        )
    );

-- 7. アトミックなクレジット消費関数 (TOCTOU防止 & 所有者厳格検証)
create or replace function public.consume_credit(org_id uuid)
returns boolean as $$
declare
    affected_rows integer;
begin
    update public.organizations
    set used_credits = used_credits + 1,
        updated_at = now()
    where id = org_id 
      and user_id = auth.uid()
      and used_credits < monthly_credits;

    get diagnostics affected_rows = row_count;
    return affected_rows > 0;
end;
$$ language plpgsql security definer;

-- 8. 新規ユーザー登録時の自動初期化トリガー (クリーンな汎用プレースホルダー)
create or replace function public.handle_new_user()
returns trigger as $$
declare
    new_org_id uuid;
begin
    insert into public.organizations (user_id, name, plan, monthly_credits, used_credits)
    values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1) || ' 組織'), 'starter', 10, 0)
    returning id into new_org_id;

    insert into public.projects (organization_id, name, domain, competitors)
    values (new_org_id, '自社ブランド', 'https://example.com', array[]::text[]);

    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
