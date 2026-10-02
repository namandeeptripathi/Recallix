"use client";

import React from "react";
import { Sparkles, Plus, Search, BookOpen } from "lucide-react";
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
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 shadow-lg shadow-indigo-500/25">
            <BookOpen className="w-5 h-5 text-white" />
            <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                Recallix
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] uppercase font-semibold tracking-wider text-indigo-300 bg-indigo-950/60 border border-indigo-700/40 rounded-full">
                Beta
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Your AI Lecture Companion
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md mx-4 hidden md:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            id="lecture-search-input"
            type="text"
            placeholder="Search lectures, summaries, concepts..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-900/60 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
          />
        </div>

        {/* Right Actions: Health Badge & Upload CTA */}
        <div className="flex items-center gap-3">
          <BackendHealthBadge
            status={backendStatus}
            onRefresh={onRefreshHealth}
          />

          <button
            id="upload-lecture-header-btn"
            onClick={onOpenUpload}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/25 transition-all transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="font-semibold">New Lecture</span>
          </button>
        </div>
      </div>
    </header>
  );
};
