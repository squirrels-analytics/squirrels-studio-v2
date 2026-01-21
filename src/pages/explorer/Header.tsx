import { type FC } from 'react';
import { Settings, User, LogOut, Database as DbIcon, Info } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { Button } from '@/components/ui/button';
import type { ProjectMetadataResponse } from '@/types/project-metadata-response';
import type { ConfigurablesItem } from '@/types/data-catalog-response';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface HeaderProps {
  authStrategy?: ProjectMetadataResponse['auth_strategy'];
  projectLabel: string;
  projectVersion: string;
  username: string | null;
  accessLevel: string | null;
  onLogout: () => Promise<void> | void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  configurables?: ConfigurablesItem[];
  configurableValues: Record<string, string>;
  onConfigurableChange: (name: string, value: string) => void;
}

export const Header: FC<HeaderProps> = ({
  authStrategy,
  projectLabel,
  projectVersion,
  username,
  accessLevel,
  onLogout,
  pageSize,
  onPageSizeChange,
  configurables,
  configurableValues,
  onConfigurableChange
}) => {
  const appNavigate = useAppNavigate();
  const isGuest = !username || username === 'guest';
  const isAdmin = accessLevel === 'admin';
  const isExternalAuth = authStrategy === 'external';
  const inputWidthClass = 'w-24';

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
                <span className="text-sm text-foreground whitespace-nowrap">Rows per Page</span>
                <Input 
                  type="number" 
                  min={10}
                  step={10}
                  value={pageSize} 
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val > 0) onPageSizeChange?.(val);
                  }}
                  className={`${inputWidthClass} h-8`}
                />
              </div>

              {!!configurables?.length && (
                <div className="px-2 pb-2">
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {configurables.map((c) => (
                      <div key={c.name} className="space-y-1">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm text-foreground truncate" title={c.label}>
                              {c.label}
                            </span>
                            {!!c.description && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                                      aria-label={`About ${c.label}`}
                                    >
                                      <Info className="h-3.5 w-3.5" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom" className="max-w-xs">
                                    <p className="text-xs leading-relaxed">{c.description}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          <Input
                            value={configurableValues[c.name] ?? c.default}
                            onChange={(e) => onConfigurableChange(c.name, e.target.value)}
                            className={`${inputWidthClass} h-8`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <DropdownMenuSeparator />
              {!isGuest && !isExternalAuth && (
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

