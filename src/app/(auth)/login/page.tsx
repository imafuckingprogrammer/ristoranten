'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, getUserProfile, getRoleBasedRedirectPath } from '@/lib/auth';
import { useAppStore } from '@/lib/store';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const { setUser, setRestaurant, setAuthenticated } = useAppStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { user: authUser } = await signIn(email, password);
      
      if (authUser) {
        const userProfile = await getUserProfile(authUser.id);
        
        if (userProfile) {
          setUser(userProfile);
          setRestaurant(userProfile.restaurant);
          setAuthenticated(true);
          
          const redirectPath = getRoleBasedRedirectPath(userProfile.role);
          router.push(redirectPath);
        } else {
          setError('User profile not found. Please contact your administrator.');
        }
      }
    } catch (error: any) {
      setError(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-black">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-black">
            Restaurant Management System
          </p>
        </div>
        
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
            />
            
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
            />
            
            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
            
            <Button
              type="submit"
              loading={loading}
              fullWidth
              size="lg"
            >
              Sign in
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-black">
              Don't have an account?{' '}
              <a href="/register" className="font-medium text-black hover:underline">
                Register your restaurant
              </a>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}