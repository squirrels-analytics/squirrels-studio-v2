import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Database, ArrowRight, AlertCircle } from 'lucide-react';
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import { ModeToggle } from '@/components/mode-toggle';
import { GlowCard } from '@/components/glow-card';
import { useApp } from '@/hooks/useApp';
import { ApiError, fetchProjectMetadata } from '@/lib/squirrels-api';
import type { ProjectMetadataResponse } from '@/types/project-metadata-response';

const ConnectPage: React.FC = () => {
  const navigate = useNavigate();
  const { hostUrl, isHostUrlInQuery, setHostUrl, setIsLoading, setProjectMetadata, setExploreEndpoints } = useApp();

  const [hostDomain, setHostDomain] = useState("");
  const [mountedPath, setMountedPath] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isManuallyConnecting, setIsManuallyConnecting] = useState(false);

  // Auto-connect if hostUrl is already present (e.g., from URL params or DEFAULT_HOSTURL)
  const { data: autoData } = useSWR<ProjectMetadataResponse>(
    hostUrl ? hostUrl : null,
    (url: string) => fetchProjectMetadata(url, setIsLoading, setProjectMetadata, setExploreEndpoints),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  const { trigger } = useSWRMutation<ProjectMetadataResponse, Error, string, string>(
    'project-metadata',
    async (_key, { arg: hostUrl }: { arg: string }) => fetchProjectMetadata(hostUrl, setIsLoading, setProjectMetadata, setExploreEndpoints)
  );

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // Combine hostDomain and mountedPath into full URL
    const trimmedHostDomain = hostDomain.trim().replace(/\/+$/, '');
    const connectionHostUrl = `${trimmedHostDomain}${mountedPath.trim()}`;

    let url: URL;
    try {
      url = new URL(connectionHostUrl);
    } catch (error) {
      console.error(error);
      setError('Invalid URL. Please check your host domain and mounted path.');
      return;
    }

    try {
      setIsManuallyConnecting(true);
      // Query the project metadata using SWR mutation
      const data = await trigger(url.toString());
      
      setProjectMetadata(data);
      
      const finalHostUrl = url.toString();
      setHostUrl(finalHostUrl);
      navigate(`/login?hostUrl=${encodeURIComponent(finalHostUrl)}`);
    } catch (error) {
      setIsManuallyConnecting(false);
      console.error(error);
      // If it's an ApiError, show its message, otherwise show a generic connection error
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Unable to connect to the server.');
      }
    }
  };

  if (autoData && !isManuallyConnecting) {
    const to = isHostUrlInQuery ? `/login?hostUrl=${encodeURIComponent(hostUrl!)}` : '/login';
    return <Navigate to={to} replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <GlowCard>
        <div className="p-6 flex flex-col items-center">
          <div className="w-16 h-16 bg-background rounded-2xl flex items-center justify-center mb-4 shadow-inner">
            <Database className="text-primary w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Squirrels Studio</h1>
          <p className="text-foreground/80 text-sm">Connect to your API server</p>
        </div>
        
        <form onSubmit={handleConnect} className="bg-secondary p-8 space-y-6">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="hostDomain" className="block text-sm font-medium text-foreground mb-1">
                Host Domain
              </label>
              <input
                id="hostDomain"
                type="text"
                value={hostDomain}
                onChange={(e) => setHostDomain(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-foreground"
                placeholder="e.g. http://localhost:8000"
                required
              />
            </div>
            
            <div>
              <label htmlFor="mountedPath" className="block text-sm font-medium text-foreground mb-1">
                Mounted Path
              </label>
              <input
                id="mountedPath"
                type="text"
                value={mountedPath}
                onChange={(e) => setMountedPath(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-foreground"
                placeholder="e.g. /analytics/my-project/v1 (optional)"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
          >
            Connect
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </GlowCard>
    </div>
  );
};

export default ConnectPage;
