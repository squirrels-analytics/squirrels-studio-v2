import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ProjectMetadataResponse } from '@/types/project-metadata-response';
import type { UserInfo } from '@/types/auth-responses';
import type { ExploreEndpointsResponse } from '@/types/explore-endpoints-response';
import { logout } from '@/lib/squirrels-api';

// Utils

function getHostUrl(searchParams: URLSearchParams): string | null {
  const queryHostUrl = searchParams.get('hostUrl');
  if (queryHostUrl) {
    return queryHostUrl;
  }
  
  const defaultHostUrl = window.DEFAULT_HOSTURL;
  if (defaultHostUrl && typeof defaultHostUrl === 'string' && defaultHostUrl.trim()) {
    return defaultHostUrl.trim();
  }
  
  return null;
}

function getCurrentPathnameFromHash(): string {
  // HashRouter paths look like: "#/explorer?hostUrl=..."
  const raw = window.location.hash.replace(/^#/, '');
  const path = raw.split('?')[0] || '/';
  return path.startsWith('/') ? path : `/${path}`;
}

// Context

export const PROTECTED_PATHS = ['/explorer', '/user-settings', '/manage-users'];

interface AppContextType {
  hostUrl: string | null;
  isHostUrlInQuery: boolean;
  setHostUrl: (url: string | null) => void;
  userProps: UserInfo | null;
  isGuest: boolean;
  sessionExpiry: number | null;
  setRegisteredSession: (user: UserInfo, sessionExpiryTimestamp: number) => void;
  setGuestSession: () => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  projectMetadata: ProjectMetadataResponse | null;
  setProjectMetadata: (metadata: ProjectMetadataResponse | null) => void;
  exploreEndpoints: ExploreEndpointsResponse | null;
  setExploreEndpoints: (endpoints: ExploreEndpointsResponse | null) => void;
  isSessionExpiredModalOpen: boolean;
  setIsSessionExpiredModalOpen: (isOpen: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [searchParams] = useSearchParams();
  const isHostUrlInQuery = searchParams.has('hostUrl');

  const [hostUrl, setHostUrl] = useState<string | null>(() => {
    // Initialize from URL params if available
    const searchParams = new URLSearchParams(window.location.hash.split('?')[1]);
    return getHostUrl(searchParams);
  });
  
  const [userProps, setUserProps] = useState<UserInfo | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [sessionExpiry, setSessionExpiry] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [projectMetadata, setProjectMetadata] = useState<ProjectMetadataResponse | null>(null);
  const [exploreEndpoints, setExploreEndpoints] = useState<ExploreEndpointsResponse | null>(null);
  const [isSessionExpiredModalOpen, setIsSessionExpiredModalOpen] = useState<boolean>(false);

  const sessionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSessionTimeout = useCallback(() => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
      sessionTimeoutRef.current = null;
    }
  }, []);

  const setGuestSession = useCallback(() => {
    clearSessionTimeout();
    setUserProps(null);
    setIsGuest(true);
    setSessionExpiry(null);
    setIsSessionExpiredModalOpen(false);
  }, [clearSessionTimeout]);

  const setRegisteredSession = useCallback((user: UserInfo, sessionExpiryTimestamp: number) => {
    clearSessionTimeout();
    setIsSessionExpiredModalOpen(false);
    setUserProps(user);
    setIsGuest(false);
    setSessionExpiry(sessionExpiryTimestamp);

    const remainingMs = sessionExpiryTimestamp * 1000 - Date.now();
    sessionTimeoutRef.current = setTimeout(() => {
      const currentPath = getCurrentPathnameFromHash();
      const isOnProtectedPath = PROTECTED_PATHS.includes(currentPath);

      // If the user isn't currently viewing a protected page, silently clear the
      // session; they'll be treated as a guest next time they go to a protected page.
      if (!isOnProtectedPath) {
        setGuestSession();
        return;
      }

      // Session expired while on a protected page: best-effort logout + modal.
      clearSessionTimeout();
      setUserProps(null);
      setSessionExpiry(null);
      setIsSessionExpiredModalOpen(true);
      if (projectMetadata) {
        void logout(projectMetadata.api_routes.logout_url).catch((err) => {
          console.error('Logout error during session expiry:', err);
        });
      }
    }, Math.max(remainingMs, 0));
  }, [clearSessionTimeout, projectMetadata, setGuestSession]);

  const value = useMemo(() => ({
    hostUrl,
    isHostUrlInQuery,
    setHostUrl,
    userProps,
    isGuest,
    sessionExpiry,
    setRegisteredSession,
    setGuestSession,
    isLoading,
    setIsLoading,
    projectMetadata,
    setProjectMetadata,
    exploreEndpoints,
    setExploreEndpoints,
    isSessionExpiredModalOpen,
    setIsSessionExpiredModalOpen
  }), [
    hostUrl,
    isHostUrlInQuery,
    userProps,
    isGuest,
    sessionExpiry,
    setRegisteredSession,
    setGuestSession,
    isLoading,
    projectMetadata,
    exploreEndpoints,
    isSessionExpiredModalOpen
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Hooks

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
