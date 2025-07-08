'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { signUp, createRestaurant } from '@/lib/auth';
import { useAppStore } from '@/lib/store';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import Container from '@/components/ui/Container';

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
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Container size="sm">
        <motion.div 
          className="max-w-md mx-auto space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center">
            <h2 className="text-3xl font-medium text-foreground mb-2">
              Register Your Restaurant
            </h2>
            <p className="text-muted">
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
              <label className="block text-sm font-medium text-foreground mb-2">
                Description (Optional)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border border-border rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent transition-all duration-200 bg-white text-foreground placeholder:text-muted shadow-soft hover:shadow-medium resize-none"
                placeholder="Tell customers about your restaurant..."
              />
            </div>
            
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-error text-sm"
              >
                {error}
              </motion.div>
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
            <p className="text-sm text-muted">
              Already have an account?{' '}
              <a href="/login" className="font-medium text-foreground hover:text-accent transition-colors">
                Sign in
              </a>
            </p>
          </div>
        </Card>
        </motion.div>
      </Container>
    </div>
  );
}