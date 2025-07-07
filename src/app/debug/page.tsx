'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { 
  User, 
  Trash2, 
  Play, 
  ChefHat, 
  Coffee, 
  Utensils,
  Crown,
  Database,
  RefreshCw
} from 'lucide-react';

export default function DebugPage() {
  const [loading, setLoading] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const { setUser, setRestaurant, user } = useAppStore();
  const supabase = createClient();

  const roles = [
    { id: 'OWNER', name: 'Restaurant Owner', icon: Crown, color: 'bg-purple-100', path: '/dashboard' },
    { id: 'KITCHEN', name: 'Kitchen Staff', icon: ChefHat, color: 'bg-orange-100', path: '/kitchen' },
    { id: 'WAITSTAFF', name: 'Wait Staff', icon: Utensils, color: 'bg-blue-100', path: '/wait' },
    { id: 'BARTENDER', name: 'Bartender', icon: Coffee, color: 'bg-green-100', path: '/bar' },
  ];

  const createDemoSession = async (role: string) => {
    try {
      setLoading(role);
      setMessage('');

      // Use the current user's restaurant if available, otherwise create demo restaurant
      const currentRestaurant = user?.restaurant;
      const restaurantData = currentRestaurant || {
        id: 'demo-restaurant-id',
        name: 'Demo Restaurant',
        slug: 'demo-restaurant',
        description: 'A demo restaurant for testing',
        owner_id: 'demo-owner-id',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Create demo user session
      const demoUser = {
        id: `demo_${role.toLowerCase()}_${Date.now()}`,
        email: `demo.${role.toLowerCase()}@restaurant.com`,
        role: role as any,
        restaurant_id: restaurantData.id,
        auth_user_id: `demo_auth_${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        restaurant: restaurantData
      };

      // Set user and restaurant in store
      setUser(demoUser);
      setRestaurant(restaurantData);
      
      // Get the path for this role
      const roleConfig = roles.find(r => r.id === role);
      const path = roleConfig?.path || '/dashboard';
      
      setMessage(`Demo session created for ${role}! Redirecting...`);
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push(path);
      }, 1000);

    } catch (error: any) {
      console.error('Error creating demo session:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading('');
    }
  };

  const cleanupDemoData = async () => {
    try {
      setLoading('cleanup');
      setMessage('');

      // Clear user and restaurant from store
      setUser(null);
      setRestaurant(null);
      
      // In a real app, you would clean up demo data from the database
      // For now, we'll just clear the local state
      
      setMessage('Demo data cleaned up successfully!');
      
      // Redirect to home
      setTimeout(() => {
        router.push('/');
      }, 1000);

    } catch (error: any) {
      console.error('Error cleaning up demo data:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading('');
    }
  };

  const refreshPage = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-black mb-4">Debug Dashboard</h1>
          <p className="text-lg text-black">
            Create demo sessions for testing different user roles and system functionality
          </p>
          
          {user && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg"
            >
              <p className="text-green-800 font-medium">
                Current Session: {user.role} - {user.email}
              </p>
            </motion.div>
          )}
          
          {message && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`mt-4 p-4 rounded-lg ${
                message.includes('Error') 
                  ? 'bg-red-50 border border-red-200 text-red-800' 
                  : 'bg-blue-50 border border-blue-200 text-blue-800'
              }`}
            >
              <p className="font-medium">{message}</p>
            </motion.div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {roles.map((role, index) => {
            const Icon = role.icon;
            return (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="text-center hover:shadow-xl">
                  <div className={`inline-flex p-4 rounded-full ${role.color} mb-4`}>
                    <Icon className="h-8 w-8 text-black" />
                  </div>
                  <h3 className="text-lg font-semibold text-black mb-2">{role.name}</h3>
                  <p className="text-sm text-black mb-4">
                    Access {role.name.toLowerCase()} interface
                  </p>
                  <Button
                    onClick={() => createDemoSession(role.id)}
                    loading={loading === role.id}
                    fullWidth
                    className="bg-black text-white"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Demo
                  </Button>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <Card className="text-center">
            <Database className="h-12 w-12 text-black mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-black mb-2">Clean Demo Data</h3>
            <p className="text-sm text-black mb-4">
              Remove all demo sessions and reset the application
            </p>
            <Button
              onClick={cleanupDemoData}
              loading={loading === 'cleanup'}
              variant="danger"
              fullWidth
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clean Up
            </Button>
          </Card>

          <Card className="text-center">
            <RefreshCw className="h-12 w-12 text-black mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-black mb-2">Refresh Page</h3>
            <p className="text-sm text-black mb-4">
              Reload the page to reset any cached state
            </p>
            <Button
              onClick={refreshPage}
              variant="secondary"
              fullWidth
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </Card>

          <Card className="text-center">
            <User className="h-12 w-12 text-black mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-black mb-2">Real Login</h3>
            <p className="text-sm text-black mb-4">
              Go to the real login page for production use
            </p>
            <Button
              onClick={() => router.push('/login')}
              variant="outline"
              fullWidth
            >
              <User className="h-4 w-4 mr-2" />
              Login
            </Button>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8 p-6 bg-gray-50 border border-black rounded-lg"
        >
          <h3 className="text-lg font-semibold text-black mb-4">Debug Instructions</h3>
          <div className="space-y-2 text-sm text-black">
            <p>• <strong>Demo Sessions:</strong> Click any role to create a temporary session with full access</p>
            <p>• <strong>Role Access:</strong> All roles can access all interfaces for testing purposes</p>
            <p>• <strong>Data:</strong> Demo sessions use mock data and don't affect the real database</p>
            <p>• <strong>Cleanup:</strong> Use the cleanup button to clear all demo sessions</p>
            <p>• <strong>QR Codes:</strong> Test QR code generation and scanning functionality</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}