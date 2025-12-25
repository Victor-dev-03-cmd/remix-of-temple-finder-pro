-- Trigger function for new orders - notify vendor
CREATE OR REPLACE FUNCTION public.notify_vendor_new_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    NEW.vendor_id,
    'success',
    'New Order Received!',
    'You have received a new order worth $' || NEW.total_amount || '. Please check your dashboard.',
    '/vendor/orders'
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new orders
CREATE TRIGGER on_new_order_notify_vendor
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_vendor_new_order();

-- Trigger function for vendor application status changes
CREATE OR REPLACE FUNCTION public.notify_vendor_application_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only notify if status changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'approved' THEN
      -- Notify user their application was approved
      INSERT INTO public.notifications (user_id, type, title, message, link)
      VALUES (
        NEW.user_id,
        'success',
        'Vendor Application Approved!',
        'Congratulations! Your vendor application for "' || NEW.business_name || '" has been approved. You can now access your vendor dashboard.',
        '/vendor'
      );
    ELSIF NEW.status = 'rejected' THEN
      -- Notify user their application was rejected
      INSERT INTO public.notifications (user_id, type, title, message, link)
      VALUES (
        NEW.user_id,
        'warning',
        'Vendor Application Update',
        'Your vendor application for "' || NEW.business_name || '" was not approved at this time. Please contact support for more information.',
        '/become-vendor'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for vendor application status changes
CREATE TRIGGER on_vendor_application_status_change
  AFTER UPDATE ON public.vendor_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_vendor_application_status();

-- Trigger function for new vendor applications - notify admins
CREATE OR REPLACE FUNCTION public.notify_admins_new_vendor_application()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Notify all admin users about new vendor application
  FOR admin_user_id IN 
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      admin_user_id,
      'info',
      'New Vendor Application',
      'A new vendor application from "' || NEW.business_name || '" is pending review.',
      '/admin/vendor-applications'
    );
  END LOOP;
  RETURN NEW;
END;
$$;

-- Create trigger for new vendor applications
CREATE TRIGGER on_new_vendor_application_notify_admins
  AFTER INSERT ON public.vendor_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_vendor_application();

-- Trigger function for order status changes - notify customer
CREATE OR REPLACE FUNCTION public.notify_customer_order_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only notify if status changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'confirmed' THEN
      INSERT INTO public.notifications (user_id, type, title, message, link)
      VALUES (
        NEW.customer_id,
        'success',
        'Order Confirmed!',
        'Your order has been confirmed and is being prepared.',
        '/dashboard/orders'
      );
    ELSIF NEW.status = 'shipped' THEN
      INSERT INTO public.notifications (user_id, type, title, message, link)
      VALUES (
        NEW.customer_id,
        'info',
        'Order Shipped!',
        'Great news! Your order has been shipped and is on its way.',
        '/dashboard/orders'
      );
    ELSIF NEW.status = 'delivered' THEN
      INSERT INTO public.notifications (user_id, type, title, message, link)
      VALUES (
        NEW.customer_id,
        'success',
        'Order Delivered!',
        'Your order has been delivered. Thank you for shopping with us!',
        '/dashboard/orders'
      );
    ELSIF NEW.status = 'cancelled' THEN
      INSERT INTO public.notifications (user_id, type, title, message, link)
      VALUES (
        NEW.customer_id,
        'warning',
        'Order Cancelled',
        'Your order has been cancelled. Please contact support if you have questions.',
        '/dashboard/orders'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for order status changes
CREATE TRIGGER on_order_status_change_notify_customer
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_customer_order_status();