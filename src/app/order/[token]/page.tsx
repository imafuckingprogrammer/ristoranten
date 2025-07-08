'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase';
import { verifyTableToken } from '@/lib/qr';
import { useAppStore } from '@/lib/store';
import { Restaurant, Category, MenuItem, CartItem } from '@/lib/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import Grid from '@/components/ui/Grid';
import Badge from '@/components/ui/Badge';
import { LoadingScreen } from '@/components/ui/LoadingSpinner';
import { Plus, Minus, ShoppingCart, Search, AlertCircle, CheckCircle, Star } from 'lucide-react';

export default function OrderPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tableInfo, setTableInfo] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');
  
  const { cart, addToCart, removeFromCart, updateCartItem, clearCart, setTableToken } = useAppStore();
  const supabase = createClient();

  useEffect(() => {
    verifyTokenAndFetchData();
  }, [token]);

  const verifyTokenAndFetchData = async () => {
    try {
      setLoading(true);
      
      // Verify token
      const tokenData = verifyTableToken(token);
      if (!tokenData) {
        setError('Invalid or expired QR code. Please scan a new QR code.');
        return;
      }
      
      setTableInfo({
        id: tokenData.table_id,
        name: tokenData.table_name
      });
      
      setTableToken(token);
      
      // Fetch restaurant
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', tokenData.restaurant_id)
        .single();
      
      if (restaurantError) throw restaurantError;
      
      setRestaurant(restaurantData);
      
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', restaurantData.id)
        .order('sort_order');
      
      if (categoriesError) throw categoriesError;
      
      // Fetch menu items
      const { data: menuItemsData, error: menuItemsError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantData.id)
        .eq('available', true)
        .order('name');
      
      if (menuItemsError) throw menuItemsError;
      
      setCategories(categoriesData || []);
      setMenuItems(menuItemsData || []);
    } catch (error: any) {
      console.error('Error verifying token and fetching data:', error);
      setError('Unable to load menu. Please try scanning the QR code again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredMenuItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category_id === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  const groupedMenuItems = categories.reduce((acc, category) => {
    const categoryItems = filteredMenuItems.filter(item => item.category_id === category.id);
    if (categoryItems.length > 0) {
      acc[category.id] = {
        category,
        items: categoryItems
      };
    }
    return acc;
  }, {} as Record<string, { category: Category; items: MenuItem[] }>);

  const getItemQuantityInCart = (itemId: string) => {
    const cartItem = cart.find(item => item.menu_item.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  const addItemToCart = (menuItem: MenuItem) => {
    addToCart({
      menu_item: menuItem,
      quantity: 1,
      special_instructions: ''
    });
  };

  const removeItemFromCart = (menuItem: MenuItem) => {
    const currentQuantity = getItemQuantityInCart(menuItem.id);
    if (currentQuantity > 1) {
      updateCartItem(menuItem.id, currentQuantity - 1);
    } else {
      removeFromCart(menuItem.id);
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.menu_item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const generateCustomerSession = () => {
    return `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const placeOrder = async () => {
    if (!restaurant || !tableInfo || cart.length === 0) return;
    
    try {
      setPlacingOrder(true);
      
      const customerSession = generateCustomerSession();
      const total = getTotalPrice();
      
      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          restaurant_id: restaurant.id,
          table_id: tableInfo.id,
          customer_session: customerSession,
          status: 'PENDING',
          total: total,
          special_instructions: specialInstructions.trim() || null,
        })
        .select()
        .single();
      
      if (orderError) throw orderError;
      
      // Create order items
      const orderItems = cart.map(item => ({
        order_id: orderData.id,
        menu_item_id: item.menu_item.id,
        quantity: item.quantity,
        price: item.menu_item.price,
        special_instructions: item.special_instructions || null,
      }));
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) throw itemsError;
      
      // Clear cart and show success
      clearCart();
      setSpecialInstructions('');
      setShowCart(false);
      setOrderPlaced(true);
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setOrderPlaced(false);
      }, 5000);
      
    } catch (error: any) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading menu..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Container size="sm">
          <motion.div 
            className="text-center max-w-md mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="text-center">
              <AlertCircle className="h-12 w-12 text-error mx-auto mb-4" />
              <h2 className="text-lg font-medium text-foreground mb-2">Unable to Load Menu</h2>
              <p className="text-sm text-muted mb-4">{error}</p>
              <p className="text-sm text-muted">Please ask your server for assistance or scan a new QR code.</p>
            </Card>
          </motion.div>
        </Container>
      </div>
    );
  }

  // Create CSS custom properties for brand color
  const brandColor = restaurant?.primary_color || '#1a1a1a';
  const brandStyles = {
    '--brand-color': brandColor,
    '--brand-color-rgb': brandColor.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)).join(', ') || '26, 26, 26'
  } as React.CSSProperties;

  return (
    <div className="min-h-screen bg-background" style={brandStyles}>
      {/* Success Banner */}
      <AnimatePresence>
        {orderPlaced && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 bg-success text-white p-4 z-50 shadow-large"
          >
            <Container>
              <div className="flex items-center justify-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span className="font-medium">Order placed successfully! Your food is being prepared.</span>
              </div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Ultra Minimal Header */}
      <div className="bg-white/60 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <h1 className="text-lg font-light text-foreground">{restaurant?.name}</h1>
          <p className="text-xs text-muted mt-1">Table {tableInfo?.name}</p>
          {restaurant?.description && (
            <p className="text-xs text-muted mt-2 font-light">{restaurant.description}</p>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6">
        {/* Ultra Minimal Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col gap-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                type="text"
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/70 backdrop-blur-sm rounded-full text-sm text-foreground placeholder-muted focus:outline-none focus:bg-white/90 transition-all duration-300 border-0"
              />
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-full text-xs font-light transition-all duration-300 ${
                  selectedCategory === 'all'
                    ? 'text-white'
                    : 'bg-white/50 text-foreground hover:bg-white/80'
                }`}
                style={selectedCategory === 'all' ? { backgroundColor: 'var(--brand-color)' } : {}}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-xs font-light transition-all duration-300 ${
                    selectedCategory === category.id
                      ? 'text-white'
                      : 'bg-white/50 text-foreground hover:bg-white/80'
                  }`}
                  style={selectedCategory === category.id ? { backgroundColor: 'var(--brand-color)' } : {}}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Ultra Minimal Menu Items */}
        <div className="space-y-12">
          {Object.entries(groupedMenuItems).map(([categoryId, { category, items }]) => (
            <div key={categoryId}>
              <h2 className="text-sm font-light text-foreground mb-6 text-center tracking-wider uppercase">{category.name}</h2>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="bg-white/40 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/60 transition-all duration-300">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <h3 className="font-light text-foreground text-sm">{item.name}</h3>
                        {item.description && (
                          <p className="text-xs text-muted mt-1 font-light">{item.description}</p>
                        )}
                        <div className="text-xs text-foreground mt-2">${item.price.toFixed(2)}</div>
                      </div>
                      
                      <div className="ml-6">
                        {getItemQuantityInCart(item.id) > 0 ? (
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => removeItemFromCart(item)}
                              className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 transition-all duration-300 border-0"
                              style={{ backgroundColor: 'rgba(var(--brand-color-rgb), 0.1)' }}
                            >
                              <Minus className="h-3 w-3" style={{ color: 'var(--brand-color)' }} />
                            </button>
                            <span className="w-6 text-center font-light text-foreground text-sm">
                              {getItemQuantityInCart(item.id)}
                            </span>
                            <button
                              onClick={() => addItemToCart(item)}
                              className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 transition-all duration-300 border-0"
                              style={{ backgroundColor: 'rgba(var(--brand-color-rgb), 0.1)' }}
                            >
                              <Plus className="h-3 w-3" style={{ color: 'var(--brand-color)' }} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addItemToCart(item)}
                            className="px-4 py-2 rounded-full text-xs font-light hover:opacity-80 transition-all duration-300 border-0 text-white"
                            style={{ backgroundColor: 'var(--brand-color)' }}
                          >
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {filteredMenuItems.length === 0 && (
          <div className="text-center py-16">
            <Search className="h-8 w-8 text-muted mx-auto mb-4" />
            <h3 className="text-xs font-light text-foreground mb-2">No items found</h3>
            <p className="text-xs text-muted">Try adjusting your search</p>
          </div>
        )}
      </div>

      {/* Ultra Minimal Floating Cart */}
      {cart.length > 0 && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40">
          <button
            onClick={() => setShowCart(true)}
            className="px-6 py-4 rounded-full shadow-lg text-xs font-light hover:opacity-90 transition-all duration-300 border-0 backdrop-blur-sm text-white"
            style={{ backgroundColor: 'var(--brand-color)' }}
          >
            <ShoppingCart className="h-4 w-4 mr-2 inline" />
            {getTotalItems()} items • ${getTotalPrice().toFixed(2)}
          </button>
        </div>
      )}

      {/* Ultra Minimal Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/80 backdrop-blur-md w-full sm:max-w-md rounded-3xl max-h-[90vh] overflow-hidden border-0 shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-light text-foreground">Your Order</h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-muted hover:text-foreground p-1 border-0"
                >
                  ×
                </button>
              </div>
              
              <div className="max-h-64 overflow-y-auto">
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.menu_item.id} className="flex justify-between items-center bg-white/50 rounded-2xl p-4">
                      <div className="flex-1">
                        <h3 className="text-xs font-light text-foreground">{item.menu_item.name}</h3>
                        <p className="text-xs text-muted">${item.menu_item.price.toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => removeItemFromCart(item.menu_item)}
                          className="w-6 h-6 rounded-full flex items-center justify-center hover:opacity-80 transition-all duration-300 border-0"
                          style={{ backgroundColor: 'rgba(var(--brand-color-rgb), 0.1)' }}
                        >
                          <Minus className="h-3 w-3" style={{ color: 'var(--brand-color)' }} />
                        </button>
                        <span className="w-4 text-center text-xs font-light text-foreground">{item.quantity}</span>
                        <button
                          onClick={() => addItemToCart(item.menu_item)}
                          className="w-6 h-6 rounded-full flex items-center justify-center hover:opacity-80 transition-all duration-300 border-0"
                          style={{ backgroundColor: 'rgba(var(--brand-color-rgb), 0.1)' }}
                        >
                          <Plus className="h-3 w-3" style={{ color: 'var(--brand-color)' }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Special Instructions */}
                <div className="mt-6">
                  <label className="block text-xs font-light text-foreground mb-2">
                    Special Instructions
                  </label>
                  <textarea
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/50 rounded-2xl text-xs text-foreground placeholder-muted focus:outline-none focus:bg-white/80 transition-all duration-300 border-0"
                    placeholder="Any special requests..."
                  />
                </div>
              </div>
              
              <div className="mt-6 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-light text-foreground">Total:</span>
                  <span className="text-sm font-medium text-foreground">${getTotalPrice().toFixed(2)}</span>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={placeOrder}
                    disabled={placingOrder}
                    className="w-full px-6 py-4 rounded-full text-xs font-light hover:opacity-90 transition-all duration-300 disabled:opacity-50 border-0 text-white"
                    style={{ backgroundColor: 'var(--brand-color)' }}
                  >
                    {placingOrder ? 'Placing Order...' : 'Place Order'}
                  </button>
                  <button
                    onClick={() => {
                      clearCart();
                      setShowCart(false);
                    }}
                    className="w-full bg-white/50 text-foreground px-6 py-3 rounded-full text-xs font-light hover:bg-white/80 transition-all duration-300 border-0"
                  >
                    Clear Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}