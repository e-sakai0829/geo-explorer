import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyName, contactName, email, websiteUrl, message } = body;

    if (!companyName || !email || !message) {
      return NextResponse.json(
        { error: "必須項目（貴社名・メールアドレス・ご相談内容）が不足しています。" },
        { status: 400 }
      );
    }

    console.log("【コンサルティング相談リード受信】", {
      timestamp: new Date().toISOString(),
      companyName,
      contactName,
      email,
      websiteUrl,
      message,
    });

    // 2. Supabase DB保存を試行
    let dbSuccess = false;
    try {
      const supabase = await createServerSupabaseClient();
      const { error: insertError } = await supabase.from("consulting_inquiries").insert({
        company_name: companyName,
        contact_name: contactName,
        email: email,
        website_url: websiteUrl,
        message: message,
        created_at: new Date().toISOString(),
      });
      if (insertError) {
        console.warn("Supabase consulting_inquiries insert error (table may not exist yet):", insertError);
      } else {
        dbSuccess = true;
      }
    } catch (dbError) {
      console.warn("consulting_inquiries table insert skipped or failed:", dbError);
    }

    return NextResponse.json({ 
      success: true, 
      message: "お問い合わせを受付しました。",
      dbSaved: dbSuccess 
    });
  } catch (error: any) {
    console.error("Consulting Inquiry API Error:", error);
    return NextResponse.json(
      { error: error.message || "送信中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}
