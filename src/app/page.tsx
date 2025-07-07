'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { QrCode, Users, BarChart3, Smartphone, Store } from 'lucide-react';

export default function HomePage() {
  const { user, isAuthenticated } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect authenticated users to their appropriate dashboard
      switch (user.role) {
        case 'OWNER':
          router.push('/dashboard');
          break;
        case 'KITCHEN':
          router.push('/kitchen');
          break;
        case 'WAITSTAFF':
          router.push('/wait');
          break;
        case 'BARTENDER':
          router.push('/bar');
          break;
        default:
          router.push('/login');
      }
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-rose-100/30 to-pink-100/30"></div>
        <div className="relative max-w-4xl mx-auto px-6 py-32">
          <div className="text-center">
            <h1 className="text-3xl md:text-5xl font-extralight text-rose-900 mb-8 leading-relaxed">
              Restaurant Management
              <span className="block font-light">Made Beautifully Simple</span>
            </h1>
            <p className="text-base text-rose-600 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
              An elegant, complete restaurant management solution with QR code ordering, 
              real-time kitchen coordination, and intuitive staff interfaces.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/register')}
                className="bg-rose-300 text-rose-900 px-8 py-4 rounded-full text-sm font-light hover:bg-rose-400 transition-all duration-300 border-0 shadow-lg backdrop-blur-sm"
              >
                Start Your Restaurant
              </button>
              <button
                onClick={() => router.push('/login')}
                className="bg-white/50 text-rose-800 px-8 py-4 rounded-full text-sm font-light hover:bg-white/70 transition-all duration-300 border-0 backdrop-blur-sm"
              >
                Staff Login
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-2xl font-extralight text-rose-900 mb-6 leading-relaxed">
              Everything You Need to Run Your Restaurant
            </h2>
            <p className="text-sm text-rose-600 font-light max-w-2xl mx-auto">
              Streamline operations from kitchen to customer with our integrated platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-8 text-center hover:bg-white/60 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-rose-200 to-rose-300 rounded-full flex items-center justify-center mx-auto mb-6">
                <QrCode className="h-7 w-7 text-rose-800" />
              </div>
              <h3 className="text-base font-light text-rose-900 mb-4">QR Code Ordering</h3>
              <p className="text-xs text-rose-600 font-light leading-relaxed">
                Generate QR codes for tables. Customers scan to access menu and place orders directly.
              </p>
            </div>

            <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-8 text-center hover:bg-white/60 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-rose-200 to-rose-300 rounded-full flex items-center justify-center mx-auto mb-6">
                <Store className="h-7 w-7 text-rose-800" />
              </div>
              <h3 className="text-base font-light text-rose-900 mb-4">Kitchen Management</h3>
              <p className="text-xs text-rose-600 font-light leading-relaxed">
                Real-time order tracking with simple status updates. Large buttons optimized for kitchen use.
              </p>
            </div>

            <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-8 text-center hover:bg-white/60 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-rose-200 to-rose-300 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-7 w-7 text-rose-800" />
              </div>
              <h3 className="text-base font-light text-rose-900 mb-4">Staff Coordination</h3>
              <p className="text-xs text-rose-600 font-light leading-relaxed">
                Separate interfaces for kitchen, wait staff, and bartenders with role-based permissions.
              </p>
            </div>

            <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-8 text-center hover:bg-white/60 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-rose-200 to-rose-300 rounded-full flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="h-7 w-7 text-rose-800" />
              </div>
              <h3 className="text-base font-light text-rose-900 mb-4">Analytics Dashboard</h3>
              <p className="text-xs text-rose-600 font-light leading-relaxed">
                Track orders, revenue, and staff performance with detailed analytics and insights.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-2xl font-extralight text-rose-900 mb-6 leading-relaxed">
              How It Works
            </h2>
            <p className="text-sm text-rose-600 font-light">
              Get up and running in minutes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-rose-200 to-rose-300 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-rose-900 font-light text-xl">1</span>
              </div>
              <h3 className="text-base font-light text-rose-900 mb-4">Setup Your Menu</h3>
              <p className="text-xs text-rose-600 font-light leading-relaxed">
                Add your restaurant details, create categories, and upload your menu items with prices and descriptions.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-rose-200 to-rose-300 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-rose-900 font-light text-xl">2</span>
              </div>
              <h3 className="text-base font-light text-rose-900 mb-4">Generate QR Codes</h3>
              <p className="text-xs text-rose-600 font-light leading-relaxed">
                Create and print QR codes for each table. Customers scan to access your menu instantly.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-rose-200 to-rose-300 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-rose-900 font-light text-xl">3</span>
              </div>
              <h3 className="text-base font-light text-rose-900 mb-4">Manage Orders</h3>
              <p className="text-xs text-rose-600 font-light leading-relaxed">
                Staff receive orders in real-time. Kitchen, bar, and wait staff all have dedicated interfaces.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-br from-rose-100 to-pink-100 py-24">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-2xl font-extralight text-rose-900 mb-6 leading-relaxed">
            Ready to Transform Your Restaurant?
          </h2>
          <p className="text-sm text-rose-600 mb-12 font-light">
            Join restaurants already using our platform to streamline their operations
          </p>
          <button
            onClick={() => router.push('/register')}
            className="bg-rose-300 text-rose-900 px-8 py-4 rounded-full text-sm font-light hover:bg-rose-400 transition-all duration-300 border-0 shadow-lg"
          >
            Get Started Today
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white/60 backdrop-blur-sm py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center">
            <h3 className="text-base font-light text-rose-900 mb-3">Restaurant SaaS</h3>
            <p className="text-xs text-rose-600 font-light mb-8">Complete restaurant management solution</p>
            <div className="flex justify-center space-x-8">
              <a 
                href="/login" 
                className="text-xs text-rose-600 hover:text-rose-900 font-light transition-all duration-300"
              >
                Staff Login
              </a>
              <a 
                href="/register" 
                className="text-xs text-rose-600 hover:text-rose-900 font-light transition-all duration-300"
              >
                Register Restaurant
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
