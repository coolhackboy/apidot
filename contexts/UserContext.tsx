"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { apiService } from "@/services/api";
import { appConfig } from "@/data/config";
import { pushUserData } from "@/utils/gtm-events";

interface UserContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        if (typeof window !== 'undefined') {
          const loggedIn = apiService.isLoggedInToApp(appConfig.appName);
          setIsLoggedIn(loggedIn);

          if (loggedIn) {
            try {
              const response = await apiService.getUserInfo(appConfig.appName);
              if (response.code === 200 && response.data) {
                pushUserData(response.data.email);
              }
            } catch (_) {}
          }
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  return (
    <UserContext.Provider value={{ isLoggedIn, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
};