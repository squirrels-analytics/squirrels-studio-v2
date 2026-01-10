import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { LogIn, FileText, ExternalLink, Copy, User, Lock, Globe, ArrowRight, Pencil, CheckCircle2, AlertCircle } from 'lucide-react';
import useSWR from 'swr';
import { ModeToggle } from '@/components/mode-toggle';
import { useApp } from '@/context/AppContext';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { Button } from '@/components/ui/button';
import { GlowCard } from '@/components/glow-card';
import { fetchAuthProviders, login, logout, ApiError } from '@/lib/squirrels-api';
import type { AuthProvidersResponse } from '@/types/AuthResponses';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const LoginPage: React.FC = () => {
  const appNavigate = useAppNavigate();
  const { 
    hostUrl, isHostUrlInQuery, projectMetadata, exploreEndpoints, setHostUrl, setProjectMetadata, setExploreEndpoints, 
    setRegisteredSession, setGuestSession, setIsLoading 
  } = useApp();
  const [activeTab, setActiveTab] = useState<'signin' | 'docs'>('signin');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [isMcpModalOpen, setIsMcpModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: providers } = useSWR<AuthProvidersResponse>(
    projectMetadata ? projectMetadata.api_routes.list_providers_url : null,
    () => fetchAuthProviders(projectMetadata!.api_routes.list_providers_url)
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostUrl || !projectMetadata) return;
    
    setError(null);
    setIsLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const userData = await login(projectMetadata.api_routes.login_url, formData);
      setRegisteredSession(userData.user, userData.session_expiry_timestamp);
      
      appNavigate('/explorer');
    } catch (error) {
      console.error(error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError("Unable to sign in. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    if (!hostUrl) return;

    if (projectMetadata) {
      try {
        await logout(projectMetadata.api_routes.logout_url);
      } catch (err) {
        console.error('Logout error before guest login:', err);
      }
    }

    setGuestSession();
    appNavigate('/explorer');
  };

  const copyMcpUrl = () => {
    if (!exploreEndpoints?.mcp_server_url) return;
    navigator.clipboard.writeText(exploreEndpoints.mcp_server_url);
    setIsMcpModalOpen(true);
  };

  const getRedirectUrl = () => {
    const url = new URL(window.location.origin + window.location.pathname);
    if (isHostUrlInQuery) {
      url.hash = `#/explorer?hostUrl=${encodeURIComponent(hostUrl || '')}`;
    } else {
      url.hash = '#/explorer';
    }
    return url.toString();
  };

  if (!hostUrl) {
    return <Navigate to="/" replace />;
  }

  const url = new URL(hostUrl);
  const hostDomain = url.origin;
  const mountedPath = url.pathname;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]"></div>
      </div>

      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>

      <GlowCard className="max-w-lg">
        <div className="bg-card p-6 text-center relative overflow-hidden border-b border-border">
          {/* Decorative elements */}
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Squirrels Studio</h1>
          <div className="mt-2 flex items-center justify-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-muted-foreground font-medium text-sm cursor-help border-b border-dashed border-muted-foreground/30 hover:text-foreground hover:border-muted-foreground/60 transition-colors">
                  {projectMetadata?.label} (v{projectMetadata?.version})
                </p>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="flex flex-col gap-4 p-3 min-w-[200px]">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Host Domain</span>
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded-sm">{hostDomain}</code>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Mounted Path</span>
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded-sm">{mountedPath || '/'}</code>
                </div>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    appNavigate('/');

                    // Avoid auto-connecting by setting the host URL to null
                    setHostUrl(null);
                    setProjectMetadata(null);
                    setExploreEndpoints(null);
                  }}
                  className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Edit connection settings"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs font-medium">Edit connection settings</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Tab Headers */}
        <div className="flex p-1 bg-muted/50 mx-6 mt-6 rounded-xl border border-border">
          <button
            onClick={() => setActiveTab('signin')}
            className={`flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 rounded-lg transition-all duration-200 ${
              activeTab === 'signin' 
                ? 'bg-card text-foreground shadow-sm border border-border/50' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 rounded-lg transition-all duration-200 ${
              activeTab === 'docs' 
                ? 'bg-card text-foreground shadow-sm border border-border/50' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="w-4 h-4" />
            API Docs & MCP
          </button>
        </div>

        <div className="p-8">
          {activeTab === 'signin' ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {error && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground/80 ml-1">
                    Username
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="block w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-foreground placeholder:text-muted-foreground/50 autofill:shadow-[inset_0_0_0_1000px_var(--background)] autofill:[-webkit-text-fill-color:var(--foreground)]"
                      placeholder="admin"
                      required
                      autoComplete="username"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground/80 ml-1">
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-foreground placeholder:text-muted-foreground/50 autofill:shadow-[inset_0_0_0_1000px_var(--background)] autofill:[-webkit-text-fill-color:var(--foreground)]"
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="cursor-pointer w-full bg-primary hover:opacity-90 active:scale-[0.98] text-primary-foreground font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 mt-2"
                >
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase font-bold tracking-widest">
                  <span className="bg-card px-4 text-muted-foreground/60"></span>
                </div>
              </div>

              {providers && (
                <div className="space-y-4">
                  {providers.map((provider) => {
                    const loginUrl = new URL(provider.login_url);
                    loginUrl.searchParams.append('redirect_url', getRedirectUrl());
                    
                    return (
                      <a
                        key={provider.name}
                        href={loginUrl.toString()}
                        className="w-full bg-secondary hover:bg-secondary/80 active:scale-[0.98] text-foreground font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 border border-border shadow-sm"
                      >
                        {provider.icon && (
                          <img 
                            src={new URL(provider.icon).toString()}
                            alt="" 
                            className="w-5 h-5 object-contain" 
                          />
                        )}
                        Sign in with {provider.label}
                      </a>
                    );
                  })}
                </div>
              )}
              
              {projectMetadata?.auth_type !== 'required' && (
                <button
                  onClick={handleGuestLogin}
                  className="cursor-pointer w-full bg-secondary hover:bg-secondary/80 active:scale-[0.98] text-foreground font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 border border-border shadow-sm"
                >
                  <Globe className="w-4 h-4" />
                  Explore as guest
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* <p className="text-sm text-muted-foreground text-center mb-4">
                Access API specifications and MCP server URL for this project.
              </p> */}
              
              {exploreEndpoints && (
                <div className="grid grid-cols-1 gap-5">
                  <a
                    href={exploreEndpoints.api_versions["0"].documentation_routes.swagger_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col bg-muted/30 border border-border rounded-2xl hover:border-primary/50 hover:bg-primary/5 transition-all group active:scale-[0.98] overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-green-500/10 rounded-md flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform shrink-0">
                          <ExternalLink className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-foreground">Swagger UI</h3>
                          <p className="text-xs text-muted-foreground">Interactive API documentation</p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1 shrink-0 ml-2" />
                    </div>
                    <div className="border-t border-border bg-muted/20 px-4 py-2.5">
                      <p className="text-xs font-mono text-primary/80 break-all">
                        {exploreEndpoints.api_versions["0"].documentation_routes.swagger_url}
                      </p>
                    </div>
                  </a>

                  <a
                    href={exploreEndpoints.api_versions["0"].documentation_routes.redoc_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col bg-muted/30 border border-border rounded-2xl hover:border-primary/50 hover:bg-primary/5 transition-all group active:scale-[0.98] overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-red-500/10 rounded-md flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform shrink-0">
                          <ExternalLink className="w-4 h-4 text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-foreground">ReDoc UI</h3>
                          <p className="text-xs text-muted-foreground">API documentation with a clean UI</p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1 shrink-0 ml-2" />
                    </div>
                    <div className="border-t border-border bg-muted/20 px-4 py-2.5">
                      <p className="text-xs font-mono text-primary/80 break-all">
                        {exploreEndpoints.api_versions["0"].documentation_routes.redoc_url}
                      </p>
                    </div>
                  </a>

                  <button
                    onClick={copyMcpUrl}
                    className="cursor-pointer flex flex-col bg-muted/30 border border-border rounded-2xl hover:border-primary/50 hover:bg-primary/5 transition-all text-left w-full group active:scale-[0.98] overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-purple-500/10 rounded-md flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform shrink-0">
                          <Copy className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-foreground">MCP Server URL</h3>
                          <p className="text-xs text-muted-foreground">Enable AI-driven data analytics on your data</p>
                        </div>
                      </div>
                      <Copy className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-all shrink-0 ml-2" />
                    </div>
                    <div className="border-t border-border bg-muted/20 px-4 py-2.5">
                      <p className="text-xs font-mono text-primary/80 break-all">{exploreEndpoints.mcp_server_url}</p>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </GlowCard>

      {/* MCP URL Copy Success Modal */}
      <Dialog open={isMcpModalOpen} onOpenChange={setIsMcpModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              URL Copied
            </DialogTitle>
            <DialogDescription>
              The MCP server URL has been copied to your clipboard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={() => setIsMcpModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoginPage;
