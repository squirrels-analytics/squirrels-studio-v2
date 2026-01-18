import { type FC, useState } from 'react';
import { 
  ArrowLeft, 
  UserPlus, 
  Pencil, 
  Trash2,
  Loader2
} from 'lucide-react';
import useSWR, { useSWRConfig } from 'swr';
import { ModeToggle } from '@/components/mode-toggle';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp } from '@/hooks/useApp';
import { isManagedAuthProject } from '@/lib/auth-strategy';
import { fetchUsers, fetchUserFields, addUser, updateUser, deleteUser, ApiError } from '@/lib/squirrels-api';
import type { RegisteredUser } from '@/types/user-fields-response';
import NotFoundPage from './NotFoundPage';

const ManageUsersPage: FC = () => {
  const appNavigate = useAppNavigate();
  const { projectMetadata, userProps, isSessionExpiredModalOpen } = useApp();
  const { mutate } = useSWRConfig();
  const managedProject = isManagedAuthProject(projectMetadata) ? projectMetadata : null;
  const routes = managedProject?.api_routes ?? null;
  
  const { data: userFieldsResponse } = useSWR(
    routes?.list_user_fields_url && userProps && !isSessionExpiredModalOpen
      ? [routes.list_user_fields_url, userProps.username] 
      : null,
    ([url]) => fetchUserFields(url)
  );

  const { data: users = [], isLoading: isLoadingUsers } = useSWR(
    routes?.list_users_url && userProps && !isSessionExpiredModalOpen
      ? [routes.list_users_url, userProps.username] 
      : null,
    ([url]) => fetchUsers(url)
  );

  const customFieldsList = userFieldsResponse?.custom_fields || [];
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<RegisteredUser | null>(null);

  // Form states
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newAccessLevel, setNewAccessLevel] = useState<'admin' | 'member'>('member');
  const [customFields, setCustomFields] = useState<Record<string, unknown>>({});
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCreateClick = () => {
    const initialCustom: Record<string, unknown> = {};
    let accessLevel: 'admin' | 'member' = 'member';
    if (userFieldsResponse) {
      userFieldsResponse.custom_fields.forEach(field => {
        initialCustom[field.name] = field.default ?? (field.type === 'string' ? '' : null);
      });
      accessLevel = userFieldsResponse.access_level.default as 'admin' | 'member';
    }
    setCustomFields(initialCustom);
    setNewUsername('');
    setNewPassword('');
    setNewAccessLevel(accessLevel);
    setErrorMessage(null);
    setIsCreateDialogOpen(true);
  };

  const generatePassword = () => {
    const minLength = managedProject?.password_requirements?.min_length;
    if (!minLength) return;

    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
    let password = '';
    for (let i = 0; i < minLength; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
  };

  const handleEditClick = (user: RegisteredUser) => {
    setSelectedUser(user);
    setNewAccessLevel(user.access_level);
    setCustomFields(user.custom_fields);
    setErrorMessage(null);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (user: RegisteredUser) => {
    setSelectedUser(user);
    setErrorMessage(null);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateUser = async () => {
    if (!routes?.add_user_url) return;
    
    // Password validation
    const requirements = managedProject?.password_requirements;
    if (requirements) {
      if (newPassword.length < requirements.min_length) {
        setErrorMessage(`Password must be at least ${requirements.min_length} characters long`);
        return;
      }
      if (newPassword.length > requirements.max_length) {
        setErrorMessage(`Password must be at most ${requirements.max_length} characters long`);
        return;
      }
    }

    setIsProcessing(true);
    setErrorMessage(null);
    try {
      await addUser(routes.add_user_url, {
        username: newUsername,
        password: newPassword,
        access_level: newAccessLevel,
        custom_fields: customFields,
      });
      setIsCreateDialogOpen(false);
      setNewUsername('');
      setNewPassword('');
      if (routes.list_users_url) {
        mutate([routes.list_users_url, userProps?.username]);
      }
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Failed to create user');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!routes?.update_user_url || !selectedUser) return;
    
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const url = routes.update_user_url.replace('{username}', selectedUser.username);
      await updateUser(url, {
        access_level: newAccessLevel,
        custom_fields: customFields,
      });
      setIsEditDialogOpen(false);
      if (routes.list_users_url) {
        mutate([routes.list_users_url, userProps?.username]);
      }
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Failed to update user');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!routes?.delete_user_url || !selectedUser) return;
    if (selectedUser.username === userProps?.username) {
      setErrorMessage("You cannot delete your own account");
      return;
    }
    
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const url = routes.delete_user_url.replace('{username}', selectedUser.username);
      await deleteUser(url);
      setIsDeleteDialogOpen(false);
      if (routes.list_users_url) {
        mutate([routes.list_users_url, userProps?.username]);
      }
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Failed to delete user');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCustomFieldChange = (name: string, value: unknown) => {
    setCustomFields(prev => ({ ...prev, [name]: value }));
  };

  if (!managedProject) {
    return <NotFoundPage />;
  }

  if (userProps?.access_level !== 'admin' && !isSessionExpiredModalOpen) {
    return <NotFoundPage />;
  }
  
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="h-16 bg-background border-b border-border flex items-center justify-between px-4 sticky top-0 z-30 shadow-sm">
        <h1 className="text-xl font-bold text-foreground">User Management</h1>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => appNavigate('/explorer')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Explorer
          </Button>
          <ModeToggle />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-6 space-y-6">
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
            <h2 className="font-bold text-lg">Users</h2>
            <Button onClick={handleCreateClick} className="gap-2">
              <UserPlus className="w-4 h-4" />
              Create User
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground text-sm uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Username / Email</th>
                  <th className="px-6 py-4 font-medium">Access Level</th>
                  {customFieldsList.map(field => (
                    <th key={field.name} className="px-6 py-4 font-medium">{field.label}</th>
                  ))}
                  <th className="px-6 py-4 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoadingUsers ? (
                  <tr>
                    <td colSpan={3 + customFieldsList.length} className="px-6 py-10 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Loading users...
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={3 + customFieldsList.length} className="px-6 py-10 text-center text-muted-foreground italic">
                      No users found.
                    </td>
                  </tr>
                ) : users.map((user) => (
                  <tr key={user.username} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium">{user.username}</td>
                    <td className="px-6 py-4 text-sm">{user.access_level}</td>
                    {customFieldsList.map(field => (
                      <td key={field.name} className="px-6 py-4 text-sm">
                        {String(user.custom_fields[field.name] ?? '')}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEditClick(user)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteClick(user)}
                          disabled={user.username === userProps?.username}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Create New User</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
            <div className="space-y-2">
              <Label htmlFor="create-username">Username / Email</Label>
              <Input 
                id="create-username" 
                placeholder="Enter username or email"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Label htmlFor="create-password">Password</Label>
                {managedProject?.password_requirements && (
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    ({managedProject.password_requirements.min_length}-{managedProject.password_requirements.max_length} chars)
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Input 
                  id="create-password" 
                  type="text" 
                  placeholder="Enter password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Button variant="outline" onClick={generatePassword}>Generate</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-access-level">Access Level</Label>
              <Select 
                value={newAccessLevel} 
                onValueChange={(value: 'admin' | 'member') => setNewAccessLevel(value)}
              >
                <SelectTrigger id="create-access-level">
                  <SelectValue placeholder="Select access level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">member</SelectItem>
                  <SelectItem value="admin">admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {customFieldsList.map(field => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={`create-${field.name}`}>{field.label} ({field.type})</Label>
                {field.enum ? (
                  <Select 
                    value={String(customFields[field.name] ?? '')} 
                    onValueChange={(val) => handleCustomFieldChange(field.name, val)}
                  >
                    <SelectTrigger id={`create-${field.name}`}>
                      <SelectValue placeholder={`Select ${field.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.enum.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input 
                    id={`create-${field.name}`}
                    type={field.type === 'int' || field.type === 'float' ? 'number' : 'text'}
                    value={String(customFields[field.name] ?? '')}
                    onChange={(e) => handleCustomFieldChange(field.name, field.type === 'int' || field.type === 'float' ? Number(e.target.value) : e.target.value)}
                  />
                )}
              </div>
            ))}

            {errorMessage && (
              <p className="text-sm font-medium text-destructive">{errorMessage}</p>
            )}
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button 
              onClick={handleCreateUser} 
              disabled={isProcessing}
              className="flex-1 sm:flex-none"
            >
              {isProcessing ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit User</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
            <div className="space-y-2">
              <Label htmlFor="edit-username">Username / Email</Label>
              <Input 
                id="edit-username" 
                value={selectedUser?.username || ''} 
                disabled 
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-access-level">Access Level</Label>
              <Select 
                value={newAccessLevel} 
                onValueChange={(value: 'admin' | 'member') => setNewAccessLevel(value)}
              >
                <SelectTrigger id="edit-access-level">
                  <SelectValue placeholder="Select access level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">member</SelectItem>
                  <SelectItem value="admin">admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {customFieldsList.map(field => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={`edit-${field.name}`}>{field.label} ({field.type})</Label>
                {field.enum ? (
                  <Select 
                    value={String(customFields[field.name] ?? '')} 
                    onValueChange={(val) => handleCustomFieldChange(field.name, val)}
                  >
                    <SelectTrigger id={`edit-${field.name}`}>
                      <SelectValue placeholder={`Select ${field.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.enum.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input 
                    id={`edit-${field.name}`}
                    type={field.type === 'int' || field.type === 'float' ? 'number' : 'text'}
                    value={String(customFields[field.name] ?? '')}
                    onChange={(e) => handleCustomFieldChange(field.name, field.type === 'int' || field.type === 'float' ? Number(e.target.value) : e.target.value)}
                  />
                )}
              </div>
            ))}

            {errorMessage && (
              <p className="text-sm font-medium text-destructive">{errorMessage}</p>
            )}
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateUser} 
              disabled={isProcessing}
              className="flex-1 sm:flex-none"
            >
              {isProcessing ? 'Updating...' : 'Update User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Delete User</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              Are you sure you want to delete user "{selectedUser?.username}"? This action cannot be undone.
            </p>
            {errorMessage && (
              <p className="text-sm font-medium text-destructive mt-4">{errorMessage}</p>
            )}
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteUser} 
              disabled={isProcessing}
              className="flex-1 sm:flex-none"
            >
              {isProcessing ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageUsersPage;

