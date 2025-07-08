'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { Restaurant, Category, MenuItem, CartItem } from '@/lib/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import Grid from '@/components/ui/Grid';
import { Plus, Minus, ShoppingCart, Search, Star } from 'lucide-react';

export default function CustomerMenuPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCart, setShowCart] = useState(false);
  
  const { cart, addToCart, removeFromCart, updateCartItem, clearCart } = useAppStore();
  const supabase = createClient();

  useEffect(() => {
    fetchRestaurantData();
  }, [slug]);

  const fetchRestaurantData = async () => {
    try {
      setLoading(true);
      
      // Fetch restaurant
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
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
      console.error('Error fetching restaurant data:', error);
      setError('Restaurant not found or menu unavailable');
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

  const addItemToCart = (menuItem: MenuItem, specialInstructions: string = '') => {
    addToCart({
      menu_item: menuItem,
      quantity: 1,
      special_instructions: specialInstructions
    });
  };

  const updateCartItemInstructions = (itemId: string, instructions: string) => {
    const cartItem = cart.find(item => item.menu_item.id === itemId);
    if (cartItem) {
      // Remove the item and add it back with new instructions
      removeFromCart(itemId);
      addToCart({
        menu_item: cartItem.menu_item,
        quantity: cartItem.quantity,
        special_instructions: instructions
      });
    }
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

  // Create CSS custom properties for brand color
  const brandColor = restaurant?.primary_color || '#1a1a1a';
  const brandStyles = {
    '--brand-color': brandColor,
    '--brand-color-rgb': brandColor.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)).join(', ') || '26, 26, 26'
  } as React.CSSProperties;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-muted border-t-accent mx-auto"></div>
          <p className="mt-4 text-foreground text-sm">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-medium text-foreground mb-2">Menu Unavailable</h2>
          <p className="text-muted">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" style={brandStyles}>
      {/* Header */}
      <div className="bg-white/60 backdrop-blur-sm shadow-soft border-b border-border">
        <Container>
          <div className="py-8">
            <h1 className="text-2xl font-medium text-foreground">
              {restaurant?.name}
            </h1>
            {restaurant?.description && (
              <p className="mt-2 text-muted">{restaurant.description}</p>
            )}
          </div>
        </Container>
      </div>

      <Container>
        <div className="py-6">
          {/* Search and Filters */}
          <div className="mb-8">
            <div className="flex flex-col gap-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  type="text"
                  placeholder="Search menu items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/70 backdrop-blur-sm rounded-xl text-sm text-foreground placeholder-muted focus:outline-none focus:bg-white/90 transition-all duration-300 border-0"
                />
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-full text-sm font-light transition-all duration-300 ${
                    selectedCategory === 'all'
                      ? 'text-white'
                      : 'bg-white/50 text-foreground hover:bg-white/80'
                  }`}
                  style={selectedCategory === 'all' ? { backgroundColor: 'var(--brand-color)' } : {}}
                >
                  All Items
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-full text-sm font-light transition-all duration-300 ${
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

          {/* Menu Items */}
          <div className="space-y-12">
            {Object.entries(groupedMenuItems).map(([categoryId, { category, items }]) => (
              <div key={categoryId}>
                <h2 className="text-lg font-medium text-foreground mb-6 text-center">{category.name}</h2>
                <Grid cols={1} gap="md" className="sm:grid-cols-2">
                  {items.map((item) => (
                    <Card key={item.id} className="overflow-hidden">
                      <div className="flex">
                        {item.image_url && (
                          <div className="w-20 h-20 flex-shrink-0">
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-full h-full object-cover rounded-l"
                            />
                          </div>
                        )}
                        <div className="flex-1 p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h3 className="font-medium text-foreground">{item.name}</h3>
                              {item.description && (
                                <p className="text-sm text-muted mt-1">{item.description}</p>
                              )}
                            </div>
                            <div className="ml-4 text-right">
                              <div className="font-medium text-foreground">${item.price.toFixed(2)}</div>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center mt-3">
                            <div className="flex items-center space-x-2">
                              <Star className="h-4 w-4 text-warning fill-current" />
                              <span className="text-sm text-muted">4.5</span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {getItemQuantityInCart(item.id) > 0 ? (
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => removeItemFromCart(item)}
                                    className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 transition-all duration-300"
                                    style={{ backgroundColor: 'rgba(var(--brand-color-rgb), 0.1)' }}
                                  >
                                    <Minus className="h-4 w-4" style={{ color: 'var(--brand-color)' }} />
                                  </button>
                                  <span className="w-8 text-center font-medium text-foreground">
                                    {getItemQuantityInCart(item.id)}
                                  </span>
                                  <button
                                    onClick={() => addItemToCart(item)}
                                    className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 transition-all duration-300"
                                    style={{ backgroundColor: 'rgba(var(--brand-color-rgb), 0.1)' }}
                                  >
                                    <Plus className="h-4 w-4" style={{ color: 'var(--brand-color)' }} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => addItemToCart(item)}
                                  className="px-4 py-2 rounded-full text-sm font-light hover:opacity-90 transition-all duration-300 text-white"
                                  style={{ backgroundColor: 'var(--brand-color)' }}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </Grid>
              </div>
            ))}
          </div>
        
          {filteredMenuItems.length === 0 && (
            <div className="text-center py-16">
              <Search className="h-12 w-12 text-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No items found</h3>
              <p className="text-muted">Try adjusting your search or category filter</p>
            </div>
          )}
        </div>
      </Container>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <button
            onClick={() => setShowCart(true)}
            className="px-6 py-3 rounded-full shadow-large text-sm font-medium hover:opacity-90 transition-all duration-300 text-white"
            style={{ backgroundColor: 'var(--brand-color)' }}
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            {getTotalItems()} items • ${getTotalPrice().toFixed(2)}
          </button>
        </div>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white/90 backdrop-blur-md w-full sm:max-w-md sm:mx-4 rounded-t-xl sm:rounded-xl max-h-[90vh] overflow-hidden shadow-large">
            <div className="p-6 border-b border-border">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-foreground">Your Order</h2>
                <button 
                  onClick={() => setShowCart(false)}
                  className="text-muted hover:text-foreground p-1"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.menu_item.id} className="bg-white/50 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground">{item.menu_item.name}</h3>
                        <p className="text-sm text-muted">${item.menu_item.price.toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => removeItemFromCart(item.menu_item)}
                          className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 transition-all duration-300"
                          style={{ backgroundColor: 'rgba(var(--brand-color-rgb), 0.1)' }}
                        >
                          <Minus className="h-4 w-4" style={{ color: 'var(--brand-color)' }} />
                        </button>
                        <span className="w-8 text-center font-medium text-foreground">{item.quantity}</span>
                        <button
                          onClick={() => addItemToCart(item.menu_item)}
                          className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 transition-all duration-300"
                          style={{ backgroundColor: 'rgba(var(--brand-color-rgb), 0.1)' }}
                        >
                          <Plus className="h-4 w-4" style={{ color: 'var(--brand-color)' }} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-foreground mb-1">
                        Special Instructions
                      </label>
                      <input
                        type="text"
                        value={item.special_instructions || ''}
                        onChange={(e) => updateCartItemInstructions(item.menu_item.id, e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white/70 rounded border-0 focus:outline-none focus:bg-white/90 transition-all duration-300"
                        placeholder="Add special instructions..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-6 border-t border-border">
              <div className="flex justify-between items-center mb-4">
                <span className="font-medium text-foreground">Total:</span>
                <span className="font-medium text-lg text-foreground">${getTotalPrice().toFixed(2)}</span>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    // This is the regular menu page, redirect to QR order page
                    alert('This menu is for browsing. Please scan the QR code at your table to place orders.');
                    setShowCart(false);
                  }}
                  className="w-full px-6 py-3 rounded-full text-sm font-medium hover:opacity-90 transition-all duration-300 text-white"
                  style={{ backgroundColor: 'var(--brand-color)' }}
                >
                  Place Order
                </button>
                <button
                  onClick={() => {
                    clearCart();
                    setShowCart(false);
                  }}
                  className="w-full bg-white/50 text-foreground px-6 py-3 rounded-full text-sm font-medium hover:bg-white/80 transition-all duration-300"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}