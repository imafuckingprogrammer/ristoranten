export type UserRole = 'OWNER' | 'KITCHEN' | 'WAITSTAFF' | 'BARTENDER';

export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  primary_color?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  restaurant_id: string;
  auth_user_id?: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  available: boolean;
  sold_out?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Table {
  id: string;
  restaurant_id: string;
  name: string;
  token: string;
  qr_code_url?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  restaurant_id: string;
  table_id: string;
  customer_session: string;
  status: OrderStatus;
  total: number;
  special_instructions?: string;
  version?: number;
  updated_by?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  price: number;
  special_instructions?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderWithItems extends Order {
  items: (OrderItem & { menu_item: MenuItem })[];
  table: Table;
}

export interface CartItem {
  menu_item: MenuItem;
  quantity: number;
  special_instructions?: string;
}

// Additional interfaces for new database tables
export interface AuthorizedEmail {
  id: string;
  email: string;
  restaurant_id: string;
  role: UserRole;
  authorized_by?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderAuditLog {
  id: string;
  order_id: string;
  user_id?: string;
  action: string;
  old_value?: any;
  new_value?: any;
  created_at: string;
}

export interface OrderNotification {
  id: string;
  order_id: string;
  message: string;
  notification_type: 'ORDER_READY' | 'ORDER_DELAYED' | 'SPECIAL_REQUEST' | 'CANCELLATION';
  target_role: 'KITCHEN_STAFF' | 'WAIT_STAFF' | 'BAR_STAFF' | 'MANAGER';
  read_at?: string;
  created_at: string;
  expires_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  old_status?: OrderStatus;
  new_status: OrderStatus;
  changed_by?: string;
  created_at: string;
}

export interface TableAssignment {
  id: string;
  table_id: string;
  user_id: string;
  assigned_at: string;
  assigned_by?: string;
  active: boolean;
}

export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  restaurant_id: string;
  user_role: string;
  last_activity: string;
  created_at: string;
  expires_at: string;
}