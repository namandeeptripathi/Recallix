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
  ShieldCheck,
} from "lucide-react";

interface Props {
  backendStatus: BackendStatusState;
  onRefresh: () => void;
}

export const DiagnosticsView: React.FC<Props> = ({
  backendStatus,
  onRefresh,
}) => {
  const isHealthy =
    backendStatus.healthy && backendStatus.data?.status === "ok";

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-2xl ${
                isHealthy
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                  : "bg-rose-500/10 border border-rose-500/30 text-rose-400"
              }`}
            >
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                FastAPI & SQLite Diagnostics
              </h2>
              <p className="text-xs text-slate-400">
                Live monitoring connection between Next.js client and FastAPI server.
              </p>
            </div>
          </div>

          <button
            onClick={onRefresh}
            disabled={backendStatus.loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition-all cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                backendStatus.loading ? "animate-spin" : ""
              }`}
            />
            <span>Ping Backend Now</span>
          </button>
        </div>
      </div>

      {/* Grid of indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status */}
        <div className="p-5 rounded-2xl glass-panel border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>FastAPI Server</span>
            <Server className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-center gap-2">
            {isHealthy ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400" />
            )}
            <span
              className={`text-lg font-bold uppercase tracking-wide ${
                isHealthy ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {backendStatus.data?.status || (backendStatus.loading ? "Checking" : "Offline")}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {backendStatus.data?.service || "FastAPI Backend"} (v
            {backendStatus.data?.version || "0.1.0"})
          </p>
        </div>

        {/* Database */}
        <div className="p-5 rounded-2xl glass-panel border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Database Storage</span>
            <Database className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">
              {backendStatus.data?.database || "SQLite"}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Local SQLite persistence with schema validation via Pydantic.
          </p>
        </div>

        {/* Latency & Uptime */}
        <div className="p-5 rounded-2xl glass-panel border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Network Latency</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-indigo-300 font-mono">
              {backendStatus.latencyMs !== undefined
                ? `${backendStatus.latencyMs} ms`
                : "--"}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Uptime:{" "}
            {backendStatus.data?.uptime_seconds !== undefined
              ? formatUptime(backendStatus.data.uptime_seconds)
              : "--"}
          </p>
        </div>
      </div>

      {/* Raw Health JSON Response */}
      <div className="p-5 rounded-2xl glass-panel border border-slate-800/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Code className="w-4 h-4 text-indigo-400" />
            <span>Raw Response from GET /api/v1/health</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            {backendStatus.lastChecked
              ? `Last tested ${backendStatus.lastChecked.toLocaleTimeString()}`
              : ""}
          </span>
        </div>

        <pre className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 font-mono text-xs text-emerald-400 overflow-x-auto">
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
