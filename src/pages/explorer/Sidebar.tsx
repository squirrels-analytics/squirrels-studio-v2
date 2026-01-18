import { type FC, type ReactNode } from 'react';
import { Play, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/filters/date-picker';
import { DateRangePicker } from '@/components/filters/date-range-picker';
import { NumberSlider } from '@/components/filters/number-slider';
import { NumberRangeSlider } from '@/components/filters/number-range-slider';
import { MultiSelect } from '@/components/filters/multi-select';
import { SingleSelect } from '@/components/filters/single-select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { parseISO } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { hasElevatedAccess, type AccessLevel } from '@/lib/access';
import type { SelectionValue } from '@/lib/squirrels-api';
import type {
  AnyParameterModel,
  SingleSelectParameterModel,
  MultiSelectParameterModel,
  DateParameterModel,
  DateRangeParameterModel,
  NumberParameterModel,
  NumberRangeParameterModel,
  TextParameterModel,
  ParameterOptionModel,
  DatasetItemModel,
  DashboardItemModel,
} from '@/types/data-catalog-response';
import type { ExplorerOptionType } from '@/types/core';

const ParameterWidget: FC<{ label: string; description?: string; children: ReactNode }> = ({ label, description, children }) => (
  <div className="space-y-2 mb-6 last:mb-0">
    <label className="text-sm font-bold text-foreground underline decoration-muted underline-offset-4 flex items-center gap-2">
      {label}
      {description && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="max-w-xs">{description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </label>
    {children}
  </div>
);

interface SidebarProps {
  exploreType: ExplorerOptionType;
  setExploreType: (type: ExplorerOptionType) => void;
  activeAssetName: string | null;
  onAssetChange: (name: string) => void;
  datasets: DatasetItemModel[];
  dashboards: DashboardItemModel[];
  parameters: AnyParameterModel[];
  paramOverrides: Record<string, SelectionValue>;
  isLoading: boolean;
  onParamChange: (param: AnyParameterModel, value: SelectionValue) => void;
  onApply: () => void;
  userAccessLevel: AccessLevel | null;
  elevatedAccessLevel: AccessLevel | null;
}

export const Sidebar: FC<SidebarProps> = ({
  exploreType,
  setExploreType,
  activeAssetName,
  onAssetChange,
  datasets,
  dashboards,
  parameters,
  paramOverrides,
  isLoading,
  onParamChange,
  onApply,
  userAccessLevel,
  elevatedAccessLevel,
}) => {
  const showSqlPlayground = hasElevatedAccess(userAccessLevel, elevatedAccessLevel);

  return (
    <aside className="w-90 bg-card border-r border-border flex flex-col h-full shadow-sm z-20 overflow-hidden">
      {/* Top Section: Fixed */}
      <div className="p-6 space-y-6 border-b border-border">
        <div>
          <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">Explore</h3>
          <Select value={exploreType} onValueChange={(val: ExplorerOptionType) => setExploreType(val)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='Datasets'>Datasets</SelectItem>
              <SelectItem value='Dashboards'>Dashboards</SelectItem>
              {showSqlPlayground && (
                <>
                  <SelectItem value='SqlPlayground'>SQL Playground</SelectItem>
                  <SelectItem value='DataLineage'>Data Lineage</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>

          {(exploreType === 'SqlPlayground' || exploreType === 'DataLineage') && (
            <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
              Note: Below are all the parameters for this Squirrels project. 
              {exploreType === 'SqlPlayground' 
                ? ' Changing these selections may change the underlying data created by dbview and federate models.' 
                : ' Changing these selections may change the compiled definition of dbview and federate models.'
              }
            </p>
          )}
        </div>

        {exploreType !== 'SqlPlayground' && exploreType !== 'DataLineage' && (
          <div>
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">Select a {exploreType.slice(0, -1)}:</h3>
            <Select 
              value={activeAssetName || ''} 
              onValueChange={onAssetChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={`Select a ${exploreType.slice(0, -1).toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {(exploreType === 'Datasets' ? datasets : dashboards).map(asset => (
                  <SelectItem key={asset.name} value={asset.name_for_api}>
                    {asset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Middle Section: Scrollable Parameters */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        {parameters.map((param) => {
          const value = paramOverrides[param.name];
          
          switch (param.widget_type) {
            case 'single_select': {
              const p = param as SingleSelectParameterModel;
              const val = (value as string) ?? p.selected_id ?? '';
              return (
                <ParameterWidget key={p.name} label={p.label} description={p.description}>
                  <SingleSelect
                    options={p.options.map((o: ParameterOptionModel) => ({ label: o.label, value: o.id }))}
                    value={val}
                    onChange={(v) => onParamChange(p, v)}
                  />
                </ParameterWidget>
              );
            }
            case 'multi_select': {
              const p = param as MultiSelectParameterModel;
              const val = (value as string[]) ?? p.selected_ids ?? [];
              return (
                <ParameterWidget key={p.name} label={p.label} description={p.description}>
                  <MultiSelect
                    options={p.options.map((o: ParameterOptionModel) => ({ label: o.label, value: o.id }))}
                    defaultValue={val}
                    onValueChange={(v) => onParamChange(p, v)}
                  />
                </ParameterWidget>
              );
            }
            case 'date': {
              const p = param as DateParameterModel;
              const val = (value as Date) ?? (p.selected_date ? parseISO(p.selected_date) : undefined);
              return (
                <ParameterWidget key={p.name} label={p.label} description={p.description}>
                  <DatePicker
                    date={val}
                    setDate={(d) => onParamChange(p, d)}
                    minDate={p.min_date ? parseISO(p.min_date) : undefined}
                    maxDate={p.max_date ? parseISO(p.max_date) : undefined}
                  />
                </ParameterWidget>
              );
            }
            case 'date_range': {
              const p = param as DateRangeParameterModel;
              const val = (value as DateRange) ?? {
                from: p.selected_start_date ? parseISO(p.selected_start_date) : undefined,
                to: p.selected_end_date ? parseISO(p.selected_end_date) : undefined
              };
              return (
                <ParameterWidget key={p.name} label={p.label} description={p.description}>
                  <DateRangePicker
                    date={val}
                    setDate={(dr) => onParamChange(p, dr)}
                    minDate={p.min_date ? parseISO(p.min_date) : undefined}
                    maxDate={p.max_date ? parseISO(p.max_date) : undefined}
                  />
                </ParameterWidget>
              );
            }
            case 'number': {
              const p = param as NumberParameterModel;
              const val = (value as number) ?? p.selected_value ?? p.min_value;
              return (
                <ParameterWidget key={p.name} label={p.label} description={p.description}>
                  <NumberSlider
                    value={val}
                    min={p.min_value}
                    max={p.max_value}
                    step={p.increment}
                    onChange={(v) => onParamChange(p, v)}
                  />
                </ParameterWidget>
              );
            }
            case 'number_range': {
              const p = param as NumberRangeParameterModel;
              const val = (value as [number, number]) ?? [p.selected_lower_value, p.selected_upper_value];
              return (
                <ParameterWidget key={p.name} label={p.label} description={p.description}>
                  <NumberRangeSlider
                    value={val}
                    min={p.min_value}
                    max={p.max_value}
                    step={p.increment}
                    onChange={(v) => onParamChange(p, v)}
                  />
                </ParameterWidget>
              );
            }
            case 'text': {
              const p = param as TextParameterModel;
              const val = (value as string) ?? p.entered_text ?? '';
              return (
                <ParameterWidget key={p.name} label={p.label} description={p.description}>
                  <Input
                    type={p.input_type === 'number' ? 'number' : 'text'}
                    value={val}
                    onChange={(e) => onParamChange(p, e.target.value)}
                    placeholder="Type here..."
                  />
                </ParameterWidget>
              );
            }
            default:
              return null;
          }
        })}
      </div>

      {/* Bottom Section: Fixed Apply Button */}
      {exploreType !== 'SqlPlayground' && exploreType !== 'DataLineage' && (
        <div className="p-6 border-t border-border">
          <Button 
            onClick={onApply}
            disabled={isLoading || !activeAssetName}
            className="w-full font-bold py-6 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            Apply
          </Button>
        </div>
      )}
    </aside>
  );
};

