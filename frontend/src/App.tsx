import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { Search } from './pages/Search';
import { HospitalDetail } from './pages/HospitalDetail';
import { Comparison } from './pages/Comparison';
import { SavedHospitals } from './pages/SavedHospitals';
import { PrescriptionCenter } from './pages/PrescriptionCenter';
import { ReportCenter } from './pages/ReportCenter';
import { HealthTrends } from './pages/HealthTrends';
import { AdminDashboard } from './pages/AdminDashboard';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Guard Route for Registered Users
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-primary animate-spin" />
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-primary animate-spin" />
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
        <AuthProvider>
          <Layout>
            <Routes>
              {/* Public Pages */}
              <Route path="/" element={<Landing />} />
              <Route path="/search" element={<Search />} />
              <Route path="/hospitals/:id" element={<HospitalDetail />} />
              <Route path="/compare" element={<Comparison />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

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
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
