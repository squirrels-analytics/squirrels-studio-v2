declare global {
  interface Window {
    DEFAULT_ORIGIN?: string;
    DEFAULT_MOUNTPATH?: string;
  }
}

export type ExplorerOptionType = 'Datasets' | 'Dashboards' | 'SqlPlayground' | 'DataLineage';