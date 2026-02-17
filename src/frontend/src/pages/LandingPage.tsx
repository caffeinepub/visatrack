import AppLayout from '../components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Calendar, Bell, Shield, FileSearch } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useHashRoute } from '../hooks/useHashRoute';

export default function LandingPage() {
  const { login, isLoggingIn } = useInternetIdentity();
  const [, setRoute] = useHashRoute();

  return (
    <AppLayout>
      <div className="min-h-[calc(100vh-200px)] flex flex-col">
        {/* Hero Section */}
        <section className="flex-1 flex items-center justify-center py-12 md:py-20">
          <div className="container px-4 md:px-6">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="flex flex-col justify-center space-y-6">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Track Your Visa Status with Ease
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground text-lg md:text-xl">
                    A personal tracker to help you manage your visa details, expiry dates, and reminders—all in one secure place.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button size="lg" onClick={login} disabled={isLoggingIn} className="text-base">
                    {isLoggingIn ? 'Logging in...' : 'Get Started'}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setRoute('visa-check')}
                    className="text-base"
                  >
                    <FileSearch className="mr-2 h-5 w-5" />
                    Check Visa Status
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <img
                  src="/assets/generated/visa-hero.dim_1600x900.png"
                  alt="Visa tracking illustration"
                  className="rounded-2xl shadow-2xl w-full max-w-[600px]"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 md:py-20 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-4">
                Everything You Need to Stay Organized
              </h2>
              <p className="text-muted-foreground text-lg max-w-[800px] mx-auto">
                VisaTrack helps you keep track of important visa information and never miss a deadline.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader>
                  <CheckCircle2 className="h-10 w-10 mb-2 text-primary" />
                  <CardTitle>Secure Storage</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Store your visa details securely with Internet Identity authentication.
                  </CardDescription>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Calendar className="h-10 w-10 mb-2 text-primary" />
                  <CardTitle>Expiry Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Keep track of visa expiry dates and important milestones.
                  </CardDescription>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Bell className="h-10 w-10 mb-2 text-primary" />
                  <CardTitle>Smart Reminders</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Set custom reminders to stay ahead of important dates.
                  </CardDescription>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Shield className="h-10 w-10 mb-2 text-primary" />
                  <CardTitle>Privacy First</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Your data is private and accessible only to you.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
