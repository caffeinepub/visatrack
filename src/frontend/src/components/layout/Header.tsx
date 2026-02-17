import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../../hooks/useQueries';
import { useHashRoute } from '../../hooks/useHashRoute';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, User, FileSearch } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function Header() {
  const { identity, clear, isLoggingIn } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const [route, setRoute] = useHashRoute();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setRoute('home')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <img
              src="/assets/generated/visatrack-logo.dim_512x512.png"
              alt="VisaTrack"
              className="h-10 w-10"
            />
            <span className="text-xl font-bold">VisaTrack</span>
          </button>

          <nav className="hidden md:flex items-center gap-2">
            <Button
              variant={route === 'visa-check' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setRoute('visa-check')}
            >
              <FileSearch className="mr-2 h-4 w-4" />
              Visa Check
            </Button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              {userProfile && (
                <div className="hidden sm:flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {getInitials(userProfile.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{userProfile.name}</span>
                </div>
              )}
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <Button disabled={isLoggingIn} variant="default" size="sm">
              <User className="mr-2 h-4 w-4" />
              {isLoggingIn ? 'Logging in...' : 'Login'}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
