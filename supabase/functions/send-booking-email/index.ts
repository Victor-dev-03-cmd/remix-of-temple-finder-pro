import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TicketDetail {
  category: string;
  label: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface BookingEmailRequest {
  customerName: string;
  customerEmail: string;
  templeName: string;
  visitDate: string;
  numTickets: number;
  bookingCode: string;
  ticketDetails?: TicketDetail[];
  totalPrice?: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      customerName, 
      customerEmail, 
      templeName, 
      visitDate, 
      numTickets, 
      bookingCode,
      ticketDetails = [],
      totalPrice = 0
    }: BookingEmailRequest = await req.json();

    console.log("Sending booking confirmation to:", customerEmail);

    // Generate QR code URL using a public QR code API
    const qrData = encodeURIComponent(`TEMPLE-BOOKING:${bookingCode}|${templeName}|${visitDate}|${numTickets}`);
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`;

    // Build ticket details rows
    const ticketRows = ticketDetails.length > 0 
      ? ticketDetails.map(ticket => `
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">${ticket.label}</td>
            <td style="padding: 8px 0; color: #1e293b; font-size: 14px; text-align: center;">${ticket.quantity}</td>
            <td style="padding: 8px 0; color: #1e293b; font-size: 14px; text-align: right;">LKR ${ticket.price}</td>
            <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">LKR ${ticket.subtotal.toLocaleString()}</td>
          </tr>
        `).join('')
      : `
          <tr>
            <td colspan="4" style="padding: 10px 0; color: #1e293b; font-size: 14px;">Total Tickets: ${numTickets}</td>
          </tr>
        `;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Confirmation</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">🕉️ Temple Connect</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Booking Confirmation</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1e293b; margin: 0 0 20px; font-size: 24px;">Namaste, ${customerName}!</h2>
              <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                Your temple visit has been confirmed. Please present this QR code at the temple entrance.
              </p>
              
              <!-- QR Code -->
              <div style="text-align: center; margin: 30px 0; padding: 30px; background-color: #f8fafc; border-radius: 12px;">
                <img src="${qrCodeUrl}" alt="Booking QR Code" style="width: 200px; height: 200px; border-radius: 8px;" />
                <p style="color: #1e293b; font-size: 18px; font-weight: 600; margin: 20px 0 5px;">Booking Code</p>
                <p style="color: #3b82f6; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: 2px;">${bookingCode}</p>
              </div>
              
              <!-- Booking Details -->
              <div style="background-color: #f8fafc; border-radius: 12px; padding: 25px; margin: 30px 0;">
                <h3 style="color: #1e293b; margin: 0 0 20px; font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px;">Booking Details</h3>
                
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Temple</td>
                    <td colspan="3" style="padding: 10px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">${templeName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Visit Date</td>
                    <td colspan="3" style="padding: 10px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">${visitDate}</td>
                  </tr>
                </table>
              </div>

              <!-- Ticket Breakdown -->
              ${ticketDetails.length > 0 ? `
              <div style="background-color: #f8fafc; border-radius: 12px; padding: 25px; margin: 30px 0;">
                <h3 style="color: #1e293b; margin: 0 0 20px; font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px;">Ticket Details</h3>
                
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr style="border-bottom: 1px solid #e2e8f0;">
                    <th style="padding: 8px 0; color: #64748b; font-size: 12px; text-align: left; font-weight: 500;">Category</th>
                    <th style="padding: 8px 0; color: #64748b; font-size: 12px; text-align: center; font-weight: 500;">Qty</th>
                    <th style="padding: 8px 0; color: #64748b; font-size: 12px; text-align: right; font-weight: 500;">Price</th>
                    <th style="padding: 8px 0; color: #64748b; font-size: 12px; text-align: right; font-weight: 500;">Subtotal</th>
                  </tr>
                  ${ticketRows}
                  <tr style="border-top: 2px solid #e2e8f0;">
                    <td colspan="3" style="padding: 12px 0; color: #1e293b; font-size: 16px; font-weight: 600;">Total Amount</td>
                    <td style="padding: 12px 0; color: #3b82f6; font-size: 18px; font-weight: 700; text-align: right;">LKR ${totalPrice.toLocaleString()}</td>
                  </tr>
                </table>
              </div>
              ` : ''}
              
              <!-- Instructions -->
              <div style="background-color: #fef3c7; border-radius: 12px; padding: 20px; margin: 30px 0;">
                <h4 style="color: #92400e; margin: 0 0 10px; font-size: 16px;">📋 Important Instructions</h4>
                <ul style="color: #92400e; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>Please arrive 15 minutes before your scheduled visit</li>
                  <li>Carry a valid ID proof along with this confirmation</li>
                  <li>Dress code: Traditional or modest attire recommended</li>
                  <li>Photography rules vary by temple - please check at entrance</li>
                </ul>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #1e293b; padding: 30px; text-align: center;">
              <p style="color: #94a3b8; font-size: 14px; margin: 0 0 10px;">
                Thank you for choosing Temple Connect
              </p>
              <p style="color: #64748b; font-size: 12px; margin: 0;">
                © 2024 Temple Connect. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Temple Connect <onboarding@resend.dev>",
        to: [customerEmail],
        subject: `Booking Confirmation - ${templeName}`,
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Resend API error:", errorText);
      throw new Error(`Email sending failed: ${errorText}`);
    }

    const emailResponse = await response.json();
    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-booking-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
