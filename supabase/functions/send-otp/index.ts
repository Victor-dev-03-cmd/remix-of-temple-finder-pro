import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OTPRequest {
  type: "email" | "phone";
  email?: string;
  phone?: string;
  countryCode?: string;
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

    const { type, email, phone, countryCode, verificationStage }: OTPRequest = await req.json();
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Get or create verification record
    const { data: existingVerification } = await supabase
      .from("vendor_verifications")
      .select("id")
      .eq("user_id", user.id)
      .eq("verification_stage", verificationStage)
      .maybeSingle();

    if (type === "email") {
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

      // Send email OTP
      const targetEmail = email || user.email;
      const { error: emailError } = await resend.emails.send({
        from: "Temple Connect <onboarding@resend.dev>",
        to: [targetEmail!],
        subject: "Your Verification Code - Temple Connect",
        html: `
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
        `,
      });

      if (emailError) {
        console.error("Email send error:", emailError);
        throw new Error("Failed to send email OTP");
      }

      console.log(`Email OTP sent to ${targetEmail}`);

    } else if (type === "phone") {
      // Update verification with phone OTP
      const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
      const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
      const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

      if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
        throw new Error("Twilio credentials not configured");
      }

      const fullPhoneNumber = `${countryCode}${phone}`;

      if (existingVerification) {
        await supabase
          .from("vendor_verifications")
          .update({
            phone_otp: otp,
            phone_otp_expires_at: expiresAt.toISOString(),
            phone_number: phone,
            country_code: countryCode,
          })
          .eq("id", existingVerification.id);
      } else {
        await supabase
          .from("vendor_verifications")
          .insert({
            user_id: user.id,
            phone_otp: otp,
            phone_otp_expires_at: expiresAt.toISOString(),
            phone_number: phone,
            country_code: countryCode,
            verification_stage: verificationStage,
          });
      }

      // Send SMS via Twilio
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
      const twilioAuth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

      const smsResponse = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${twilioAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: fullPhoneNumber,
          From: twilioPhoneNumber,
          Body: `Your Temple Connect verification code is: ${otp}. This code expires in 10 minutes.`,
        }),
      });

      if (!smsResponse.ok) {
        const errorData = await smsResponse.json();
        console.error("Twilio error:", errorData);
        throw new Error("Failed to send SMS OTP");
      }

      console.log(`Phone OTP sent to ${fullPhoneNumber}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: `OTP sent via ${type}` }),
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
