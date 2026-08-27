import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";

const PLAN_CREDITS: Record<string, number> = {
  starter: 30,
  growth: 150,
  agency: 500,
};

export async function POST(req: NextRequest) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY || "dummy_key_for_build";
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16" as any,
    });

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    // Webhook署名検証
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err: any) {
        console.error("Webhook signature verification failed:", err.message);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
    } else {
      event = JSON.parse(body);
    }

    // イベント別の厳密なマルチテナント更新処理
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
          // 1. orgId による厳密な単一組織更新
          const { error } = await supabase
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

          if (error) console.error("Failed to update organization by orgId:", error);
        } else if (userId) {
          // 2. userId による更新
          await supabase
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
        } else if (session.customer_email) {
          // 3. メールアドレスによる組織逆引き更新
          const { data: userList } = await supabase.auth.admin?.listUsers() || { data: { users: [] } };
          const matchedUser = userList.users?.find((u: any) => u.email === session.customer_email);
          if (matchedUser) {
            await supabase
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
              .eq("user_id", matchedUser.id);
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[Stripe Webhook] Subscription canceled for: ${subscription.id}`);

        // 解約時は該当の stripe_subscription_id を持つ組織のみを無料枠へ更新
        await supabase
          .from("organizations")
          .update({
            plan: "starter",
            monthly_credits: 10,
            updated_at: new Date().toISOString(),
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
