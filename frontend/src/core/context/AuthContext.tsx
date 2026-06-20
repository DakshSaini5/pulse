import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '@core/services/api';

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
      if (!storedToken) {
        // No token at all — nothing to hydrate
        setLoading(false);
        return;
      }

      // --- Optimistic Hydration ---
      // Instantly paint the UI with the cached user from localStorage (0ms).
      // This eliminates the blank flash while we wait for a network round trip.
      const cachedUser = localStorage.getItem('pulse_user');
      if (cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
        } catch {
          // Corrupt cache — clear and proceed to server verify
          localStorage.removeItem('pulse_user');
        }
      }
      // Unblock the UI immediately — dashboard renders now
      setLoading(false);

      // --- Silent Background Verification ---
      // Validate the token with the server in the background.
      try {
        const freshUser = await authAPI.verifyToken();
        setUser(freshUser); // Refresh with latest server data (e.g. updated name/role)
      } catch (error: any) {
        // Only force logout if the server specifically rejected the token (401/403)
        // Network errors or 500s should just keep using the cached optimistic user
        if (error.response?.status === 401 || error.response?.status === 403) {
          authAPI.logout();
          setUser(null);
        } else {
          console.warn('[Pulse] Silent token verification failed due to network/server error. Using cached user.');
        }
      }
    };

    initAuth();
  }, []);

  const refreshUser = async () => {
    try {
      const userData = await authAPI.verifyToken();
      setUser(userData);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        authAPI.logout();
        setUser(null);
      }
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
