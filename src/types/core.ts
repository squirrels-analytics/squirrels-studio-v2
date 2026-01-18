declare global {
  interface Window {
    DEFAULT_HOSTURL?: string;
  }
}

export type ExplorerOptionType = 'Datasets' | 'Dashboards' | 'SqlPlayground' | 'DataLineage';