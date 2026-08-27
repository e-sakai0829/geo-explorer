import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: "STRIPE_SECRET_KEY が設定されていません。" }, { status: 500 });
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16" as any,
    });

    // 最新の組織から stripe_customer_id を取得
    const { data: org } = await supabase
      .from("organizations")
      .select("stripe_customer_id")
      .not("stripe_customer_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const origin = req.headers.get("origin") || "https://geo.traditionalart.biz";

    if (!org?.stripe_customer_id) {
      // まだStripe顧客IDがない場合は料金ページへリダイレクト案内
      return NextResponse.json({ 
        url: `${origin}/pricing` 
      });
    }

    // Stripe Customer Portal (請求管理・解約・領収書発行ポータル) セッションの作成
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: org.stripe_customer_id,
      return_url: `${origin}/settings`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    console.error("Stripe Portal Error:", error);
    return NextResponse.json({ error: error.message || "ポータルセッションの作成に失敗しました。" }, { status: 500 });
  }
}
