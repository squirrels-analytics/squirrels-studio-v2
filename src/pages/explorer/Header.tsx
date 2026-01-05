import { type FC } from 'react';
import { Settings, User, LogOut, Database as DbIcon } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

interface HeaderProps {
  projectLabel: string;
  projectVersion: string;
  username: string | null;
  accessLevel: string | null;
  onLogout: () => Promise<void> | void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
}

export const Header: FC<HeaderProps> = ({
  projectLabel,
  projectVersion,
  username,
  accessLevel,
  onLogout,
  pageSize,
  onPageSizeChange
}) => {
  const appNavigate = useAppNavigate();
  const isGuest = !username || username === 'guest';
  const isAdmin = accessLevel === 'admin';

  return (
    <header className="h-16 bg-background border-b border-border flex items-center justify-between px-4 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="bg-primary p-2 rounded-lg">
          <DbIcon className="text-primary-foreground w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            Project Name: <span className="font-normal text-muted-foreground">{projectLabel} (v{projectVersion})</span>
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {!isGuest ? (
          <div className="text-right mr-2 hidden sm:block">
            <p className="text-xs text-muted-foreground">Logged in as</p>
            <p className="text-sm font-semibold text-foreground">"{username}"</p>
          </div>
        ) : (
          <div className="text-right mr-2 hidden sm:block">
            <p className="text-xs text-muted-foreground">Exploring as guest</p>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <ModeToggle />
        
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings className="w-4 h-4" />
                <span className="sr-only">Open settings</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Configurations</DropdownMenuLabel>
              <div className="p-2 flex items-center justify-between gap-4">
                <span className="text-sm text-foreground whitespace-nowrap">Rows per page:</span>
                <Input 
                  type="number" 
                  min={10}
                  step={10}
                  value={pageSize} 
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val > 0) onPageSizeChange?.(val);
                  }}
                  className="w-20 h-8" 
                />
              </div>
              <DropdownMenuSeparator />
              {(isAdmin || !isGuest) && (
                <>
                  <DropdownMenuLabel>Navigation</DropdownMenuLabel>
                  <DropdownMenuGroup>
                    {!isGuest && (
                      <DropdownMenuItem onClick={() => appNavigate('/user-settings')}>
                        <User className="mr-2 h-4 w-4" />
                        <span>User Settings</span>
                      </DropdownMenuItem>
                    )}
                    {isAdmin && (
                      <DropdownMenuItem onClick={() => appNavigate('/manage-users')}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Manage Users</span>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={onLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>{isGuest ? 'Login' : 'Logout'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

