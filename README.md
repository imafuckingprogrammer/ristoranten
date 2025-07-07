# 🍽️ Restaurant SaaS Platform

> **Multi-tenant restaurant management system with QR code ordering, real-time kitchen coordination, and individual staff accountability.**

---

## 📋 **Table of Contents**
- [System Architecture](#-system-architecture)
- [User Account System](#-user-account-system)
- [User Roles & Permissions](#-user-roles--permissions)
- [Core Features](#-core-features)
- [User Flows](#-user-flows)
- [Technical Implementation](#-technical-implementation)
- [Database Schema](#-database-schema)
- [Installation & Setup](#-installation--setup)
- [Future Enhancements](#-future-enhancements)

---

## 🏗️ **System Architecture**

### **Multi-Tenant SaaS Design**
```
Restaurant A (tenant_1)
├── Owner Account (sarah@restaurant-a.com)
├── Kitchen Staff (john@kitchen.com, mike@kitchen.com, alex@kitchen.com)
├── Wait Staff (emma@wait.com, david@wait.com, lisa@wait.com, tom@wait.com, anna@wait.com)
├── Bartenders (carlos@bar.com, jessica@bar.com)
└── Tables (15 tables with unique QR codes)

Restaurant B (tenant_2)
├── Owner Account (owner@restaurant-b.com)
├── Kitchen Staff (8 individual accounts)
├── Wait Staff (12 individual accounts)
├── Bartenders (4 individual accounts)
└── Tables (25 tables with unique QR codes)
```

### **Individual Accountability System**
- ✅ **Each person = Unique account** with individual login credentials
- ✅ **Action tracking**: Who prepared orders, who served tables, who modified items
- ✅ **Assignment capability**: Tables assigned to specific waiters
- ✅ **Performance metrics**: Individual staff efficiency and activity tracking
- ✅ **Future-ready**: Built for table assignments, shift scheduling, performance reviews

---

## 👤 **User Account System**

### **How Staff Accounts Work:**
```javascript
// Example: 5 Kitchen Staff = 5 Unique Accounts
{
  "kitchen_staff_1": {
    "email": "john.smith@restaurant.com",
    "role": "KITCHEN",
    "restaurant_id": "restaurant-123",
    "last_active": "2024-01-15 14:30:00"
  },
  "kitchen_staff_2": {
    "email": "sarah.johnson@restaurant.com", 
    "role": "KITCHEN",
    "restaurant_id": "restaurant-123",
    "last_active": "2024-01-15 14:25:00"
  }
}
```

### **Activity Tracking Ready:**
```sql
-- Database ready for individual tracking
orders.prepared_by     -- "john.smith@restaurant.com"
orders.served_by       -- "emma.davis@restaurant.com"
tables.assigned_to     -- "tom.wilson@restaurant.com"
orders.modified_by     -- "lisa.brown@restaurant.com"
```

### **Why Token-Based QR System:**
1. **🔒 Security**: Tokens expire (24h), harder to forge than simple table IDs
2. **📱 Stateless**: Works without internet connection for menu viewing
3. **🎯 Table-Specific**: Each QR contains table info, restaurant context
4. **🚀 Future Features**: 
   - Assign QR codes to specific waiters
   - Track which waiter generated the QR
   - Table-specific promotions or specials
   - Customer feedback tied to specific tables/staff

---

## 👥 **User Roles & Permissions**

### 🏢 **Owner/Manager**
**Full administrative access:**
- ✅ Dashboard analytics (revenue, orders, performance)
- ✅ Menu management (create/edit categories, items, pricing)
- ✅ Staff management (create individual accounts, assign roles)
- ✅ Table management (create/edit tables, generate QR codes)
- ✅ Restaurant settings (branding, hours, contact info)
- ✅ Financial reports and individual staff performance
- ✅ Real-time monitoring of all operations

### 👨‍🍳 **Kitchen Staff (Individual Accounts)**
**Kitchen operations with personal accountability:**
- ✅ View incoming orders in real-time
- ✅ Claim specific orders (tracked to their account)
- ✅ Update order status (PENDING → PREPARING → READY)
- ✅ Personal prep time tracking and performance metrics
- ✅ Communication with wait staff
- ❌ Cannot modify menu or prices
- ❌ Cannot access financial data

### 🍽️ **Wait Staff (Individual Accounts)**
**Customer service with table assignments:**
- ✅ View all tables and their status
- ✅ Get assigned specific tables (by manager)
- ✅ Take orders manually (walk-ins)
- ✅ Edit/cancel orders (with full edit capabilities)
- ✅ Track personal service metrics (tables served, tips, customer satisfaction)
- ✅ Handle customer requests and modifications
- ❌ Cannot access financial reports
- ❌ Cannot modify menu or staff accounts

### 🍹 **Bartender (Individual Accounts)**
**Bar operations with tab management:**
- ✅ View drink orders only (intelligent filtering)
- ✅ Manage table tabs/running totals
- ✅ Personal drink preparation tracking
- ✅ Handle bar-specific requests
- ✅ Track individual performance (drinks made, speed, accuracy)
- ❌ Cannot see food orders
- ❌ Cannot access kitchen interface

---

## 🚀 **Core Features**

### **1. QR Code Ordering System**
```
Customer Journey:
1. Scan QR code on table
2. View restaurant menu (branded)
3. Add items to cart with special instructions
4. Place order with customer session tracking
5. Real-time status updates
6. Order completion and feedback
```

**Technical Features:**
- **Token-based security**: JWT tokens with 24h expiration
- **Table context**: QR contains table_id, restaurant_id, table_name
- **Mobile-optimized**: Touch-friendly interface for phones
- **Offline capability**: Menu loads even with poor connection

### **2. Real-Time Kitchen Management**
```
Kitchen Workflow:
1. New orders appear instantly
2. Kitchen staff claims orders (tracked to their account)
3. Update status with personal accountability
4. Real-time coordination with wait staff
5. Performance tracking per staff member
```

**Individual Tracking:**
- ⏱️ **Prep time per staff member** (efficiency metrics)
- 👥 **Order assignment tracking** (who made what)
- 📊 **Performance analytics** (speed, accuracy, volume)
- 🔔 **Personal notifications** (new orders for assigned staff)

### **3. Wait Staff Order Management**
```
Wait Staff Interface:
1. Color-coded table overview
2. Personal table assignments
3. Full order editing capabilities
4. Customer service tracking
5. Individual performance metrics
```

**Order Editing Capabilities:**
- ✏️ **Modify quantities** (+ and - buttons)
- ❌ **Remove individual items** (with confirmation)
- 📝 **Edit special instructions** (real-time updates)
- 🚫 **Cancel entire orders** (with manager approval)
- 💰 **Real-time total calculations**

### **4. Bartender Tab System**
```
Bar Operations:
1. Drink orders filtered automatically
2. Tab management by table
3. Personal preparation tracking
4. Individual performance metrics
```

**Smart Filtering:**
```javascript
// Automatic drink detection
const drinkKeywords = [
  'drink', 'beer', 'wine', 'cocktail', 
  'juice', 'soda', 'whiskey', 'vodka', 
  'rum', 'gin', 'tequila', 'martini'
];
```

---

## 🌊 **User Flows**

### **Customer Flow (QR Code Ordering)**
```
1. Arrive at table → 2. Scan QR code → 3. Browse menu → 4. Add items to cart →
5. Review order → 6. Place order → 7. Track status → 8. Receive food → 9. Complete
```

**Detailed Customer Experience:**
1. **Arrival**: Customer sits at table (e.g., "Window Table")
2. **QR Scan**: Opens camera, scans QR code
3. **Menu Access**: Instant access to branded restaurant menu
4. **Browsing**: Categories, search, item descriptions, photos
5. **Ordering**: Add items, modify quantities, special instructions
6. **Confirmation**: Review total, submit order
7. **Tracking**: Real-time updates (Received → Preparing → Ready → Served)
8. **Completion**: Notification when order is ready

### **Kitchen Staff Flow (Individual Accountability)**
```
1. Login (john@kitchen.com) → 2. View order queue → 3. Claim order → 
4. Start preparation → 5. Update status → 6. Mark complete → 7. Performance tracking
```

**Detailed Kitchen Process:**
1. **Personal Login**: Each staff member logs in with unique account
2. **Order Queue**: See all pending orders sorted by time/priority
3. **Order Claiming**: Staff member clicks "Take Order" (tracked to their account)
4. **Preparation**: Update status to "PREPARING" (timestamped)
5. **Progress Updates**: Mark individual items as complete
6. **Completion**: Mark entire order as "READY" (prep time recorded)
7. **Analytics**: System tracks personal efficiency, speed, accuracy

### **Wait Staff Flow (Table Management)**
```
1. Login (emma@wait.com) → 2. View assigned tables → 3. Manage orders → 
4. Edit/cancel as needed → 5. Serve customers → 6. Complete service
```

**Detailed Wait Staff Process:**
1. **Personal Login**: Access with individual staff credentials
2. **Table Assignment**: See personally assigned tables (color-coded)
3. **Order Overview**: Monitor all orders across assigned tables
4. **Order Editing**: Full edit capabilities before kitchen starts
5. **Customer Service**: Handle special requests, complaints, modifications
6. **Service Completion**: Mark orders as served, reset tables
7. **Performance**: Track tables served, customer satisfaction, efficiency

---

## 🔧 **Technical Implementation**

### **Technology Stack**
```
Frontend:
├── Next.js 15 (App Router, RSC)
├── TypeScript (Full type safety)
├── Tailwind CSS v4 (Utility-first styling)
├── Framer Motion (Smooth animations)
└── Zustand (Lightweight state management)

Backend:
├── Supabase (BaaS platform)
├── PostgreSQL (Primary database)
├── Row Level Security (Multi-tenant isolation)
├── Real-time subscriptions (WebSocket-based)
├── JWT tokens (QR code security)
└── RESTful APIs (CRUD operations)

Infrastructure:
├── Vercel (Edge deployment)
├── Cloudflare (CDN, DDoS protection)
├── Sentry (Error monitoring)
└── Analytics (Performance tracking)
```

### **Individual User Tracking System**
```javascript
// User session tracking
const trackUserAction = async (action, details) => {
  await supabase.from('user_activities').insert({
    user_id: currentUser.id,
    user_email: currentUser.email,
    action: action, // 'order_prepared', 'table_served', 'order_modified'
    details: details,
    restaurant_id: currentUser.restaurant_id,
    timestamp: new Date().toISOString()
  });
};

// Example usage:
trackUserAction('order_prepared', { 
  order_id: 'order-123', 
  prep_time_minutes: 12,
  items_prepared: ['burger', 'fries']
});
```

### **Real-Time Multi-User Coordination**
```javascript
// Kitchen staff see live updates from all kitchen accounts
const kitchenChannel = supabase
  .channel('kitchen-coordination')
  .on('postgres_changes', {
    event: '*',
    schema: 'public', 
    table: 'orders',
    filter: `restaurant_id=eq.${restaurantId}`
  }, (payload) => {
    // Update UI for all kitchen staff
    updateOrderQueue(payload);
    
    // Show who is working on what
    showStaffAssignments(payload.prepared_by);
  })
  .subscribe();
```

---

## 🗄️ **Database Schema**

### **Multi-Tenant Structure**
```sql
-- Restaurant isolation
CREATE TABLE restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  owner_id uuid REFERENCES auth.users(id),
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Individual user accounts
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role user_role NOT NULL, -- OWNER, KITCHEN, WAITSTAFF, BARTENDER
  restaurant_id uuid REFERENCES restaurants(id),
  auth_user_id uuid REFERENCES auth.users(id),
  last_active_at timestamptz DEFAULT now(),
  performance_metrics jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Table assignments
CREATE TABLE tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  restaurant_id uuid REFERENCES restaurants(id),
  qr_token text UNIQUE,
  assigned_to uuid REFERENCES users(id), -- Which waiter
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Order tracking with individual accountability
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id),
  table_id uuid REFERENCES tables(id),
  customer_session text NOT NULL,
  status order_status DEFAULT 'PENDING',
  total decimal(10,2) NOT NULL,
  special_instructions text,
  
  -- Individual staff tracking
  created_by uuid REFERENCES users(id),     -- Who took the order
  assigned_to uuid REFERENCES users(id),    -- Who is responsible
  prepared_by uuid REFERENCES users(id),    -- Kitchen staff who made it
  served_by uuid REFERENCES users(id),      -- Wait staff who served it
  
  -- Timing for performance metrics
  created_at timestamptz DEFAULT now(),
  preparation_started_at timestamptz,
  preparation_completed_at timestamptz,
  served_at timestamptz
);

-- Activity tracking for accountability
CREATE TABLE user_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  user_email text NOT NULL,
  action text NOT NULL, -- 'order_prepared', 'table_served', 'order_modified'
  details jsonb DEFAULT '{}',
  restaurant_id uuid REFERENCES restaurants(id),
  created_at timestamptz DEFAULT now()
);
```

### **Performance Tracking Ready**
```sql
-- Individual staff performance queries
SELECT 
  u.email,
  COUNT(o.id) as orders_prepared,
  AVG(EXTRACT(EPOCH FROM (o.preparation_completed_at - o.preparation_started_at))/60) as avg_prep_time_minutes,
  DATE_TRUNC('day', o.created_at) as date
FROM orders o
JOIN users u ON o.prepared_by = u.id
WHERE o.restaurant_id = $1
  AND o.preparation_completed_at IS NOT NULL
GROUP BY u.email, DATE_TRUNC('day', o.created_at)
ORDER BY date DESC;
```

---

## 📦 **Installation & Setup**

### **Prerequisites**
- Node.js 18+
- npm or yarn
- Supabase account

### **Quick Start**
```bash
# 1. Clone repository
git clone <repository-url>
cd restaurant-saas

# 2. Install dependencies
npm install

# 3. Environment setup
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# 4. Start development server
npm run dev

# 5. Open browser
# Navigate to http://localhost:3000
```

### **Environment Variables**
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT Secret for QR Codes
JWT_SECRET=your_secure_jwt_secret

# Optional: Monitoring
SENTRY_DSN=your_sentry_dsn
```

### **Database Setup**
```sql
-- Run this SQL in your Supabase SQL editor
-- See supabase-schema.sql for complete schema
-- Includes RLS policies for multi-tenant isolation
```

---

## 🔮 **Future Enhancements**

### **Staff Management Features** (Ready for Implementation)
- 👥 **Table assignment system** (assign specific waiters to tables)
- 📊 **Performance dashboards** (individual staff metrics)
- ⏰ **Shift scheduling** (staff availability and scheduling)
- 🏆 **Gamification** (achievements, leaderboards, staff competition)
- 📱 **Staff mobile app** (native iOS/Android for floor staff)
- 💬 **Internal messaging** (staff communication system)

### **Advanced Analytics** (Database Ready)
- 📈 **Predictive analytics** (busy period forecasting)
- 🎯 **Staff optimization** (optimal staffing levels)
- 💰 **Revenue optimization** (menu item profitability)
- 🔄 **Workflow optimization** (bottleneck identification)
- 📊 **Customer behavior analysis** (ordering patterns)

### **Customer Experience**
- 💳 **Payment integration** (Stripe, Square, Apple Pay)
- 🎁 **Loyalty programs** (points, rewards, customer retention)
- ⭐ **Review system** (customer feedback and ratings)
- 🔔 **SMS notifications** (order status updates)
- 🌍 **Multi-language support** (international customers)

---

## 🛠️ **Debug & Testing**

### **Debug Dashboard**
- 🛠️ **Access**: `/debug` - Test all roles with demo data
- 🔄 **Role switching**: Switch between Owner/Kitchen/Wait/Bar interfaces
- 🧹 **Data cleanup**: Reset demo data with one click
- 📝 **Activity simulation**: Generate test orders and activities

### **Testing Individual Accounts**
```javascript
// Create multiple kitchen staff for testing
const kitchenStaff = [
  'john.smith@kitchen.com',
  'sarah.johnson@kitchen.com', 
  'mike.wilson@kitchen.com',
  'alex.brown@kitchen.com',
  'emma.davis@kitchen.com'
];

// Each gets unique login and tracking
kitchenStaff.forEach(email => createStaffAccount(email, 'KITCHEN'));
```

---

## 📞 **Support & Documentation**

### **Getting Help**
- 📧 **Technical Support**: Issues and bug reports
- 📚 **Documentation**: Complete API and user guides
- 🎥 **Video Tutorials**: Staff training and onboarding
- 💬 **Community**: User forums and discussions

### **Staff Training Materials**
- 🎓 **Owner training**: Complete restaurant setup guide
- 👨‍🍳 **Kitchen training**: Order management and efficiency
- 🍽️ **Wait staff training**: Customer service and order editing
- 🍹 **Bartender training**: Tab management and drink orders

---

**Built with ❤️ for individual accountability and staff empowerment**
*Every action tracked, every staff member valued.*