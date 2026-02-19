import React from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { useHashRoute } from './hooks/useHashRoute';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import AustralianVisaCheckPage from './pages/AustralianVisaCheckPage';
import ProfileSetupModal from './components/profile/ProfileSetupModal';
import { Toaster } from '@/components/ui/sonner';
import { AppErrorBoundary } from './components/errors/AppErrorBoundary';

export default function App() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const [route] = useHashRoute();

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  // Visa check page is accessible to everyone
  if (route === 'visa-check') {
    return (
      <AppErrorBoundary>
        <AustralianVisaCheckPage />
        <Toaster />
      </AppErrorBoundary>
    );
  }

  // Home route - show landing, profile setup, or dashboard
  return (
    <AppErrorBoundary>
      {!isAuthenticated ? (
        <LandingPage />
      ) : showProfileSetup ? (
        <ProfileSetupModal />
      ) : (
        <DashboardPage />
      )}
      <Toaster />
    </AppErrorBoundary>
  );
}
