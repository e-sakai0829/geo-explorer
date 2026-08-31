import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({
        plan: "free",
        monthly_credits: 10,
        used_credits: 0,
        remaining_credits: 10,
        isLoggedIn: false,
      });
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("id, name, plan, monthly_credits, used_credits, credits_reset_at")
      .eq("user_id", user.id)
      .single();

    if (!org) {
      return NextResponse.json({
        plan: "starter",
        monthly_credits: 10,
        used_credits: 0,
        remaining_credits: 10,
        isLoggedIn: true,
      });
    }

    return NextResponse.json({
      plan: org.plan,
      monthly_credits: org.monthly_credits,
      used_credits: org.used_credits,
      remaining_credits: Math.max(0, org.monthly_credits - org.used_credits),
      credits_reset_at: org.credits_reset_at,
      isLoggedIn: true,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("organizations")
      .update({ used_credits: 0 })
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Credits successfully reset to 10/10!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
