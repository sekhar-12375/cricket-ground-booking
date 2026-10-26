import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Admin, UserRole } from '../types';
import { authApi, getToken } from '../services/api';

interface AuthContextType {
  user: (User | Admin) | null;
  role: UserRole | null;
  isLoading: boolean;
  login: (email: string, password: string, role?: 'USER' | 'ADMIN') => Promise<{ success: boolean; message: string }>;
  register: (data: { name: string; phone: string; email: string; password: string; confirmPassword?: string }) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<(User | Admin) | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setRole(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await authApi.getMe();
      if (res.success && res.data) {
        setUser(res.data);
        setRole(res.data.role);
      } else {
        setUser(null);
        setRole(null);
      }
    } catch {
      setUser(null);
      setRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string, targetRole?: 'USER' | 'ADMIN') => {
    setIsLoading(true);
    try {
      const res = await authApi.login({ email, password, role: targetRole });
      if (res.success && res.data) {
        setUser(res.data.user);
        setRole(res.data.user.role);
        return { success: true, message: res.message || 'Login successful' };
      } else {
        return { success: false, message: res.message || 'Invalid email or password.' };
      }
    } catch {
      return { success: false, message: 'Invalid email or password.' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { name: string; phone: string; email: string; password: string; confirmPassword?: string }) => {
    setIsLoading(true);
    try {
      const res = await authApi.register(data);
      if (res.success) {
        return { success: true, message: res.message || 'Registration successful.' };
      }
      return { success: false, message: res.message || 'Registration failed.' };
    } catch {
      return { success: false, message: 'Registration failed. Please check inputs.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setRole(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
