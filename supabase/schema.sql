-- ==========================================================
-- GEO Explorer / AI-Citations データベース構築スクリプト
-- Supabase SQL Editor に貼り付けて「RUN」を実行してください
-- ==========================================================

-- 1. 組織・ユーザー管理テーブル (Stripe連携 & クレジット管理)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'starter', -- starter, growth, agency
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    monthly_credits INT NOT NULL DEFAULT 30,
    used_credits INT NOT NULL DEFAULT 0,
    credits_reset_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 month'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. プロジェクト（追跡サイト）テーブル
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_brand TEXT NOT NULL, -- 自社ブランド名 (例: Ailo)
    target_domain TEXT NOT NULL, -- 自社ドメイン (例: https://ailo.jp)
    competitor_brands TEXT[] NOT NULL DEFAULT '{}', -- 競合ブランドリスト
    competitor_domains TEXT[] NOT NULL DEFAULT '{}', -- 競合ドメインリスト
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 追跡プロンプトテーブル
CREATE TABLE IF NOT EXISTS public.tracked_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    prompt_text TEXT NOT NULL,
    category TEXT DEFAULT '一般',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 調査・解析ログテーブル (日次/週次スナップショット)
CREATE TABLE IF NOT EXISTS public.prompt_analysis_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_id UUID REFERENCES public.tracked_prompts(id) ON DELETE CASCADE,
    raw_response_text TEXT,
    target_mentioned BOOLEAN NOT NULL DEFAULT FALSE,
    target_cited BOOLEAN NOT NULL DEFAULT FALSE,
    mentioned_competitors TEXT[] DEFAULT '{}',
    fanout_queries TEXT[] DEFAULT '{}', -- AI内部展開サブクエリ
    citations JSONB DEFAULT '[]', -- [{title, url, domain}]
    difficulty_score INT DEFAULT 50, -- 奪取難易度 (1-100)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. AEO生成記事 ＆ クローズドループ効果測定テーブル
CREATE TABLE IF NOT EXISTS public.aeo_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    prompt_id UUID REFERENCES public.tracked_prompts(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    outline JSONB NOT NULL DEFAULT '[]',
    content_markdown TEXT NOT NULL,
    published_url TEXT, -- ユーザーが公開したURL
    published_at TIMESTAMP WITH TIME ZONE, -- 公開日時
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) の有効化（セキュリティ強化）
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracked_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_analysis_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aeo_articles ENABLE ROW LEVEL SECURITY;

-- 開発用パブリックアクセスポリシーの作成
CREATE POLICY "Public Read/Write Organizations" ON public.organizations FOR ALL USING (true);
CREATE POLICY "Public Read/Write Projects" ON public.projects FOR ALL USING (true);
CREATE POLICY "Public Read/Write Prompts" ON public.tracked_prompts FOR ALL USING (true);
CREATE POLICY "Public Read/Write Logs" ON public.prompt_analysis_logs FOR ALL USING (true);
CREATE POLICY "Public Read/Write Articles" ON public.aeo_articles FOR ALL USING (true);

-- 初期テストデータの投入 (Ailo プロジェクト)
INSERT INTO public.organizations (name, plan, monthly_credits, used_credits)
VALUES ('Traditionalart Inc.', 'starter', 30, 6);
