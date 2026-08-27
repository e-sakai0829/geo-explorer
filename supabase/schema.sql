-- ============================================================
-- GEO Explorer SaaS: 商用マルチテナント DB スキーマ (Supabase PostgreSQL)
-- ============================================================

-- 1. 組織（テナント）テーブル
create table if not exists public.organizations (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    plan text not null default 'starter' check (plan in ('starter', 'growth', 'agency', 'enterprise')),
    monthly_credits integer not null default 10,
    used_credits integer not null default 0,
    stripe_customer_id text unique,
    stripe_subscription_id text unique,
    credits_reset_at timestamp with time zone not null default (now() + interval '30 days'),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. プロジェクト（追跡対象ドメイン・自社ブランド）テーブル
create table if not exists public.projects (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid references public.organizations(id) on delete cascade not null,
    name text not null,
    domain text not null,
    competitors text[] default array[]::text[],
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. 追跡プロンプト（検索クエリ）テーブル
create table if not exists public.tracked_prompts (
    id uuid primary key default gen_random_uuid(),
    project_id uuid references public.projects(id) on delete cascade not null,
    prompt_text text not null,
    target_locale text not null default 'ja-JP',
    check_frequency text not null default 'weekly' check (check_frequency in ('daily', 'weekly', 'manual')),
    last_scanned_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. プロンプト解析ログ（Search Grounding スキャン結果）テーブル
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
    scanned_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. AEO 直答生成記事テーブル
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

-- ============================================================
-- Row Level Security (RLS) ポリシー: 厳格なマルチテナント分離
-- ============================================================
alter table public.organizations enable row level security;
alter table public.projects enable row level security;
alter table public.tracked_prompts enable row level security;
alter table public.prompt_analysis_logs enable row level security;
alter table public.aeo_articles enable row level security;

-- organizations: 自身の user_id のみ操作可能
create policy "Users can view own organizations"
    on public.organizations for select
    using (auth.uid() = user_id);

create policy "Users can update own organizations"
    on public.organizations for update
    using (auth.uid() = user_id);

create policy "Users can insert own organizations"
    on public.organizations for insert
    with check (auth.uid() = user_id);

-- projects: 自身が所属する organization のみ操作可能
create policy "Users can manage own projects"
    on public.projects for all
    using (
        organization_id in (
            select id from public.organizations where user_id = auth.uid()
        )
    );

-- tracked_prompts: 自身が所有する project のみ操作可能
create policy "Users can manage own tracked prompts"
    on public.tracked_prompts for all
    using (
        project_id in (
            select p.id from public.projects p
            join public.organizations o on p.organization_id = o.id
            where o.user_id = auth.uid()
        )
    );

-- prompt_analysis_logs: 自身の tracked_prompts のみ操作可能
create policy "Users can manage own analysis logs"
    on public.prompt_analysis_logs for all
    using (
        prompt_id in (
            select tp.id from public.tracked_prompts tp
            join public.projects p on tp.project_id = p.id
            join public.organizations o on p.organization_id = o.id
            where o.user_id = auth.uid()
        )
    );

-- aeo_articles: 自身の project のみ操作可能
create policy "Users can manage own aeo articles"
    on public.aeo_articles for all
    using (
        project_id in (
            select p.id from public.projects p
            join public.organizations o on p.organization_id = o.id
            where o.user_id = auth.uid()
        )
    );

-- ============================================================
-- アトミックなクレジット消費関数 (TOCTOU競合状態の完全防止)
-- ============================================================
create or replace function public.consume_credit(org_id uuid)
returns boolean as $$
declare
    affected_rows integer;
begin
    update public.organizations
    set used_credits = used_credits + 1,
        updated_at = now()
    where id = org_id and used_credits < monthly_credits;

    get diagnostics affected_rows = row_count;
    return affected_rows > 0;
end;
$$ language plpgsql security definer;

-- ============================================================
-- 新規ユーザー登録時の自動テナント初期化トリガー
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
declare
    new_org_id uuid;
begin
    -- 1. 無料枠の組織を作成 (10クレジット)
    insert into public.organizations (user_id, name, plan, monthly_credits, used_credits)
    values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1) || ' 組織'), 'starter', 10, 0)
    returning id into new_org_id;

    -- 2. デフォルトプロジェクトを作成
    insert into public.projects (organization_id, name, domain, competitors)
    values (
        new_org_id, 
        'My Brand', 
        'https://example.com', 
        array['Competitor A', 'Competitor B']
    );

    return new;
end;
$$ language plpgsql security definer;

-- トリガーの作成
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
