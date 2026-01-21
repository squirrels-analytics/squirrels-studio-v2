import { useState, useMemo, type FC } from 'react';
import useSWR from 'swr';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { fetchCompiledModel, type SelectionValue, type ConfigurableValues } from '@/lib/squirrels-api';
import type { 
  DataCatalogResponse, 
  DataModelItem, 
  DatasetItemModel, 
  DashboardItemModel,
  ColumnConfig,
  ColumnWithConditionModel
} from '@/types/data-catalog-response';
import type { ProjectMetadataResponse } from '@/types/project-metadata-response';
import type { CompiledQueryModel } from '@/types/compiled-query-model';
import { Loader2, Info } from 'lucide-react';

interface LineageDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  node: {
    id: string;
    type: 'model' | 'dataset' | 'dashboard';
    name: string;
  } | null;
  catalog: DataCatalogResponse;
  projectMetadata: ProjectMetadataResponse;
  paramOverrides: Record<string, SelectionValue>;
  configurables: ConfigurableValues;
}

export const LineageDetailsDialog: FC<LineageDetailsDialogProps> = ({
  isOpen,
  onOpenChange,
  node,
  catalog,
  projectMetadata,
  paramOverrides,
  configurables
}) => {
  const [activeTab, setActiveTab] = useState<'definition' | 'placeholders'>('definition');

  const asset = node ? (
    node.type === 'model' ? catalog.models?.find(m => m.name === node.name) :
    node.type === 'dataset' ? catalog.datasets.find(d => d.name === node.name) :
    catalog.dashboards.find(d => d.name === node.name)
  ) : null;

  const isModel = node?.type === 'model';
  const model = isModel && asset ? (asset as DataModelItem) : null;
  const shouldFetchCompiledModel =
    !!isOpen &&
    !!model &&
    ['build', 'dbview', 'federate'].includes(model.model_type);

  const paramOverridesKey = useMemo(() => {
    const sorted: Record<string, SelectionValue> = {};
    Object.keys(paramOverrides)
      .sort()
      .forEach((k) => {
        sorted[k] = paramOverrides[k];
      });
    return JSON.stringify(sorted);
  }, [paramOverrides]);

  const compiledModelKey = shouldFetchCompiledModel
    ? ['compiled-model', projectMetadata.api_routes.get_compiled_model_url, model.name, paramOverridesKey]
    : null;

  const {
    data: compiledModelData,
    isLoading: isLoadingCompiledModel,
    error: compiledModelError,
  } = useSWR<CompiledQueryModel>(
    compiledModelKey,
    () => fetchCompiledModel(projectMetadata, model!.name, paramOverrides, configurables),
  );

  if (!node || !asset) return null;

  const getParameterLabel = (paramName: string) => {
    const param = catalog.parameters.find(p => p.name === paramName);
    return param?.label || paramName;
  };

  const getConnectionLabel = (connName: string | null | undefined) => {
    if (!connName) return null;
    const conn = catalog.connections?.find(c => c.name === connName);
    return conn?.label || connName;
  };

  const renderColumnsTable = (columns: (ColumnConfig | ColumnWithConditionModel)[]) => (
    <div className="border rounded-lg overflow-hidden border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left px-4 py-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px] w-[150px]">Name</th>
              <th className="text-left px-4 py-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px] w-[100px]">Type</th>
              <th className="text-left px-4 py-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Condition</th>
              <th className="text-left px-4 py-2 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {columns.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-muted-foreground py-8 italic">No columns defined</td>
              </tr>
            ) : (
              columns.map((col, idx) => {
                const condition = col.condition || [];
                const displayConditions = Array.isArray(condition) ? condition.map(
                  (item: string) => (
                    <Badge key={item} variant="outline" className="text-[9px] h-4 px-1.5 font-normal bg-muted/30">
                      {item}
                    </Badge>
                  )
                ) : condition;
                
                return (
                  <tr key={idx} className="hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-xs font-bold text-foreground">{col.name}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-normal bg-muted/30">{col.type || 'unknown'}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground italic">
                      <div className="flex flex-wrap gap-1.5">{displayConditions.length > 0 ? displayConditions : '-'}</div>
                    </td>
                    <td className="px-4 py-2.5 text-xs leading-relaxed text-foreground/80">{col.description || '-'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const compiledModel = shouldFetchCompiledModel ? (compiledModelData ?? null) : null;
  const isLoading = shouldFetchCompiledModel && isLoadingCompiledModel;
  const error = compiledModelError
    ? (compiledModelError instanceof Error ? compiledModelError.message : 'Failed to fetch compiled model')
    : null;

  const dataset = node.type === 'dataset' ? asset as DatasetItemModel : null;
  const dashboard = node.type === 'dashboard' ? asset as DashboardItemModel : null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden gap-0">
        <DialogHeader className="p-6 border-b bg-muted/20 shrink-0">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-xl flex items-center gap-3">
                {isModel ? model?.name : (dataset?.label || dashboard?.label || node.name)}
                <Badge variant="secondary" className="text-[10px] font-black uppercase px-2 h-5">
                  {isModel ? model?.model_type : node.type}
                </Badge>
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          {/* Description Section */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Description</h4>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {isModel ? model?.config.description : (dataset?.description || dashboard?.description) || (
                <span className="italic text-muted-foreground">No description provided</span>
              )}
            </p>
          </div>

          {/* Properties Section */}
          {dashboard && (
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Result Format</h4>
              <Badge variant="outline" className="font-bold">{dashboard.result_format.toUpperCase()}</Badge>
            </div>
          )}
          {isModel && model?.config && 'connection' in model.config && (
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Connection</h4>
              <p className="text-sm font-semibold text-foreground/90">{getConnectionLabel(model.config.connection as string) || '-'}</p>
            </div>
          )}
          {isModel && model?.model_type === 'source' && 'table' in model.config && (
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Table</h4>
              <code className="text-xs bg-muted px-2 py-1 rounded border border-border">{String(model.config.table) || '-'}</code>
            </div>
          )}

          {/* Parameters Section */}
          {(dataset?.parameters || dashboard?.parameters) && (
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Parameters</h4>
              <div className="flex flex-wrap gap-2">
                {(dataset?.parameters || dashboard?.parameters || []).map(p => (
                  <Badge key={p} variant="outline" className="bg-background px-2 py-1 font-medium border-primary/20 text-primary">
                    {getParameterLabel(p)}
                  </Badge>
                ))}
                {((dataset?.parameters?.length === 0) || (dashboard?.parameters?.length === 0)) && (
                  <span className="text-xs text-muted-foreground italic">No parameters</span>
                )}
              </div>
            </div>
          )}

          {/* Columns Section */}
          {(isModel || dataset) && (
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Columns</h4>
              {renderColumnsTable(isModel ? (model?.config.columns || []) : (dataset?.schema.fields || []))}
            </div>
          )}

          {/* Compiled Definition Section */}
          {isModel && ['build', 'dbview', 'federate'].includes(model?.model_type || '') && (
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Compiled Definition</h4>
                {isLoading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
              </div>
              
              {error ? (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-xs flex gap-3 items-center">
                  <Info className="w-4 h-4 shrink-0" />
                  <p>{error}</p>
                </div>
              ) : compiledModel ? (
                <div className="space-y-4">
                  <div className="flex bg-muted p-1 rounded-lg w-fit border border-border">
                    <button 
                      onClick={() => setActiveTab('definition')}
                      className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'definition' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      Definition ({compiledModel.language.toUpperCase()})
                    </button>
                    <button 
                      onClick={() => setActiveTab('placeholders')}
                      className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'placeholders' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      Placeholders
                    </button>
                  </div>
                  
                  {activeTab === 'definition' ? (
                    <div className="border rounded-xl bg-[#0d1117] text-[#e6edf3] p-6 font-mono text-xs overflow-auto max-h-[500px] shadow-inner custom-scrollbar">
                      <pre className="whitespace-pre-wrap leading-relaxed">{compiledModel.definition}</pre>
                    </div>
                  ) : (
                    <div className="border rounded-xl bg-[#0d1117] text-[#e6edf3] p-6 font-mono text-xs overflow-auto max-h-[500px] shadow-inner custom-scrollbar">
                      <pre className="leading-relaxed">{JSON.stringify(compiledModel.placeholders, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ) : !isLoading && (
                <p className="text-xs text-muted-foreground italic">Compiled definition not available</p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
