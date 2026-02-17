import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { useHashRoute } from './hooks/useHashRoute';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import AustralianVisaCheckPage from './pages/AustralianVisaCheckPage';
import ProfileSetupModal from './components/profile/ProfileSetupModal';
import { Toaster } from '@/components/ui/sonner';

export default function App() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const [route] = useHashRoute();

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  // Visa check page is accessible to everyone
  if (route === 'visa-check') {
    return (
      <>
        <AustralianVisaCheckPage />
        <Toaster />
      </>
    );
  }

  // Home route - show landing, profile setup, or dashboard
  return (
    <>
      {!isAuthenticated ? (
        <LandingPage />
      ) : showProfileSetup ? (
        <ProfileSetupModal />
      ) : (
        <DashboardPage />
      )}
      <Toaster />
    </>
  );
}
