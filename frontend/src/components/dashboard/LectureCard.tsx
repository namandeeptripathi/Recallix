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
  Tag,
  MessageSquare,
  BookOpen,
  CalendarDays,
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
  const taskPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  return (
    <article
      id={`lecture-card-${lecture.id}`}
      className="rounded-xl overflow-hidden card-hover"
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-base)",
        transition: "border-color 0.18s ease, box-shadow 0.18s ease",
      }}
    >
      {/* ── Card header ─────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1.5 flex-1 min-w-0">
          {/* Meta row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="px-2 py-0.5 text-[11px] font-semibold rounded-md tracking-wide"
              style={{
                backgroundColor: "var(--accent-subtle)",
                color: "var(--accent)",
                border: "1px solid var(--accent-border)",
              }}
            >
              {lecture.subject}
            </span>
            <span
              className="flex items-center gap-1 text-[11px]"
              style={{ color: "var(--text-muted)" }}
            >
              <CalendarDays className="w-3 h-3 shrink-0" />
              {formatDate(lecture.created_at)}
            </span>
            {totalTasks > 0 && (
              <span
                className="text-[11px] font-medium"
                style={{ color: taskPercent === 100 ? "var(--success)" : "var(--text-muted)" }}
              >
                {completedCount}/{totalTasks} tasks
              </span>
            )}
          </div>
          {/* Title */}
          <h3
            className="text-[0.9375rem] font-semibold leading-snug"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}
          >
            {lecture.title}
          </h3>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onAskQuestion}
            className="btn-secondary flex items-center gap-1.5 px-2.5 py-1.5 text-xs"
            title="Ask grounded questions on this lecture"
          >
            <MessageSquare className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Ask Q&A</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn-ghost p-1.5"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded
              ? <ChevronUp className="w-4 h-4" strokeWidth={1.75} />
              : <ChevronDown className="w-4 h-4" strokeWidth={1.75} />}
          </button>
        </div>
      </div>

      {/* ── Expanded body ────────────────────────────────────────── */}
      {isExpanded && (
        <div style={{ borderTop: "1px solid var(--border-subtle)" }}>

          {/* AI Summary section */}
          <div className="px-4 py-3.5" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <div className="flex items-center justify-between mb-2.5">
              <div
                className="flex items-center gap-1.5 text-[11px] font-semibold"
                style={{ color: "var(--accent)" }}
              >
                <BookOpen className="w-3.5 h-3.5" strokeWidth={2} />
                <span>{showRawNotes ? "Raw Notes" : "AI Summary"}</span>
              </div>
              <button
                onClick={() => setShowRawNotes(!showRawNotes)}
                className="flex items-center gap-1 text-[11px] transition-colors cursor-pointer"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = "var(--text-secondary)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = "var(--text-muted)")
                }
              >
                <FileText className="w-3 h-3" />
                <span>{showRawNotes ? "View Summary" : "View Raw Notes"}</span>
              </button>
            </div>

            <div
              className="px-3.5 py-3 rounded-lg text-[0.8125rem] leading-relaxed"
              style={{
                backgroundColor: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)",
              }}
            >
              {showRawNotes ? (
                <pre className="font-mono text-xs whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>
                  {lecture.raw_notes}
                </pre>
              ) : (
                <p>{lecture.summary || "Summary processing…"}</p>
              )}
            </div>
          </div>

          {/* Key Concepts section */}
          {lecture.key_concepts && lecture.key_concepts.length > 0 && (
            <div className="px-4 py-3.5" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <div
                className="flex items-center gap-1.5 text-[11px] font-semibold mb-2.5"
                style={{ color: "var(--warning)" }}
              >
                <Tag className="w-3.5 h-3.5" strokeWidth={2} />
                <span>Key Concepts</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {lecture.key_concepts.map((concept, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 text-[11px] rounded-md"
                    style={{
                      backgroundColor: "var(--warning-bg)",
                      border: "1px solid rgba(196,154,74,0.18)",
                      color: "var(--warning)",
                    }}
                  >
                    {concept}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Study Tasks section */}
          {lecture.action_items && lecture.action_items.length > 0 && (
            <div className="px-4 py-3.5">
              <div className="flex items-center justify-between mb-2.5">
                <div
                  className="flex items-center gap-1.5 text-[11px] font-semibold"
                  style={{ color: "var(--success)" }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} />
                  <span>Study Tasks</span>
                </div>
                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  {completedCount} / {totalTasks}
                </span>
              </div>

              {/* Inline task progress */}
              {totalTasks > 0 && (
                <div className="progress-track mb-2.5">
                  <div className="progress-fill" style={{ width: `${taskPercent}%` }} />
                </div>
              )}

              <div className="space-y-1">
                {lecture.action_items.map((task) => (
                  <label
                    key={task.id}
                    className="flex items-start gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors"
                    style={
                      task.completed
                        ? { opacity: 0.45 }
                        : { backgroundColor: "var(--bg-elevated)" }
                    }
                    onMouseEnter={(e) => {
                      if (!task.completed)
                        (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-overlay)";
                    }}
                    onMouseLeave={(e) => {
                      if (!task.completed)
                        (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-elevated)";
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => onToggleTask(lecture.id, task.id, !task.completed)}
                      className="mt-0.5 shrink-0 focus:outline-none cursor-pointer"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-4 h-4" style={{ color: "var(--success)" }} strokeWidth={2} />
                      ) : (
                        <Circle className="w-4 h-4" style={{ color: "var(--text-muted)" }} strokeWidth={1.75} />
                      )}
                    </button>
                    <span
                      className={`flex-1 text-xs leading-snug ${task.completed ? "line-through" : ""}`}
                      style={{
                        color: task.completed ? "var(--text-muted)" : "var(--text-secondary)",
                      }}
                    >
                      {task.task}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
};
