// @ts-nocheck
import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../core/context/AuthContext';
import { ThemeProvider } from '../core/context/ThemeContext';
import { LocationProvider } from '../core/context/LocationContext';

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

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

import { ErrorBoundary } from '../core/components/ErrorBoundary';

export const MobileApp: React.FC = () => {
  return (
    <div className="w-full h-full min-h-screen pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] bg-[#F8FAFC] dark:bg-[#0B0F19]">
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <Router>
            <ScrollToTop />
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
