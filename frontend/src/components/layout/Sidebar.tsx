"use client";

import React from "react";
import {
  LayoutDashboard,
  BookMarked,
  CheckSquare,
  MessageSquareText,
  Activity,
  Cpu,
  Sparkles,
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
    {
      id: "dashboard" as NavTab,
      label: "Overview",
      icon: LayoutDashboard,
    },
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
      badgeColor: "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30",
    },
    {
      id: "chat" as NavTab,
      label: "Ask Recallix",
      icon: MessageSquareText,
      sparkle: true,
    },
    {
      id: "diagnostics" as NavTab,
      label: "Backend Diagnostics",
      icon: Activity,
    },
  ];

  return (
    <aside className="w-full lg:w-64 shrink-0 flex flex-col justify-between p-4 rounded-2xl glass-panel border-slate-800/80 mb-6 lg:mb-0">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
            Navigation
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-indigo-600/20 text-indigo-200 border border-indigo-500/30 shadow-sm shadow-indigo-500/10"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? "text-indigo-400" : "text-slate-400"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.sparkle && (
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    )}
                    {item.badge && (
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full font-semibold ${
                          item.badgeColor ||
                          "bg-slate-800 text-slate-300 border border-slate-700"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Model Spec Card */}
      <div className="mt-6 pt-4 border-t border-slate-800/80">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-medium mb-1">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>AI Architecture</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            FastAPI + SQLite backbone with Gemma (via Ollama) integration pipeline ready.
          </p>
        </div>
      </div>
    </aside>
  );
};
