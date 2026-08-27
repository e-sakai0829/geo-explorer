import type { Metadata } from "next";
import "./globals.css";
import AppLayoutWrapper from "@/components/AppLayoutWrapper";

export const metadata: Metadata = {
  title: "GEO Explorer | AI検索（Google AIO / Gemini）言及・引用最適化プラットフォーム",
  description: "Google AI Overviews、Gemini、ChatGPT検索におけるブランド露出を可視化し、AEO直答記事を自動生成する次世代GEO SaaS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="bg-white text-slate-900 antialiased min-h-screen">
        <AppLayoutWrapper>
          {children}
        </AppLayoutWrapper>
      </body>
    </html>
  );
}
