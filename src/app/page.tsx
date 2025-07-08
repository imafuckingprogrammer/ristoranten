'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import Grid from '@/components/ui/Grid';
import { QrCode, Users, BarChart3, Store } from 'lucide-react';

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
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-24 lg:py-32">
        <Container>
          <motion.div 
            className="text-center max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-normal text-foreground mb-6 leading-tight">
              Restaurant Management
              <span className="block text-muted">Made Simple</span>
            </h1>
            <p className="text-lg text-muted mb-12 max-w-2xl mx-auto leading-relaxed">
              Complete restaurant management solution with QR code ordering, 
              real-time kitchen coordination, and intuitive staff interfaces.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => router.push('/register')}
                size="lg"
                className="px-8"
              >
                Start Your Restaurant
              </Button>
              <Button
                onClick={() => router.push('/login')}
                variant="secondary"
                size="lg"
                className="px-8"
              >
                Staff Login
              </Button>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-surface">
        <Container>
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-medium text-foreground mb-4">
              Everything You Need
            </h2>
            <p className="text-muted max-w-2xl mx-auto">
              Streamline operations from kitchen to customer with our integrated platform
            </p>
          </motion.div>

          <Grid cols={2} gap="lg">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <Card padding="lg" className="text-center h-full">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-6">
                  <QrCode className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-4">QR Code Ordering</h3>
                <p className="text-muted leading-relaxed">
                  Generate QR codes for tables. Customers scan to access menu and place orders directly.
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Card padding="lg" className="text-center h-full">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-6">
                  <Store className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-4">Kitchen Management</h3>
                <p className="text-muted leading-relaxed">
                  Real-time order tracking with simple status updates. Large buttons optimized for kitchen use.
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <Card padding="lg" className="text-center h-full">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-6">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-4">Staff Coordination</h3>
                <p className="text-muted leading-relaxed">
                  Separate interfaces for kitchen, wait staff, and bartenders with role-based permissions.
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <Card padding="lg" className="text-center h-full">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-6">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-4">Analytics Dashboard</h3>
                <p className="text-muted leading-relaxed">
                  Track orders, revenue, and staff performance with detailed analytics and insights.
                </p>
              </Card>
            </motion.div>
          </Grid>
        </Container>
      </section>

      {/* How It Works Section */}
      <section className="py-24">
        <Container>
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-medium text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted">
              Get up and running in minutes
            </p>
          </motion.div>

          <Grid cols={3} gap="lg">
            {[
              {
                step: '1',
                title: 'Setup Your Menu',
                description: 'Add your restaurant details, create categories, and upload your menu items with prices and descriptions.'
              },
              {
                step: '2',
                title: 'Generate QR Codes',
                description: 'Create and print QR codes for each table. Customers scan to access your menu instantly.'
              },
              {
                step: '3',
                title: 'Manage Orders',
                description: 'Staff receive orders in real-time. Kitchen, bar, and wait staff all have dedicated interfaces.'
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-medium">
                  <span className="text-white font-medium text-lg">{item.step}</span>
                </div>
                <h3 className="text-lg font-medium text-foreground mb-4">{item.title}</h3>
                <p className="text-muted leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </Grid>
        </Container>
      </section>

      {/* Call to Action */}
      <section className="py-24 bg-surface">
        <Container>
          <motion.div 
            className="text-center max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-medium text-foreground mb-4">
              Ready to Transform Your Restaurant?
            </h2>
            <p className="text-muted mb-8">
              Join restaurants already using our platform to streamline their operations
            </p>
            <Button
              onClick={() => router.push('/register')}
              size="lg"
              className="px-8"
            >
              Get Started Today
            </Button>
          </motion.div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-white">
        <Container>
          <div className="text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">Restaurant SaaS</h3>
            <p className="text-muted mb-8">Complete restaurant management solution</p>
            <div className="flex justify-center space-x-8">
              <a 
                href="/login" 
                className="text-muted hover:text-foreground transition-colors"
              >
                Staff Login
              </a>
              <a 
                href="/register" 
                className="text-muted hover:text-foreground transition-colors"
              >
                Register Restaurant
              </a>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
