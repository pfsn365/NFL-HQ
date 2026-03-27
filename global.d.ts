interface ChartbeatConfig {
  uid?: number;
  domain?: string;
  flickerControl?: boolean;
  useCanonical?: boolean;
  useCanonicalDomain?: boolean;
  sections?: string;
  authors?: string;
  title?: string;
  path?: string;
}

interface ChartbeatSuperfly {
  virtualPage: (path: string, title: string) => void;
}

interface Window {
  _sf_async_config?: ChartbeatConfig;
  pSUPERFLY?: ChartbeatSuperfly;
}
