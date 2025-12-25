-- Add email template settings columns to site_settings
ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS email_from_name text DEFAULT 'Temple Connect',
ADD COLUMN IF NOT EXISTS email_from_address text DEFAULT 'onboarding@resend.dev',
ADD COLUMN IF NOT EXISTS booking_email_subject text DEFAULT 'Booking Confirmation - {{temple_name}}',
ADD COLUMN IF NOT EXISTS booking_email_greeting text DEFAULT 'Namaste, {{customer_name}}!',
ADD COLUMN IF NOT EXISTS booking_email_message text DEFAULT 'Your temple visit has been confirmed. Please present this QR code at the temple entrance.',
ADD COLUMN IF NOT EXISTS booking_email_instructions text DEFAULT 'Please arrive 15 minutes before your scheduled visit|Carry a valid ID proof along with this confirmation|Dress code: Traditional or modest attire recommended|Photography rules vary by temple - please check at entrance',
ADD COLUMN IF NOT EXISTS vendor_approval_email_subject text DEFAULT 'Your Vendor Application has been Approved!',
ADD COLUMN IF NOT EXISTS vendor_approval_email_message text DEFAULT 'Congratulations! Your application to become a vendor on Temple Connect has been approved. You can now access your vendor dashboard and start managing your temple products.',
ADD COLUMN IF NOT EXISTS vendor_rejection_email_subject text DEFAULT 'Update on Your Vendor Application',
ADD COLUMN IF NOT EXISTS vendor_rejection_email_message text DEFAULT 'Thank you for your interest in becoming a vendor on Temple Connect. After careful review, we are unable to approve your application at this time. Please feel free to reapply or contact us for more information.',
ADD COLUMN IF NOT EXISTS new_order_email_subject text DEFAULT 'New Order Received - Order #{{order_id}}',
ADD COLUMN IF NOT EXISTS new_order_email_message text DEFAULT 'You have received a new order. Please check your vendor dashboard for order details and process it promptly.';