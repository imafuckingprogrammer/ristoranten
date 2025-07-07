# Restaurant SaaS - Complete System Blueprint

## 🎯 Overview

This is a comprehensive multi-tenant restaurant management SaaS application built with Next.js 14, Supabase, and TypeScript. The system supports QR code-based ordering, real-time kitchen management, staff coordination, and automated menu website generation.

## 🏗️ System Architecture

### Tech Stack
- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL, Auth, Real-time, Storage)
- **State Management**: Zustand with persistence
- **UI Components**: Custom components with Lucide React icons
- **QR Generation**: qrcode.js library
- **Real-time**: Supabase subscriptions + WebSocket

### Core Features
1. **Multi-tenant Architecture**: Thousands of restaurants can use the platform
2. **Role-based Access Control**: OWNER, KITCHEN, WAITSTAFF, BARTENDER roles
3. **QR Code Ordering**: Token-based table identification system
4. **Real-time Updates**: Live order status synchronization
5. **Automated Menu Websites**: Generated per restaurant with custom branding
6. **Staff Management**: Role-based interfaces optimized for each user type

## 🗄️ Database Schema

### Core Tables

#### restaurants
```sql
- id (UUID, PK)
- name (VARCHAR) - Restaurant name
- slug (VARCHAR, UNIQUE) - URL-friendly identifier
- description (TEXT) - Restaurant description
- primary_color (VARCHAR) - Brand color for menu website
- owner_id (UUID, FK) - References auth.users
- created_at, updated_at (TIMESTAMP)
```

#### users (Staff Members)
```sql
- id (UUID, PK)
- email (VARCHAR, UNIQUE)
- role (ENUM: OWNER, KITCHEN, WAITSTAFF, BARTENDER)
- restaurant_id (UUID, FK) - References restaurants
- auth_user_id (UUID, FK) - References auth.users
- created_at, updated_at (TIMESTAMP)
```

#### categories
```sql
- id (UUID, PK)
- restaurant_id (UUID, FK)
- name (VARCHAR) - Category name (e.g., "Appetizers")
- sort_order (INTEGER) - Display order
- created_at, updated_at (TIMESTAMP)
```

#### menu_items
```sql
- id (UUID, PK)
- restaurant_id (UUID, FK)
- category_id (UUID, FK)
- name (VARCHAR) - Item name
- description (TEXT) - Item description
- price (DECIMAL) - Item price
- image_url (TEXT) - Optional image URL
- available (BOOLEAN) - Availability toggle
- created_at, updated_at (TIMESTAMP)
```

#### tables
```sql
- id (UUID, PK)
- restaurant_id (UUID, FK)
- name (VARCHAR) - Custom table name (e.g., "Window Table")
- token (VARCHAR, UNIQUE) - JWT token for QR codes
- qr_code_url (TEXT) - Generated QR code image URL
- active (BOOLEAN) - Enable/disable table
- created_at, updated_at (TIMESTAMP)
```

#### orders
```sql
- id (UUID, PK)
- restaurant_id (UUID, FK)
- table_id (UUID, FK)
- customer_session (VARCHAR) - Anonymous customer identifier
- status (ENUM: PENDING, PREPARING, READY, COMPLETED, CANCELLED)
- total (DECIMAL) - Auto-calculated total
- special_instructions (TEXT)
- created_at, updated_at (TIMESTAMP)
```

#### order_items
```sql
- id (UUID, PK)
- order_id (UUID, FK)
- menu_item_id (UUID, FK)
- quantity (INTEGER)
- price (DECIMAL) - Price snapshot at order time
- special_instructions (TEXT)
- created_at, updated_at (TIMESTAMP)
```

#### order_status_history
```sql
- id (UUID, PK)
- order_id (UUID, FK)
- old_status (ENUM)
- new_status (ENUM)
- changed_by (UUID, FK) - References users
- created_at (TIMESTAMP)
```

### Security & RLS Policies
- **Multi-tenant isolation**: All queries scoped by restaurant_id
- **Role-based permissions**: Users can only access their restaurant's data
- **Owner privileges**: Full CRUD on restaurant data
- **Staff permissions**: Limited to viewing and updating orders
- **Customer access**: Anonymous ordering through QR tokens

## 🔐 Authentication & Authorization

### Authentication Flow
1. **Restaurant Owner Registration**: Creates auth user + restaurant record
2. **Staff Account Creation**: Owner creates staff with role assignment
3. **Role-based Routing**: Automatic redirect to appropriate interface
4. **Customer Sessions**: Anonymous sessions via QR code tokens

### User Roles & Permissions

#### OWNER
- Full restaurant management
- Menu and category CRUD operations
- Staff account management
- QR code generation and table management
- Analytics and reporting access
- Restaurant settings and branding

#### KITCHEN
- View pending/preparing orders
- Update order status (PENDING → PREPARING → READY → COMPLETED)
- Cancel orders if needed
- Optimized touch-friendly interface

#### WAITSTAFF
- Multi-table overview dashboard
- View orders across all tables
- Modify orders (add/remove items)
- Track order status per table
- Customer service interface

#### BARTENDER
- Tab-based order organization
- Filter for drink orders only
- Manage multiple customer tabs
- Track drink preparation and completion

## 🎨 User Interfaces

### Owner Dashboard (`/dashboard`)
**Features:**
- Restaurant overview and settings
- Menu management with drag-drop categories
- Add/edit/delete menu items with availability toggle
- Staff management and role assignment
- QR code generation for tables
- Analytics dashboard with order insights

**UI Components:**
- Category sidebar with item counts
- Menu item grid with inline editing
- Modal forms for adding new items/categories
- Real-time availability toggles

### Kitchen Interface (`/kitchen`)
**Features:**
- Large order cards with essential information
- Touch-optimized status update buttons
- Real-time order notifications
- Order age tracking with time indicators
- Special instructions highlighting

**UI Design:**
- Minimal, high-contrast interface
- Large touch targets (buttons 44px+ height)
- Color-coded order status indicators
- Automatic refresh every 30 seconds

### Wait Staff Interface (`/wait`)
**Features:**
- Table grid overview with status indicators
- Multi-table management dashboard
- Order details modal for each table
- Customer notification system
- Real-time status updates

**UI Design:**
- Grid layout for table visualization
- Quick table switching with swipe gestures
- Order summary cards with customer info
- Status badges with color coding

### Bartender Interface (`/bar`)
**Features:**
- Tab-based organization by table
- Drink order filtering and prioritization
- Tab duration tracking
- Multiple order status management
- Quick drink preparation workflow

**UI Design:**
- Sidebar tab list with totals
- Drink-focused order filtering
- Timer indicators for service speed
- Batch status updates

### Customer Menu Website (`/menu/[slug]`)
**Features:**
- Responsive menu display with restaurant branding
- Category-based navigation with search
- Cart management with quantity controls
- Special instructions per item
- Real-time pricing and availability

**UI Design:**
- Mobile-first responsive design
- Restaurant color theming
- Floating cart with order summary
- Touch-optimized item selection

## ⚡ Real-time Features

### Supabase Real-time Implementation
```typescript
// Order status changes trigger updates across all interfaces
const channel = supabase
  .channel('restaurant-orders')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'orders',
    filter: `restaurant_id=eq.${restaurantId}`
  }, (payload) => {
    // Handle real-time updates
  })
  .subscribe();
```

### Real-time Data Flow
1. **Customer places order** → Kitchen receives instant notification
2. **Kitchen updates status** → Wait staff sees real-time updates
3. **Order ready** → Customer and wait staff notifications
4. **Order completed** → Analytics update, order archive

### Performance Optimizations
- Debounced real-time updates (100ms)
- Selective channel subscriptions by role
- Local state management with Zustand
- Optimistic UI updates for better UX

## 🔗 QR Code System

### Token-based Architecture
```typescript
// JWT token structure for QR codes
interface QRToken {
  table_id: string;
  restaurant_id: string;
  exp: number; // Expiration timestamp
  iss: string; // Issuer
}
```

### QR Code Generation Flow
1. **Owner creates table** → Unique token generated
2. **QR code generated** → Contains encrypted table/restaurant info
3. **Customer scans QR** → Redirects to menu with table context
4. **Order placement** → Table automatically identified

### Security Features
- JWT tokens with expiration (24 hours)
- Restaurant-scoped validation
- Token regeneration capability
- Active/inactive table control

## 🛠️ File Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Authentication routes
│   │   ├── login/page.tsx       # Staff login
│   │   └── register/page.tsx    # Restaurant registration
│   ├── dashboard/page.tsx       # Owner dashboard
│   ├── kitchen/page.tsx         # Kitchen interface
│   ├── wait/page.tsx           # Wait staff interface
│   ├── bar/page.tsx            # Bartender interface
│   ├── menu/[slug]/page.tsx    # Customer menu
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Landing page
├── components/
│   ├── ui/                     # Reusable UI components
│   │   ├── Button.tsx          # Button component
│   │   ├── Card.tsx           # Card component
│   │   └── Input.tsx          # Input component
│   ├── dashboard/             # Dashboard-specific components
│   ├── kitchen/              # Kitchen-specific components
│   ├── wait/                 # Wait staff components
│   └── menu/                 # Customer menu components
├── lib/
│   ├── types.ts              # TypeScript definitions
│   ├── supabase.ts          # Supabase client
│   ├── auth.ts              # Authentication utilities
│   └── store.ts             # Zustand state management
└── supabase-schema.sql       # Database schema
```

## 🚀 Deployment & Setup

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Supabase Setup
1. Create new Supabase project
2. Run `supabase-schema.sql` to create tables and policies
3. Configure authentication settings
4. Enable real-time for required tables

### Development Setup
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local

# Run development server
npm run dev
```

### Production Deployment
- Deploy to Vercel, Netlify, or similar platform
- Configure environment variables
- Set up custom domain for restaurant subdomains
- Configure SSL certificates

## 🔮 Future Enhancements

### Phase 2 Features
- **Payment Integration**: Stripe integration for order payments
- **Inventory Management**: Track ingredient levels and auto-disable items
- **Staff Performance Analytics**: Track service times and efficiency
- **Customer Loyalty Program**: Points and rewards system
- **Multi-location Support**: Franchise management capabilities

### Phase 3 Features
- **Mobile Apps**: Native iOS/Android apps for staff
- **Voice Ordering**: Integration with voice assistants
- **AI Recommendations**: ML-powered menu suggestions
- **Integration APIs**: POS system integrations
- **Advanced Analytics**: Predictive analytics and forecasting

### Technical Improvements
- **Offline Support**: Service workers for offline operation
- **Push Notifications**: Real-time alerts for staff devices
- **Performance Monitoring**: Error tracking and performance analytics
- **Load Balancing**: Horizontal scaling for high-traffic restaurants
- **CDN Integration**: Global content delivery for menu images

## 📊 Monitoring & Analytics

### Built-in Analytics
- Order volume and revenue tracking
- Peak hours and demand patterns
- Menu item popularity analysis
- Staff performance metrics
- Customer behavior insights

### Performance Monitoring
- Real-time order processing times
- System response times
- Error rates and uptime monitoring
- Database query performance
- User engagement metrics

## 🔧 Maintenance & Support

### Regular Maintenance Tasks
- Database backups and cleanup
- Security updates and patches
- Performance optimization
- Feature updates and bug fixes
- Customer support and training

### Scaling Considerations
- Database indexing optimization
- Caching layer implementation
- Load balancer configuration
- Auto-scaling infrastructure
- Multi-region deployment

## 📝 Notes

This blueprint provides a complete foundation for a production-ready restaurant SaaS platform. The architecture is designed to handle thousands of restaurants while maintaining excellent performance and user experience across all interfaces.

The system prioritizes:
- **Simplicity**: Minimal clicks for staff operations
- **Reliability**: Real-time updates and error handling
- **Scalability**: Multi-tenant architecture with proper isolation
- **Security**: Role-based access and data protection
- **Usability**: Optimized interfaces for each user role

For questions or support, refer to the documentation in each component file and the comprehensive type definitions in `src/lib/types.ts`.