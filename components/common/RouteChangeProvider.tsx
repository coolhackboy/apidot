"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

// Create a context for route change state
type RouteChangeContextType = {
  isRouteChanging: boolean;
  setIsRouteChanging: (isChanging: boolean) => void;
};

const RouteChangeContext = createContext<RouteChangeContextType | undefined>(undefined);

// Hook to use the route change context
export function useRouteChange() {
  const context = useContext(RouteChangeContext);
  
  if (!context) {
    throw new Error("useRouteChange must be used within a RouteChangeProvider");
  }
  
  return context;
}

// Provider component for route change events
export function RouteChangeProvider({ children }: { children: ReactNode }) {
  const [isRouteChanging, setIsRouteChanging] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Store previous path to detect actual navigation
  const [prevPathname, setPrevPathname] = useState(pathname);
  const [prevSearchParams, setPrevSearchParams] = useState(searchParams.toString());

  // Handle route changes
  useEffect(() => {
    // Function to start loading with a minimum display time
    const startLoading = () => {
      setIsRouteChanging(true);
    };

    // Function to stop loading after a slight delay for better UX
    const stopLoading = () => {
      // Add a small delay to ensure the loading indicator is visible even for fast navigations
      setTimeout(() => {
        setIsRouteChanging(false);
      }, 300);
    };

    // Check if navigation is actually happening by comparing current and previous paths
    const currentSearchParams = searchParams.toString();
    if (prevPathname !== pathname || prevSearchParams !== currentSearchParams) {
      // Navigation has started
      startLoading();
      
      // Update previous values
      setPrevPathname(pathname);
      setPrevSearchParams(currentSearchParams);
      
      // Navigation has completed (we've reached this point)
      stopLoading();
    }

    // Additionally listen for beforeunload for external navigations
    window.addEventListener("beforeunload", startLoading);
    
    return () => {
      window.removeEventListener("beforeunload", startLoading);
    };
  }, [pathname, searchParams, prevPathname, prevSearchParams]);

  // Create memoized context value
  const contextValue = {
    isRouteChanging,
    setIsRouteChanging,
  };

  return (
    <RouteChangeContext.Provider value={contextValue}>
      {children}
    </RouteChangeContext.Provider>
  );
} 