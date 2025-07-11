'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { createClient } from '@/lib/supabase';
import { signOut, checkUserPermission } from '@/lib/auth';
import { OrderWithItems, OrderStatus } from '@/lib/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import Grid from '@/components/ui/Grid';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import { LoadingScreen } from '@/components/ui/LoadingSpinner';
import { 
  Wine, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Users,
  LogOut,
  Filter,
  Star,
  Timer,
  Plus,
  Minus,
  X,
  Save
} from 'lucide-react';

interface DrinkTab {
  tableId: string;
  tableName: string;
  orders: OrderWithItems[];
  totalAmount: number;
  startTime: string;
}

export default function BartenderPage() {
  const { user, restaurant, isAuthenticated } = useAppStore();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [tabs, setTabs] = useState<DrinkTab[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'preparing' | 'ready'>('all');
  const [showCreateTab, setShowCreateTab] = useState(false);
  const [newTabCustomer, setNewTabCustomer] = useState('');
  const [selectedDrinks, setSelectedDrinks] = useState<{ id: string; quantity: number; price: number }[]>([]);
  const [availableDrinks, setAvailableDrinks] = useState<any[]>([]);
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }
    
    // Check if user has permission to access bartender interface
    if (!checkUserPermission(user.role, 'BARTENDER')) {
      router.push('/login');
      return;
    }
    
    fetchOrders();
    fetchAvailableDrinks();
    setupRealtimeSubscription();
  }, [isAuthenticated, user, router]);

  const fetchOrders = async () => {
    if (!restaurant) return;
    
    try {
      setLoading(true);
      
      // Fetch orders with drink items (filtering by category or specific drink items)
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          table:tables(*),
          items:order_items(
            *,
            menu_item:menu_items(
              *,
              category:categories(name)
            )
          )
        `)
        .eq('restaurant_id', restaurant.id)
        .in('status', ['PENDING', 'PREPARING', 'READY'])
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Filter orders that contain drink items from drink categories
      const drinkOrders = (data || []).filter((order: any) => 
        order.items.some((item: any) => {
          // Check if the menu item belongs to a drink category
          const categoryName = item.menu_item.category?.name?.toLowerCase() || '';
          return categoryName === 'bardrinksonly' || 
                 categoryName.includes('drink') || 
                 categoryName.includes('beverage') || 
                 categoryName.includes('bar');
        })
      );
      
      setOrders(drinkOrders);
      organizeTabs(drinkOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const organizeTabs = (orders: OrderWithItems[]) => {
    const tabsMap = new Map<string, DrinkTab>();
    
    orders.forEach(order => {
      // Use table_id if available, otherwise use customer_session for bar tabs
      const tableId = order.table_id || order.customer_session;
      const tableName = order.table?.name || (order.special_instructions?.includes('Bar tab for') ? 
        order.special_instructions.replace('Bar tab for ', '') : 'Bar Tab');
      
      if (!tabsMap.has(tableId)) {
        tabsMap.set(tableId, {
          tableId,
          tableName,
          orders: [],
          totalAmount: 0,
          startTime: order.created_at,
        });
      }
      
      const tab = tabsMap.get(tableId)!;
      tab.orders.push(order);
      tab.totalAmount += order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Update start time if this order is older
      if (order.created_at < tab.startTime) {
        tab.startTime = order.created_at;
      }
    });
    
    setTabs(Array.from(tabsMap.values()));
  };

  const setupRealtimeSubscription = () => {
    if (!restaurant) return;
    
    const channel = supabase
      .channel('bartender-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurant.id}`,
        },
        () => fetchOrders()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items',
        },
        () => fetchOrders()
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
      
      // Refresh data
      fetchOrders();
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

  const getOrderAge = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes === 1) return '1 min ago';
    return `${diffInMinutes} mins ago`;
  };

  const getTabDuration = (startTime: string) => {
    const now = new Date();
    const start = new Date(startTime);
    const diffInMinutes = Math.floor((now.getTime() - start.getTime()) / 60000);
    
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const getDrinkItems = (order: OrderWithItems) => {
    return order.items.filter((item: any) => {
      const categoryName = item.menu_item.category?.name?.toLowerCase() || '';
      return categoryName === 'bardrinksonly' || 
             categoryName.includes('drink') || 
             categoryName.includes('beverage') || 
             categoryName.includes('bar');
    });
  };

  const fetchAvailableDrinks = async () => {
    if (!restaurant) return;
    
    try {
      // First get drink categories (bardrinksonly or drinks)
      const { data: categories, error: categoryError } = await supabase
        .from('categories')
        .select('id, name')
        .eq('restaurant_id', restaurant.id)
        .or('name.eq.bardrinksonly,name.ilike.%drink%,name.ilike.%beverage%,name.ilike.%bar%');
      
      if (categoryError) {
        console.error('Error fetching categories:', categoryError);
        setAvailableDrinks([]);
        return;
      }
      
      // If no drink categories found, set empty array
      if (!categories || categories.length === 0) {
        console.log('No drink categories found');
        setAvailableDrinks([]);
        return;
      }
      
      // Get category IDs for drink categories
      const categoryIds = categories.map(cat => cat.id);
      
      // Then get menu items from those categories
      const { data: menuItems, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .in('category_id', categoryIds)
        .eq('available', true);
      
      if (error) {
        console.error('Error fetching menu items:', error);
        setAvailableDrinks([]);
        return;
      }
      
      setAvailableDrinks(menuItems || []);
    } catch (error) {
      console.error('Error fetching drinks:', error);
      setAvailableDrinks([]);
    }
  };

  const createManualTab = async () => {
    if (!restaurant || !newTabCustomer.trim() || selectedDrinks.length === 0) return;
    
    try {
      setLoading(true);
      
      // Generate a unique customer session for this tab
      const customerSession = `bar_tab_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      
      // Calculate total
      const total = selectedDrinks.reduce((sum, drink) => sum + (drink.price * drink.quantity), 0);
      
      // Create the order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          restaurant_id: restaurant.id,
          table_id: null, // No table for bar orders
          customer_session: customerSession,
          status: 'PENDING',
          total: total,
          special_instructions: `Bar tab for ${newTabCustomer}`,
        })
        .select()
        .single();
      
      if (orderError) throw orderError;
      
      // Create order items
      const orderItems = selectedDrinks.map(drink => ({
        order_id: orderData.id,
        menu_item_id: drink.id,
        quantity: drink.quantity,
        price: drink.price,
        special_instructions: null,
      }));
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) throw itemsError;
      
      // Reset form
      setNewTabCustomer('');
      setSelectedDrinks([]);
      setShowCreateTab(false);
      
      // Refresh orders
      fetchOrders();
      
    } catch (error: any) {
      console.error('Error creating manual tab:', error);
      alert('Failed to create tab. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addDrinkToTab = (drink: any) => {
    const existingDrink = selectedDrinks.find(d => d.id === drink.id);
    if (existingDrink) {
      setSelectedDrinks(prev => 
        prev.map(d => d.id === drink.id ? { ...d, quantity: d.quantity + 1 } : d)
      );
    } else {
      setSelectedDrinks(prev => [...prev, { id: drink.id, quantity: 1, price: drink.price }]);
    }
  };

  const removeDrinkFromTab = (drinkId: string) => {
    setSelectedDrinks(prev => {
      const drink = prev.find(d => d.id === drinkId);
      if (drink && drink.quantity > 1) {
        return prev.map(d => d.id === drinkId ? { ...d, quantity: d.quantity - 1 } : d);
      } else {
        return prev.filter(d => d.id !== drinkId);
      }
    });
  };

  const getTabTotal = () => {
    return selectedDrinks.reduce((sum, drink) => sum + (drink.price * drink.quantity), 0);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const filteredOrders = orders.filter(order => {
    if (filterStatus === 'all') return true;
    return order.status.toLowerCase() === filterStatus;
  });

  if (loading) {
    return <LoadingScreen message="Loading bar interface..." />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border">
        <Container>
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center shadow-medium">
                <Wine className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-medium text-foreground">Bar</h1>
                <p className="text-sm text-muted">{restaurant?.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">
                {tabs.length} tabs
              </Badge>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 border border-border rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent transition-all duration-200 bg-white text-foreground shadow-soft hover:shadow-medium"
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
              </select>
              <Button
                size="sm"
                onClick={() => setShowCreateTab(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Tab
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </Container>
      </header>

      <Container className="py-8">
        <Grid cols={4} gap="lg">
          {/* Tabs Sidebar */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card>
              <h2 className="text-lg font-medium text-foreground mb-6">Active Tabs</h2>
              <div className="space-y-3">
                {tabs.map((tab) => (
                  <div
                    key={tab.tableId}
                    className={`p-4 rounded-lg cursor-pointer transition-all duration-300 ${
                      selectedTab === tab.tableId
                        ? 'bg-accent text-white'
                        : 'bg-surface hover:bg-surface/80'
                    }`}
                    onClick={() => setSelectedTab(tab.tableId)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-medium">
                          {tab.tableName.includes('Bar Tab') ? tab.tableName : `Table ${tab.tableName}`}
                        </h3>
                        <p className="text-xs opacity-75">{tab.orders.length} orders</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">${tab.totalAmount.toFixed(2)}</p>
                        <p className="text-xs opacity-75">{getTabDuration(tab.startTime)}</p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {tabs.length === 0 && (
                  <div className="text-center py-12">
                    <Wine className="h-12 w-12 text-muted mx-auto mb-4" />
                    <p className="text-xs text-muted font-light">No active tabs</p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Orders List */}
          <div className="lg:col-span-3">
            <Card>
              <h2 className="text-lg font-medium text-foreground mb-6">
                {selectedTab ? (() => {
                  const tab = tabs.find(t => t.tableId === selectedTab);
                  return tab?.tableName.includes('Bar Tab') ? 
                    `${tab.tableName} Orders` : 
                    `Table ${tab?.tableName} Orders`;
                })() : 'All Drink Orders'}
              </h2>
              
              <div className="space-y-3">
                {filteredOrders
                  .filter(order => selectedTab ? (order.table_id === selectedTab || order.customer_session === selectedTab) : true)
                  .map((order) => {
                    const drinkItems = getDrinkItems(order);
                    
                    if (drinkItems.length === 0) return null;
                    
                    return (
                      <Card key={order.id} className="hover:shadow-medium transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-sm font-medium text-foreground">
                              {order.table?.name ? `Table ${order.table.name}` : 
                                (order.special_instructions?.includes('Bar tab for') ? 
                                  order.special_instructions.replace('Bar tab for ', '') : 'Bar Tab')} - #{order.id.slice(-6)}
                            </h3>
                            <p className="text-xs text-muted">{getOrderAge(order.created_at)}</p>
                          </div>
                          <Badge variant={
                            order.status === 'PENDING' ? 'warning' :
                            order.status === 'PREPARING' ? 'default' :
                            order.status === 'READY' ? 'success' :
                            'secondary'
                          }>
                            {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                          </Badge>
                        </div>
                        
                        <div className="space-y-3 mb-6">
                          {drinkItems.map((item) => (
                            <div key={item.id} className="flex justify-between items-center p-3 bg-surface rounded-lg">
                              <div className="flex items-center space-x-3">
                                <Badge variant="secondary" size="sm">
                                  {item.quantity}
                                </Badge>
                                <div>
                                  <div className="text-sm font-medium text-foreground">{item.menu_item.name}</div>
                                  {item.special_instructions && (
                                    <div className="text-xs text-error mt-1">
                                      Note: {item.special_instructions}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-sm font-medium text-foreground">
                                ${(item.price * item.quantity).toFixed(2)}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex justify-end space-x-3">
                          {order.status === 'PENDING' && (
                            <Button
                              onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                              loading={updatingOrder === order.id}
                              disabled={updatingOrder === order.id}
                              size="sm"
                            >
                              Start Preparing
                            </Button>
                          )}
                          
                          {order.status === 'PREPARING' && (
                            <div className="flex space-x-3">
                              <Button
                                onClick={() => updateOrderStatus(order.id, 'READY')}
                                loading={updatingOrder === order.id}
                                disabled={updatingOrder === order.id}
                                variant="success"
                                size="sm"
                              >
                                Mark Ready
                              </Button>
                              <Button
                                onClick={() => updateOrderStatus(order.id, 'PENDING')}
                                disabled={updatingOrder === order.id}
                                variant="secondary"
                                size="sm"
                              >
                                Back
                              </Button>
                            </div>
                          )}
                          
                          {order.status === 'READY' && (
                            <div className="flex space-x-3">
                              <Button
                                onClick={() => updateOrderStatus(order.id, 'COMPLETED')}
                                loading={updatingOrder === order.id}
                                disabled={updatingOrder === order.id}
                                variant="success"
                                size="sm"
                              >
                                Complete
                              </Button>
                              <Button
                                onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                                disabled={updatingOrder === order.id}
                                variant="secondary"
                                size="sm"
                              >
                                Back
                              </Button>
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                
                {filteredOrders.filter(order => selectedTab ? (order.table_id === selectedTab || order.customer_session === selectedTab) : true).length === 0 && (
                  <div className="text-center py-16">
                    <Wine className="h-12 w-12 text-muted mx-auto mb-6" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No Drink Orders</h3>
                    <p className="text-muted">All caught up! New drink orders will appear here.</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </Grid>
      </Container>

      {/* Create New Tab Modal */}
      {showCreateTab && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl max-h-[90vh] overflow-hidden shadow-large">
            <div className="p-6 border-b border-border">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-foreground">Create New Tab</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateTab(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto">
              {/* Customer Name */}
              <div className="mb-6">
                <Input
                  label="Customer Name"
                  value={newTabCustomer}
                  onChange={(e) => setNewTabCustomer(e.target.value)}
                  placeholder="Enter customer name..."
                  fullWidth
                />
              </div>

              {/* Available Drinks */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-foreground mb-3">Available Drinks</h3>
                <div className="space-y-3 max-h-40 overflow-y-auto">
                  {availableDrinks.map((drink) => (
                    <div key={drink.id} className="flex justify-between items-center p-3 bg-surface rounded-lg">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground">{drink.name}</div>
                        <div className="text-xs text-muted">${drink.price.toFixed(2)}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => addDrinkToTab(drink)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Drinks */}
              {selectedDrinks.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-foreground mb-3">Selected Drinks</h3>
                  <div className="space-y-3">
                    {selectedDrinks.map((drink) => {
                      const drinkData = availableDrinks.find(d => d.id === drink.id);
                      return (
                        <div key={drink.id} className="flex justify-between items-center p-3 bg-surface rounded-lg">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-foreground">{drinkData?.name}</div>
                            <div className="text-xs text-muted">${drink.price.toFixed(2)} × {drink.quantity}</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeDrinkFromTab(drink.id)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-6 text-center text-sm font-medium text-foreground">{drink.quantity}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => addDrinkToTab(drinkData)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-border">
              <div className="flex justify-between items-center mb-6">
                <span className="text-sm font-medium text-foreground">Total:</span>
                <span className="text-sm font-medium text-foreground">${getTabTotal().toFixed(2)}</span>
              </div>
              <div className="space-y-3">
                <Button
                  onClick={createManualTab}
                  disabled={!newTabCustomer.trim() || selectedDrinks.length === 0 || loading}
                  loading={loading}
                  fullWidth
                >
                  {loading ? 'Creating...' : 'Create Tab'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setNewTabCustomer('');
                    setSelectedDrinks([]);
                    setShowCreateTab(false);
                  }}
                  fullWidth
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}