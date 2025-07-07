'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { createClient } from '@/lib/supabase';
import { signOut } from '@/lib/auth';
import { OrderWithItems, Table } from '@/lib/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { 
  Clock, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  ChefHat,
  LogOut,
  Eye,
  Edit,
  Bell,
  X,
  Plus,
  Minus,
  DollarSign
} from 'lucide-react';

export default function WaitStaffPage() {
  const { user, restaurant, isAuthenticated } = useAppStore();
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'WAITSTAFF') {
      router.push('/login');
      return;
    }
    
    fetchData();
    setupRealtimeSubscription();
  }, [isAuthenticated, user, router]);

  const fetchData = async () => {
    if (!restaurant) return;
    
    try {
      setLoading(true);
      
      // Fetch tables (with error handling for demo restaurants)
      const { data: tablesData, error: tablesError } = await supabase
        .from('tables')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('active', true)
        .order('name');
      
      if (tablesError) {
        console.error('Error fetching tables:', tablesError);
        // For demo restaurants, create mock tables if none exist
        if (restaurant.id === 'demo-restaurant-id') {
          setTables([
            { id: 'demo-table-1', name: 'Table 1', restaurant_id: restaurant.id, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
            { id: 'demo-table-2', name: 'Table 2', restaurant_id: restaurant.id, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
          ]);
        }
      } else {
        setTables(tablesData || []);
      }
      
      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
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
        .order('created_at', { ascending: false });
      
      if (ordersError) throw ordersError;
      
      setTables(tablesData || []);
      setOrders(ordersData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!restaurant) return;
    
    const channel = supabase
      .channel('waitstaff-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurant.id}`,
        },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items',
        },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getTableStatus = (table: Table) => {
    const tableOrders = orders.filter(order => order.table_id === table.id);
    
    if (tableOrders.length === 0) {
      return { status: 'empty', color: 'bg-white text-black', count: 0 };
    }
    
    const hasReady = tableOrders.some(order => order.status === 'READY');
    const hasPreparing = tableOrders.some(order => order.status === 'PREPARING');
    const hasPending = tableOrders.some(order => order.status === 'PENDING');
    
    if (hasReady) {
      return { status: 'ready', color: 'bg-green-100 text-green-800 border-green-200', count: tableOrders.length };
    } else if (hasPreparing) {
      return { status: 'preparing', color: 'bg-blue-100 text-blue-800 border-blue-200', count: tableOrders.length };
    } else if (hasPending) {
      return { status: 'pending', color: 'bg-orange-100 text-orange-800 border-orange-200', count: tableOrders.length };
    }
    
    return { status: 'empty', color: 'bg-white text-black', count: 0 };
  };

  const getTableIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <Bell className="h-5 w-5" />;
      case 'preparing':
        return <ChefHat className="h-5 w-5" />;
      case 'pending':
        return <Clock className="h-5 w-5" />;
      default:
        return <Users className="h-5 w-5" />;
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

  const cancelOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'CANCELLED' })
        .eq('id', orderId);
      
      if (error) throw error;
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order');
    }
  };

  const updateOrderItem = async (orderItemId: string, quantity: number, specialInstructions?: string) => {
    try {
      if (quantity <= 0) {
        // Remove item if quantity is 0
        const { error } = await supabase
          .from('order_items')
          .delete()
          .eq('id', orderItemId);
        
        if (error) throw error;
      } else {
        // Update item
        const { error } = await supabase
          .from('order_items')
          .update({ 
            quantity, 
            special_instructions: specialInstructions || null 
          })
          .eq('id', orderItemId);
        
        if (error) throw error;
      }
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Error updating order item:', error);
      alert('Failed to update order item');
    }
  };

  const viewTableOrders = (table: Table) => {
    setSelectedTable(table);
    setShowOrderDetails(true);
  };

  const viewOrderDetails = (order: OrderWithItems) => {
    setSelectedOrder(order);
  };

  const calculateOrderTotal = (order: OrderWithItems) => {
    return order.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black"></div>
          <p className="mt-4 text-black">Loading tables...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Users className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-black">Wait Staff</h1>
                <p className="text-sm text-black">{restaurant?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-black">
                {orders.length} active orders
              </div>
              <Button variant="ghost" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showOrderDetails ? (
          // Table Grid View
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-black mb-2">Table Overview</h2>
              <p className="text-black">Click on a table to view orders and manage service</p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {tables.map((table) => {
                const tableStatus = getTableStatus(table);
                
                return (
                  <Card
                    key={table.id}
                    className={`cursor-pointer transition-all hover:shadow-xl ${
                      tableStatus.status !== 'empty' ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                    }`}
                    onClick={() => viewTableOrders(table)}
                  >
                    <div className="text-center">
                      <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${tableStatus.color}`}>
                        {getTableIcon(tableStatus.status)}
                      </div>
                      <h3 className="font-semibold text-black mb-1">{table.name}</h3>
                      <div className="text-xs text-black">
                        {tableStatus.count > 0 ? `${tableStatus.count} orders` : 'Available'}
                      </div>
                      {tableStatus.status !== 'empty' && (
                        <div className={`mt-2 px-2 py-1 rounded-full text-xs font-medium ${tableStatus.color}`}>
                          {tableStatus.status.charAt(0).toUpperCase() + tableStatus.status.slice(1)}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
            
            {/* Recent Orders Summary */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-black mb-4">Recent Orders</h2>
              <div className="space-y-4">
                {orders.slice(0, 5).map((order) => (
                  <Card key={order.id} className="cursor-pointer hover:shadow-md" onClick={() => viewOrderDetails(order)}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          order.status === 'READY' ? 'bg-green-100 text-green-800' :
                          order.status === 'PREPARING' ? 'bg-blue-100 text-blue-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {order.status === 'READY' ? <Bell className="h-5 w-5" /> :
                           order.status === 'PREPARING' ? <ChefHat className="h-5 w-5" /> :
                           <Clock className="h-5 w-5" />}
                        </div>
                        <div>
                          <div className="font-semibold text-black">
                            Table {order.table?.name}
                          </div>
                          <div className="text-sm text-black">
                            {order.items.length} items • {getOrderAge(order.created_at)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-black">
                          ${calculateOrderTotal(order).toFixed(2)}
                        </div>
                        <div className="text-sm text-black">
                          #{order.id.slice(-6)}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Table Orders Detail View
          <div>
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-black">
                    Table {selectedTable?.name} Orders
                  </h2>
                  <p className="text-black">Manage orders for this table</p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setShowOrderDetails(false)}
                >
                  Back to Tables
                </Button>
              </div>
            </div>
            
            <div className="space-y-6">
              {orders
                .filter(order => order.table_id === selectedTable?.id)
                .map((order) => (
                  <Card key={order.id}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-black">
                          Order #{order.id.slice(-6)}
                        </h3>
                        <p className="text-sm text-black">
                          {getOrderAge(order.created_at)}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        order.status === 'READY' ? 'bg-green-100 text-green-800' :
                        order.status === 'PREPARING' ? 'bg-blue-100 text-blue-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center">
                          <div className="flex items-center space-x-3">
                            <span className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <div>
                              <div className="font-medium text-black">{item.menu_item.name}</div>
                              {item.special_instructions && (
                                <div className="text-xs text-red-600 mt-1">
                                  Note: {item.special_instructions}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="font-medium text-black">
                            ${(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {order.special_instructions && (
                      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-sm text-yellow-800">
                          <strong>Special Instructions:</strong> {order.special_instructions}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center pt-4 border-t">
                      <div className="font-bold text-lg">
                        Total: ${calculateOrderTotal(order).toFixed(2)}
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="danger"
                          onClick={() => {
                            if (confirm('Are you sure you want to cancel this order?')) {
                              cancelOrder(order.id);
                            }
                          }}
                          disabled={order.status === 'CANCELLED'}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Order Edit Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-black">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-black">
                  Edit Order #{selectedOrder.id.slice(-6)}
                </h2>
                <Button 
                  variant="ghost" 
                  onClick={() => setSelectedOrder(null)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="border border-black rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-black">{item.menu_item.name}</h3>
                        <p className="text-sm text-black">${item.price.toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateOrderItem(item.id, item.quantity - 1, item.special_instructions)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center font-bold">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateOrderItem(item.id, item.quantity + 1, item.special_instructions)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => {
                            if (confirm('Remove this item from the order?')) {
                              updateOrderItem(item.id, 0);
                            }
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-black mb-1">
                        Special Instructions
                      </label>
                      <input
                        type="text"
                        value={item.special_instructions || ''}
                        onChange={(e) => {
                          // Update immediately on blur or enter
                        }}
                        onBlur={(e) => {
                          if (e.target.value !== (item.special_instructions || '')) {
                            updateOrderItem(item.id, item.quantity, e.target.value);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            updateOrderItem(item.id, item.quantity, e.currentTarget.value);
                          }
                        }}
                        className="w-full px-3 py-2 border border-black rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                        placeholder="Add special instructions..."
                      />
                    </div>
                    
                    <div className="mt-2 text-right">
                      <span className="font-bold text-black">
                        Subtotal: ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-6 border-t border-black">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-bold text-black">
                  Order Total: ${calculateOrderTotal(selectedOrder).toFixed(2)}
                </span>
                <div className="flex space-x-3">
                  <Button 
                    variant="danger"
                    onClick={() => {
                      if (confirm('Cancel this entire order?')) {
                        cancelOrder(selectedOrder.id);
                        setSelectedOrder(null);
                      }
                    }}
                  >
                    Cancel Order
                  </Button>
                  <Button onClick={() => setSelectedOrder(null)}>
                    Done Editing
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}