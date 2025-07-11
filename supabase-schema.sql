-- Updated Database Schema (from currentsupabase.sql)
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

-- Indexes for better performance
CREATE INDEX idx_restaurants_owner_id ON restaurants(owner_id);
CREATE INDEX idx_restaurants_slug ON restaurants(slug);
CREATE INDEX idx_users_restaurant_id ON users(restaurant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_categories_restaurant_id ON categories(restaurant_id);
CREATE INDEX idx_menu_items_restaurant_id ON menu_items(restaurant_id);
CREATE INDEX idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX idx_tables_restaurant_id ON tables(restaurant_id);
CREATE INDEX idx_tables_token ON tables(token);
CREATE INDEX idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX idx_orders_table_id ON orders(table_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id);

-- Row Level Security (RLS) policies
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- Restaurant policies
CREATE POLICY "Users can view their own restaurant" ON restaurants
    FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can update their own restaurant" ON restaurants
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can insert their own restaurant" ON restaurants
    FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Users policies
CREATE POLICY "Users can view users in their restaurant" ON users
    FOR SELECT USING (
        restaurant_id IN (
            SELECT id FROM restaurants WHERE owner_id = auth.uid()
        ) OR auth_user_id = auth.uid()
    );

CREATE POLICY "Restaurant owners can manage their staff" ON users
    FOR ALL USING (
        restaurant_id IN (
            SELECT id FROM restaurants WHERE owner_id = auth.uid()
        )
    );

-- Categories policies
CREATE POLICY "Users can view categories in their restaurant" ON categories
    FOR SELECT USING (
        restaurant_id IN (
            SELECT restaurant_id FROM users WHERE auth_user_id = auth.uid()
            UNION
            SELECT id FROM restaurants WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Restaurant owners can manage categories" ON categories
    FOR ALL USING (
        restaurant_id IN (
            SELECT id FROM restaurants WHERE owner_id = auth.uid()
        )
    );

-- Menu items policies
CREATE POLICY "Users can view menu items in their restaurant" ON menu_items
    FOR SELECT USING (
        restaurant_id IN (
            SELECT restaurant_id FROM users WHERE auth_user_id = auth.uid()
            UNION
            SELECT id FROM restaurants WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Restaurant owners can manage menu items" ON menu_items
    FOR ALL USING (
        restaurant_id IN (
            SELECT id FROM restaurants WHERE owner_id = auth.uid()
        )
    );

-- Tables policies
CREATE POLICY "Users can view tables in their restaurant" ON tables
    FOR SELECT USING (
        restaurant_id IN (
            SELECT restaurant_id FROM users WHERE auth_user_id = auth.uid()
            UNION
            SELECT id FROM restaurants WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Restaurant owners can manage tables" ON tables
    FOR ALL USING (
        restaurant_id IN (
            SELECT id FROM restaurants WHERE owner_id = auth.uid()
        )
    );

-- Orders policies
CREATE POLICY "Users can view orders in their restaurant" ON orders
    FOR SELECT USING (
        restaurant_id IN (
            SELECT restaurant_id FROM users WHERE auth_user_id = auth.uid()
            UNION
            SELECT id FROM restaurants WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Restaurant staff can manage orders" ON orders
    FOR ALL USING (
        restaurant_id IN (
            SELECT restaurant_id FROM users WHERE auth_user_id = auth.uid()
            UNION
            SELECT id FROM restaurants WHERE owner_id = auth.uid()
        )
    );

-- Order items policies
CREATE POLICY "Users can view order items in their restaurant" ON order_items
    FOR SELECT USING (
        order_id IN (
            SELECT id FROM orders WHERE restaurant_id IN (
                SELECT restaurant_id FROM users WHERE auth_user_id = auth.uid()
                UNION
                SELECT id FROM restaurants WHERE owner_id = auth.uid()
            )
        )
    );

CREATE POLICY "Restaurant staff can manage order items" ON order_items
    FOR ALL USING (
        order_id IN (
            SELECT id FROM orders WHERE restaurant_id IN (
                SELECT restaurant_id FROM users WHERE auth_user_id = auth.uid()
                UNION
                SELECT id FROM restaurants WHERE owner_id = auth.uid()
            )
        )
    );

-- Order status history policies
CREATE POLICY "Users can view order status history in their restaurant" ON order_status_history
    FOR SELECT USING (
        order_id IN (
            SELECT id FROM orders WHERE restaurant_id IN (
                SELECT restaurant_id FROM users WHERE auth_user_id = auth.uid()
                UNION
                SELECT id FROM restaurants WHERE owner_id = auth.uid()
            )
        )
    );

CREATE POLICY "Restaurant staff can insert order status history" ON order_status_history
    FOR INSERT WITH CHECK (
        order_id IN (
            SELECT id FROM orders WHERE restaurant_id IN (
                SELECT restaurant_id FROM users WHERE auth_user_id = auth.uid()
                UNION
                SELECT id FROM restaurants WHERE owner_id = auth.uid()
            )
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updating updated_at
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tables_updated_at BEFORE UPDATE ON tables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update order total when order items change
CREATE OR REPLACE FUNCTION update_order_total()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE orders 
    SET total = (
        SELECT COALESCE(SUM(price * quantity), 0)
        FROM order_items
        WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
    )
    WHERE id = COALESCE(NEW.order_id, OLD.order_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Triggers for updating order total
CREATE TRIGGER update_order_total_on_insert AFTER INSERT ON order_items
    FOR EACH ROW EXECUTE FUNCTION update_order_total();

CREATE TRIGGER update_order_total_on_update AFTER UPDATE ON order_items
    FOR EACH ROW EXECUTE FUNCTION update_order_total();

CREATE TRIGGER update_order_total_on_delete AFTER DELETE ON order_items
    FOR EACH ROW EXECUTE FUNCTION update_order_total();

-- Function to track order status changes
CREATE OR REPLACE FUNCTION track_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO order_status_history (order_id, old_status, new_status, changed_by)
        VALUES (NEW.id, OLD.status, NEW.status, 
                (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1));
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for tracking order status changes
CREATE TRIGGER track_order_status_change_trigger AFTER UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION track_order_status_change();