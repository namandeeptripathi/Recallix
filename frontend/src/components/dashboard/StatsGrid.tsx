"use client";

import React from "react";
import { BookOpen, Lightbulb, CheckCircle2, TrendingUp } from "lucide-react";

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
  const taskPercent =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const stats = [
    {
      id: "stat-lectures",
      label: "Lectures Ingested",
      value: totalLectures,
      subtext: "Ready for Q&A review",
      icon: BookOpen,
      color: "from-blue-500/20 to-indigo-500/20 text-indigo-400 border-indigo-500/30",
    },
    {
      id: "stat-concepts",
      label: "Key Concepts Mapped",
      value: totalConcepts,
      subtext: "Distilled from notes",
      icon: Lightbulb,
      color: "from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30",
    },
    {
      id: "stat-tasks",
      label: "Action Items Done",
      value: `${completedTasks}/${totalTasks}`,
      subtext: `${taskPercent}% tasks completed`,
      icon: CheckCircle2,
      color: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30",
    },
    {
      id: "stat-readiness",
      label: "Study Readiness",
      value: `${Math.min(95, 60 + totalLectures * 10)}%`,
      subtext: "Grounded recall readiness",
      icon: TrendingUp,
      color: "from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.id}
            id={stat.id}
            className="p-5 rounded-2xl glass-panel glass-panel-hover border-slate-800/80 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 mb-1">{stat.label}</p>
                <h3 className="text-2xl font-bold tracking-tight text-white">
                  {stat.value}
                </h3>
              </div>
              <div className={`p-3 rounded-xl bg-gradient-to-br border ${stat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
              <span>{stat.subtext}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
