// @ts-nocheck
import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../core/context/AuthContext';
import { ThemeProvider } from '../core/context/ThemeContext';
import { LocationProvider } from '../core/context/LocationContext';
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

import { LandingScreen } from './screens/LandingScreen';
import { HomeScreen } from './screens/HomeScreen';
import { DiscoverScreen } from './screens/DiscoverScreen';
import { HospitalCompareScreen } from './screens/HospitalCompareScreen';
import { RecordsScreen } from './screens/RecordsScreen';
import { TrendsScreen } from './screens/TrendsScreen';

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

// Handles Android hardware back button
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

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

import { ErrorBoundary } from '../core/components/ErrorBoundary';

export const MobileApp: React.FC = () => {
  // Initialize native Android UI on mount
  useEffect(() => {
    const initNative = async () => {
      try {
        // Style the status bar to match Pulse dark theme
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#0B0F19' });
        // Hide splash screen after a short delay so WebView has time to paint
        await SplashScreen.hide({ fadeOutDuration: 300 });
      } catch (e) {
        // Not running natively — silently ignore
      }
    };
    initNative();
  }, []);

  return (
    <div className="w-full h-full min-h-screen pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] bg-[#F8FAFC] dark:bg-[#0B0F19]">
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <Router>
            <ScrollToTop />
            <AndroidBackHandler />
            <AuthProvider>
              <ThemeProvider>
                <LocationProvider>
                  <Suspense fallback={<div className="flex-1 w-full h-full bg-[#F8FAFC] dark:bg-[#0B0F19]" />}>
                    <Routes>
                      <Route path="/" element={<LandingScreen />} />
                      <Route 
                        path="/home" 
                        element={
                          <ProtectedRoute>
                            <HomeScreen />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/discover" 
                        element={
                          <ProtectedRoute>
                            <DiscoverScreen activeScreen="discover" />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/compare" 
                        element={
                          <ProtectedRoute>
                            <HospitalCompareScreen />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/records" 
                        element={
                          <ProtectedRoute>
                            <RecordsScreen activeScreen="records" />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/trends" 
                        element={
                          <ProtectedRoute>
                            <TrendsScreen activeScreen="trends" />
                          </ProtectedRoute>
                        } 
                      />
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
