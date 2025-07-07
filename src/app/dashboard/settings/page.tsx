'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { createClient } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { LoadingScreen } from '@/components/ui/LoadingSpinner';
import { 
  ArrowLeft, 
  Save, 
  Palette, 
  Globe, 
  Info,
  Trash2,
  AlertTriangle
} from 'lucide-react';

export default function SettingsPage() {
  const { user, restaurant, isAuthenticated, setRestaurant } = useAppStore();
  const [settings, setSettings] = useState({
    name: '',
    slug: '',
    description: '',
    primary_color: '#000000',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'OWNER') {
      router.push('/login');
      return;
    }
    
    if (restaurant) {
      setSettings({
        name: restaurant.name,
        slug: restaurant.slug,
        description: restaurant.description || '',
        primary_color: restaurant.primary_color || '#000000',
      });
      setLoading(false);
    }
  }, [isAuthenticated, user, router, restaurant]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;
    
    try {
      setSaving(true);
      
      const { data, error } = await supabase
        .from('restaurants')
        .update({
          name: settings.name.trim(),
          slug: settings.slug.trim(),
          description: settings.description.trim() || null,
          primary_color: settings.primary_color,
        })
        .eq('id', restaurant.id)
        .select()
        .single();
      
      if (error) throw error;
      
      setRestaurant(data);
      alert('Settings saved successfully!');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      alert(`Failed to save settings: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSlugChange = (value: string) => {
    // Auto-format slug
    const formattedSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    setSettings({ ...settings, slug: formattedSlug });
  };

  const deleteRestaurant = async () => {
    if (!restaurant || !confirm('Are you sure? This will permanently delete your restaurant and all data. This cannot be undone.')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('restaurants')
        .delete()
        .eq('id', restaurant.id);
      
      if (error) throw error;
      
      // Clear local state and redirect
      setRestaurant(null);
      router.push('/');
    } catch (error: any) {
      console.error('Error deleting restaurant:', error);
      alert(`Failed to delete restaurant: ${error.message}`);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading settings..." />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b-2 border-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-black">Settings</h1>
                <p className="text-sm text-black">{restaurant?.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Restaurant Information */}
          <Card>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="flex items-center mb-6">
                <Info className="h-5 w-5 text-black mr-2" />
                <h2 className="text-lg font-semibold text-black">Restaurant Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Restaurant Name"
                  value={settings.name}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                  required
                  fullWidth
                />
                
                <Input
                  label="URL Slug"
                  value={settings.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  required
                  fullWidth
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Description
                </label>
                <textarea
                  value={settings.description}
                  onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Tell customers about your restaurant..."
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Brand Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={settings.primary_color}
                      onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                      className="w-12 h-12 border-2 border-black rounded-lg cursor-pointer"
                    />
                    <Input
                      value={settings.primary_color}
                      onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                      placeholder="#000000"
                      className="w-32"
                    />
                  </div>
                </div>
              </div>
              
              <Button
                type="submit"
                loading={saving}
                className="w-full md:w-auto"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </form>
          </Card>

          {/* Menu Website Preview */}
          <Card>
            <div className="flex items-center mb-6">
              <Globe className="h-5 w-5 text-black mr-2" />
              <h2 className="text-lg font-semibold text-black">Menu Website</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-black mb-2">Your menu website URL:</p>
                <div className="flex items-center space-x-2">
                  <code className="bg-white px-3 py-2 rounded-lg text-black border-2 border-black">
                    {typeof window !== 'undefined' ? window.location.origin : 'https://yourapp.com'}/menu/{settings.slug}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const url = `${window.location.origin}/menu/${settings.slug}`;
                      window.open(url, '_blank');
                    }}
                  >
                    Preview
                  </Button>
                </div>
              </div>
              
              <div className="p-4 border-2 border-black rounded-lg" style={{ backgroundColor: settings.primary_color }}>
                <div className="bg-white p-4 rounded-lg">
                  <h3 className="text-xl font-bold text-black">{settings.name || 'Your Restaurant'}</h3>
                  <p className="text-black mt-2">{settings.description || 'Your restaurant description'}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-600">
            <div className="flex items-center mb-6">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <h2 className="text-lg font-semibold text-red-600">Danger Zone</h2>
            </div>
            
            <div className="space-y-4">
              <p className="text-black">
                Once you delete your restaurant, there is no going back. Please be certain.
              </p>
              
              {!showDeleteConfirm ? (
                <Button
                  variant="danger"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Restaurant
                </Button>
              ) : (
                <div className="space-y-4">
                  <p className="font-semibold text-red-600">
                    Are you absolutely sure you want to delete your restaurant?
                  </p>
                  <p className="text-black">
                    This will permanently delete your restaurant, all menu items, tables, staff accounts, and order history.
                  </p>
                  <div className="flex space-x-3">
                    <Button
                      variant="danger"
                      onClick={deleteRestaurant}
                    >
                      Yes, Delete Forever
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}