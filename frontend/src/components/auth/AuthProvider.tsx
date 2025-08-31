import React from 'react';
import type { ReactNode } from 'react';
import { AuthProvider as AuthProviderImpl } from '@/contexts/AuthContext';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  return <AuthProviderImpl>{children}</AuthProviderImpl>;
};
