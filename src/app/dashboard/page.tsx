'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { signOut } from '@/lib/auth';
import { createClient } from '@/lib/supabase';
import { Category, MenuItem } from '@/lib/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { Plus, Edit, Trash2, QrCode, Users, BarChart3, Settings } from 'lucide-react';
import { LoadingScreen } from '@/components/ui/LoadingSpinner';

export default function DashboardPage() {
  const { user, restaurant, isAuthenticated } = useAppStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddMenuItem, setShowAddMenuItem] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newMenuItem, setNewMenuItem] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    image_url: '',
  });
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'OWNER') {
      router.push('/login');
      return;
    }
    
    fetchData();
  }, [isAuthenticated, user, router]);

  const fetchData = async () => {
    if (!restaurant) return;
    
    try {
      setLoading(true);
      
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('sort_order');
      
      if (categoriesError) throw categoriesError;
      
      // Fetch menu items
      const { data: menuItemsData, error: menuItemsError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('name');
      
      if (menuItemsError) throw menuItemsError;
      
      setCategories(categoriesData || []);
      setMenuItems(menuItemsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant || !newCategoryName.trim()) return;
    
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: newCategoryName.trim(),
          restaurant_id: restaurant.id,
          sort_order: categories.length,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setCategories([...categories, data]);
      setNewCategoryName('');
      setShowAddCategory(false);
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const handleAddMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant || !newMenuItem.name.trim() || !newMenuItem.price || !newMenuItem.category_id) return;
    
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .insert({
          name: newMenuItem.name.trim(),
          description: newMenuItem.description.trim(),
          price: parseFloat(newMenuItem.price),
          category_id: newMenuItem.category_id,
          restaurant_id: restaurant.id,
          image_url: newMenuItem.image_url.trim() || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setMenuItems([...menuItems, data]);
      setNewMenuItem({
        name: '',
        description: '',
        price: '',
        category_id: '',
        image_url: '',
      });
      setShowAddMenuItem(false);
    } catch (error) {
      console.error('Error adding menu item:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const toggleMenuItemAvailability = async (itemId: string, currentAvailability: boolean) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ available: !currentAvailability })
        .eq('id', itemId);
      
      if (error) throw error;
      
      setMenuItems(menuItems.map(item => 
        item.id === itemId ? { ...item, available: !currentAvailability } : item
      ));
    } catch (error) {
      console.error('Error updating menu item availability:', error);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-rose-50">
      {/* Ultra Minimal Header */}
      <div className="bg-white/60 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-lg font-light text-rose-900">
                {restaurant?.name}
              </h1>
              <p className="text-xs text-rose-500">Dashboard</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => router.push('/dashboard/tables')}
                className="text-rose-600 hover:text-rose-900 px-3 py-2 text-xs font-light transition-all duration-300 rounded-full hover:bg-rose-100"
              >
                <QrCode className="h-3 w-3 mr-1 inline" />
                QR
              </button>
              <button
                onClick={() => router.push('/dashboard/staff')}
                className="text-rose-600 hover:text-rose-900 px-3 py-2 text-xs font-light transition-all duration-300 rounded-full hover:bg-rose-100"
              >
                <Users className="h-3 w-3 mr-1 inline" />
                Staff
              </button>
              <button
                onClick={() => router.push('/dashboard/analytics')}
                className="text-rose-600 hover:text-rose-900 px-3 py-2 text-xs font-light transition-all duration-300 rounded-full hover:bg-rose-100"
              >
                <BarChart3 className="h-3 w-3 mr-1 inline" />
                Analytics
              </button>
              <button
                onClick={() => router.push('/dashboard/settings')}
                className="text-rose-600 hover:text-rose-900 px-3 py-2 text-xs font-light transition-all duration-300 rounded-full hover:bg-rose-100"
              >
                <Settings className="h-3 w-3 mr-1 inline" />
                Settings
              </button>
              <button
                onClick={handleSignOut}
                className="bg-rose-200 text-rose-900 px-4 py-2 rounded-full text-xs font-light hover:bg-rose-300 transition-all duration-300 border-0"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Categories Section */}
          <div className="lg:col-span-1">
            <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-light text-rose-900 tracking-wider uppercase">Categories</h2>
                <button
                  onClick={() => setShowAddCategory(true)}
                  className="bg-rose-200 text-rose-900 px-3 py-2 rounded-full text-xs font-light hover:bg-rose-300 transition-all duration-300 border-0"
                >
                  <Plus className="h-3 w-3 mr-1 inline" />
                  Add
                </button>
              </div>
              
              {showAddCategory && (
                <form onSubmit={handleAddCategory} className="mb-6">
                  <div className="flex gap-3">
                    <input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Category name"
                      className="flex-1 px-4 py-3 bg-white/30 backdrop-blur-sm rounded-2xl text-sm text-rose-900 placeholder-rose-400 focus:outline-none focus:bg-white/50 transition-all duration-300 border-0"
                    />
                    <button
                      type="submit"
                      className="bg-rose-300 text-rose-900 px-4 py-3 rounded-2xl text-xs font-light hover:bg-rose-400 transition-all duration-300 border-0"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddCategory(false)}
                      className="bg-rose-100 text-rose-700 px-4 py-3 rounded-2xl text-xs font-light hover:bg-rose-200 transition-all duration-300 border-0"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
              
              <div className="space-y-3">
                {categories.map((category) => (
                  <div key={category.id} className="flex justify-between items-center p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                    <span className="text-sm font-light text-rose-900">{category.name}</span>
                    <span className="text-xs text-rose-500">
                      {menuItems.filter(item => item.category_id === category.id).length} items
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Menu Items Section */}
          <div className="lg:col-span-2">
            <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-light text-rose-900 tracking-wider uppercase">Menu Items</h2>
                <button
                  onClick={() => setShowAddMenuItem(true)}
                  disabled={categories.length === 0}
                  className="bg-rose-200 text-rose-900 px-3 py-2 rounded-full text-xs font-light hover:bg-rose-300 transition-all duration-300 disabled:opacity-50 border-0"
                >
                  <Plus className="h-3 w-3 mr-1 inline" />
                  Add Item
                </button>
              </div>
              
              {showAddMenuItem && (
                <form onSubmit={handleAddMenuItem} className="mb-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-light text-rose-700 mb-2">Item Name</label>
                      <input
                        value={newMenuItem.name}
                        onChange={(e) => setNewMenuItem({...newMenuItem, name: e.target.value})}
                        required
                        className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm rounded-2xl text-sm text-rose-900 placeholder-rose-400 focus:outline-none focus:bg-white/50 transition-all duration-300 border-0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-light text-rose-700 mb-2">Price</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newMenuItem.price}
                        onChange={(e) => setNewMenuItem({...newMenuItem, price: e.target.value})}
                        required
                        className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm rounded-2xl text-sm text-rose-900 placeholder-rose-400 focus:outline-none focus:bg-white/50 transition-all duration-300 border-0"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-light text-rose-700 mb-2">Category</label>
                    <select
                      value={newMenuItem.category_id}
                      onChange={(e) => setNewMenuItem({...newMenuItem, category_id: e.target.value})}
                      className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm rounded-2xl text-sm text-rose-900 focus:outline-none focus:bg-white/50 transition-all duration-300 border-0"
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-light text-rose-700 mb-2">Description</label>
                    <textarea
                      value={newMenuItem.description}
                      onChange={(e) => setNewMenuItem({...newMenuItem, description: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm rounded-2xl text-sm text-rose-900 placeholder-rose-400 focus:outline-none focus:bg-white/50 transition-all duration-300 border-0 resize-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-light text-rose-700 mb-2">Image URL</label>
                    <input
                      value={newMenuItem.image_url}
                      onChange={(e) => setNewMenuItem({...newMenuItem, image_url: e.target.value})}
                      className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm rounded-2xl text-sm text-rose-900 placeholder-rose-400 focus:outline-none focus:bg-white/50 transition-all duration-300 border-0"
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="bg-rose-300 text-rose-900 px-6 py-3 rounded-2xl text-sm font-light hover:bg-rose-400 transition-all duration-300 border-0"
                    >
                      Add Item
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddMenuItem(false)}
                      className="bg-rose-100 text-rose-700 px-6 py-3 rounded-2xl text-sm font-light hover:bg-rose-200 transition-all duration-300 border-0"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
              
              <div className="space-y-6">
                {categories.map((category) => {
                  const categoryItems = menuItems.filter(item => item.category_id === category.id);
                  
                  if (categoryItems.length === 0) return null;
                  
                  return (
                    <div key={category.id}>
                      <h3 className="text-sm font-light text-rose-800 mb-4 tracking-wider uppercase">{category.name}</h3>
                      <div className="space-y-3">
                        {categoryItems.map((item) => (
                          <div key={item.id} className="flex justify-between items-center p-4 bg-white/20 backdrop-blur-sm rounded-2xl hover:bg-white/30 transition-all duration-300">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <h4 className="text-sm font-light text-rose-900">{item.name}</h4>
                                <span className="text-xs px-3 py-1 rounded-full bg-rose-200/50 text-rose-800">
                                  ${item.price}
                                </span>
                                <span className={`text-xs px-3 py-1 rounded-full ${
                                  item.available ? 'bg-green-200/50 text-green-800' : 'bg-red-200/50 text-red-800'
                                }`}>
                                  {item.available ? 'Available' : 'Unavailable'}
                                </span>
                              </div>
                              {item.description && (
                                <p className="text-xs text-rose-500 mt-2 font-light">{item.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => toggleMenuItemAvailability(item.id, item.available)}
                                className={`px-4 py-2 rounded-full text-xs font-light transition-all duration-300 border-0 ${
                                  item.available 
                                    ? 'bg-red-200/50 text-red-700 hover:bg-red-300/50'
                                    : 'bg-green-200/50 text-green-700 hover:bg-green-300/50'
                                }`}
                              >
                                {item.available ? 'Disable' : 'Enable'}
                              </button>
                              <button className="p-2 text-rose-400 hover:text-rose-600 transition-all duration-300">
                                <Edit className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}