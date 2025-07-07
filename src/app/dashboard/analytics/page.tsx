'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { createClient } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { LoadingScreen } from '@/components/ui/LoadingSpinner';
import { 
  ArrowLeft, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Users,
  Calendar,
  Clock,
  Star
} from 'lucide-react';

interface AnalyticsData {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalCustomers: number;
  todayOrders: number;
  todayRevenue: number;
  topItems: Array<{ name: string; count: number; revenue: number }>;
  recentOrders: Array<{ id: string; table_name: string; total: number; created_at: string }>;
}

export default function AnalyticsPage() {
  const { user, restaurant, isAuthenticated } = useAppStore();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('week');
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'OWNER') {
      router.push('/login');
      return;
    }
    
    fetchAnalytics();
  }, [isAuthenticated, user, router, timeRange]);

  const fetchAnalytics = async () => {
    if (!restaurant) return;
    
    try {
      setLoading(true);
      
      // Calculate date ranges
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      let startDate: Date;
      
      switch (timeRange) {
        case 'today':
          startDate = today;
          break;
        case 'week':
          startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0); // All time
      }
      
      // Fetch orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          table:tables(name),
          items:order_items(
            *,
            menu_item:menu_items(name)
          )
        `)
        .eq('restaurant_id', restaurant.id)
        .in('status', ['PENDING', 'PREPARING', 'READY', 'COMPLETED'])
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });
      
      if (ordersError) throw ordersError;
      
      // Calculate analytics
      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum, order) => sum + order.total, 0) || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      const todayOrders = orders?.filter(order => 
        new Date(order.created_at) >= today
      ).length || 0;
      
      const todayRevenue = orders?.filter(order => 
        new Date(order.created_at) >= today
      ).reduce((sum, order) => sum + order.total, 0) || 0;
      
      // Calculate unique customers (simplified by unique table sessions)
      const uniqueSessions = new Set(orders?.map(order => order.customer_session) || []);
      const totalCustomers = uniqueSessions.size;
      
      // Calculate top menu items
      const itemCounts: Record<string, { name: string; count: number; revenue: number }> = {};
      orders?.forEach(order => {
        order.items.forEach((item: any) => {
          const itemName = item.menu_item.name;
          if (!itemCounts[itemName]) {
            itemCounts[itemName] = { name: itemName, count: 0, revenue: 0 };
          }
          itemCounts[itemName].count += item.quantity;
          itemCounts[itemName].revenue += item.price * item.quantity;
        });
      });
      
      const topItems = Object.values(itemCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      // Recent orders (last 10)
      const recentOrders = orders?.slice(0, 10).map(order => ({
        id: order.id,
        table_name: order.table?.name || 'Unknown',
        total: order.total,
        created_at: order.created_at,
      })) || [];
      
      setAnalytics({
        totalOrders,
        totalRevenue,
        averageOrderValue,
        totalCustomers,
        todayOrders,
        todayRevenue,
        topItems,
        recentOrders,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading analytics..." />;
  }

  return (
    <div className="min-h-screen bg-rose-50">
      {/* Ultra Minimal Header */}
      <div className="bg-white/60 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-rose-600 hover:text-rose-900 px-3 py-2 text-xs font-light transition-all duration-300 rounded-full hover:bg-rose-100"
              >
                <ArrowLeft className="h-3 w-3 mr-1 inline" />
                Back
              </button>
              <div>
                <h1 className="text-lg font-light text-rose-900">Analytics</h1>
                <p className="text-xs text-rose-500">{restaurant?.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {(['today', 'week', 'month', 'all'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-2 rounded-full text-xs font-light transition-all duration-300 border-0 ${
                    timeRange === range 
                      ? 'bg-rose-300 text-rose-900' 
                      : 'bg-white/50 text-rose-600 hover:bg-white/70'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {analytics ? (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-rose-200 to-rose-300 rounded-full flex items-center justify-center mr-4">
                    <ShoppingBag className="h-5 w-5 text-rose-800" />
                  </div>
                  <div>
                    <h3 className="text-xs font-light text-rose-700 tracking-wide">Total Orders</h3>
                    <p className="text-lg font-light text-rose-900">{analytics.totalOrders}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-rose-200 to-rose-300 rounded-full flex items-center justify-center mr-4">
                    <DollarSign className="h-5 w-5 text-rose-800" />
                  </div>
                  <div>
                    <h3 className="text-xs font-light text-rose-700 tracking-wide">Revenue</h3>
                    <p className="text-lg font-light text-rose-900">${analytics.totalRevenue.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-rose-200 to-rose-300 rounded-full flex items-center justify-center mr-4">
                    <TrendingUp className="h-5 w-5 text-rose-800" />
                  </div>
                  <div>
                    <h3 className="text-xs font-light text-rose-700 tracking-wide">Avg Order Value</h3>
                    <p className="text-lg font-light text-rose-900">${analytics.averageOrderValue.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-rose-200 to-rose-300 rounded-full flex items-center justify-center mr-4">
                    <Users className="h-5 w-5 text-rose-800" />
                  </div>
                  <div>
                    <h3 className="text-xs font-light text-rose-700 tracking-wide">Customers</h3>
                    <p className="text-lg font-light text-rose-900">{analytics.totalCustomers}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Performance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-6">
                <h3 className="text-xs font-light text-rose-700 tracking-wide mb-6 uppercase">Today's Performance</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-rose-600 font-light">Orders</span>
                    <span className="text-sm font-light text-rose-900">{analytics.todayOrders}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-rose-600 font-light">Revenue</span>
                    <span className="text-sm font-light text-rose-900">${analytics.todayRevenue.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-6">
                <h3 className="text-xs font-light text-rose-700 tracking-wide mb-6 uppercase">Top Menu Items</h3>
                <div className="space-y-3">
                  {analytics.topItems.map((item, index) => (
                    <div key={item.name} className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="w-6 h-6 bg-gradient-to-br from-rose-200 to-rose-300 rounded-full flex items-center justify-center text-xs font-light text-rose-900 mr-3">
                          {index + 1}
                        </span>
                        <span className="text-sm text-rose-900 font-light">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-light text-rose-900">{item.count}</div>
                        <div className="text-xs text-rose-500 font-light">${item.revenue.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-6">
              <h3 className="text-xs font-light text-rose-700 tracking-wide mb-6 uppercase">Recent Orders</h3>
              <div className="space-y-3">
                {analytics.recentOrders.map((order) => (
                  <div key={order.id} className="flex justify-between items-center py-3 border-b border-rose-200/30 last:border-b-0">
                    <div>
                      <span className="text-sm font-light text-rose-900">Table {order.table_name}</span>
                      <span className="text-xs text-rose-500 ml-4 font-light">
                        {new Date(order.created_at).toLocaleString()}
                      </span>
                    </div>
                    <span className="text-sm font-light text-rose-900">${order.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <TrendingUp className="h-12 w-12 text-rose-300 mx-auto mb-6" />
            <h3 className="text-sm font-light text-rose-900 mb-2">No Data Available</h3>
            <p className="text-xs text-rose-500 font-light">Start taking orders to see analytics</p>
          </div>
        )}
      </div>
    </div>
  );
}