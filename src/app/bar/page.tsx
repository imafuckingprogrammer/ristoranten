'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { createClient } from '@/lib/supabase';
import { signOut } from '@/lib/auth';
import { OrderWithItems, OrderStatus } from '@/lib/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
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
    if (!isAuthenticated || !user || user.role !== 'BARTENDER') {
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-rose-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-rose-300 mx-auto"></div>
          <p className="mt-3 text-xs text-rose-400">Loading...</p>
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
                <Wine className="h-5 w-5 text-rose-800" />
              </div>
              <div>
                <h1 className="text-lg font-light text-rose-900">Bar</h1>
                <p className="text-xs text-rose-500">{restaurant?.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-xs text-rose-600 font-light">
                {tabs.length} tabs
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="text-xs bg-white/50 backdrop-blur-sm border-0 rounded-full px-3 py-2 text-rose-900 focus:outline-none focus:bg-white/70 transition-all duration-300"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
              </select>
              <button
                onClick={() => setShowCreateTab(true)}
                className="bg-rose-300 text-rose-900 px-4 py-2 rounded-full text-xs font-light hover:bg-rose-400 transition-all duration-300 border-0"
              >
                + New Tab
              </button>
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Tabs Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-6">
              <h2 className="text-sm font-light text-rose-900 mb-6 tracking-wider uppercase">Active Tabs</h2>
              <div className="space-y-3">
                {tabs.map((tab) => (
                  <div
                    key={tab.tableId}
                    className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 ${
                      selectedTab === tab.tableId
                        ? 'bg-rose-300/50 backdrop-blur-sm text-rose-900'
                        : 'bg-white/20 backdrop-blur-sm hover:bg-white/30'
                    }`}
                    onClick={() => setSelectedTab(tab.tableId)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-light">
                          {tab.tableName.includes('Bar Tab') ? tab.tableName : `Table ${tab.tableName}`}
                        </h3>
                        <p className="text-xs opacity-75 font-light">{tab.orders.length} orders</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-light">${tab.totalAmount.toFixed(2)}</p>
                        <p className="text-xs opacity-75 font-light">{getTabDuration(tab.startTime)}</p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {tabs.length === 0 && (
                  <div className="text-center py-12">
                    <Wine className="h-12 w-12 text-rose-300 mx-auto mb-4" />
                    <p className="text-xs text-rose-500 font-light">No active tabs</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Orders List */}
          <div className="lg:col-span-3">
            <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-6">
              <h2 className="text-sm font-light text-rose-900 mb-6 tracking-wider uppercase">
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
                      <div key={order.id} className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/30 transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-sm font-light text-rose-900">
                              {order.table?.name ? `Table ${order.table.name}` : 
                                (order.special_instructions?.includes('Bar tab for') ? 
                                  order.special_instructions.replace('Bar tab for ', '') : 'Bar Tab')} - #{order.id.slice(-6)}
                            </h3>
                            <p className="text-xs text-rose-500 font-light">{getOrderAge(order.created_at)}</p>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-light ${
                            order.status === 'PENDING' ? 'bg-orange-200/50 text-orange-800' :
                            order.status === 'PREPARING' ? 'bg-blue-200/50 text-blue-800' :
                            order.status === 'READY' ? 'bg-green-200/50 text-green-800' :
                            'bg-rose-200/50 text-rose-800'
                          }`}>
                            {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                          </div>
                        </div>
                        
                        <div className="space-y-3 mb-6">
                          {drinkItems.map((item) => (
                            <div key={item.id} className="flex justify-between items-center">
                              <div className="flex items-center space-x-3">
                                <span className="w-7 h-7 bg-rose-200/50 rounded-full flex items-center justify-center text-xs font-light text-rose-900">
                                  {item.quantity}
                                </span>
                                <div>
                                  <div className="text-sm font-light text-rose-900">{item.menu_item.name}</div>
                                  {item.special_instructions && (
                                    <div className="text-xs text-red-600 mt-1 font-light">
                                      Note: {item.special_instructions}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-sm font-light text-rose-900">
                                ${(item.price * item.quantity).toFixed(2)}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex justify-end space-x-3">
                          {order.status === 'PENDING' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                              disabled={updatingOrder === order.id}
                              className="bg-blue-200/50 text-blue-800 px-4 py-2 rounded-full text-xs font-light hover:bg-blue-300/50 transition-all duration-300 disabled:opacity-50 border-0"
                            >
                              Start Preparing
                            </button>
                          )}
                          
                          {order.status === 'PREPARING' && (
                            <div className="flex space-x-3">
                              <button
                                onClick={() => updateOrderStatus(order.id, 'READY')}
                                disabled={updatingOrder === order.id}
                                className="bg-green-200/50 text-green-800 px-4 py-2 rounded-full text-xs font-light hover:bg-green-300/50 transition-all duration-300 disabled:opacity-50 border-0"
                              >
                                Mark Ready
                              </button>
                              <button
                                onClick={() => updateOrderStatus(order.id, 'PENDING')}
                                disabled={updatingOrder === order.id}
                                className="bg-rose-200/50 text-rose-800 px-4 py-2 rounded-full text-xs font-light hover:bg-rose-300/50 transition-all duration-300 disabled:opacity-50 border-0"
                              >
                                Back
                              </button>
                            </div>
                          )}
                          
                          {order.status === 'READY' && (
                            <div className="flex space-x-3">
                              <button
                                onClick={() => updateOrderStatus(order.id, 'COMPLETED')}
                                disabled={updatingOrder === order.id}
                                className="bg-green-200/50 text-green-800 px-4 py-2 rounded-full text-xs font-light hover:bg-green-300/50 transition-all duration-300 disabled:opacity-50 border-0"
                              >
                                Complete
                              </button>
                              <button
                                onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                                disabled={updatingOrder === order.id}
                                className="bg-rose-200/50 text-rose-800 px-4 py-2 rounded-full text-xs font-light hover:bg-rose-300/50 transition-all duration-300 disabled:opacity-50 border-0"
                              >
                                Back
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                
                {filteredOrders.filter(order => selectedTab ? (order.table_id === selectedTab || order.customer_session === selectedTab) : true).length === 0 && (
                  <div className="text-center py-16">
                    <Wine className="h-12 w-12 text-rose-300 mx-auto mb-6" />
                    <h3 className="text-sm font-light text-rose-900 mb-2">No Drink Orders</h3>
                    <p className="text-xs text-rose-500 font-light">All caught up! New drink orders will appear here.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create New Tab Modal */}
      {showCreateTab && (
        <div className="fixed inset-0 bg-rose-100/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/80 backdrop-blur-md w-full max-w-md rounded-3xl max-h-[90vh] overflow-hidden border-0 shadow-2xl">
            <div className="p-6 border-b border-rose-200/50">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-light text-rose-900">Create New Tab</h2>
                <button
                  onClick={() => setShowCreateTab(false)}
                  className="text-rose-400 hover:text-rose-600 p-1 border-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto">
              {/* Customer Name */}
              <div className="mb-6">
                <label className="block text-xs font-light text-rose-700 mb-2">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={newTabCustomer}
                  onChange={(e) => setNewTabCustomer(e.target.value)}
                  placeholder="Enter customer name..."
                  className="w-full px-4 py-3 bg-rose-50/50 backdrop-blur-sm rounded-2xl text-sm text-rose-900 placeholder-rose-400 focus:outline-none focus:bg-rose-50 transition-all duration-300 border-0"
                />
              </div>

              {/* Available Drinks */}
              <div className="mb-6">
                <h3 className="text-xs font-light text-rose-700 mb-3">Available Drinks</h3>
                <div className="space-y-3 max-h-40 overflow-y-auto">
                  {availableDrinks.map((drink) => (
                    <div key={drink.id} className="flex justify-between items-center p-3 bg-rose-50/30 backdrop-blur-sm rounded-2xl">
                      <div className="flex-1">
                        <div className="text-sm font-light text-rose-900">{drink.name}</div>
                        <div className="text-xs text-rose-500 font-light">${drink.price.toFixed(2)}</div>
                      </div>
                      <button
                        onClick={() => addDrinkToTab(drink)}
                        className="w-7 h-7 bg-rose-200/50 rounded-full flex items-center justify-center hover:bg-rose-300/50 hover:text-rose-900 transition-all duration-300 border-0"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Drinks */}
              {selectedDrinks.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-light text-rose-700 mb-3">Selected Drinks</h3>
                  <div className="space-y-3">
                    {selectedDrinks.map((drink) => {
                      const drinkData = availableDrinks.find(d => d.id === drink.id);
                      return (
                        <div key={drink.id} className="flex justify-between items-center p-3 bg-rose-100/50 backdrop-blur-sm rounded-2xl">
                          <div className="flex-1">
                            <div className="text-sm font-light text-rose-900">{drinkData?.name}</div>
                            <div className="text-xs text-rose-500 font-light">${drink.price.toFixed(2)} × {drink.quantity}</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => removeDrinkFromTab(drink.id)}
                              className="w-6 h-6 bg-rose-200/50 rounded-full flex items-center justify-center hover:bg-rose-300/50 transition-all duration-300 border-0"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-light text-rose-900">{drink.quantity}</span>
                            <button
                              onClick={() => addDrinkToTab(drinkData)}
                              className="w-6 h-6 bg-rose-200/50 rounded-full flex items-center justify-center hover:bg-rose-300/50 transition-all duration-300 border-0"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-rose-200/50">
              <div className="flex justify-between items-center mb-6">
                <span className="text-sm font-light text-rose-900">Total:</span>
                <span className="text-sm font-medium text-rose-900">${getTabTotal().toFixed(2)}</span>
              </div>
              <div className="space-y-3">
                <button
                  onClick={createManualTab}
                  disabled={!newTabCustomer.trim() || selectedDrinks.length === 0 || loading}
                  className="w-full bg-rose-300 text-rose-900 px-6 py-4 rounded-full text-sm font-light hover:bg-rose-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border-0"
                >
                  {loading ? 'Creating...' : 'Create Tab'}
                </button>
                <button
                  onClick={() => {
                    setNewTabCustomer('');
                    setSelectedDrinks([]);
                    setShowCreateTab(false);
                  }}
                  className="w-full bg-rose-100 text-rose-700 px-6 py-3 rounded-full text-sm font-light hover:bg-rose-200 transition-all duration-300 border-0"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}