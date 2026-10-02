"use client";

import React, { useState } from "react";
import { Lecture } from "@/types/lecture";
import { formatDate } from "@/lib/utils";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  FileText,
  Lightbulb,
  MessageSquare,
  Sparkles,
  Calendar,
} from "lucide-react";

interface Props {
  lecture: Lecture;
  onToggleTask: (lectureId: string, taskId: string, completed: boolean) => void;
  onAskQuestion: () => void;
}

export const LectureCard: React.FC<Props> = ({
  lecture,
  onToggleTask,
  onAskQuestion,
}) => {
  const [showRawNotes, setShowRawNotes] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const completedCount = lecture.action_items.filter((t) => t.completed).length;
  const totalTasks = lecture.action_items.length;

  return (
    <div
      id={`lecture-card-${lecture.id}`}
      className="p-5 rounded-2xl glass-panel glass-panel-hover border-slate-800/80 transition-all space-y-4"
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[11px] font-semibold tracking-wide rounded-md bg-indigo-950/70 border border-indigo-500/30 text-indigo-300">
              {lecture.subject}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(lecture.created_at)}</span>
            </div>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            {lecture.title}
          </h3>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onAskQuestion}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 transition-all cursor-pointer"
            title="Ask grounded questions on this lecture"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Ask Q&A</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
            title={isExpanded ? "Collapse lecture" : "Expand lecture"}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4 pt-2 border-t border-slate-800/60">
          {/* Summary / Notes Switcher */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>AI Structured Summary</span>
              </div>
              <button
                onClick={() => setShowRawNotes(!showRawNotes)}
                className="text-[11px] text-slate-400 hover:text-indigo-300 underline underline-offset-2 flex items-center gap-1"
              >
                <FileText className="w-3 h-3" />
                <span>{showRawNotes ? "View AI Summary" : "View Raw Notes"}</span>
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 text-xs sm:text-sm text-slate-300 leading-relaxed">
              {showRawNotes ? (
                <div className="font-mono text-xs text-slate-300 whitespace-pre-wrap">
                  {lecture.raw_notes}
                </div>
              ) : (
                <p>{lecture.summary || "Summary processing..."}</p>
              )}
            </div>
          </div>

          {/* Key Concepts */}
          {lecture.key_concepts && lecture.key_concepts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>Core Concepts</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {lecture.key_concepts.map((concept, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 text-xs rounded-lg bg-amber-950/30 border border-amber-500/20 text-amber-200/90"
                  >
                    {concept}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Items / Study Tasks */}
          {lecture.action_items && lecture.action_items.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Actionable Study Tasks</span>
                </div>
                <span className="text-[11px] font-normal text-slate-400">
                  {completedCount} of {totalTasks} done
                </span>
              </div>

              <div className="space-y-1.5">
                {lecture.action_items.map((task) => (
                  <label
                    key={task.id}
                    className={`flex items-start gap-2.5 p-2 rounded-lg transition-colors cursor-pointer text-xs ${
                      task.completed
                        ? "bg-slate-900/30 text-slate-500 line-through"
                        : "bg-slate-900/60 hover:bg-slate-800/60 text-slate-300"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        onToggleTask(lecture.id, task.id, !task.completed)
                      }
                      className="mt-0.5 text-emerald-400 focus:outline-none"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-500 hover:text-emerald-400" />
                      )}
                    </button>
                    <span className="flex-1">{task.task}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
