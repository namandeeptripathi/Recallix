"use client";

import React, { useState } from "react";
import { BackendStatusState } from "@/types/api";
import { formatUptime } from "@/lib/utils";
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Database,
  Server,
} from "lucide-react";

interface Props {
  status: BackendStatusState;
  onRefresh: () => void;
}

export const BackendHealthBadge: React.FC<Props> = ({ status, onRefresh }) => {
  const [showDetails, setShowDetails] = useState(false);

  const isHealthy = status.healthy && status.data?.status === "ok";

  const badgeStyle = status.loading
    ? {
        backgroundColor: "var(--bg-elevated)",
        border: "1px solid var(--border-base)",
        color: "var(--text-muted)",
      }
    : isHealthy
    ? {
        backgroundColor: "var(--success-bg)",
        border: "1px solid rgba(82,168,122,0.25)",
        color: "var(--success)",
      }
    : {
        backgroundColor: "var(--error-bg)",
        border: "1px solid rgba(194,96,96,0.25)",
        color: "var(--error)",
      };

  return (
    <div className="relative">
      <button
        id="backend-health-indicator-btn"
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer"
        style={badgeStyle}
        title="Click to view FastAPI health diagnostics"
      >
        {/* Pulsing dot */}
        <span className="relative flex h-2 w-2 shrink-0">
          {isHealthy && !status.loading && (
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
              style={{ backgroundColor: "var(--success)" }}
            />
          )}
          <span
            className="relative inline-flex rounded-full h-2 w-2"
            style={{
              backgroundColor: status.loading
                ? "var(--warning)"
                : isHealthy
                ? "var(--success)"
                : "var(--error)",
            }}
          />
        </span>
        <span className="hidden sm:inline tracking-wide">
          {status.loading
            ? "Checking…"
            : isHealthy
            ? `Connected (${status.latencyMs}ms)`
            : "Backend offline"}
        </span>
      </button>

      {/* Dropdown diagnostics */}
      {showDetails && (
        <div
          className="absolute right-0 mt-2 w-72 p-4 rounded-xl shadow-xl z-50 animate-in"
          style={{
            backgroundColor: "var(--bg-elevated)",
            border: "1px solid var(--border-base)",
          }}
        >
          <div
            className="flex items-center justify-between pb-3 mb-3"
            style={{ borderBottom: "1px solid var(--border-base)" }}
          >
            <div
              className="flex items-center gap-2 text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              <Server className="w-4 h-4" style={{ color: "var(--accent)" }} />
              <span>Backend Status</span>
            </div>
            <button
              onClick={onRefresh}
              disabled={status.loading}
              className="btn-ghost p-1 cursor-pointer disabled:opacity-50"
              title="Ping health endpoint"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${status.loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="space-y-1.5 text-xs">
            {[
              {
                icon: <Activity className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />,
                label: "Endpoint",
                value: "/api/v1/health",
                mono: true,
              },
              {
                icon: isHealthy ? (
                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "var(--success)" }} />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5" style={{ color: "var(--error)" }} />
                ),
                label: "Status",
                value: status.data?.status || (status.loading ? "Checking" : "Error"),
                valueStyle: {
                  color: isHealthy ? "var(--success)" : "var(--error)",
                  fontWeight: 600,
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.06em",
                },
              },
              {
                icon: <Database className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />,
                label: "Database",
                value: status.data?.database || "SQLite (inactive)",
                mono: true,
              },
            ].map(({ icon, label, value, mono, valueStyle }) => (
              <div
                key={label}
                className="flex items-center justify-between py-1.5 px-2.5 rounded-lg"
                style={{ backgroundColor: "var(--bg-card)" }}
              >
                <span
                  className="flex items-center gap-1.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  {icon}
                  {label}
                </span>
                <span
                  className={mono ? "font-mono" : ""}
                  style={valueStyle || { color: "var(--text-secondary)" }}
                >
                  {value}
                </span>
              </div>
            ))}

            {status.data?.uptime_seconds !== undefined && (
              <div
                className="flex items-center justify-between py-1.5 px-2.5 rounded-lg"
                style={{ backgroundColor: "var(--bg-card)" }}
              >
                <span style={{ color: "var(--text-muted)" }}>Uptime</span>
                <span className="font-mono" style={{ color: "var(--text-secondary)" }}>
                  {formatUptime(status.data.uptime_seconds)}
                </span>
              </div>
            )}

            {status.latencyMs !== undefined && (
              <div
                className="flex items-center justify-between py-1.5 px-2.5 rounded-lg"
                style={{ backgroundColor: "var(--bg-card)" }}
              >
                <span style={{ color: "var(--text-muted)" }}>Latency</span>
                <span className="font-mono" style={{ color: "var(--accent)" }}>
                  {status.latencyMs} ms
                </span>
              </div>
            )}

            {status.error && (
              <div
                className="p-2.5 rounded-lg text-[11px] leading-relaxed mt-1"
                style={{
                  backgroundColor: "var(--error-bg)",
                  border: "1px solid rgba(194,96,96,0.2)",
                  color: "var(--error)",
                }}
              >
                {status.error}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
