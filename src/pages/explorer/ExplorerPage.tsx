import { useState, useMemo, useCallback, lazy, Suspense, type FC } from 'react';
import { Navigate } from 'react-router-dom';
import { ChevronDown, TableIcon, Download, LayoutDashboardIcon, Info, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2 } from 'lucide-react';
import useSWR from 'swr';
import { useApp } from '@/context/AppContext';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { downloadCsv } from '@/lib/utils';
import { fetchDataCatalog, fetchAssetParameters, fetchAssetResults, fetchProjectParameters, logout, type SelectionValue } from '@/lib/squirrels-api';
import NotFoundPage from '../NotFoundPage';
import { SqlPlayground } from './SqlPlayground';

const DataLineageExplorer = lazy(() => import('./DataLineageExplorer'));

import type {
  DataCatalogResponse,
  AnyParameterModel,
  SingleSelectParameterModel,
  MultiSelectParameterModel,
  ParametersResponse,
  DashboardItemModel
} from '@/types/data-catalog-response';
import type { DatasetResultResponse } from '@/types/dataset-result-response';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import type { ExplorerOptionType } from '@/types/core';

const ExplorerPage: FC = () => {
  const appNavigate = useAppNavigate();
  const { 
    hostUrl, 
    projectMetadata, 
    userProps, 
    setGuestSession, 
    isLoading, 
    setIsLoading,
    isSessionExpiredModalOpen
  } = useApp();

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    if (projectMetadata) {
      try {
        await logout(projectMetadata.api_routes.logout_url);
      } catch (err) {
        console.error('Logout error:', err);
      }
    }

    setGuestSession();
    appNavigate('/login');
  };

  const [exploreType, setExploreType] = useState<ExplorerOptionType>('Datasets');
  const [selectedDatasetName, setSelectedDatasetName] = useState<string | null>(null);
  const [selectedDashboardName, setSelectedDashboardName] = useState<string | null>(null);
  const [paramOverrides, setParamOverrides] = useState<Record<string, SelectionValue>>({});
  const [appliedParamOverrides, setAppliedParamOverrides] = useState<Record<string, SelectionValue>>({});
  const [hasData, setHasData] = useState(false);
  const [datasetResult, setDatasetResult] = useState<DatasetResultResponse | null>(null);
  const [dashboardResult, setDashboardResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(1000);

  // Fetch Data Catalog
  const { data: catalog } = useSWR<DataCatalogResponse>(
    projectMetadata && !isLoggingOut && !isSessionExpiredModalOpen 
      ? [projectMetadata.api_routes.get_data_catalog_url, userProps?.username] 
      : null,
    ([url]) => fetchDataCatalog(url)
  );

  const datasets = catalog?.datasets ?? [];
  const dashboards = catalog?.dashboards ?? [];

  const activeAssetName = useMemo(() => {
    if (exploreType === 'Datasets') {
      return selectedDatasetName ?? datasets[0]?.name_for_api ?? null;
    } else {
      return selectedDashboardName ?? dashboards[0]?.name_for_api ?? null;
    }
  }, [exploreType, selectedDatasetName, selectedDashboardName, datasets, dashboards]);

  const activeAsset = useMemo(() => {
    const list = exploreType === 'Datasets' ? datasets : dashboards;
    return list.find(a => a.name_for_api === activeAssetName) ?? null;
  }, [exploreType, activeAssetName, datasets, dashboards]);

  // Fetch Parameters for Active Asset
  const effectiveAssetName = exploreType === 'SqlPlayground' || exploreType === 'DataLineage' || activeAssetName;
  const paramKey = projectMetadata && effectiveAssetName && !isLoggingOut && !isSessionExpiredModalOpen
    ? [projectMetadata, exploreType, activeAssetName, userProps?.username, 'params']
    : null;

  const { data: paramsData, mutate: mutateParams } = useSWR<ParametersResponse>(
    paramKey,
    () => {
      if (exploreType === 'SqlPlayground' || exploreType === 'DataLineage') {
        return fetchProjectParameters(projectMetadata!);
      }
      return fetchAssetParameters(projectMetadata!, exploreType, activeAssetName!);
    }
  );

  const parameters = paramsData?.parameters ?? [];

  const handleParamChange = async (param: AnyParameterModel, value: SelectionValue) => {
    const name = param.name;
    setParamOverrides(prev => ({ ...prev, [name]: value }));

    if (param.widget_type === 'single_select' || param.widget_type === 'multi_select') {
      const p = param as SingleSelectParameterModel | MultiSelectParameterModel;
      if (p.trigger_refresh) {
        try {
          const refreshed = (exploreType === 'SqlPlayground' || exploreType === 'DataLineage')
            ? await fetchProjectParameters(projectMetadata!, name, value)
            : await fetchAssetParameters(projectMetadata!, exploreType, activeAssetName!, name, value);

          // Update cache
          if (paramsData) {
            const updatedParams = paramsData.parameters.map(existing => {
              const fresh = refreshed.parameters.find(r => r.name === existing.name);
              return fresh || existing;
            });
            mutateParams({ parameters: updatedParams }, false);
          }

          // Clear stale overrides for children (params not changed by refresh or the parent itself)
          const refreshedNames = new Set(refreshed.parameters.map(p => p.name));
          setParamOverrides(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(key => {
              if (key !== name && refreshedNames.has(key)) {
                delete next[key];
              }
            });
            return next;
          });
        } catch (err) {
          console.error('Failed to refresh parameters:', err);
        }
      }
    }
  };

  const handleApply = useCallback(async (pageOrEvent: number | React.MouseEvent | unknown = 1, useAppliedParams: boolean = false) => {
    if (!projectMetadata || !activeAssetName) return;
    
    const page = typeof pageOrEvent === 'number' ? pageOrEvent : 1;
    const currentParams = useAppliedParams ? appliedParamOverrides : paramOverrides;
    
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchAssetResults(
        projectMetadata,
        exploreType,
        activeAssetName,
        currentParams,
        exploreType === 'Datasets' ? { offset: (page - 1) * pageSize, limit: pageSize } : undefined
      );
      
      if (exploreType === 'Datasets') {
        setDatasetResult(result as DatasetResultResponse);
        setDashboardResult(null);
        setCurrentPage(page);
      } else {
        setDatasetResult(null);
        if (result instanceof Blob) {
          const url = URL.createObjectURL(result);
          if (dashboardResult?.startsWith('blob:')) {
            URL.revokeObjectURL(dashboardResult);
          }
          setDashboardResult(url);
        } else {
          setDashboardResult(result as string); // HTML string
        }
      }
      setHasData(true);
      if (!useAppliedParams) {
        setAppliedParamOverrides(paramOverrides);
      }
    } catch (err) {
      console.error('Failed to fetch results:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
      setIsErrorModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  }, [
    projectMetadata,
    activeAssetName,
    exploreType,
    paramOverrides,
    appliedParamOverrides,
    pageSize,
    dashboardResult,
    setIsLoading
  ]);

  const currentRows = useMemo(() => {
    return datasetResult?.data ?? [];
  }, [datasetResult]);

  const columns = useMemo(() => {
    return datasetResult?.schema.fields ?? [];
  }, [datasetResult]);

  const totalPages = useMemo(() => {
    if (!datasetResult) return 0;
    return Math.ceil(datasetResult.total_num_rows / pageSize);
  }, [datasetResult, pageSize]);

  const dashboardFormat = useMemo(() => {
    if (exploreType === 'Dashboards' && activeAsset) {
      return (activeAsset as DashboardItemModel).result_format;
    }
    return null;
  }, [exploreType, activeAsset]);

  const handleExportCurrentRows = () => {
    const startRow = (currentPage - 1) * pageSize + 1;
    const endRow = (currentPage - 1) * pageSize + currentRows.length;
    const csvName = `${(activeAssetName || 'dataset')}-rows-${startRow}-to-${endRow}.csv`;
    downloadCsv(currentRows, csvName, columns.map(c => c.name));
  };

  const handleExportAllRows = async () => {
    if (!projectMetadata || !activeAssetName || !datasetResult) return;
    
    setIsLoading(true);
    try {
      const result = await fetchAssetResults(
        projectMetadata,
        exploreType,
        activeAssetName,
        appliedParamOverrides,
        { offset: 0, limit: datasetResult.total_num_rows }
      );
      
      if (typeof result === 'object' && result !== null && 'data' in result) {
        const data = (result as DatasetResultResponse).data;
        const csvName = `${(activeAssetName || 'dataset')}-all.csv`;
        downloadCsv(data, csvName, columns.map(c => c.name));
      } else {
        throw new Error('Unexpected response format from server');
      }
    } catch (err) {
      console.error('Failed to export all rows:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while exporting data');
      setIsErrorModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (!hostUrl) {
    return <Navigate to="/" replace />;
  }

  if (projectMetadata?.auth_type === 'required' && !userProps && !isSessionExpiredModalOpen) {
    return <NotFoundPage />;
  }
  
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col h-screen overflow-hidden">
      <Header 
        projectLabel={projectMetadata?.label || ''} 
        projectVersion={projectMetadata?.version || ''} 
        username={userProps?.username || null} 
        accessLevel={userProps?.access_level || null}
        onLogout={handleLogout} 
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          exploreType={exploreType}
          setExploreType={(type) => {
            setExploreType(type);
            setParamOverrides({});
            setAppliedParamOverrides({});
            setHasData(false);
            setDatasetResult(null);
            setCurrentPage(1);
            if (dashboardResult?.startsWith('blob:')) {
              URL.revokeObjectURL(dashboardResult);
            }
            setDashboardResult(null);
            setError(null);
          }}
          activeAssetName={activeAssetName}
          onAssetChange={(val) => {
            if (exploreType === 'Datasets') setSelectedDatasetName(val);
            else setSelectedDashboardName(val);
            setParamOverrides({});
            setAppliedParamOverrides({});
            setHasData(false);
            setDatasetResult(null);
            setCurrentPage(1);
            if (dashboardResult?.startsWith('blob:')) {
              URL.revokeObjectURL(dashboardResult);
            }
            setDashboardResult(null);
            setError(null);
          }}
          datasets={datasets}
          dashboards={dashboards}
          parameters={parameters}
          paramOverrides={paramOverrides}
          isLoading={isLoading}
          onParamChange={handleParamChange}
          onApply={handleApply}
          userAccessLevel={userProps?.access_level || null}
          elevatedAccessLevel={projectMetadata?.elevated_access_level || null}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-background p-6">
          <Dialog open={isErrorModalOpen} onOpenChange={setIsErrorModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-destructive">Loading Failed</DialogTitle>
                <DialogDescription>
                  {error}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={() => setIsErrorModalOpen(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {exploreType === 'SqlPlayground' ? (
            <SqlPlayground 
              models={catalog?.models ?? []} 
              connections={catalog?.connections ?? []}
              projectMetadata={projectMetadata!} 
              paramOverrides={paramOverrides}
              pageSize={pageSize}
            />
          ) : exploreType === 'DataLineage' ? (
            <Suspense fallback={
              <div className="h-full w-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading lineage explorer...</p>
                </div>
              </div>
            }>
              <DataLineageExplorer
                catalog={catalog!}
                projectMetadata={projectMetadata!}
                paramOverrides={paramOverrides}
              />
            </Suspense>
          ) : !hasData ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center border-4 border-dashed border-border">
                {exploreType === 'Datasets' ? (
                  <TableIcon className="w-10 h-10 text-muted-foreground/50" />
                ) : (
                  <LayoutDashboardIcon className="w-10 h-10 text-muted-foreground/50" />
                )}
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-foreground text-lg">{exploreType === 'Datasets' ? 'Dataset' : 'Dashboard'} Canvas</h3>
                <p className="max-w-xs mx-auto text-muted-foreground">Select your parameters on the left and click "Apply" to view the {exploreType === 'Datasets' ? 'dataset' : 'dashboard'}.</p>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden h-full flex flex-col animate-in fade-in zoom-in-95 duration-500">
              <div className="p-4 border-b border-border flex items-center justify-between bg-card sticky top-0 z-10">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <TableIcon className="w-4 h-4 text-primary" />
                  {activeAsset?.label || activeAssetName}
                </h3>
                {exploreType === 'Datasets' && (
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="sm" className="gap-2">
                          <Download className="w-3.5 h-3.5" />
                          Export CSV
                          <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={handleExportCurrentRows}>
                          Export current rows
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleExportAllRows}>
                          Export all rows
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
              
              <div className="flex-1 overflow-auto custom-scrollbar">
                {exploreType === 'Datasets' ? (
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-muted border-b border-border">
                        {columns.map(col => (
                          <th key={col.name} className="text-left px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider sticky top-0 bg-muted">
                            <div className="flex items-center gap-2">
                              {col.name}
                              {col.description && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                      <p className="max-w-xs">{col.description}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {currentRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-accent/50 transition-colors group">
                          {columns.map((col, colIdx) => (
                            <td key={col.name} className="px-6 py-3.5 text-foreground whitespace-nowrap">
                              {String(row[colIdx] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="h-full w-full bg-white flex items-center justify-center">
                    {dashboardFormat === 'png' ? (
                      <img src={dashboardResult ?? ''} alt="Dashboard" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <iframe 
                        srcDoc={dashboardResult ?? ''} 
                        className="w-full h-full border-none" 
                        title="Dashboard Content"
                      />
                    )}
                  </div>
                )}
              </div>

              {exploreType === 'Datasets' && (
                <div className="p-4 border-t border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                  <div className="flex flex-wrap items-center gap-4">
                    <span>
                      Showing {currentRows.length} of {datasetResult?.total_num_rows || currentRows.length} rows
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleApply(1, true)}
                      disabled={currentPage === 1 || isLoading}
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleApply(currentPage - 1, true)}
                      disabled={currentPage === 1 || isLoading}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="px-3 h-8 flex items-center bg-muted rounded font-bold text-foreground">
                      Page {currentPage} of {totalPages || 1}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleApply(currentPage + 1, true)}
                      disabled={currentPage === totalPages || totalPages === 0 || isLoading}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleApply(totalPages, true)}
                      disabled={currentPage === totalPages || totalPages === 0 || isLoading}
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ExplorerPage;
