import { createContext } from 'react';
import type { ProjectMetadataResponse } from '@/types/project-metadata-response';
import type { UserInfo } from '@/types/auth-responses';
import type { ExploreEndpointsResponse } from '@/types/explore-endpoints-response';

export interface AppContextType {
  origin: string | null;
  mountPath: string | null;
  isConnectionInQuery: boolean;
  setConnection: (origin: string | null, mountPath: string | null) => void;
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

export const AppContext = createContext<AppContextType | undefined>(undefined);
