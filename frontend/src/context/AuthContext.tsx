import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

interface User {
  id: string;
  email: string;
  mobileNumber?: string;
  name: string;
  role: string;
  authProvider?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  register: (name: string, email: string, mobileNumber: string, password: string, code: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('pulse_token');
      if (storedToken) {
        try {
          // Actually verify the token with the backend
          const userData = await authAPI.verifyToken();
          setUser(userData);
        } catch (err) {
          // Token is invalid/expired
          authAPI.logout();
        }
      }
      setLoading(false);
    };
    
    initAuth();
  }, []);

  const refreshUser = async () => {
    try {
      const userData = await authAPI.verifyToken();
      setUser(userData);
    } catch (err) {
      authAPI.logout();
      setUser(null);
    }
  };

  const login = async (identifier: string, password: string) => {
    setLoading(true);
    try {
      const data = await authAPI.login(identifier, password);
      setUser(data.user);
    } catch (err) {
      setLoading(false);
      throw err; // BUG-13 FIX: re-throw so Login.tsx can show the error toast
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async (credential: string) => {
    setLoading(true);
    try {
      const data = await authAPI.googleAuth(credential);
      setUser(data.user);
    } catch (err) {
      setLoading(false);
      throw err; // BUG-13 FIX
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, mobileNumber: string, password: string, code: string) => {
    setLoading(true);
    try {
      const data = await authAPI.register(name, email, mobileNumber, password, code);
      setUser(data.user);
    } catch (err) {
      setLoading(false);
      throw err; // BUG-13 FIX
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, googleLogin, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
