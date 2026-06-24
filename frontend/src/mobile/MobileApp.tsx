// @ts-nocheck
import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '../core/context/AuthContext';
import { ThemeProvider } from '../core/context/ThemeContext';
import { LocationProvider } from '../core/context/LocationContext';
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { ErrorBoundary } from '../core/components/ErrorBoundary';

import { LoginScreen } from './screens/LandingScreen';
import { HomeScreen } from './screens/HomeScreen';
import { DiscoverScreen } from './screens/DiscoverScreen';
import { HospitalCompareScreen } from './screens/HospitalCompareScreen';
import { RecordsScreen } from './screens/RecordsScreen';
import { TrendsScreen } from './screens/TrendsScreen';
import { BottomNav } from './screens/BottomNav';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Handles Android hardware back button — navigates back or minimizes app
const AndroidBackHandler: React.FC = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const listener = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        navigate(-1);
      } else {
        CapacitorApp.minimizeApp();
      }
    });
    return () => { listener.then(l => l.remove()); };
  }, [navigate]);
  return null;
};

// Redirects logged-in users away from login screen to /home
const AuthRedirect: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <MobileLoadingScreen />;
  if (user) return <Navigate to="/home" replace />;
  return <>{children}</>;
};

// Protects authenticated routes
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <MobileLoadingScreen />;
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

// Shows bottom nav on authenticated screens
const AuthenticatedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      {children}
      <BottomNav />
    </>
  );
};

// Minimal loading screen matching the app theme
const MobileLoadingScreen: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-[#0B0F19]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-3 border-[#1E60D5] border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-slate-400 font-medium">Loading Pulse...</p>
    </div>
  </div>
);

export const MobileApp: React.FC = () => {
  useEffect(() => {
    const initNative = async () => {
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#0B0F19' });
        await SplashScreen.hide({ fadeOutDuration: 300 });
      } catch (e) {
        // Not running natively — silently ignore
      }
    };
    initNative();
  }, []);

  return (
    <div className="w-full h-full min-h-screen pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] bg-[#0B0F19]">
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <Router>
            <ScrollToTop />
            <AndroidBackHandler />
            <AuthProvider>
              <ThemeProvider>
                <LocationProvider>
                  <Toaster
                    position="top-center"
                    toastOptions={{
                      style: { background: '#1E293B', color: '#F1F5F9', border: '1px solid #334155', fontSize: '13px' },
                    }}
                  />
                  <Suspense fallback={<MobileLoadingScreen />}>
                    <Routes>
                      {/* Login — skip if already authenticated */}
                      <Route path="/" element={<AuthRedirect><LoginScreen /></AuthRedirect>} />

                      {/* Authenticated routes with bottom nav */}
                      <Route path="/home" element={<ProtectedRoute><AuthenticatedLayout><HomeScreen /></AuthenticatedLayout></ProtectedRoute>} />
                      <Route path="/discover" element={<ProtectedRoute><AuthenticatedLayout><DiscoverScreen activeScreen="discover" /></AuthenticatedLayout></ProtectedRoute>} />
                      <Route path="/compare" element={<ProtectedRoute><AuthenticatedLayout><HospitalCompareScreen /></AuthenticatedLayout></ProtectedRoute>} />
                      <Route path="/records" element={<ProtectedRoute><AuthenticatedLayout><RecordsScreen activeScreen="records" /></AuthenticatedLayout></ProtectedRoute>} />
                      <Route path="/trends" element={<ProtectedRoute><AuthenticatedLayout><TrendsScreen activeScreen="trends" /></AuthenticatedLayout></ProtectedRoute>} />

                      {/* Catch-all */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </LocationProvider>
              </ThemeProvider>
            </AuthProvider>
          </Router>
        </QueryClientProvider>
      </ErrorBoundary>
    </div>
  );
};

export default MobileApp;
