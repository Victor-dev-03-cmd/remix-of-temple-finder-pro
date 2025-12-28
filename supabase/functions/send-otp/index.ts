
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import sgMail from "npm:@sendgrid/mail";

const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
const SENDER_EMAIL = "laxsan732@gmail.com"; // IMPORTANT: Replace with your verified SendGrid sender email

interface WebhookPayload {
  type: "EMAIL_OTP";
  email: string;
  data: {
    code: string;
  };
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    if (!SENDGRID_API_KEY) {
      throw new Error("SENDGRID_API_KEY is not set.");
    }

    sgMail.setApiKey(SENDGRID_API_KEY);

    const payload: WebhookPayload = await req.json();
    const { email, data } = payload;
    const { code } = data;

    const msg = {
      to: email,
      from: SENDER_EMAIL, // Use the variable defined above
      subject: `Your Verification Code: ${code}`,
      html: `
        <p>Hello,</p>
        <p>Your verification code is: <strong>${code}</strong></p>
        <p>Please use this code to verify your email address.</p>
        <p>Thanks,</p>
        <p>The Temple Info Team</p>
      `,
    };

    await sgMail.send(msg);

    return new Response(JSON.stringify({ message: "OTP email sent successfully." }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
