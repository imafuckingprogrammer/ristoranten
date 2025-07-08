'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { createClient } from '@/lib/supabase';
import { signOut } from '@/lib/auth';
import { OrderWithItems, OrderStatus } from '@/lib/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import Grid from '@/components/ui/Grid';
import Badge from '@/components/ui/Badge';
import { LoadingScreen } from '@/components/ui/LoadingSpinner';
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
    return <LoadingScreen message="Loading kitchen orders..." />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border">
        <Container>
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center shadow-medium">
                <ChefHat className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-medium text-foreground">Kitchen</h1>
                <p className="text-sm text-muted">{restaurant?.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">
                {orders.length} active orders
              </Badge>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </Container>
      </header>

      <Container className="py-8">
        {orders.length === 0 ? (
          <motion.div 
            className="text-center py-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <ChefHat className="h-16 w-16 text-muted mx-auto mb-6" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Active Orders</h3>
            <p className="text-muted">All caught up! New orders will appear here.</p>
          </motion.div>
        ) : (
          <Grid cols={3} gap="lg">
            {orders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="h-full">
                  <div className="mb-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-foreground">
                          Table {order.table?.name}
                        </h3>
                        <p className="text-sm text-muted">
                          Order #{order.id.slice(-6)}
                        </p>
                      </div>
                      <Badge 
                        variant={
                          order.status === 'PENDING' ? 'warning' :
                          order.status === 'PREPARING' ? 'default' :
                          order.status === 'READY' ? 'success' :
                          'secondary'
                        }
                      >
                        <div className="flex items-center gap-1">
                          {getStatusIcon(order.status)}
                          {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                        </div>
                      </Badge>
                    </div>
                    
                    <div className="flex items-center text-sm text-muted mb-4">
                      <Clock className="h-4 w-4 mr-2" />
                      {getOrderAge(order.created_at)}
                    </div>
                  
                    <div className="space-y-3 mb-6">
                      {order.items.map((item) => (
                        <div key={item.id} className="p-3 bg-surface rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" size="sm">
                              {item.quantity}
                            </Badge>
                            <span className="text-sm font-medium text-foreground">{item.menu_item.name}</span>
                          </div>
                          {item.special_instructions && (
                            <p className="text-sm text-error mt-2">
                              Note: {item.special_instructions}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {order.special_instructions && (
                      <div className="mb-6 p-4 bg-warning/10 border border-warning/20 rounded-lg">
                        <p className="text-sm text-warning-foreground">
                          <strong>Special Instructions:</strong> {order.special_instructions}
                        </p>
                      </div>
                    )}
                  </div>
                
                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {order.status === 'PENDING' && (
                      <Button
                        fullWidth
                        onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                        loading={updatingOrder === order.id}
                        disabled={updatingOrder === order.id}
                      >
                        <ChefHat className="h-4 w-4 mr-2" />
                        {updatingOrder === order.id ? 'Starting...' : 'Start Preparing'}
                      </Button>
                    )}
                    
                    {order.status === 'PREPARING' && (
                      <div className="space-y-3">
                        <Button
                          fullWidth
                          variant="success"
                          onClick={() => updateOrderStatus(order.id, 'READY')}
                          loading={updatingOrder === order.id}
                          disabled={updatingOrder === order.id}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {updatingOrder === order.id ? 'Marking...' : 'Mark Ready'}
                        </Button>
                        <Button
                          fullWidth
                          variant="secondary"
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, 'PENDING')}
                          disabled={updatingOrder === order.id}
                        >
                          Back to Pending
                        </Button>
                      </div>
                    )}
                    
                    {order.status === 'READY' && (
                      <div className="space-y-3">
                        <Button
                          fullWidth
                          variant="success"
                          onClick={() => updateOrderStatus(order.id, 'COMPLETED')}
                          loading={updatingOrder === order.id}
                          disabled={updatingOrder === order.id}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {updatingOrder === order.id ? 'Completing...' : 'Complete Order'}
                        </Button>
                        <Button
                          fullWidth
                          variant="secondary"
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                          disabled={updatingOrder === order.id}
                        >
                          Back to Preparing
                        </Button>
                      </div>
                    )}
                    
                    {/* Emergency cancel button */}
                    <Button
                      fullWidth
                      variant="danger"
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
                      disabled={updatingOrder === order.id}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Order
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </Grid>
        )}
      </Container>
    </div>
  );
}