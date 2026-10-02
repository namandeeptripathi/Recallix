"use client";

import React, { useState } from "react";
import { BackendStatusState } from "@/types/api";
import { formatUptime } from "@/lib/utils";
import { Activity, CheckCircle2, AlertCircle, RefreshCw, Database, Server } from "lucide-react";

interface Props {
  status: BackendStatusState;
  onRefresh: () => void;
}

export const BackendHealthBadge: React.FC<Props> = ({ status, onRefresh }) => {
  const [showDetails, setShowDetails] = useState(false);

  const isHealthy = status.healthy && status.data?.status === "ok";

  return (
    <div className="relative">
      <button
        id="backend-health-indicator-btn"
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
          status.loading
            ? "bg-slate-800/80 border-slate-700 text-slate-400"
            : isHealthy
            ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300 hover:border-emerald-500/60 glow-badge-emerald"
            : "bg-rose-950/40 border-rose-500/30 text-rose-300 hover:border-rose-500/60"
        }`}
        title="Click to view FastAPI health diagnostics"
      >
        <span className="relative flex h-2 w-2">
          {isHealthy && !status.loading && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              status.loading
                ? "bg-amber-400"
                : isHealthy
                ? "bg-emerald-400"
                : "bg-rose-400"
            }`}
          ></span>
        </span>
        <span className="font-semibold tracking-wide">
          {status.loading
            ? "Checking FastAPI..."
            : isHealthy
            ? `FastAPI: Connected (${status.latencyMs}ms)`
            : "FastAPI: Offline"}
        </span>
      </button>

      {/* Expanded Diagnostics Card */}
      {showDetails && (
        <div className="absolute right-0 mt-3 w-80 p-4 rounded-xl glass-panel shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 border border-slate-700/60">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Server className="w-4 h-4 text-indigo-400" />
              <span>Backend Diagnostics</span>
            </div>
            <button
              onClick={onRefresh}
              disabled={status.loading}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
              title="Ping health endpoint"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${status.loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1 px-2 rounded bg-slate-900/60">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-indigo-400" /> Endpoint
              </span>
              <span className="font-mono text-slate-200">/api/v1/health</span>
            </div>

            <div className="flex items-center justify-between py-1 px-2 rounded bg-slate-900/60">
              <span className="text-slate-400 flex items-center gap-1.5">
                {isHealthy ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                )}
                System Status
              </span>
              <span className={`font-semibold uppercase tracking-wider ${isHealthy ? "text-emerald-400" : "text-rose-400"}`}>
                {status.data?.status || (status.loading ? "Checking" : "Error")}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 px-2 rounded bg-slate-900/60">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-cyan-400" /> Database
              </span>
              <span className="font-mono text-cyan-300">
                {status.data?.database || "SQLite (Inactive)"}
              </span>
            </div>

            {status.data?.uptime_seconds !== undefined && (
              <div className="flex items-center justify-between py-1 px-2 rounded bg-slate-900/60">
                <span className="text-slate-400">Server Uptime</span>
                <span className="font-mono text-slate-300">
                  {formatUptime(status.data.uptime_seconds)}
                </span>
              </div>
            )}

            {status.latencyMs !== undefined && (
              <div className="flex items-center justify-between py-1 px-2 rounded bg-slate-900/60">
                <span className="text-slate-400">Roundtrip Latency</span>
                <span className="font-mono text-indigo-300">{status.latencyMs} ms</span>
              </div>
            )}

            {status.error && (
              <div className="p-2 mt-2 rounded bg-rose-950/60 border border-rose-800/40 text-rose-300 text-[11px] leading-relaxed">
                {status.error}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
