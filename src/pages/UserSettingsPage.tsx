import { type FC, useState } from 'react';
import { Lock, Key, ArrowLeft, Plus, Trash2, Copy, CheckCircle2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import useSWR, { useSWRConfig } from 'swr';
import { ModeToggle } from '@/components/mode-toggle';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useApp } from '@/hooks/useApp';
import { isManagedAuthProject } from '@/lib/auth-strategy';
import { changePassword, fetchApiKeys, createApiKey, revokeApiKey, ApiError } from '@/lib/squirrels-api';
import NotFoundPage from './NotFoundPage';

interface DisplayApiKey {
  id: string;
  description: string;
  created: Date;
  expires: Date | null;
  key?: string; // Only present when just created
}

const UserSettingsPage: FC = () => {
  const appNavigate = useAppNavigate();
  const { projectMetadata, userProps, isSessionExpiredModalOpen } = useApp();
  const { mutate } = useSWRConfig();
  const managedProject = isManagedAuthProject(projectMetadata) ? projectMetadata : null;
  const routes = managedProject?.api_routes ?? null;
  
  const [apiKeyExpires, setApiKeyExpires] = useState(true);
  const [expiryDays, setExpiryDays] = useState('90');
  const [apiKeyDesc, setApiKeyDesc] = useState('');
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const { data: apiKeys = [], isLoading: isLoadingKeys } = useSWR(
    routes?.list_api_keys_url && userProps && !isSessionExpiredModalOpen
      ? [routes.list_api_keys_url, userProps.username] 
      : null,
    ([url]) => fetchApiKeys(url)
  );

  const [newKey, setNewKey] = useState<DisplayApiKey | null>(null);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!routes?.change_password_url) return;
    
    // Reset status
    setPasswordStatus(null);

    // Validation: All fields must be non-empty
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'All fields must be non-empty' });
      return;
    }

    // Validation: New passwords do not match
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'New passwords do not match' });
      return;
    }

    // Password length validation
    const requirements = managedProject?.password_requirements;
    if (requirements) {
      if (newPassword.length < requirements.min_length) {
        setPasswordStatus({ 
          type: 'error', 
          message: `New password must be at least ${requirements.min_length} characters long` 
        });
        return;
      }
      if (newPassword.length > requirements.max_length) {
        setPasswordStatus({ 
          type: 'error', 
          message: `New password must be at most ${requirements.max_length} characters long` 
        });
        return;
      }
    }

    setIsChangingPassword(true);
    try {
      await changePassword(routes.change_password_url, {
        old_password: currentPassword,
        new_password: newPassword,
      });
      
      // Success
      setIsPasswordModalOpen(true);
      
      // Clear fields on success
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to change password';
      setPasswordStatus({ type: 'error', message });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCreateApiKey = async () => {
    if (!routes?.create_api_key_url) return;
    
    setApiKeyError(null);
    if (!apiKeyDesc.trim()) {
      setApiKeyError('API Key description is required');
      return;
    }

    setIsCreatingKey(true);
    try {
      const response = await createApiKey(routes.create_api_key_url, {
        title: apiKeyDesc,
        expiry_minutes: apiKeyExpires ? (parseInt(expiryDays) || 0) * 24 * 60 : null,
      });

      const now = new Date();
      const expiryDate = apiKeyExpires ? new Date(now.getTime() + (parseInt(expiryDays) || 0) * 24 * 60 * 60 * 1000) : null;

      const createdKey: DisplayApiKey = {
        id: 'new', // The real ID will be in the list after refresh
        description: apiKeyDesc,
        created: now,
        expires: expiryDate,
        key: response.api_key
      };

      setNewKey(createdKey);
      setIsKeyModalOpen(true);
      setApiKeyDesc('');
      
      // Refresh the list
      if (routes.list_api_keys_url) {
        mutate([routes.list_api_keys_url, userProps?.username]);
      }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to create API key';
      setApiKeyError(message);
    } finally {
      setIsCreatingKey(false);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!routes?.revoke_api_key_url) return;
    setKeyToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteKey = async () => {
    if (!keyToDelete || !routes?.revoke_api_key_url) return;
    
    const url = routes.revoke_api_key_url.replace('{key_id}', keyToDelete);
    try {
      await revokeApiKey(url);
      if (routes.list_api_keys_url) {
        mutate([routes.list_api_keys_url, userProps?.username]);
      }
    } catch (error) {
      console.error('Failed to revoke API key:', error);
    } finally {
      setIsDeleteModalOpen(false);
      setKeyToDelete(null);
    }
  };

  const copyToClipboard = () => {
    if (newKey?.key) {
      navigator.clipboard.writeText(newKey.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!managedProject || (!userProps && !isSessionExpiredModalOpen)) {
    return <NotFoundPage />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="h-16 bg-background border-b border-border flex items-center justify-between px-4 sticky top-0 z-30 shadow-sm">
        <h1 className="text-xl font-bold text-foreground">User Settings</h1>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => appNavigate('/explorer')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Explorer
          </Button>
          <ModeToggle />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-6 space-y-8 overflow-y-auto">
        
        {/* Change Password Section */}
        <section className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-lg text-foreground">Change Password</h2>
          </div>
          <div className="p-6">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleChangePassword();
              }} 
              className="space-y-4"
              autoComplete="off"
            >
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input 
                  id="current-password" 
                  type="password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Label htmlFor="new-password">New Password</Label>
                  {managedProject.password_requirements && (
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      ({managedProject.password_requirements.min_length}-{managedProject.password_requirements.max_length} chars)
                    </span>
                  )}
                </div>
                <Input 
                  id="new-password" 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input 
                  id="confirm-password" 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="off"
                />
              </div>

              {passwordStatus && passwordStatus.type === 'error' && (
                <div className="text-sm font-medium text-destructive">
                  {passwordStatus.message}
                </div>
              )}

              <Button type="submit" className="mt-2" disabled={isChangingPassword}>
                {isChangingPassword ? 'Changing...' : 'Change Password'}
              </Button>
            </form>
          </div>
        </section>

        {/* API Keys Section */}
        <section className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-lg text-foreground">API Keys</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key-desc">API Key Description</Label>
                <Input 
                  id="api-key-desc" 
                  placeholder="e.g. Work Laptop, Production, etc." 
                  value={apiKeyDesc}
                  onChange={(e) => {
                    setApiKeyDesc(e.target.value);
                    if (apiKeyError) setApiKeyError(null);
                  }}
                />
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2 py-3">
                  <Checkbox 
                    id="expires" 
                    checked={apiKeyExpires} 
                    onCheckedChange={(checked) => setApiKeyExpires(checked === true)} 
                  />
                  <Label htmlFor="expires" className="cursor-pointer">API Key Expires</Label>
                </div>
                {apiKeyExpires && <div className="flex items-center gap-2">
                  <Input 
                    type="number" 
                    value={expiryDays} 
                    onChange={(e) => setExpiryDays(e.target.value)}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">days</span>
                </div>}
              </div>

              {apiKeyError && (
                <div className="text-sm font-medium text-destructive">
                  {apiKeyError}
                </div>
              )}

              <Button 
                variant="default" 
                className="gap-2"
                onClick={handleCreateApiKey}
                disabled={isCreatingKey}
              >
                <Plus className="w-4 h-4" />
                {isCreatingKey ? 'Creating...' : 'Create API Key'}
              </Button>
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="font-bold text-foreground">Your API Keys</h3>
              
              {isLoadingKeys ? (
                <p className="text-sm text-muted-foreground">Loading API keys...</p>
              ) : apiKeys.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  You don't have any API Keys yet.
                </p>
              ) : (
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="text-left p-3 font-semibold text-muted-foreground">Key</th>
                        <th className="text-left p-3 font-semibold text-muted-foreground">Description</th>
                        <th className="text-left p-3 font-semibold text-muted-foreground">Created</th>
                        <th className="text-left p-3 font-semibold text-muted-foreground">Expires</th>
                        <th className="text-center p-3 font-semibold text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {apiKeys.map((key) => {
                        const createdAt = parseISO(key.created_at);
                        const expiresAt = key.expires_at ? parseISO(key.expires_at) : null;
                        
                        return (
                          <tr key={key.id} className="hover:bg-muted/30 transition-colors">
                            <td className="p-3 font-mono text-xs">****{key.last_four}</td>
                            <td className="p-3 font-medium">{key.title}</td>
                            <td className="p-3 text-muted-foreground">
                              {format(createdAt, 'MMM d, yyyy')} at {format(createdAt, 'h:mm a')}
                            </td>
                            <td className="p-3 text-muted-foreground">
                              {expiresAt ? (
                                `${format(expiresAt, 'MMM d, yyyy')} at ${format(expiresAt, 'h:mm a')}`
                              ) : (
                                'Never'
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteKey(key.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* New API Key Modal */}
      <Dialog open={isKeyModalOpen} onOpenChange={setIsKeyModalOpen}>
        <DialogContent 
          className="sm:max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>API Key Created</DialogTitle>
            <DialogDescription>
              Please copy your API key now. For security reasons, you won't be able to see it again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 pt-4">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="api-key" className="sr-only">
                API Key
              </Label>
              <Input
                id="api-key"
                defaultValue={newKey?.key}
                readOnly
                className="font-mono bg-muted"
              />
            </div>
            <Button size="sm" className="px-3" onClick={copyToClipboard}>
              {copied ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span className="sr-only">Copy</span>
            </Button>
          </div>
          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsKeyModalOpen(false)}
            >
              I've copied the key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Change Success Modal */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Password Changed
            </DialogTitle>
            <DialogDescription>
              Your password has been successfully updated.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={() => setIsPasswordModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete API Key Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Revoke API Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke this API key? This action cannot be undone and any applications using this key will lose access.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeleteKey}
            >
              Revoke Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserSettingsPage;
