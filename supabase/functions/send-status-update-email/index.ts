import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// This would ideally come from your site settings
const SITE_NAME = 'Temple Connect'

interface OrderDetails {
  order_id: string;
  customer_email: string;
  customer_name: string;
  new_status: 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
}

function getEmailContent(status: OrderDetails['new_status'], orderId: string) {
  const shortOrderId = orderId.slice(0, 8).toUpperCase();
  switch (status) {
    case 'confirmed':
      return {
        subject: `Your Temple Connect order #${shortOrderId} is confirmed!`,
        body: `Good news! Your order #${shortOrderId} has been confirmed by the vendor. You will be notified again once it ships.`,
      }
    case 'shipped':
      return {
        subject: `Your Temple Connect order #${shortOrderId} has been shipped!`,
        body: `Your order #${shortOrderId} is on its way. You can expect it to arrive soon.`,
      }
    case 'delivered':
      return {
        subject: `Your Temple Connect order #${shortOrderId} has been delivered!`,
        body: `Your order #${shortOrderId} has been marked as delivered. We hope you enjoy your products!`,
      }
    case 'cancelled':
      return {
        subject: `Your Temple Connect order #${shortOrderId} has been cancelled.`,
        body: `We're sorry to inform you that your order #${shortOrderId} has been cancelled. If you did not request this, please contact support.`,
      }
    default:
      return {
        subject: `Update on your Temple Connect order #${shortOrderId}`,
        body: `There is an update on your order. It is now marked as: ${status}.`,
      }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { order_id, customer_email, customer_name, new_status }: OrderDetails = await req.json()

    // Validate input
    if (!order_id || !customer_email || !customer_name || !new_status) {
      throw new Error('Missing required fields: order_id, customer_email, customer_name, new_status')
    }

    const { subject, body } = getEmailContent(new_status, order_id)
    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY is not set in environment variables.')
    }
    
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `${SITE_NAME} <noreply@yourdomain.com>`, // IMPORTANT: Replace with your sending domain
        to: customer_email,
        subject: subject,
        html: `
          <p>Hi ${customer_name},</p>
          <p>${body}</p>
          <p>Thank you for shopping with us,<br>The ${SITE_NAME} Team</p>
        `,
      }),
    })

    if (!res.ok) {
      const errorBody = await res.text()
      throw new Error(`Failed to send email: ${res.status} ${res.statusText} - ${errorBody}`)
    }

    const data = await res.json()

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
