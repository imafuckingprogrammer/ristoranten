'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { signOut, checkUserPermission } from '@/lib/auth';
import { createClient } from '@/lib/supabase';
import { Category, MenuItem } from '@/lib/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Container from '@/components/ui/Container';
import Grid from '@/components/ui/Grid';
import Badge from '@/components/ui/Badge';
import { Plus, Edit, QrCode, Users, BarChart3, Settings, LogOut } from 'lucide-react';
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
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }
    
    // Check if user has permission to access dashboard (owners only)
    if (!checkUserPermission(user.role, 'OWNER')) {
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border">
        <Container>
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-xl font-medium text-foreground">
                {restaurant?.name}
              </h1>
              <p className="text-sm text-muted">Dashboard</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard/tables')}
              >
                <QrCode className="h-4 w-4 mr-2" />
                QR Codes
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard/staff')}
              >
                <Users className="h-4 w-4 mr-2" />
                Staff
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard/analytics')}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard/settings')}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
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
        <Grid cols={3} gap="lg">
          {/* Categories Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-foreground">Categories</h2>
                <Button
                  size="sm"
                  onClick={() => setShowAddCategory(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
              
              {showAddCategory && (
                <motion.form 
                  onSubmit={handleAddCategory} 
                  className="mb-6"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-4">
                    <Input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Category name"
                      fullWidth
                    />
                    <div className="flex gap-3">
                      <Button type="submit" size="sm">
                        Add
                      </Button>
                      <Button 
                        type="button" 
                        variant="secondary" 
                        size="sm"
                        onClick={() => setShowAddCategory(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </motion.form>
              )}
              
              <div className="space-y-3">
                {categories.map((category, index) => (
                  <motion.div 
                    key={category.id} 
                    className="flex justify-between items-center p-4 bg-surface rounded-lg"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <span className="text-sm font-medium text-foreground">{category.name}</span>
                    <Badge variant="secondary">
                      {menuItems.filter(item => item.category_id === category.id).length} items
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Menu Items Section */}
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-foreground">Menu Items</h2>
                <Button
                  size="sm"
                  onClick={() => setShowAddMenuItem(true)}
                  disabled={categories.length === 0}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
              
              {showAddMenuItem && (
                <motion.form 
                  onSubmit={handleAddMenuItem} 
                  className="mb-8 space-y-6"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                >
                  <Grid cols={2} gap="md">
                    <Input
                      label="Item Name"
                      value={newMenuItem.name}
                      onChange={(e) => setNewMenuItem({...newMenuItem, name: e.target.value})}
                      required
                      fullWidth
                    />
                    <Input
                      label="Price"
                      type="number"
                      step="0.01"
                      value={newMenuItem.price}
                      onChange={(e) => setNewMenuItem({...newMenuItem, price: e.target.value})}
                      required
                      fullWidth
                    />
                  </Grid>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Category</label>
                    <select
                      value={newMenuItem.category_id}
                      onChange={(e) => setNewMenuItem({...newMenuItem, category_id: e.target.value})}
                      className="w-full px-4 py-3 border border-border rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent transition-all duration-200 bg-white text-foreground shadow-soft hover:shadow-medium"
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
                    <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                    <textarea
                      value={newMenuItem.description}
                      onChange={(e) => setNewMenuItem({...newMenuItem, description: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-3 border border-border rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent transition-all duration-200 bg-white text-foreground placeholder:text-muted shadow-soft hover:shadow-medium resize-none"
                      placeholder="Item description..."
                    />
                  </div>
                  
                  <Input
                    label="Image URL"
                    value={newMenuItem.image_url}
                    onChange={(e) => setNewMenuItem({...newMenuItem, image_url: e.target.value})}
                    placeholder="https://..."
                    fullWidth
                  />
                  
                  <div className="flex gap-3">
                    <Button type="submit">
                      Add Item
                    </Button>
                    <Button 
                      type="button" 
                      variant="secondary"
                      onClick={() => setShowAddMenuItem(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </motion.form>
              )}
              
              <div className="space-y-6">
                {categories.map((category, categoryIndex) => {
                  const categoryItems = menuItems.filter(item => item.category_id === category.id);
                  
                  if (categoryItems.length === 0) return null;
                  
                  return (
                    <motion.div 
                      key={category.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: categoryIndex * 0.1 }}
                    >
                      <h3 className="text-lg font-medium text-foreground mb-4">{category.name}</h3>
                      <div className="space-y-3">
                        {categoryItems.map((item, itemIndex) => (
                          <motion.div 
                            key={item.id} 
                            className="flex justify-between items-center p-4 bg-surface rounded-lg hover:shadow-medium transition-all duration-300"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: itemIndex * 0.05 }}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-sm font-medium text-foreground">{item.name}</h4>
                                <Badge variant="secondary">
                                  ${item.price}
                                </Badge>
                                <Badge variant={item.available ? 'success' : 'error'}>
                                  {item.available ? 'Available' : 'Unavailable'}
                                </Badge>
                              </div>
                              {item.description && (
                                <p className="text-sm text-muted">{item.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <Button
                                size="sm"
                                variant={item.available ? 'danger' : 'success'}
                                onClick={() => toggleMenuItemAvailability(item.id, item.available)}
                              >
                                {item.available ? 'Disable' : 'Enable'}
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        </Grid>
      </Container>
    </div>
  );
}