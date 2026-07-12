import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../core/context/AuthContext';
import { ThemeProvider } from '../core/context/ThemeContext';
import { LocationProvider } from '../core/context/LocationContext';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { Comparison } from './pages/Comparison';
import { SavedHospitals } from './pages/SavedHospitals';
import { PrescriptionCenter } from './pages/PrescriptionCenter';
import { HealthTrends } from './pages/HealthTrends';
import { Terms } from './pages/Terms';

// Lazy load heavy pages
const Search = lazy(() => import('./pages/Search').then(m => ({ default: m.Search })));
const HospitalDetail = lazy(() => import('./pages/HospitalDetail').then(m => ({ default: m.HospitalDetail })));
const ReportCenter = lazy(() => import('./pages/ReportCenter').then(m => ({ default: m.ReportCenter })));
import { AdminDashboard } from './pages/AdminDashboard';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Forgot } from './pages/Forgot';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Privacy } from './pages/Privacy';
import { NotFound } from './pages/NotFound';
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Scroll to top of page on route transitions
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Handles Android hardware back button and splash screen
const NativeHandler: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const initNative = async () => {
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#0B0F19' });
        await SplashScreen.hide({ fadeOutDuration: 300 });
      } catch (e) {
        // Silently ignore if plugins fail
      }
    };
    initNative();

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

// Guard Route for Registered Users
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-transparent">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-primary animate-spin" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Guard Route for Admins
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-transparent">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-primary animate-spin" />
      </div>
    );
  }
  
  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/search" replace />;
  }
  
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <ScrollToTop />
        <NativeHandler />
        <AuthProvider>
          <ThemeProvider>
            <LocationProvider>
              <Layout>
                <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center bg-transparent"><div className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-primary animate-spin" /></div>}>
                <Routes>
                {/* Public Pages */}
                <Route path="/" element={<Landing />} />
                <Route path="/search" element={<Search />} />
                <Route path="/hospitals/:id" element={<HospitalDetail />} />
                <Route path="/compare" element={<Comparison />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot" element={<Forgot />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />

                {/* Guarded Dashboard Pages */}
                <Route 
                  path="/saved" 
                  element={
                    <ProtectedRoute>
                      <SavedHospitals />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/prescriptions" 
                  element={
                    <ProtectedRoute>
                      <PrescriptionCenter />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/reports" 
                  element={
                    <ProtectedRoute>
                      <ReportCenter />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/trends" 
                  element={
                    <ProtectedRoute>
                      <HealthTrends />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  } 
                />

                {/* Guarded Admin Dashboard */}
                <Route 
                  path="/admin" 
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  } 
                />

                {/* Fallback Redirect */}
                <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              </Layout>
            </LocationProvider>
          </ThemeProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
