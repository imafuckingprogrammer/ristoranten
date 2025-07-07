'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { createClient } from '@/lib/supabase';
import { signOut } from '@/lib/auth';
import { OrderWithItems, OrderStatus } from '@/lib/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Clock, ChefHat, CheckCircle, XCircle, AlertCircle, LogOut } from 'lucide-react';

export default function KitchenPage() {
  const { user, restaurant, isAuthenticated } = useAppStore();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'KITCHEN') {
      router.push('/login');
      return;
    }
    
    fetchOrders();
    setupRealtimeSubscription();
  }, [isAuthenticated, user, router]);

  const fetchOrders = async () => {
    if (!restaurant) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          table:tables(*),
          items:order_items(
            *,
            menu_item:menu_items(*)
          )
        `)
        .eq('restaurant_id', restaurant.id)
        .in('status', ['PENDING', 'PREPARING', 'READY'])
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!restaurant) return;
    
    const channel = supabase
      .channel('kitchen-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurant.id}`,
        },
        (payload) => {
          fetchOrders();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items',
        },
        (payload) => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      setUpdatingOrder(orderId);
      
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      
      if (error) throw error;
      
      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      
      // If order is completed, remove it from the kitchen view
      if (newStatus === 'COMPLETED') {
        setOrders(orders.filter(order => order.id !== orderId));
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    } finally {
      setUpdatingOrder(null);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'PREPARING':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'READY':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-white text-black border-black';
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return <AlertCircle className="h-5 w-5" />;
      case 'PREPARING':
        return <ChefHat className="h-5 w-5" />;
      case 'READY':
        return <CheckCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getOrderAge = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes === 1) return '1 min ago';
    return `${diffInMinutes} mins ago`;
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rose-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-rose-300 mx-auto"></div>
          <p className="mt-3 text-xs text-rose-400">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rose-50">
      {/* Ultra Minimal Header */}
      <div className="bg-white/60 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-rose-200 to-rose-300 rounded-full flex items-center justify-center shadow-lg">
                <ChefHat className="h-5 w-5 text-rose-800" />
              </div>
              <div>
                <h1 className="text-lg font-light text-rose-900">Kitchen</h1>
                <p className="text-xs text-rose-500">{restaurant?.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-xs text-rose-600 font-light">
                {orders.length} active orders
              </div>
              <button
                onClick={handleSignOut}
                className="text-rose-400 hover:text-rose-600 p-2 transition-all duration-300"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {orders.length === 0 ? (
          <div className="text-center py-16">
            <ChefHat className="h-12 w-12 text-rose-300 mx-auto mb-6" />
            <h3 className="text-sm font-light text-rose-900 mb-2">No Active Orders</h3>
            <p className="text-xs text-rose-500 font-light">All caught up! New orders will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white/40 backdrop-blur-sm rounded-3xl p-6 hover:bg-white/60 transition-all duration-300">
                <div className="mb-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-base font-light text-rose-900">
                        Table {order.table?.name}
                      </h3>
                      <p className="text-xs text-rose-500 font-light">
                        Order #{order.id.slice(-6)}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-light ${
                      order.status === 'PENDING' ? 'bg-orange-200/50 text-orange-800' :
                      order.status === 'PREPARING' ? 'bg-blue-200/50 text-blue-800' :
                      order.status === 'READY' ? 'bg-green-200/50 text-green-800' :
                      'bg-rose-200/50 text-rose-800'
                    }`}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(order.status)}
                        {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-rose-500 mb-4 font-light">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {getOrderAge(order.created_at)}
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-rose-200/50 rounded-full flex items-center justify-center text-xs font-light text-rose-900">{item.quantity}</span>
                            <span className="text-sm font-light text-rose-900">{item.menu_item.name}</span>
                          </div>
                          {item.special_instructions && (
                            <p className="text-xs text-red-600 mt-1 font-light">
                              Note: {item.special_instructions}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {order.special_instructions && (
                    <div className="mb-6 p-3 bg-yellow-200/20 backdrop-blur-sm rounded-2xl">
                      <p className="text-xs text-yellow-800 font-light">
                        <strong>Special Instructions:</strong> {order.special_instructions}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="space-y-3">
                  {order.status === 'PENDING' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                      disabled={updatingOrder === order.id}
                      className="w-full bg-blue-200/50 text-blue-800 px-6 py-4 rounded-full text-sm font-light hover:bg-blue-300/50 transition-all duration-300 disabled:opacity-50 border-0"
                    >
                      <ChefHat className="h-4 w-4 mr-2 inline" />
                      {updatingOrder === order.id ? 'Starting...' : 'Start Preparing'}
                    </button>
                  )}
                  
                  {order.status === 'PREPARING' && (
                    <div className="space-y-3">
                      <button
                        onClick={() => updateOrderStatus(order.id, 'READY')}
                        disabled={updatingOrder === order.id}
                        className="w-full bg-green-200/50 text-green-800 px-6 py-4 rounded-full text-sm font-light hover:bg-green-300/50 transition-all duration-300 disabled:opacity-50 border-0"
                      >
                        <CheckCircle className="h-4 w-4 mr-2 inline" />
                        {updatingOrder === order.id ? 'Marking...' : 'Mark Ready'}
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'PENDING')}
                        disabled={updatingOrder === order.id}
                        className="w-full bg-rose-200/50 text-rose-800 px-6 py-3 rounded-full text-xs font-light hover:bg-rose-300/50 transition-all duration-300 disabled:opacity-50 border-0"
                      >
                        Back to Pending
                      </button>
                    </div>
                  )}
                  
                  {order.status === 'READY' && (
                    <div className="space-y-3">
                      <button
                        onClick={() => updateOrderStatus(order.id, 'COMPLETED')}
                        disabled={updatingOrder === order.id}
                        className="w-full bg-green-200/50 text-green-800 px-6 py-4 rounded-full text-sm font-light hover:bg-green-300/50 transition-all duration-300 disabled:opacity-50 border-0"
                      >
                        <CheckCircle className="h-4 w-4 mr-2 inline" />
                        {updatingOrder === order.id ? 'Completing...' : 'Complete Order'}
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                        disabled={updatingOrder === order.id}
                        className="w-full bg-rose-200/50 text-rose-800 px-6 py-3 rounded-full text-xs font-light hover:bg-rose-300/50 transition-all duration-300 disabled:opacity-50 border-0"
                      >
                        Back to Preparing
                      </button>
                    </div>
                  )}
                  
                  {/* Emergency cancel button */}
                  <button
                    onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
                    disabled={updatingOrder === order.id}
                    className="w-full bg-red-200/30 text-red-700 px-6 py-2 rounded-full text-xs font-light hover:bg-red-300/30 transition-all duration-300 disabled:opacity-50 border-0"
                  >
                    <XCircle className="h-3 w-3 mr-1 inline" />
                    Cancel Order
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}