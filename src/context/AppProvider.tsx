import React, {
  useCallback,
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
import { PROTECTED_PATHS } from '@/lib/access';
import { AppContext } from './AppContext';

// Utils

function getOrigin(searchParams: URLSearchParams): string | null {
  const queryOrigin = searchParams.get('origin');
  if (queryOrigin !== null) {
    return queryOrigin;
  }
  
  const defaultOrigin = window.DEFAULT_ORIGIN;
  if (defaultOrigin && typeof defaultOrigin === 'string') {
    return defaultOrigin.trim();
  }
  
  return null;
}

function getMountPath(searchParams: URLSearchParams): string | null {
  const queryMountPath = searchParams.get('mountPath');
  if (queryMountPath !== null) {
    return queryMountPath;
  }
  
  const defaultMountPath = window.DEFAULT_MOUNTPATH;
  if (defaultMountPath && typeof defaultMountPath === 'string') {
    return defaultMountPath.trim();
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

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [searchParams] = useSearchParams();
  const isConnectionInQuery = searchParams.has('origin') || searchParams.has('mountPath');

  const [origin, setOrigin] = useState<string | null>(() => {
    const searchParams = new URLSearchParams(window.location.hash.split('?')[1]);
    return getOrigin(searchParams);
  });

  const [mountPath, setMountPath] = useState<string | null>(() => {
    const searchParams = new URLSearchParams(window.location.hash.split('?')[1]);
    return getMountPath(searchParams);
  });

  const setConnection = useCallback((newOrigin: string | null, newMountPath: string | null) => {
    setOrigin(newOrigin);
    setMountPath(newMountPath);
  }, []);
  
  const [userProps, setUserProps] = useState<UserInfo | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [sessionExpiry, setSessionExpiry] = useState<number | null>(null);
  // Ref-counted loading to avoid overlapping async operations fighting each other.
  const [loadingCount, setLoadingCount] = useState<number>(0);
  const isLoading = loadingCount > 0;
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

  const setIsLoading = useCallback((loading: boolean) => {
    setLoadingCount((prev) => {
      if (loading) return prev + 1;
      return Math.max(0, prev - 1);
    });
  }, []);

  const value = useMemo(() => ({
    origin,
    mountPath,
    isConnectionInQuery,
    setConnection,
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
    origin,
    mountPath,
    isConnectionInQuery,
    setConnection,
    userProps,
    isGuest,
    sessionExpiry,
    setRegisteredSession,
    setGuestSession,
    isLoading,
    setIsLoading,
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
