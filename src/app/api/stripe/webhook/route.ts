import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase-admin";

const PLAN_CREDITS: Record<string, number> = {
  starter: 30,
  growth: 150,
  agency: 500,
};

export async function POST(req: NextRequest) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeKey) {
      console.error("Missing STRIPE_SECRET_KEY in Webhook");
      return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
    }

    if (!webhookSecret) {
      console.error("Missing STRIPE_WEBHOOK_SECRET in Webhook (Fail-closed)");
      return NextResponse.json({ error: "Missing STRIPE_WEBHOOK_SECRET" }, { status: 500 });
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16" as any,
    });

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      console.error("Missing stripe-signature header");
      return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
    }

    // サーバーレス環境での RLS バイパス専用 Admin クライアントを取得
    const supabase = createAdminClient();

    // ==========================================
    // 1. 初回決済完了イベント (checkout.session.completed)
    // ==========================================
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata || {};
      const planId = (metadata.planId || "starter").toLowerCase();
      const orgId = metadata.orgId;
      const userId = metadata.userId;
      const customerId = session.customer as string;

      const monthlyCredits = PLAN_CREDITS[planId] || 30;

      // 初回契約時は used_credits を 0 に初期化
      const updateData = {
        plan: planId,
        monthly_credits: monthlyCredits,
        used_credits: 0,
        stripe_customer_id: customerId || null,
        updated_at: new Date().toISOString(),
      };

      if (orgId) {
        const { error: orgError } = await supabase
          .from("organizations")
          .update(updateData)
          .eq("id", orgId);

        if (orgError) {
          console.error("Failed to update organization by orgId:", orgError);
        }
      } else if (userId) {
        const { error: orgError } = await supabase
          .from("organizations")
          .update(updateData)
          .eq("user_id", userId);

        if (orgError) {
          console.error("Failed to update organization by userId:", orgError);
        }
      } else if (customerId) {
        const { error: orgError } = await supabase
          .from("organizations")
          .update(updateData)
          .eq("stripe_customer_id", customerId);

        if (orgError) {
          console.error("Failed to update organization by customerId:", orgError);
        }
      }
    }

    // ==========================================
    // 2. 毎月の更新請求成功イベント (invoice.payment_succeeded)
    // ★ 2ヶ月目以降の月次クレジット自動リセット（used_credits: 0）
    // ==========================================
    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      const billingReason = invoice.billing_reason;

      // 毎月の自動更新請求（subscription_cycle）または初回契約時
      if (customerId && (billingReason === "subscription_cycle" || billingReason === "subscription_create")) {
        const { error: orgError } = await supabase
          .from("organizations")
          .update({
            used_credits: 0, // 月次利用枠を 0 に完全リセット
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        if (orgError) {
          console.error("Failed to reset used_credits on invoice.payment_succeeded:", orgError);
        }
      }
    }

    // ==========================================
    // 3. プラン変更イベント (customer.subscription.updated)
    // ==========================================
    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const metadata = subscription.metadata || {};

      // metadata.planId からの判定（最優先・完全多通貨対応）
      let planId = metadata.planId ? metadata.planId.toLowerCase() : "";

      // metadata にない場合のフォールバック（USD / TWD / JPY の多通貨正確照合）
      if (!planId || !PLAN_CREDITS[planId]) {
        const priceAmount = subscription.items?.data?.[0]?.price?.unit_amount || 0;
        const currency = (subscription.items?.data?.[0]?.price?.currency || "jpy").toLowerCase();

        if (currency === "usd") {
          if (priceAmount <= 7000) planId = "starter"; // $69 (6900)
          else if (priceAmount >= 40000) planId = "agency"; // $499 (49900)
          else planId = "growth"; // $199 (19900)
        } else if (currency === "twd") {
          if (priceAmount <= 250000) planId = "starter"; // NT$ 2,190 (219000)
          else if (priceAmount >= 1500000) planId = "agency"; // NT$ 17,900 (1790000)
          else planId = "growth"; // NT$ 6,590 (659000)
        } else {
          // JPY
          if (priceAmount <= 10000) planId = "starter"; // ¥9,800
          else if (priceAmount >= 70000) planId = "agency"; // ¥79,800
          else planId = "growth"; // ¥29,800
        }
      }

      const monthlyCredits = PLAN_CREDITS[planId] || 30;

      if (customerId) {
        const { error: orgError } = await supabase
          .from("organizations")
          .update({
            plan: planId,
            monthly_credits: monthlyCredits,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        if (orgError) {
          console.error("Failed to update organization on subscription.updated:", orgError);
        }
      }
    }

    // ==========================================
    // 4. 解約イベント (customer.subscription.deleted)
    // ★ 解約時は即座に無料プラン（10クレジット）へダウングレード
    // ==========================================
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      if (customerId) {
        const { error: orgError } = await supabase
          .from("organizations")
          .update({
            plan: "starter",
            monthly_credits: 10, // 無料初期枠へダウングレード
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        if (orgError) {
          console.error("Failed to downgrade organization on subscription.deleted:", orgError);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Stripe Webhook Error:", error);
    return NextResponse.json({ error: error.message || "Webhook processing failed" }, { status: 500 });
  }
}
