import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerSupabaseClient } from "@/lib/supabase-server";

// 言語・通貨別の正確なプラン価格定義 (おとり表示・為替不整合を完全排除)
const PLAN_PRICES: Record<string, Record<string, { name: string; amount: number; currency: string; credits: number }>> = {
  ja: {
    starter: { name: "GEO Explorer Starter プラン", amount: 9800, currency: "jpy", credits: 30 },
    growth: { name: "GEO Explorer Growth プラン", amount: 29800, currency: "jpy", credits: 150 },
    agency: { name: "GEO Explorer Agency プラン", amount: 79800, currency: "jpy", credits: 500 },
  },
  "zh-TW": {
    starter: { name: "GEO Explorer Starter 方案", amount: 2190, currency: "twd", credits: 30 },
    growth: { name: "GEO Explorer Growth 方案", amount: 6590, currency: "twd", credits: 150 },
    agency: { name: "GEO Explorer Agency 方案", amount: 17900, currency: "twd", credits: 500 },
  },
  en: {
    starter: { name: "GEO Explorer Starter Plan", amount: 6900, currency: "usd", credits: 30 }, // $69.00
    growth: { name: "GEO Explorer Growth Plan", amount: 19900, currency: "usd", credits: 150 }, // $199.00
    agency: { name: "GEO Explorer Agency Plan", amount: 49900, currency: "usd", credits: 500 }, // $499.00
  },
};

export async function POST(req: NextRequest) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: "STRIPE_SECRET_KEY が設定されていません。" }, { status: 500 });
    }

    // 1. ログインユーザーと組織を取得
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    let orgId = "";
    let userEmail = "";
    let customerId: string | undefined = undefined;

    if (user) {
      userEmail = user.email || "";
      const { data: org } = await supabase
        .from("organizations")
        .select("id, stripe_customer_id")
        .eq("user_id", user.id)
        .single();
      
      orgId = org?.id || "";
      customerId = org?.stripe_customer_id || undefined;
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16" as any,
    });

    const { planId = "growth", lang = "ja" } = await req.json();
    const langKey = PLAN_PRICES[lang] ? lang : "ja";
    const plan = PLAN_PRICES[langKey][planId] || PLAN_PRICES["ja"]["growth"];

    const origin = req.headers.get("origin") || "https://geo.traditionalart.biz";

    // 2. Stripe Checkout セッションを作成（表示通貨・金額と完全に一致）
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: plan.currency,
            product_data: {
              name: plan.name,
              description: lang === "zh-TW" 
                ? `${plan.name}（每月自動發放 ${plan.credits} 查詢額度）` 
                : lang === "en" 
                ? `${plan.name} (${plan.credits} Query Credits / month)` 
                : `${plan.name}（月間 ${plan.credits} クレジット付与）`,
            },
            unit_amount: plan.amount,
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?payment=cancelled`,
      client_reference_id: orgId || user?.id || undefined,
      metadata: {
        planId,
        orgId,
        userId: user?.id || "",
        currency: plan.currency,
      },
    };

    if (customerId) {
      sessionParams.customer = customerId;
    } else if (userEmail) {
      sessionParams.customer_email = userEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json({ error: error.message || "決済セッションの作成に失敗しました。" }, { status: 500 });
  }
}
