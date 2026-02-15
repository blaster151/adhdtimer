'use client';

import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from '@/components/auth/auth-provider';

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider. Wrap your app in <AuthProvider>.');
  }

  return context;
}
