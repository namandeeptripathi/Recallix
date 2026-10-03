"use client";

import React from "react";
import { BackendStatusState } from "@/types/api";
import { formatUptime } from "@/lib/utils";
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  Database,
  Server,
  RefreshCw,
  Code,
  Gauge,
} from "lucide-react";

interface Props {
  backendStatus: BackendStatusState;
  onRefresh: () => void;
}

export const DiagnosticsView: React.FC<Props> = ({ backendStatus, onRefresh }) => {
  const isHealthy = backendStatus.healthy && backendStatus.data?.status === "ok";
  const StatusIcon = isHealthy ? CheckCircle2 : AlertCircle;
  const statusColor = isHealthy ? "var(--success)" : "var(--error)";
  const statusBg = isHealthy ? "var(--success-bg)" : "var(--error-bg)";

  return (
    <div className="space-y-4">

      {/* Banner */}
      <div
        className="p-5 rounded-xl"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-base)",
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="p-3 rounded-lg"
              style={{ backgroundColor: statusBg, color: statusColor }}
            >
              <Activity className="w-5 h-5" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                FastAPI & SQLite Diagnostics
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Live monitoring between Next.js client and FastAPI server.
              </p>
            </div>
          </div>

          <button
            onClick={onRefresh}
            disabled={backendStatus.loading}
            className="btn-secondary flex items-center gap-2 px-3.5 py-2 text-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${backendStatus.loading ? "animate-spin" : ""}`} />
            <span>Ping Backend</span>
          </button>
        </div>
      </div>

      {/* Indicator cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div
          className="p-5 rounded-xl space-y-2"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-base)" }}
        >
          <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
            <span>FastAPI Server</span>
            <Server className="w-4 h-4" style={{ color: "var(--accent)" }} />
          </div>
          <div className="flex items-center gap-2">
            <StatusIcon className="w-5 h-5" style={{ color: statusColor }} />
            <span
              className="text-lg font-semibold uppercase tracking-wide"
              style={{ color: statusColor }}
            >
              {backendStatus.data?.status || (backendStatus.loading ? "Checking" : "Offline")}
            </span>
          </div>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            {backendStatus.data?.service || "FastAPI Backend"} (v{backendStatus.data?.version || "0.1.0"})
          </p>
        </div>

        <div
          className="p-5 rounded-xl space-y-2"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-base)" }}
        >
          <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
            <span>Database Storage</span>
            <Database className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          </div>
          <div>
            <span className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              {backendStatus.data?.database || "SQLite"}
            </span>
          </div>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            Local SQLite · schema validated via Pydantic.
          </p>
        </div>

        <div
          className="p-5 rounded-xl space-y-2"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-base)" }}
        >
          <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
            <span>Latency</span>
            <Gauge className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          </div>
          <div>
            <span className="text-lg font-semibold font-mono" style={{ color: "var(--accent)" }}>
              {backendStatus.latencyMs !== undefined ? `${backendStatus.latencyMs} ms` : "—"}
            </span>
          </div>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            Uptime:{" "}
            {backendStatus.data?.uptime_seconds !== undefined
              ? formatUptime(backendStatus.data.uptime_seconds)
              : "—"}
          </p>
        </div>
      </div>

      {/* Raw JSON */}
      <div
        className="p-5 rounded-xl"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-base)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div
            className="flex items-center gap-2 text-xs font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            <Code className="w-4 h-4" style={{ color: "var(--accent)" }} />
            <span>Raw response — GET /api/v1/health</span>
          </div>
          <span className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>
            {backendStatus.lastChecked
              ? `Last checked ${backendStatus.lastChecked.toLocaleTimeString()}`
              : ""}
          </span>
        </div>

        <pre
          className="p-4 rounded-lg font-mono text-xs overflow-x-auto"
          style={{
            backgroundColor: "var(--bg-overlay)",
            border: "1px solid var(--border-subtle)",
            color: "var(--success)",
          }}
        >
          {JSON.stringify(
            backendStatus.data || {
              status: "disconnected",
              error: backendStatus.error || "Ensure backend is running at http://127.0.0.1:8000",
            },
            null,
            2
          )}
        </pre>
      </div>
    </div>
  );
};
