declare global {
  interface Window {
    DEFAULT_HOSTURL?: string;
    SQRL_STUDIO_BASE_URL?: string;
  }
}

export type ExplorerOptionType = 'Datasets' | 'Dashboards' | 'SqlPlayground' | 'DataLineage';