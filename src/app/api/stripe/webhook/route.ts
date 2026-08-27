import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase-admin";

const PLAN_CREDITS: Record<string, number> = {
  starter: 30,
  growth: 150,
  agency: 500,
};

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey) {
    console.error("STRIPE_SECRET_KEY is not configured.");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  // 署名検証バイパスの完全排除 (Fail-closed)
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured.");
    return NextResponse.json({ error: "Webhook secret missing" }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: "2023-10-16" as any,
  });

  let event: Stripe.Event;

  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // RLSをバイパスするAdminクライアントを使用（RLSによる更新失敗を完全防止）
  const supabaseAdmin = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const planId = session.metadata?.planId || "growth";
        const orgId = session.metadata?.orgId || session.client_reference_id;
        const userId = session.metadata?.userId;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const credits = PLAN_CREDITS[planId] || 30;

        console.log(`[Stripe Webhook] Verified Checkout for orgId: ${orgId}, userId: ${userId}, plan: ${planId}`);

        if (orgId) {
          const { error } = await supabaseAdmin
            .from("organizations")
            .update({
              plan: planId,
              monthly_credits: credits,
              used_credits: 0,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              credits_reset_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", orgId);

          if (error) throw new Error(`Failed to update org by orgId: ${error.message}`);
        } else if (userId) {
          const { error } = await supabaseAdmin
            .from("organizations")
            .update({
              plan: planId,
              monthly_credits: credits,
              used_credits: 0,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              credits_reset_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);

          if (error) throw new Error(`Failed to update org by userId: ${error.message}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[Stripe Webhook] Subscription canceled for: ${subscription.id}`);

        const { error } = await supabaseAdmin
          .from("organizations")
          .update({
            plan: "starter",
            monthly_credits: 10,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        if (error) throw new Error(`Failed to cancel subscription: ${error.message}`);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Stripe Webhook DB Error:", error);
    return NextResponse.json({ error: error.message || "Webhook processing error" }, { status: 500 });
  }
}
