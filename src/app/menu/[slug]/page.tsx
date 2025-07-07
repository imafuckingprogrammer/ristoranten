'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { Restaurant, Category, MenuItem, CartItem } from '@/lib/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black"></div>
          <p className="mt-4 text-black">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-black mb-2">Menu Unavailable</h2>
          <p className="text-black">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div 
        className="bg-white shadow-sm border-b"
        style={{ backgroundColor: restaurant?.primary_color || '#ffffff' }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-black">
              {restaurant?.name}
            </h1>
            {restaurant?.description && (
              <p className="mt-2 text-black">{restaurant.description}</p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-black" />
                <input
                  type="text"
                  placeholder="Search menu items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex space-x-2 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                  selectedCategory === 'all'
                    ? 'bg-black text-white'
                    : 'bg-white text-black border border-black'
                }`}
              >
                All Items
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                    selectedCategory === category.id
                      ? 'bg-black text-white'
                      : 'bg-white text-black border border-black'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="space-y-8">
          {Object.entries(groupedMenuItems).map(([categoryId, { category, items }]) => (
            <div key={categoryId}>
              <h2 className="text-2xl font-bold text-black mb-4">{category.name}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {items.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <div className="flex">
                      {item.image_url && (
                        <div className="w-24 h-24 flex-shrink-0">
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
                            <h3 className="font-semibold text-black">{item.name}</h3>
                            {item.description && (
                              <p className="text-sm text-black mt-1">{item.description}</p>
                            )}
                          </div>
                          <div className="ml-4 text-right">
                            <div className="font-bold text-black">${item.price.toFixed(2)}</div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center mt-3">
                          <div className="flex items-center space-x-2">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm text-black">4.5</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {getItemQuantityInCart(item.id) > 0 ? (
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeItemFromCart(item)}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-8 text-center font-medium">
                                  {getItemQuantityInCart(item.id)}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => addItemToCart(item)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => addItemToCart(item)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {filteredMenuItems.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-24 w-24 text-black mx-auto mb-4" />
            <h3 className="text-lg font-medium text-black mb-2">No items found</h3>
            <p className="text-black">Try adjusting your search or category filter</p>
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <Button
            onClick={() => setShowCart(true)}
            size="lg"
            className="bg-black text-white shadow-xl"
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            {getTotalItems()} items • ${getTotalPrice().toFixed(2)}
          </Button>
        </div>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-md sm:mx-4 rounded-t-lg sm:rounded-lg max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-black">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Your Order</h2>
                <Button variant="ghost" onClick={() => setShowCart(false)}>
                  ×
                </Button>
              </div>
            </div>
            
            <div className="p-4 max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.menu_item.id} className="flex justify-between items-center">
                    <div className="flex-1">
                      <h3 className="font-medium">{item.menu_item.name}</h3>
                      <p className="text-sm text-black">${item.menu_item.price.toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeItemFromCart(item.menu_item)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => addItemToCart(item.menu_item)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 border-t border-black">
              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold">Total:</span>
                <span className="font-bold text-lg">${getTotalPrice().toFixed(2)}</span>
              </div>
              <div className="space-y-2">
                <Button
                  fullWidth
                  size="lg"
                  onClick={() => {
                    // This is the regular menu page, redirect to QR order page
                    alert('This menu is for browsing. Please scan the QR code at your table to place orders.');
                    setShowCart(false);
                  }}
                >
                  Place Order
                </Button>
                <Button
                  fullWidth
                  variant="ghost"
                  onClick={() => {
                    clearCart();
                    setShowCart(false);
                  }}
                >
                  Clear Cart
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}