export interface HealthResponse {
  status: "ok" | "degraded" | "error";
  service: string;
  version: string;
  database: string;
  timestamp: string;
  uptime_seconds: number;
}

export interface BackendStatusState {
  healthy: boolean;
  loading: boolean;
  latencyMs?: number;
  data?: HealthResponse;
  error?: string;
  lastChecked?: Date;
}
