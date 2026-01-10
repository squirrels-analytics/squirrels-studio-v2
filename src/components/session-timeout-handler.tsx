import React from 'react';
import { useLocation } from 'react-router-dom';
import useSWR from 'swr';
import { useApp } from '@/context/AppContext';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { fetchUserSession } from '@/lib/squirrels-api';
import type { UserSessionResponse } from '@/types/AuthResponses';
import { PROTECTED_PATHS } from '@/context/AppContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export const SessionTimeoutHandler: React.FC = () => {
  const { 
    projectMetadata, 
    userProps, 
    isGuest,
    setRegisteredSession,
    setGuestSession,
    isSessionExpiredModalOpen, 
    setIsSessionExpiredModalOpen
  } = useApp();
  const location = useLocation();
  const appNavigate = useAppNavigate();

  const isProtectedPath = PROTECTED_PATHS.some(path => location.pathname === path);
  
  // If we're on a protected path but don't have session info (e.g. page refresh),
  // we need to fetch it to restore the session or confirm we are still logged in.
  // We only fetch if we have projectMetadata (to get the URL), missing session data,
  // and haven't explicitly been marked as a guest.
  const shouldFetchSession = !!projectMetadata && (userProps === null && !isGuest) && isProtectedPath;

  useSWR<UserSessionResponse>(
    shouldFetchSession ? projectMetadata!.api_routes.get_user_session_url : null,
    (url: string) => fetchUserSession(url),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
      onSuccess: (sessionInfo) => {
        setRegisteredSession(sessionInfo.user, sessionInfo.session_expiry_timestamp);
      },
      onError: () => {
        // If the session check fails (e.g. 401), treat the user as a guest
        // so we don't keep trying to fetch the session.
        setGuestSession();
      },
    }
  );

  const handleCloseModal = () => {
    setIsSessionExpiredModalOpen(false);
    appNavigate('/login');
  };

  return (
    <Dialog open={isSessionExpiredModalOpen}>
      <DialogContent 
        className="sm:max-w-sm"
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5" />
            Session Expired
          </DialogTitle>
          <DialogDescription>
            Your user session has expired. Please sign in again to continue.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            className="w-full"
            onClick={handleCloseModal}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
