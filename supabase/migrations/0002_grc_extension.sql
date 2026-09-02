-- ============================================================
-- Migration 0002: GRC型週次モニタリング対応拡張
-- 既存デプロイ済みDBに安全に適用可能（すべて IF NOT EXISTS / 冪等）
-- 適用方法: Supabase Dashboard > SQL Editor で実行、または
--   supabase db push / psql -f supabase/migrations/0002_grc_extension.sql
-- ============================================================

alter table public.tracked_prompts
    add column if not exists category text not null default '未分類',
    add column if not exists search_intent text,
    add column if not exists importance text not null default 'medium',
    add column if not exists keyword text;

do $$ begin
    alter table public.tracked_prompts
        add constraint tracked_prompts_importance_check check (importance in ('high', 'medium', 'low'));
exception when duplicate_object then null;
end $$;

alter table public.prompt_analysis_logs
    add column if not exists engine text not null default 'gemini',
    add column if not exists rank integer,
    add column if not exists aio_status text not null default 'not_shown',
    add column if not exists win_loss text,
    add column if not exists direct_mention_score integer,
    add column if not exists citation_domain_score integer,
    add column if not exists fanout_coverage_score integer;

do $$ begin
    alter table public.prompt_analysis_logs
        add constraint prompt_analysis_logs_engine_check check (engine in ('gemini', 'chatgpt', 'ai_mode', 'perplexity'));
exception when duplicate_object then null;
end $$;

do $$ begin
    alter table public.prompt_analysis_logs
        add constraint prompt_analysis_logs_aio_status_check check (aio_status in ('not_shown', 'shown_not_recommended', 'shown_recommended'));
exception when duplicate_object then null;
end $$;

do $$ begin
    alter table public.prompt_analysis_logs
        add constraint prompt_analysis_logs_win_loss_check check (win_loss in ('win', 'loss', 'draw', 'not_applicable'));
exception when duplicate_object then null;
end $$;

create table if not exists public.domain_citations (
    id uuid primary key default gen_random_uuid(),
    project_id uuid references public.projects(id) on delete cascade not null,
    domain text not null,
    media_name text,
    citation_count integer not null default 0,
    our_listed boolean not null default false,
    domain_rating integer,
    action_note text,
    category text,
    last_seen_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (project_id, domain)
);

alter table public.domain_citations enable row level security;

do $$ begin
    create policy "domain_citations_policy" on public.domain_citations
        for all using (
            project_id in (
                select p.id from public.projects p
                join public.organizations o on p.organization_id = o.id
                where o.user_id = auth.uid()
            )
        );
exception when duplicate_object then null;
end $$;
