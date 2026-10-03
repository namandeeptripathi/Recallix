"use client";

import React from "react";
import {
  LayoutDashboard,
  BookMarked,
  CheckSquare,
  MessageSquareText,
  Activity,
  Cpu,
} from "lucide-react";

export type NavTab = "dashboard" | "lectures" | "tasks" | "chat" | "diagnostics";

interface Props {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  lectureCount: number;
  pendingTasksCount: number;
}

export const Sidebar: React.FC<Props> = ({
  activeTab,
  onTabChange,
  lectureCount,
  pendingTasksCount,
}) => {
  const navItems = [
    { id: "dashboard" as NavTab, label: "Overview", icon: LayoutDashboard },
    {
      id: "lectures" as NavTab,
      label: "Lectures & Notes",
      icon: BookMarked,
      badge: lectureCount > 0 ? String(lectureCount) : undefined,
    },
    {
      id: "tasks" as NavTab,
      label: "Action Items",
      icon: CheckSquare,
      badge: pendingTasksCount > 0 ? String(pendingTasksCount) : undefined,
      badgePending: true,
    },
    { id: "chat" as NavTab, label: "Ask Recallix", icon: MessageSquareText },
    { id: "diagnostics" as NavTab, label: "Diagnostics", icon: Activity },
  ];

  return (
    <aside
      className="w-full lg:w-52 shrink-0 flex flex-col rounded-xl mb-6 lg:mb-0 overflow-hidden"
      style={{
        backgroundColor: "var(--bg-sidebar)",
        border: "1px solid var(--border-base)",
      }}
    >
      {/* Nav items */}
      <div className="flex-1 p-2 pt-3">
        <p className="section-label px-2 pb-2">Navigation</p>
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => onTabChange(item.id)}
                className="w-full flex items-center justify-between px-2.5 py-2.5 rounded-lg text-[0.8125rem] font-medium transition-all cursor-pointer"
                style={
                  isActive
                    ? {
                        backgroundColor: "var(--accent-subtle)",
                        color: "var(--accent)",
                      }
                    : { color: "var(--text-secondary)" }
                }
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-elevated)";
                    (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "";
                    (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                  }
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className="w-[15px] h-[15px] shrink-0"
                    strokeWidth={isActive ? 2.2 : 1.75}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className="px-1.5 py-0.5 text-[10px] rounded-md font-semibold shrink-0 ml-1.5"
                    style={
                      item.badgePending
                        ? {
                            backgroundColor: "var(--warning-bg)",
                            color: "var(--warning)",
                            border: "1px solid rgba(196,154,74,0.2)",
                          }
                        : {
                            backgroundColor: "var(--bg-elevated)",
                            color: "var(--text-secondary)",
                            border: "1px solid var(--border-base)",
                          }
                    }
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer: AI stack info */}
      <div
        className="m-2 p-3 rounded-lg"
        style={{
          backgroundColor: "var(--bg-elevated)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div
          className="flex items-center gap-2 text-xs font-medium mb-1"
          style={{ color: "var(--text-secondary)" }}
        >
          <Cpu className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--accent)" }} />
          <span>AI Stack</span>
        </div>
        <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
          FastAPI · SQLite · Gemma via Ollama
        </p>
      </div>
    </aside>
  );
};
