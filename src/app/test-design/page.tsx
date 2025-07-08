'use client';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Container from '@/components/ui/Container';
import Grid from '@/components/ui/Grid';

export default function TestDesignPage() {
  return (
    <div className="min-h-screen bg-background py-12">
      <Container>
        <div className="text-center mb-12">
          <h1 className="text-4xl font-medium text-foreground mb-4">
            Design System Test
          </h1>
          <p className="text-muted">
            Testing the new clean, minimal design system
          </p>
        </div>

        <Grid cols={2} gap="lg">
          <Card>
            <h2 className="text-xl font-medium text-foreground mb-4">Buttons</h2>
            <div className="space-y-4">
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="success">Success Button</Button>
              <Button variant="danger">Danger Button</Button>
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-medium text-foreground mb-4">Form Elements</h2>
            <div className="space-y-4">
              <Input label="Email" placeholder="Enter your email" />
              <Input label="Password" type="password" placeholder="Enter password" />
              <Input label="With Error" error="This field is required" />
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-medium text-foreground mb-4">Badges</h2>
            <div className="space-y-2">
              <div><Badge variant="default">Default</Badge></div>
              <div><Badge variant="success">Success</Badge></div>
              <div><Badge variant="warning">Warning</Badge></div>
              <div><Badge variant="error">Error</Badge></div>
              <div><Badge variant="secondary">Secondary</Badge></div>
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-medium text-foreground mb-4">Typography</h2>
            <div className="space-y-2">
              <h1 className="text-3xl font-medium text-foreground">Heading 1</h1>
              <h2 className="text-2xl font-medium text-foreground">Heading 2</h2>
              <h3 className="text-xl font-medium text-foreground">Heading 3</h3>
              <p className="text-foreground">Regular paragraph text</p>
              <p className="text-muted">Muted text</p>
              <p className="text-sm text-muted">Small muted text</p>
            </div>
          </Card>
        </Grid>

        <div className="mt-12 text-center">
          <Card className="inline-block">
            <h3 className="text-lg font-medium text-foreground mb-2">
              Color Scheme
            </h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary rounded-lg mx-auto mb-2"></div>
                <span className="text-sm text-muted">Primary</span>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-accent rounded-lg mx-auto mb-2"></div>
                <span className="text-sm text-muted">Accent</span>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-success rounded-lg mx-auto mb-2"></div>
                <span className="text-sm text-muted">Success</span>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-error rounded-lg mx-auto mb-2"></div>
                <span className="text-sm text-muted">Error</span>
              </div>
            </div>
          </Card>
        </div>
      </Container>
    </div>
  );
}