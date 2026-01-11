import { useState, useMemo, useCallback, type FC, lazy, Suspense } from 'react';
import { 
  TableIcon, 
  Info, 
  ChevronDown, 
  ChevronRight, 
  Play, 
  RotateCw,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Database
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchQueryResult, type SelectionValue } from '@/lib/squirrels-api';
import type { DataModelItem } from '@/types/data-catalog-response';
import type { ProjectMetadataResponse } from '@/types/project-metadata-response';
import type { DatasetResultResponse } from '@/types/dataset-result-response';

const SqlEditor = lazy(() => import('./SqlEditor'));

interface SqlPlaygroundProps {
  models: DataModelItem[];
  projectMetadata: ProjectMetadataResponse;
  paramOverrides: Record<string, SelectionValue>;
  pageSize: number;
}

export const SqlPlayground: FC<SqlPlaygroundProps> = ({
  models,
  projectMetadata,
  paramOverrides,
  pageSize,
}) => {
  const { resolvedTheme } = useTheme();
  const [sqlQuery, setSqlQuery] = useState('');
  const [appliedSqlQuery, setAppliedSqlQuery] = useState('');
  const [appliedParamOverrides, setAppliedParamOverrides] = useState<Record<string, SelectionValue>>({});
  const [result, setResult] = useState<DatasetResultResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedModels, setExpandedModels] = useState<Record<string, boolean>>({});

  const toggleModel = (name: string) => {
    setExpandedModels(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const groupedModels = useMemo(() => {
    const groups: Record<string, DataModelItem[]> = {
      source: [],
      seed: [],
      build: [],
      dbview: [],
      federate: [],
    };
    models.forEach(m => {
      if (groups[m.model_type]) {
        groups[m.model_type].push(m);
      }
    });
    return groups;
  }, [models]);

  const handleRunQuery = useCallback(async (page: number = 1, useApplied: boolean = false) => {
    const currentSqlQuery = useApplied ? appliedSqlQuery : sqlQuery;
    const currentParamOverrides = useApplied ? appliedParamOverrides : paramOverrides;
    
    if (!currentSqlQuery.trim()) return;

    if (!useApplied) setIsLoading(true);
    setError(null);
    try {
      const res = await fetchQueryResult(
        projectMetadata,
        currentSqlQuery,
        currentParamOverrides,
        { offset: (page - 1) * pageSize, limit: pageSize }
      );
      setResult(res);
      setCurrentPage(page);
      if (!useApplied) {
        setAppliedSqlQuery(sqlQuery);
        setAppliedParamOverrides(paramOverrides);
      }
    } catch (err) {
      console.error('Failed to run query:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while running the query');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, [projectMetadata, sqlQuery, appliedSqlQuery, paramOverrides, appliedParamOverrides, pageSize]);

  const handleClear = () => {
    setSqlQuery('');
  };

  const totalPages = useMemo(() => {
    if (!result) return 0;
    return Math.ceil(result.total_num_rows / pageSize);
  }, [result, pageSize]);

  const columns = useMemo(() => result?.schema.fields ?? [], [result]);
  const rows = useMemo(() => result?.data ?? [], [result]);

  return (
    <div className="flex h-full overflow-hidden bg-background">
      {/* Models Browser */}
      <div className="w-90 border border-border flex flex-col overflow-hidden bg-card/30">
        <div className="p-4 border-b border-border bg-card/50">
          <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <Database className="w-4 h-4" />
            Data Models
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
          {Object.entries(groupedModels).map(([type, typeModels]) => {
            if (typeModels.length === 0) return null;
            return (
              <div key={type} className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  {type} Models
                  <Badge variant="outline" className="text-xs px-1">{typeModels.length}</Badge>
                </h4>
                <div className="space-y-1">
                  {typeModels.map(model => (
                    <div key={model.name} className="border border-border/50 rounded-lg overflow-hidden bg-card/50 transition-all hover:border-primary/30">
                      <button
                        onClick={() => toggleModel(model.name)}
                        className="w-full text-left p-2.5 flex items-center justify-between hover:bg-accent/50 transition-colors"
                      >
                        <span className="text-sm font-semibold truncate flex items-center gap-2">
                          {expandedModels[model.name] ? <ChevronDown className="w-3.5 h-3.5 text-primary" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                          {model.name}
                        </span>
                        {!model.is_queryable && (
                          <Badge variant="default" className="text-[9px] h-4 px-1 leading-none">Querying Not Supported</Badge>
                        )}
                      </button>
                      {expandedModels[model.name] && (
                        <div className="p-3 pt-0 border-t border-border/30 bg-background/50 animate-in slide-in-from-top-1 duration-200">
                          {model.config.description && (
                            <p className="text-xs text-muted-foreground mb-3 leading-relaxed italic">
                              {model.config.description}
                            </p>
                          )}
                          <div className="space-y-1.5">
                            <h5 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Columns</h5>
                            <div className="flex flex-col gap-3">
                              {model.config.columns?.map(col => (
                                <div 
                                  key={col.name} 
                                  className={`relative pl-3 py-2 border-l-2 hover:bg-accent/30 transition-colors rounded-r-md ${
                                    col.category === 'dimension'
                                      ? 'border-blue-500/60'
                                      : col.category === 'measure'
                                      ? 'border-amber-500/60'
                                      : 'border-slate-500/60'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <span className="text-sm font-bold text-foreground tracking-tight break-all">{col.name}</span>
                                    <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded font-mono shrink-0 border border-border/50">{col.type}</span>
                                  </div>

                                  {col.description && (
                                    <p className="text-xs text-muted-foreground/90 italic leading-relaxed whitespace-normal wrap-break-word mb-2">
                                      {col.description}
                                    </p>
                                  )}
                                  
                                  {(col.category || (col.condition && col.condition.length > 0)) && (
                                    <div className="flex flex-wrap gap-1.5">
                                      {col.category && (
                                        <Badge 
                                          variant="secondary" 
                                          className={`text-[10px] px-2 h-5 font-normal border-0 rounded-sm ${
                                            col.category === 'dimension' 
                                              ? 'bg-blue-500/15 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 hover:bg-blue-500/25' 
                                              : col.category === 'measure'
                                              ? 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 hover:bg-amber-500/25'
                                              : 'bg-slate-500/15 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300 hover:bg-slate-500/25'
                                          }`}
                                        >
                                          {col.category}
                                        </Badge>
                                      )}
                                      {col.condition?.map(cond => (
                                        <Badge key={cond} variant="outline" className="text-[10px] px-1.5 h-4 font-normal border-primary/20 text-primary/50">
                                          {cond}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                              {(!model.config.columns || model.config.columns.length === 0) && (
                                <span className="text-[10px] text-muted-foreground italic px-2">No columns defined</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Editor and Results */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Editor Section */}
        <div className="p-6 border-b border-border bg-card/20 space-y-4">
          <div className="flex items-center justify-start">
            <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest">SQL Query Editor</h3>
          </div>
          
          <div className="border border-border rounded-xl overflow-hidden bg-background shadow-inner focus-within:ring-1 focus-within:ring-primary/30 resize-y min-h-[50px] h-[100px]">
            <Suspense fallback={
              <div className="w-full h-full flex items-center justify-center bg-background text-muted-foreground text-xs font-mono">
                Loading SQL Editor...
              </div>
            }>
              <SqlEditor
                value={sqlQuery}
                onChange={(value) => setSqlQuery(value)}
                onRunQuery={() => handleRunQuery(1)}
                theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
                models={models}
                placeholder='Write SQL query here, press "Ctrl+Enter" to run it'
                className="text-sm h-full"
              />
            </Suspense>
          </div>

          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClear}
              className="gap-2 h-8"
            >
              <RotateCw className="w-3.5 h-3.5" />
              Clear
            </Button>
            <Button 
              size="sm" 
              onClick={() => handleRunQuery(1)}
              disabled={isLoading || !sqlQuery.trim()}
              className="gap-2 h-8 shadow-sm"
            >
              {isLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              Run Query
            </Button>
          </div>
        </div>

        {/* Results Section */}
        <div className="flex-1 overflow-hidden flex flex-col bg-background/50">
          {error && (
            <div className="p-6">
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm flex gap-3">
                <Info className="w-5 h-5 shrink-0" />
                <div className="space-y-1">
                  <p className="font-bold">Query Execution Failed</p>
                  <p className="opacity-90">{error}</p>
                </div>
              </div>
            </div>
          )}

          {!result && !error && !isLoading && (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6">
              <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center border border-border mb-4 opacity-50">
                <TableIcon className="w-8 h-8" />
              </div>
              <p className="font-medium text-foreground">No data to display</p>
              <p className="text-sm max-w-xs text-center mt-1">Write your SQL query above and click "Run Query" to see the results.</p>
            </div>
          )}

          {isLoading && !result && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium animate-pulse text-muted-foreground">Executing query...</p>
            </div>
          )}

          {result && (
            <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-500">
              <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border sticky top-0 z-10 backdrop-blur-sm">
                      {columns.map(col => (
                        <th key={col.name} className="text-left px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider bg-muted/50">
                          <div className="flex items-center gap-2">
                            {col.name}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card/20">
                    {rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-accent/30 transition-colors group">
                        {columns.map((col, colIdx) => (
                          <td key={col.name} className="px-6 py-3.5 text-foreground whitespace-nowrap font-mono text-xs">
                            {String(row[colIdx] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-4 border-t border-border bg-card/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                <div className="flex flex-wrap items-center gap-4">
                  <span>
                    Showing {rows.length} of {result.total_num_rows} rows
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleRunQuery(1, true)}
                    disabled={currentPage === 1 || isLoading}
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleRunQuery(currentPage - 1, true)}
                    disabled={currentPage === 1 || isLoading}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="px-3 h-8 flex items-center bg-muted rounded font-bold text-foreground min-w-[100px] justify-center">
                    Page {currentPage} of {totalPages || 1}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleRunQuery(currentPage + 1, true)}
                    disabled={currentPage === totalPages || totalPages === 0 || isLoading}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleRunQuery(totalPages, true)}
                    disabled={currentPage === totalPages || totalPages === 0 || isLoading}
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
