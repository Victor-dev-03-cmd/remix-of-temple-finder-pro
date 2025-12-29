import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
const SENDER_EMAIL = "laxsan732@gmail.com";

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

    const payload: WebhookPayload = await req.json();
    const { email, data } = payload;
    const { code } = data;

    // Use SendGrid's REST API directly instead of npm package
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email }],
            subject: `Your Verification Code: ${code}`,
          },
        ],
        from: { email: SENDER_EMAIL },
        content: [
          {
            type: "text/html",
            value: `
              <p>Hello,</p>
              <p>Your verification code is: <strong>${code}</strong></p>
              <p>Please use this code to verify your email address.</p>
              <p>Thanks,</p>
              <p>The Temple Connect Team</p>
            `,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SendGrid API error: ${errorText}`);
    }

    return new Response(JSON.stringify({ message: "OTP email sent successfully." }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error("Error sending email:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
