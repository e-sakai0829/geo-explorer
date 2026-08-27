import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";

const stripeKey = process.env.STRIPE_SECRET_KEY || "";
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

const stripe = new Stripe(stripeKey, {
  apiVersion: "2023-10-16" as any,
});

const PLAN_CREDITS: Record<string, number> = {
  starter: 30,
  growth: 150,
  agency: 500,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    // Webhook署名検証 (Webhook Secretがある場合)
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err: any) {
        console.error("Webhook signature verification failed:", err.message);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
    } else {
      // 署名なし（テストモード）
      event = JSON.parse(body);
    }

    // イベント別の処理
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const planId = session.metadata?.planId || "starter";
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const credits = PLAN_CREDITS[planId] || 30;

        console.log(`[Stripe Webhook] Checkout completed for plan: ${planId}, credits: ${credits}`);

        // Supabase の organizations テーブルを更新（最新の組織を更新）
        const { error } = await supabase
          .from("organizations")
          .update({
            plan: planId,
            monthly_credits: credits,
            used_credits: 0,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            credits_reset_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .order("created_at", { ascending: false })
          .limit(1);

        if (error) {
          console.error("Failed to update Supabase organization:", error);
        } else {
          console.log("Successfully updated organization plan and credits in Supabase!");
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[Stripe Webhook] Subscription canceled: ${subscription.id}`);

        // 解約時はプランを starter (無料/初期枠) に戻す
        await supabase
          .from("organizations")
          .update({
            plan: "starter",
            monthly_credits: 10,
          })
          .eq("stripe_subscription_id", subscription.id);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Stripe Webhook Error:", error);
    return NextResponse.json({ error: error.message || "Webhook processing error" }, { status: 500 });
  }
}
