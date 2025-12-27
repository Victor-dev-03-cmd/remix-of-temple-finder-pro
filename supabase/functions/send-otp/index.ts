import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OTPRequest {
  type: "email";
  email?: string;
  verificationStage: "pre_submission" | "post_approval";
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { type, email, verificationStage }: OTPRequest = await req.json();
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Get or create verification record
    const { data: existingVerification } = await supabase
      .from("vendor_verifications")
      .select("id")
      .eq("user_id", user.id)
      .eq("verification_stage", verificationStage)
      .maybeSingle();

    // Update or create verification with email OTP
    if (existingVerification) {
      await supabase
        .from("vendor_verifications")
        .update({
          email_otp: otp,
          email_otp_expires_at: expiresAt.toISOString(),
        })
        .eq("id", existingVerification.id);
    } else {
      await supabase
        .from("vendor_verifications")
        .insert({
          user_id: user.id,
          email_otp: otp,
          email_otp_expires_at: expiresAt.toISOString(),
          verification_stage: verificationStage,
        });
    }

    // Send email OTP via SendGrid
    const targetEmail = email || user.email;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333; text-align: center;">Temple Connect</h1>
        <h2 style="color: #666; text-align: center;">Email Verification Code</h2>
        <div style="background: #f5f5f5; padding: 30px; border-radius: 10px; text-align: center; margin: 20px 0;">
          <p style="font-size: 14px; color: #666; margin-bottom: 10px;">Your verification code is:</p>
          <p style="font-size: 36px; font-weight: bold; color: #333; letter-spacing: 8px; margin: 0;">${otp}</p>
        </div>
        <p style="color: #888; font-size: 14px; text-align: center;">
          This code will expire in 10 minutes.<br/>
          If you didn't request this code, please ignore this email.
        </p>
      </div>
    `;

    const sendGridResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: targetEmail }] }],
        from: { email: "noreply@temple-info-com.vercel.app", name: "Temple Connect" },
        subject: "Your Verification Code - Temple Connect",
        content: [{ type: "text/html", value: emailHtml }],
      }),
    });

    if (!sendGridResponse.ok) {
      const errorData = await sendGridResponse.text();
      console.error("SendGrid error:", errorData);
      throw new Error("Failed to send email OTP");
    }

    console.log(`Email OTP sent to ${targetEmail}`);

    return new Response(
      JSON.stringify({ success: true, message: "OTP sent via email" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in send-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
