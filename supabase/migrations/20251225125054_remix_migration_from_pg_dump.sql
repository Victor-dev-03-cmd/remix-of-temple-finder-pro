CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'vendor',
    'customer'
);


--
-- Name: get_user_role(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_role(_user_id uuid) RETURNS public.app_role
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role 
      WHEN 'admin' THEN 1 
      WHEN 'vendor' THEN 2 
      WHEN 'customer' THEN 3 
    END
  LIMIT 1
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  );
  
  -- Assign default customer role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');
  
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: update_temple_rating(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_temple_rating() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.temples
    SET 
      rating = COALESCE((SELECT AVG(rating)::numeric(2,1) FROM public.temple_reviews WHERE temple_id = OLD.temple_id), 0),
      review_count = (SELECT COUNT(*) FROM public.temple_reviews WHERE temple_id = OLD.temple_id)
    WHERE id = OLD.temple_id;
    RETURN OLD;
  ELSE
    UPDATE public.temples
    SET 
      rating = COALESCE((SELECT AVG(rating)::numeric(2,1) FROM public.temple_reviews WHERE temple_id = NEW.temple_id), 0),
      review_count = (SELECT COUNT(*) FROM public.temple_reviews WHERE temple_id = NEW.temple_id)
    WHERE id = NEW.temple_id;
    RETURN NEW;
  END IF;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: favorites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.favorites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    product_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: home_gallery_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.home_gallery_images (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    image_url text NOT NULL,
    title text,
    description text,
    display_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid NOT NULL,
    vendor_id uuid NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    shipping_address text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT orders_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'shipped'::text, 'delivered'::text, 'cancelled'::text])))
);


--
-- Name: product_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    user_id uuid NOT NULL,
    rating integer NOT NULL,
    title text,
    comment text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT product_reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vendor_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    category text NOT NULL,
    image_url text,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    temple_id uuid,
    CONSTRAINT products_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    email text,
    full_name text,
    avatar_url text,
    phone text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: site_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    site_name text DEFAULT 'Temple Connect'::text NOT NULL,
    default_country text DEFAULT 'LK'::text NOT NULL,
    maintenance_mode boolean DEFAULT false NOT NULL,
    email_notifications boolean DEFAULT true NOT NULL,
    new_vendor_alerts boolean DEFAULT true NOT NULL,
    order_alerts boolean DEFAULT true NOT NULL,
    primary_font text DEFAULT 'Outfit'::text NOT NULL,
    display_font text DEFAULT 'Playfair Display'::text NOT NULL,
    dark_mode boolean DEFAULT false NOT NULL,
    compact_mode boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    primary_color text DEFAULT '217 91% 60%'::text NOT NULL,
    accent_color text DEFAULT '43 96% 56%'::text NOT NULL,
    logo_url text,
    footer_tagline text DEFAULT 'Connecting devotees with Hindu temples across Sri Lanka.'::text,
    social_facebook text,
    social_instagram text,
    social_twitter text,
    social_linkedin text,
    social_youtube text,
    hero_title text DEFAULT 'Discover Sacred Temples'::text,
    hero_subtitle text DEFAULT 'Connect with Hindu temples across Sri Lanka and explore sacred traditions'::text,
    hero_image_url text,
    hero_cta_text text DEFAULT 'Become a Temple Vendor'::text,
    hero_cta_link text DEFAULT '/become-vendor'::text,
    commission_rate numeric DEFAULT 10
);


--
-- Name: temple_bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.temple_bookings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    temple_id uuid NOT NULL,
    customer_name text NOT NULL,
    customer_email text NOT NULL,
    customer_phone text,
    visit_date date NOT NULL,
    num_tickets integer DEFAULT 1 NOT NULL,
    booking_code text NOT NULL,
    status text DEFAULT 'confirmed'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    ticket_details jsonb DEFAULT '[]'::jsonb
);


--
-- Name: temple_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.temple_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    temple_id uuid NOT NULL,
    user_id uuid NOT NULL,
    rating integer NOT NULL,
    title text,
    comment text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT temple_reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: temples; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.temples (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    deity text NOT NULL,
    province text NOT NULL,
    district text NOT NULL,
    address text,
    image_url text,
    latitude numeric NOT NULL,
    longitude numeric NOT NULL,
    rating numeric DEFAULT 0,
    review_count integer DEFAULT 0,
    services text[] DEFAULT '{}'::text[],
    opening_hours text,
    contact text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'customer'::public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vendor_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendor_applications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    business_name text NOT NULL,
    temple_name text NOT NULL,
    description text,
    phone text,
    status text DEFAULT 'pending'::text NOT NULL,
    admin_notes text,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    temple_id uuid,
    CONSTRAINT vendor_applications_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);


--
-- Name: favorites favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_pkey PRIMARY KEY (id);


--
-- Name: favorites favorites_user_id_product_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_user_id_product_id_key UNIQUE (user_id, product_id);


--
-- Name: home_gallery_images home_gallery_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.home_gallery_images
    ADD CONSTRAINT home_gallery_images_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: product_reviews product_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_reviews
    ADD CONSTRAINT product_reviews_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: site_settings site_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_pkey PRIMARY KEY (id);


--
-- Name: temple_bookings temple_bookings_booking_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.temple_bookings
    ADD CONSTRAINT temple_bookings_booking_code_key UNIQUE (booking_code);


--
-- Name: temple_bookings temple_bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.temple_bookings
    ADD CONSTRAINT temple_bookings_pkey PRIMARY KEY (id);


--
-- Name: temple_reviews temple_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.temple_reviews
    ADD CONSTRAINT temple_reviews_pkey PRIMARY KEY (id);


--
-- Name: temple_reviews temple_reviews_temple_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.temple_reviews
    ADD CONSTRAINT temple_reviews_temple_id_user_id_key UNIQUE (temple_id, user_id);


--
-- Name: temples temples_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.temples
    ADD CONSTRAINT temples_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: vendor_applications vendor_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_applications
    ADD CONSTRAINT vendor_applications_pkey PRIMARY KEY (id);


--
-- Name: idx_temple_bookings_booking_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_temple_bookings_booking_code ON public.temple_bookings USING btree (booking_code);


--
-- Name: idx_temple_bookings_temple_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_temple_bookings_temple_id ON public.temple_bookings USING btree (temple_id);


--
-- Name: idx_temple_bookings_visit_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_temple_bookings_visit_date ON public.temple_bookings USING btree (visit_date);


--
-- Name: home_gallery_images update_home_gallery_images_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_home_gallery_images_updated_at BEFORE UPDATE ON public.home_gallery_images FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: orders update_orders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: product_reviews update_product_reviews_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_product_reviews_updated_at BEFORE UPDATE ON public.product_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: products update_products_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: site_settings update_site_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: temple_bookings update_temple_bookings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_temple_bookings_updated_at BEFORE UPDATE ON public.temple_bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: temple_reviews update_temple_rating_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_temple_rating_trigger AFTER INSERT OR DELETE OR UPDATE ON public.temple_reviews FOR EACH ROW EXECUTE FUNCTION public.update_temple_rating();


--
-- Name: temple_reviews update_temple_reviews_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_temple_reviews_updated_at BEFORE UPDATE ON public.temple_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: temples update_temples_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_temples_updated_at BEFORE UPDATE ON public.temples FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: vendor_applications update_vendor_applications_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_vendor_applications_updated_at BEFORE UPDATE ON public.vendor_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: favorites favorites_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: product_reviews product_reviews_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_reviews
    ADD CONSTRAINT product_reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: products products_temple_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_temple_id_fkey FOREIGN KEY (temple_id) REFERENCES public.temples(id);


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: temple_bookings temple_bookings_temple_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.temple_bookings
    ADD CONSTRAINT temple_bookings_temple_id_fkey FOREIGN KEY (temple_id) REFERENCES public.temples(id) ON DELETE CASCADE;


--
-- Name: temple_reviews temple_reviews_temple_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.temple_reviews
    ADD CONSTRAINT temple_reviews_temple_id_fkey FOREIGN KEY (temple_id) REFERENCES public.temples(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: vendor_applications vendor_applications_temple_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_applications
    ADD CONSTRAINT vendor_applications_temple_id_fkey FOREIGN KEY (temple_id) REFERENCES public.temples(id);


--
-- Name: home_gallery_images Active gallery images are publicly viewable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Active gallery images are publicly viewable" ON public.home_gallery_images FOR SELECT USING ((is_active = true));


--
-- Name: temples Active temples are publicly viewable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Active temples are publicly viewable" ON public.temples FOR SELECT USING ((is_active = true));


--
-- Name: site_settings Admins can insert site settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert site settings" ON public.site_settings FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: temple_bookings Admins can manage all bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all bookings" ON public.temple_bookings USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: home_gallery_images Admins can manage gallery images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage gallery images" ON public.home_gallery_images USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can manage roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage roles" ON public.user_roles USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: temples Admins can manage temples; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage temples" ON public.temples USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: products Admins can update all products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all products" ON public.products FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: vendor_applications Admins can update applications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update applications" ON public.vendor_applications FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: site_settings Admins can update site settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update site settings" ON public.site_settings FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: vendor_applications Admins can view all applications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all applications" ON public.vendor_applications FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: products Admins can view all products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all products" ON public.products FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: site_settings Admins can view site settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view site settings" ON public.site_settings FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: temple_bookings Anyone can create bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can create bookings" ON public.temple_bookings FOR INSERT WITH CHECK (true);


--
-- Name: temple_bookings Anyone can view bookings by booking code; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view bookings by booking code" ON public.temple_bookings FOR SELECT USING (true);


--
-- Name: products Approved products are publicly viewable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Approved products are publicly viewable" ON public.products FOR SELECT USING ((status = 'approved'::text));


--
-- Name: product_reviews Authenticated users can create reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can create reviews" ON public.product_reviews FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: orders Customers can create orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Customers can create orders" ON public.orders FOR INSERT WITH CHECK ((auth.uid() = customer_id));


--
-- Name: order_items Customers can insert order items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Customers can insert order items" ON public.order_items FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.orders
  WHERE ((orders.id = order_items.order_id) AND (orders.customer_id = auth.uid())))));


--
-- Name: orders Customers can view their own orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Customers can view their own orders" ON public.orders FOR SELECT USING ((auth.uid() = customer_id));


--
-- Name: product_reviews Reviews are publicly viewable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Reviews are publicly viewable" ON public.product_reviews FOR SELECT USING (true);


--
-- Name: temple_reviews Temple reviews are publicly viewable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Temple reviews are publicly viewable" ON public.temple_reviews FOR SELECT USING (true);


--
-- Name: favorites Users can add their own favorites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can add their own favorites" ON public.favorites FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: temple_reviews Users can create their own reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own reviews" ON public.temple_reviews FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: favorites Users can delete their own favorites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own favorites" ON public.favorites FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: product_reviews Users can delete their own reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own reviews" ON public.product_reviews FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: temple_reviews Users can delete their own reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own reviews" ON public.temple_reviews FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: vendor_applications Users can insert their own applications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own applications" ON public.vendor_applications FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: product_reviews Users can update their own reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own reviews" ON public.product_reviews FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: temple_reviews Users can update their own reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own reviews" ON public.temple_reviews FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: order_items Users can view order items for their orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view order items for their orders" ON public.order_items FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.orders
  WHERE ((orders.id = order_items.order_id) AND ((orders.customer_id = auth.uid()) OR (orders.vendor_id = auth.uid()))))));


--
-- Name: vendor_applications Users can view their own applications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own applications" ON public.vendor_applications FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: favorites Users can view their own favorites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own favorites" ON public.favorites FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: products Vendors can delete their own products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Vendors can delete their own products" ON public.products FOR DELETE USING ((auth.uid() = vendor_id));


--
-- Name: products Vendors can insert their own products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Vendors can insert their own products" ON public.products FOR INSERT WITH CHECK ((auth.uid() = vendor_id));


--
-- Name: orders Vendors can update orders for their products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Vendors can update orders for their products" ON public.orders FOR UPDATE USING ((auth.uid() = vendor_id));


--
-- Name: products Vendors can update their own products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Vendors can update their own products" ON public.products FOR UPDATE USING ((auth.uid() = vendor_id));


--
-- Name: orders Vendors can view orders for their products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Vendors can view orders for their products" ON public.orders FOR SELECT USING ((auth.uid() = vendor_id));


--
-- Name: products Vendors can view their own products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Vendors can view their own products" ON public.products FOR SELECT USING ((auth.uid() = vendor_id));


--
-- Name: favorites; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

--
-- Name: home_gallery_images; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.home_gallery_images ENABLE ROW LEVEL SECURITY;

--
-- Name: order_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

--
-- Name: orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

--
-- Name: product_reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: site_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: temple_bookings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.temple_bookings ENABLE ROW LEVEL SECURITY;

--
-- Name: temple_reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.temple_reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: temples; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.temples ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: vendor_applications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vendor_applications ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;