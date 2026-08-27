import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const PLAN_PRICES: Record<string, { name: string; amount: number; credits: number }> = {
  starter: { name: "GEO Explorer Starter プラン", amount: 9800, credits: 30 },
  growth: { name: "GEO Explorer Growth プラン", amount: 29800, credits: 150 },
  agency: { name: "GEO Explorer Agency プラン", amount: 79800, credits: 500 },
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

    const { planId = "growth" } = await req.json();
    const plan = PLAN_PRICES[planId];

    if (!plan) {
      return NextResponse.json({ error: "無効なプランです。" }, { status: 400 });
    }

    const origin = req.headers.get("origin") || "https://geo.traditionalart.biz";

    // 2. Stripe Checkout セッションを作成（orgId & userId をメタデータに完全注入）
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "jpy",
            product_data: {
              name: plan.name,
              description: `${plan.name}（月間 ${plan.credits} クレジット付与）`,
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
