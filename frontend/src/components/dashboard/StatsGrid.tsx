"use client";

import React from "react";
import { BookOpen, Lightbulb, CheckCircle2 } from "lucide-react";

interface Props {
  totalLectures: number;
  totalConcepts: number;
  completedTasks: number;
  totalTasks: number;
}

export const StatsGrid: React.FC<Props> = ({
  totalLectures,
  totalConcepts,
  completedTasks,
  totalTasks,
}) => {
  const taskPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

      {/* Lectures */}
      <div
        id="stat-lectures"
        className="px-4 py-3.5 rounded-xl flex items-center gap-4"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-base)",
        }}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: "var(--accent-subtle)", color: "var(--accent)" }}
        >
          <BookOpen className="w-4 h-4" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
            {totalLectures}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
            Lectures ingested
          </p>
        </div>
      </div>

      {/* Key Concepts */}
      <div
        id="stat-concepts"
        className="px-4 py-3.5 rounded-xl flex items-center gap-4"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-base)",
        }}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: "var(--warning-bg)", color: "var(--warning)" }}
        >
          <Lightbulb className="w-4 h-4" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
            {totalConcepts}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
            Key concepts mapped
          </p>
        </div>
      </div>

      {/* Tasks Done — with actual progress bar */}
      <div
        id="stat-tasks"
        className="px-4 py-3.5 rounded-xl"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-base)",
        }}
      >
        <div className="flex items-center gap-4 mb-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "var(--success-bg)", color: "var(--success)" }}
          >
            <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              {completedTasks}
              <span className="text-base font-normal ml-1" style={{ color: "var(--text-muted)" }}>
                / {totalTasks}
              </span>
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
              Tasks completed
            </p>
          </div>
        </div>
        {/* Real progress bar — grounded in actual task data */}
        {totalTasks > 0 && (
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${taskPercent}%` }}
              role="progressbar"
              aria-valuenow={taskPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${taskPercent}% of tasks complete`}
            />
          </div>
        )}
      </div>
    </div>
  );
};
