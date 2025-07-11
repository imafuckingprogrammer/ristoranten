-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.authorized_emails (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  restaurant_id uuid NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['OWNER'::text, 'WAITSTAFF'::text, 'KITCHEN'::text, 'BARTENDER'::text])),
  authorized_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT authorized_emails_pkey PRIMARY KEY (id),
  CONSTRAINT authorized_emails_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id),
  CONSTRAINT authorized_emails_authorized_by_fkey FOREIGN KEY (authorized_by) REFERENCES public.users(id)
);
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  restaurant_id uuid NOT NULL,
  name character varying NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id)
);
CREATE TABLE public.menu_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  restaurant_id uuid NOT NULL,
  category_id uuid NOT NULL,
  name character varying NOT NULL,
  description text,
  price numeric NOT NULL,
  image_url text,
  available boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  sold_out boolean DEFAULT false,
  CONSTRAINT menu_items_pkey PRIMARY KEY (id),
  CONSTRAINT menu_items_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id),
  CONSTRAINT menu_items_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.order_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  user_id uuid,
  action text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT order_audit_log_pkey PRIMARY KEY (id),
  CONSTRAINT order_audit_log_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_audit_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL,
  menu_item_id uuid NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price numeric NOT NULL CHECK (price >= 0::numeric),
  special_instructions text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid,
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_items_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id),
  CONSTRAINT order_items_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id)
);
CREATE TABLE public.order_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  message text NOT NULL,
  notification_type text NOT NULL CHECK (notification_type = ANY (ARRAY['ORDER_READY'::text, 'ORDER_DELAYED'::text, 'SPECIAL_REQUEST'::text, 'CANCELLATION'::text])),
  target_role text NOT NULL CHECK (target_role = ANY (ARRAY['KITCHEN_STAFF'::text, 'WAIT_STAFF'::text, 'BAR_STAFF'::text, 'MANAGER'::text])),
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + '04:00:00'::interval),
  CONSTRAINT order_notifications_pkey PRIMARY KEY (id),
  CONSTRAINT order_notifications_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.order_status_history (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL,
  old_status USER-DEFINED,
  new_status USER-DEFINED NOT NULL,
  changed_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT order_status_history_pkey PRIMARY KEY (id),
  CONSTRAINT order_status_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_status_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.users(id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  restaurant_id uuid NOT NULL,
  table_id uuid NOT NULL,
  customer_session character varying NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'PENDING'::order_status CHECK (status = ANY (ARRAY['PENDING'::order_status, 'PREPARING'::order_status, 'READY'::order_status, 'COMPLETED'::order_status, 'CANCELLED'::order_status])),
  total numeric NOT NULL DEFAULT 0,
  special_instructions text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  version integer DEFAULT 1,
  updated_by uuid,
  created_by uuid,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id),
  CONSTRAINT orders_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.tables(id),
  CONSTRAINT orders_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id),
  CONSTRAINT orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.restaurants (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL,
  slug character varying NOT NULL UNIQUE,
  description text,
  primary_color character varying DEFAULT '#000000'::character varying,
  owner_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT restaurants_pkey PRIMARY KEY (id),
  CONSTRAINT restaurants_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id)
);
CREATE TABLE public.table_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  table_id uuid NOT NULL,
  user_id uuid NOT NULL,
  assigned_at timestamp with time zone DEFAULT now(),
  assigned_by uuid,
  active boolean DEFAULT true,
  CONSTRAINT table_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT table_assignments_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.tables(id),
  CONSTRAINT table_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT table_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id)
);
CREATE TABLE public.tables (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  restaurant_id uuid NOT NULL,
  name character varying NOT NULL,
  token character varying NOT NULL UNIQUE,
  qr_code_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tables_pkey PRIMARY KEY (id),
  CONSTRAINT tables_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id)
);
CREATE TABLE public.user_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_token text NOT NULL UNIQUE,
  restaurant_id uuid NOT NULL,
  user_role text NOT NULL,
  last_activity timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + '08:00:00'::interval),
  CONSTRAINT user_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT user_sessions_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  email character varying NOT NULL UNIQUE,
  role USER-DEFINED NOT NULL DEFAULT 'WAITSTAFF'::user_role,
  restaurant_id uuid NOT NULL,
  auth_user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  name character varying NOT NULL,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id),
  CONSTRAINT users_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id)
);