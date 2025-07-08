'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { createClient } from '@/lib/supabase';
import { signOut } from '@/lib/auth';
import { OrderWithItems, Table } from '@/lib/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import Grid from '@/components/ui/Grid';
import Badge from '@/components/ui/Badge';
import { LoadingScreen } from '@/components/ui/LoadingSpinner';
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
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [newOrderTable, setNewOrderTable] = useState<string>('');
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [orderItems, setOrderItems] = useState<{id: string, quantity: number, special_instructions: string}[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  
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
            { id: 'demo-table-1', name: 'Table 1', restaurant_id: restaurant.id, active: true, token: 'demo-token-1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
            { id: 'demo-table-2', name: 'Table 2', restaurant_id: restaurant.id, active: true, token: 'demo-token-2', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
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
      
      // Fetch menu items and categories for order placement
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('sort_order');
      
      const { data: menuItemsData, error: menuItemsError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('available', true)
        .order('name');
      
      if (!categoriesError) setCategories(categoriesData || []);
      if (!menuItemsError) setMenuItems(menuItemsData || []);
      
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

  const addItemToOrder = (menuItem: any) => {
    const existingItem = orderItems.find(item => item.id === menuItem.id);
    if (existingItem) {
      setOrderItems(prev => 
        prev.map(item => 
          item.id === menuItem.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setOrderItems(prev => [...prev, { 
        id: menuItem.id, 
        quantity: 1, 
        special_instructions: '' 
      }]);
    }
  };

  const removeItemFromOrder = (menuItemId: string) => {
    const existingItem = orderItems.find(item => item.id === menuItemId);
    if (existingItem && existingItem.quantity > 1) {
      setOrderItems(prev => 
        prev.map(item => 
          item.id === menuItemId 
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
      );
    } else {
      setOrderItems(prev => prev.filter(item => item.id !== menuItemId));
    }
  };

  const updateItemInstructions = (menuItemId: string, instructions: string) => {
    setOrderItems(prev => 
      prev.map(item => 
        item.id === menuItemId 
          ? { ...item, special_instructions: instructions }
          : item
      )
    );
  };

  const getOrderTotal = () => {
    return orderItems.reduce((total, orderItem) => {
      const menuItem = menuItems.find(item => item.id === orderItem.id);
      return total + (menuItem ? menuItem.price * orderItem.quantity : 0);
    }, 0);
  };

  const createOrder = async () => {
    if (!restaurant || !newOrderTable || orderItems.length === 0) return;
    
    try {
      const customerSession = `waitstaff_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const total = getOrderTotal();
      
      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          restaurant_id: restaurant.id,
          table_id: newOrderTable,
          customer_session: customerSession,
          status: 'PENDING',
          total: total,
          special_instructions: specialInstructions || null,
        })
        .select()
        .single();
      
      if (orderError) throw orderError;
      
      // Create order items
      const orderItemsData = orderItems.map(item => {
        const menuItem = menuItems.find(mi => mi.id === item.id);
        return {
          order_id: orderData.id,
          menu_item_id: item.id,
          quantity: item.quantity,
          price: menuItem.price,
          special_instructions: item.special_instructions || null,
        };
      });
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData);
      
      if (itemsError) throw itemsError;
      
      // Reset form
      setOrderItems([]);
      setNewOrderTable('');
      setSpecialInstructions('');
      setShowNewOrder(false);
      
      // Refresh data
      fetchData();
      
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order. Please try again.');
    }
  };

  const filteredMenuItems = menuItems.filter(item => 
    selectedCategory === 'all' || item.category_id === selectedCategory
  );

  if (loading) {
    return <LoadingScreen message="Loading wait staff interface..." />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border">
        <Container>
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center shadow-medium">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-medium text-foreground">Wait Staff</h1>
                <p className="text-sm text-muted">{restaurant?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">
                {orders.length} active orders
              </Badge>
              <Button size="sm" onClick={() => setShowNewOrder(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Order
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </Container>
      </header>

      <Container className="py-8">
        {showNewOrder ? (
          // Create New Order View
          <div>
            <div className="mb-8">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowNewOrder(false);
                  setOrderItems([]);
                  setNewOrderTable('');
                  setSpecialInstructions('');
                  setSelectedCategory('all');
                }}
                className="mb-4"
              >
                ← Back to Tables
              </Button>
              <h2 className="text-2xl font-medium text-foreground mb-2">Create New Order</h2>
              <p className="text-muted">Select a table and add items to create an order</p>
            </div>
            
            {/* Table Selection */}
            <Card className="mb-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Select Table
                </label>
                <select
                  value={newOrderTable}
                  onChange={(e) => setNewOrderTable(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                  required
                >
                  <option value="">Select a table</option>
                  {tables.map((table) => (
                    <option key={table.id} value={table.id}>
                      {table.name}
                    </option>
                  ))}
                </select>
              </div>
            </Card>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Menu Items */}
              <div className="lg:col-span-2">
                <Card>
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-foreground mb-4">Menu Categories</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                          selectedCategory === 'all'
                            ? 'bg-accent text-white'
                            : 'bg-surface text-foreground hover:bg-surface/80'
                        }`}
                      >
                        All Items
                      </button>
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                            selectedCategory === category.id
                              ? 'bg-accent text-white'
                              : 'bg-surface text-foreground hover:bg-surface/80'
                          }`}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {filteredMenuItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-4 bg-surface rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{item.name}</h4>
                          {item.description && (
                            <p className="text-sm text-muted mt-1">{item.description}</p>
                          )}
                          <p className="text-sm font-medium text-foreground mt-2">${item.price.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {orderItems.find(oi => oi.id === item.id) ? (
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeItemFromOrder(item.id)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center font-medium text-foreground">
                                {orderItems.find(oi => oi.id === item.id)?.quantity || 0}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => addItemToOrder(item)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => addItemToOrder(item)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
              
              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card>
                  <h3 className="text-lg font-medium text-foreground mb-4">Order Summary</h3>
                  
                  {orderItems.length === 0 ? (
                    <p className="text-muted text-center py-8">No items added yet</p>
                  ) : (
                    <div className="space-y-4">
                      {orderItems.map((orderItem) => {
                        const menuItem = menuItems.find(item => item.id === orderItem.id);
                        if (!menuItem) return null;
                        
                        return (
                          <div key={orderItem.id} className="bg-surface rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <h4 className="font-medium text-foreground">{menuItem.name}</h4>
                                <p className="text-sm text-muted">${menuItem.price.toFixed(2)} each</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeItemFromOrder(orderItem.id)}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-8 text-center font-medium text-foreground">
                                  {orderItem.quantity}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => addItemToOrder(menuItem)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="mt-3">
                              <label className="block text-xs font-medium text-foreground mb-1">
                                Special Instructions
                              </label>
                              <input
                                type="text"
                                value={orderItem.special_instructions || ''}
                                onChange={(e) => updateItemInstructions(orderItem.id, e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                                placeholder="Add special instructions..."
                              />
                            </div>
                            
                            <div className="mt-2 text-right">
                              <span className="text-sm font-medium text-foreground">
                                ${(menuItem.price * orderItem.quantity).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  <div className="mt-6 pt-4 border-t border-border">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-medium text-foreground">Total:</span>
                      <span className="text-lg font-bold text-foreground">${getOrderTotal().toFixed(2)}</span>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Order Notes
                      </label>
                      <textarea
                        value={specialInstructions}
                        onChange={(e) => setSpecialInstructions(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                        rows={3}
                        placeholder="Add any special instructions for the entire order..."
                      />
                    </div>
                    
                    <Button
                      onClick={createOrder}
                      disabled={!newOrderTable || orderItems.length === 0}
                      fullWidth
                      className="mb-3"
                    >
                      Create Order
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowNewOrder(false);
                        setOrderItems([]);
                        setNewOrderTable('');
                        setSpecialInstructions('');
                        setSelectedCategory('all');
                      }}
                      fullWidth
                    >
                      Cancel
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        ) : !showOrderDetails ? (
          // Table Grid View
          <div>
            <motion.div 
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-2xl font-medium text-foreground mb-2">Table Overview</h2>
              <p className="text-muted">Click on a table to view orders and manage service</p>
            </motion.div>
            
            <Grid cols={6} gap="md" responsive={true}>
              {tables.map((table, index) => {
                const tableStatus = getTableStatus(table);
                
                return (
                  <motion.div
                    key={table.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card
                      className={`cursor-pointer transition-all hover:shadow-large ${
                        tableStatus.status !== 'empty' ? 'ring-2 ring-accent' : ''
                      }`}
                      onClick={() => viewTableOrders(table)}
                    >
                      <div className="text-center">
                        <div className={`w-12 h-12 mx-auto mb-3 rounded-lg flex items-center justify-center ${
                          tableStatus.status === 'ready' ? 'bg-success text-white' :
                          tableStatus.status === 'preparing' ? 'bg-accent text-white' :
                          tableStatus.status === 'pending' ? 'bg-warning text-white' :
                          'bg-surface text-muted'
                        }`}>
                          {getTableIcon(tableStatus.status)}
                        </div>
                        <h3 className="font-medium text-foreground mb-1">{table.name}</h3>
                        <div className="text-sm text-muted mb-2">
                          {tableStatus.count > 0 ? `${tableStatus.count} orders` : 'Available'}
                        </div>
                        {tableStatus.status !== 'empty' && (
                          <Badge 
                            variant={
                              tableStatus.status === 'ready' ? 'success' :
                              tableStatus.status === 'preparing' ? 'default' :
                              tableStatus.status === 'pending' ? 'warning' :
                              'secondary'
                            }
                            size="sm"
                          >
                            {tableStatus.status.charAt(0).toUpperCase() + tableStatus.status.slice(1)}
                          </Badge>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </Grid>
            
            {/* Recent Orders Summary */}
            <motion.div 
              className="mt-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h2 className="text-xl font-medium text-foreground mb-6">Recent Orders</h2>
              <div className="space-y-4">
                {orders.slice(0, 5).map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className="cursor-pointer hover:shadow-medium transition-all" onClick={() => viewOrderDetails(order)}>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            order.status === 'READY' ? 'bg-success text-white' :
                            order.status === 'PREPARING' ? 'bg-accent text-white' :
                            'bg-warning text-white'
                          }`}>
                            {order.status === 'READY' ? <Bell className="h-5 w-5" /> :
                             order.status === 'PREPARING' ? <ChefHat className="h-5 w-5" /> :
                             <Clock className="h-5 w-5" />}
                          </div>
                          <div>
                            <div className="font-medium text-foreground">
                              Table {order.table?.name}
                            </div>
                            <div className="text-sm text-muted">
                              {order.items.length} items • {getOrderAge(order.created_at)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-foreground">
                            ${calculateOrderTotal(order).toFixed(2)}
                          </div>
                          <div className="text-sm text-muted">
                            #{order.id.slice(-6)}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          // Table Orders Detail View
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-medium text-foreground">
                    Table {selectedTable?.name} Orders
                  </h2>
                  <p className="text-muted">Manage orders for this table</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowOrderDetails(false)}
                >
                  Back to Tables
                </Button>
              </div>
            </div>
            
            <div className="space-y-6">
              {orders
                .filter(order => order.table_id === selectedTable?.id)
                .map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-medium text-foreground">
                            Order #{order.id.slice(-6)}
                          </h3>
                          <p className="text-sm text-muted">
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
                            <span className="w-8 h-8 bg-surface rounded-full flex items-center justify-center text-sm font-medium text-foreground">
                              {item.quantity}
                            </span>
                            <div>
                              <div className="font-medium text-foreground">{item.menu_item.name}</div>
                              {item.special_instructions && (
                                <div className="text-xs text-error mt-1">
                                  Note: {item.special_instructions}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="font-medium text-foreground">
                            ${(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {order.special_instructions && (
                      <div className="mb-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                        <p className="text-sm text-warning-foreground">
                          <strong>Special Instructions:</strong> {order.special_instructions}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center pt-4 border-t border-border">
                      <div className="font-bold text-lg text-foreground">
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
                  </motion.div>
                ))}
            </div>
          </motion.div>
        )}
      </Container>

      {/* Order Edit Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-large">
            <div className="p-6 border-b border-border">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-medium text-foreground">
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
                  <div key={item.id} className="border border-border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground">{item.menu_item.name}</h3>
                        <p className="text-sm text-muted">${item.price.toFixed(2)} each</p>
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
                      <label className="block text-sm font-medium text-foreground mb-1">
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
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                        placeholder="Add special instructions..."
                      />
                    </div>
                    
                    <div className="mt-2 text-right">
                      <span className="font-medium text-foreground">
                        Subtotal: ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-6 border-t border-border">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-medium text-foreground">
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