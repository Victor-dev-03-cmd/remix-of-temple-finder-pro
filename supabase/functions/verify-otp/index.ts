import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyRequest {
  type: "email" | "phone";
  otp: string;
  verificationStage: "pre_submission" | "post_approval";
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

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { type, otp, verificationStage }: VerifyRequest = await req.json();

    // Get verification record
    const { data: verification, error: verifyError } = await supabase
      .from("vendor_verifications")
      .select("*")
      .eq("user_id", user.id)
      .eq("verification_stage", verificationStage)
      .maybeSingle();

    if (verifyError || !verification) {
      throw new Error("No verification record found");
    }

    const now = new Date();

    if (type === "email") {
      if (verification.email_otp !== otp) {
        throw new Error("Invalid email OTP");
      }
      if (new Date(verification.email_otp_expires_at) < now) {
        throw new Error("Email OTP has expired");
      }

      // Mark email as verified
      await supabase
        .from("vendor_verifications")
        .update({ email_verified: true, email_otp: null })
        .eq("id", verification.id);

      console.log(`Email verified for user ${user.id}`);

    } else if (type === "phone") {
      if (verification.phone_otp !== otp) {
        throw new Error("Invalid phone OTP");
      }
      if (new Date(verification.phone_otp_expires_at) < now) {
        throw new Error("Phone OTP has expired");
      }

      // Mark phone as verified
      await supabase
        .from("vendor_verifications")
        .update({ phone_verified: true, phone_otp: null })
        .eq("id", verification.id);

      console.log(`Phone verified for user ${user.id}`);
    }

    // Get updated verification status
    const { data: updatedVerification } = await supabase
      .from("vendor_verifications")
      .select("email_verified, phone_verified, application_id")
      .eq("id", verification.id)
      .single();

    // If both are verified, update the vendor application
    if (updatedVerification?.email_verified && updatedVerification?.phone_verified) {
      if (verificationStage === "pre_submission" && updatedVerification.application_id) {
        // Update vendor application with verified status
        await serviceClient
          .from("vendor_applications")
          .update({
            email_verified: true,
            phone_verified: true,
            phone_country_code: verification.country_code,
          })
          .eq("id", updatedVerification.application_id);
      } else if (verificationStage === "post_approval" && updatedVerification.application_id) {
        // Vendor can now access dashboard
        await serviceClient
          .from("vendor_applications")
          .update({
            email_verified: true,
            phone_verified: true,
          })
          .eq("id", updatedVerification.application_id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailVerified: type === "email" ? true : verification.email_verified,
        phoneVerified: type === "phone" ? true : verification.phone_verified,
        fullyVerified: updatedVerification?.email_verified && updatedVerification?.phone_verified,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in verify-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
