'use client';

import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { appConfig } from '@/data/config';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const isLoggedIn = apiService.isLoggedInToApp(appConfig.appName);
      setIsAuthenticated(isLoggedIn);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  return {
    isAuthenticated,
    isLoading,
  };
} 