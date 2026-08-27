import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const PLAN_PRICES: Record<string, { name: string; amount: number }> = {
  starter: { name: "GEO Explorer Starter プラン", amount: 9800 },
  growth: { name: "GEO Explorer Growth プラン", amount: 29800 },
  agency: { name: "GEO Explorer Agency プラン", amount: 79800 },
};

export async function POST(req: NextRequest) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      console.error("STRIPE_SECRET_KEY is missing in environment variables.");
      return NextResponse.json({ 
        error: "Vercelの環境変数に STRIPE_SECRET_KEY が設定されていません。Vercelダッシュボードの Settings > Environment Variables で設定を確認してください。" 
      }, { status: 500 });
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

    // Stripe サブスクリプション Checkout セッションの作成
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "jpy",
            product_data: {
              name: plan.name,
              description: `${plan.name}（月額サブスクリプション）`,
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
      metadata: {
        planId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json({ error: error.message || "決済セッションの作成に失敗しました。" }, { status: 500 });
  }
}
