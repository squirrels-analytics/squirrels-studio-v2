import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import useSWR from 'swr';
import { useApp } from '@/context/AppContext';
import { fetchProjectMetadata } from '@/lib/squirrels-api';
import type { ProjectMetadataResponse } from '@/types/ProjectMetadataResponse';

interface ProjectInitializerProps {
  children: React.ReactNode;
}

export const ProjectInitializer: React.FC<ProjectInitializerProps> = ({ children }) => {
  const { hostUrl, projectMetadata, setProjectMetadata, setIsLoading, setExploreEndpoints } = useApp();
  const location = useLocation();

  const isOnConnectPage = location.pathname === '/';
  const shouldFetch = hostUrl && !isOnConnectPage && !projectMetadata;

  const { data, error } = useSWR<ProjectMetadataResponse>(
    shouldFetch ? hostUrl : null,
    (url: string) => fetchProjectMetadata(url, setIsLoading, setProjectMetadata, setExploreEndpoints),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  // Redirection logic: if we're not on the connect page and something is wrong
  if (!isOnConnectPage) {
    if (!hostUrl || error) {
      if (error) console.error('Initialization error:', error);
      return <Navigate to="/" replace />;
    }
  }

  // If we are currently fetching metadata for the first time
  const isInitializing = shouldFetch && !data && !error;
  if (isInitializing) {
    return null;
  }

  return <>{children}</>;
};
