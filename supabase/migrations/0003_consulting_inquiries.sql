-- ============================================================
-- Migration 0003: マーケティングコンサルティング相談リード保存テーブル
-- 既存デプロイ済みDBに安全に適用可能（すべて IF NOT EXISTS / 冪等）
-- 適用方法: Supabase Dashboard > SQL Editor で実行、または supabase db push
-- ============================================================

create table if not exists public.consulting_inquiries (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text,
  email text not null,
  website_url text,
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.consulting_inquiries enable row level security;

-- 未認証（anon）および認証済みユーザーの両方からのお問い合わせINSERTを許可
drop policy if exists "public can submit inquiries" on public.consulting_inquiries;
create policy "public can submit inquiries"
  on public.consulting_inquiries
  for insert
  to anon, authenticated
  with check (true);

-- ※ SELECT（閲覧）ポリシーは設定せず、Supabase管理画面からのみ閲覧可能とする（機密情報保護）
