"use client";

import React from "react";
import { Plus, Search, BookOpen } from "lucide-react";
import { BackendHealthBadge } from "../dashboard/BackendHealthBadge";
import { BackendStatusState } from "@/types/api";

interface Props {
  backendStatus: BackendStatusState;
  onRefreshHealth: () => void;
  onOpenUpload: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Navbar: React.FC<Props> = ({
  backendStatus,
  onRefreshHealth,
  onOpenUpload,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <header
      className="sticky top-0 z-40 w-full"
      style={{
        backgroundColor: "var(--bg-sidebar)",
        borderBottom: "1px solid var(--border-base)",
      }}
    >
      <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto gap-4">

        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
            style={{ backgroundColor: "var(--accent)", color: "#071210" }}
          >
            <BookOpen className="w-4 h-4" strokeWidth={2.2} />
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span
              className="text-sm font-semibold tracking-tight"
              style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}
            >
              Recallix
            </span>
            <span
              className="px-1.5 py-0.5 text-[10px] font-semibold rounded tracking-widest uppercase"
              style={{
                backgroundColor: "var(--accent-subtle)",
                color: "var(--accent)",
                border: "1px solid var(--accent-border)",
              }}
            >
              Beta
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs hidden md:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />
          </div>
          <input
            id="lecture-search-input"
            type="text"
            placeholder="Search lectures, concepts..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="input-base w-full pl-9 pr-4 py-1.5 text-[0.8125rem]"
          />
        </div>

        {/* Right */}
        <div className="flex items-center gap-2.5 shrink-0">
          <BackendHealthBadge status={backendStatus} onRefresh={onRefreshHealth} />
          <button
            id="upload-lecture-header-btn"
            onClick={onOpenUpload}
            className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Lecture</span>
          </button>
        </div>
      </div>
    </header>
  );
};
