'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUp, createRestaurant } from '@/lib/auth';
import { useAppStore } from '@/lib/store';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    restaurantName: '',
    restaurantSlug: '',
    description: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const { setUser, setRestaurant, setAuthenticated } = useAppStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Auto-generate slug from restaurant name
      ...(name === 'restaurantName' && {
        restaurantSlug: value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '')
      })
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      // Create auth user
      const { user: authUser } = await signUp(formData.email, formData.password);
      
      if (authUser) {
        // Create restaurant
        const restaurant = await createRestaurant(
          formData.restaurantName,
          formData.restaurantSlug,
          formData.description
        );
        
        // Set user state
        const userProfile = {
          id: authUser.id,
          email: formData.email,
          role: 'OWNER' as const,
          restaurant_id: restaurant.id,
          auth_user_id: authUser.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          restaurant: restaurant,
        };
        
        setUser(userProfile);
        setRestaurant(restaurant);
        setAuthenticated(true);
        
        router.push('/dashboard');
      }
    } catch (error: any) {
      setError(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-black">
            Register Your Restaurant
          </h2>
          <p className="mt-2 text-sm text-black">
            Get started with your restaurant management system
          </p>
        </div>
        
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              fullWidth
            />
            
            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              fullWidth
            />
            
            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              fullWidth
            />
            
            <Input
              label="Restaurant Name"
              type="text"
              name="restaurantName"
              value={formData.restaurantName}
              onChange={handleChange}
              required
              fullWidth
            />
            
            <Input
              label="Restaurant URL Slug"
              type="text"
              name="restaurantSlug"
              value={formData.restaurantSlug}
              onChange={handleChange}
              required
              fullWidth
            />
            
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Description (Optional)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-black rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Tell customers about your restaurant..."
              />
            </div>
            
            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
            
            <Button
              type="submit"
              loading={loading}
              fullWidth
              size="lg"
            >
              Create Restaurant
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-black">
              Already have an account?{' '}
              <a href="/login" className="font-medium text-black hover:underline">
                Sign in
              </a>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}