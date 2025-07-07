# 🚀 Quick Setup Guide

## Prerequisites
- Node.js 18+
- Supabase account
- Git

## 1. Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd restaurant-saas
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   JWT_SECRET=your_secure_jwt_secret_here
   ```

## 2. Supabase Setup

1. **Create a new Supabase project** at [supabase.com](https://supabase.com)

2. **Run the database schema**
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `supabase-schema.sql`
   - Execute the SQL to create all tables, policies, and triggers

3. **Enable Real-time**
   - Go to Database → Tables
   - Enable real-time for these tables:
     - `orders`
     - `order_items`
     - `order_status_history`

## 3. Start Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 4. First Steps

1. **Register a restaurant** - Visit the homepage and click "Start Your Restaurant"
2. **Set up your menu** - Add categories and menu items
3. **Create tables** - Go to QR Codes section and create tables
4. **Add staff** - Go to Staff section and create staff accounts
5. **Test ordering** - Use the QR codes to test customer ordering

## 🎯 Features Working

✅ **Restaurant Registration**: Complete owner onboarding
✅ **Menu Management**: Add/edit categories and items
✅ **QR Code Generation**: Create printable QR codes for tables
✅ **Table Management**: Enable/disable tables, regenerate QR codes
✅ **Staff Management**: Create kitchen, wait staff, and bartender accounts
✅ **Customer Ordering**: Scan QR → browse menu → place orders
✅ **Kitchen Interface**: Real-time order management
✅ **Wait Staff Interface**: Multi-table overview and management
✅ **Bartender Interface**: Drink order filtering and tab management
✅ **Real-time Updates**: Live order status across all interfaces

## 🔧 Production Deployment

### Vercel (Recommended)
1. Connect repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy

### Environment Variables for Production
```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
JWT_SECRET=your_production_jwt_secret (generate a secure one)
```

## 📱 User Flow

### Restaurant Owner:
1. Register restaurant at `/register`
2. Access dashboard at `/dashboard`
3. Set up menu items and categories
4. Create tables and generate QR codes
5. Add staff members with appropriate roles
6. Print QR codes and place on tables

### Staff Members:
1. Login at `/login` with provided credentials
2. Auto-redirect to role-based interface:
   - Kitchen staff → `/kitchen`
   - Wait staff → `/wait`
   - Bartenders → `/bar`

### Customers:
1. Scan QR code at table
2. Browse menu at `/order/[token]`
3. Add items to cart
4. Place order with special instructions
5. Track order status in real-time

## 🛠️ Troubleshooting

**Build Errors**: 
- Ensure all environment variables are set
- Check Supabase credentials are correct

**Database Errors**:
- Verify SQL schema was executed completely
- Check RLS policies are enabled

**Real-time Not Working**:
- Enable real-time for required tables in Supabase
- Check network connectivity

**QR Codes Not Working**:
- Verify JWT_SECRET is set
- Check table tokens are being generated

## 📈 Next Steps

- Set up payment processing (Stripe integration ready)
- Add email notifications for staff
- Implement advanced analytics
- Add inventory management
- Create mobile apps for staff

## 🆘 Support

Check the [BLUEPRINT.md](./BLUEPRINT.md) for detailed architecture information or open an issue for support.