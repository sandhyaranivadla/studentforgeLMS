'use client';

import React, { createContext, useContext, useState, useMemo } from 'react';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

export type Role = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name?: string | null;
  role: Role;
}

interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

function getInitialAuthState(): { user: User | null; token: string | null } {
  const storedToken = Cookies.get('token');
  if (!storedToken) return { user: null, token: null };
  try {
    const decoded = jwtDecode<JwtPayload>(storedToken);
    return {
      token: storedToken,
      user: { id: decoded.sub, email: decoded.email, role: decoded.role },
    };
  } catch {
    Cookies.remove('token');
    return { user: null, token: null };
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initial = useMemo(() => getInitialAuthState(), []);
  const [user, setUser] = useState<User | null>(initial.user);
  const [token, setToken] = useState<string | null>(initial.token);

  const login = (newToken: string) => {
    Cookies.set('token', newToken, { expires: 1 }); // 1 day
    const decoded = jwtDecode<JwtPayload>(newToken);
    setToken(newToken);
    setUser({
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    });
  };

  const logout = () => {
    Cookies.remove('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, isLoading: false }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
