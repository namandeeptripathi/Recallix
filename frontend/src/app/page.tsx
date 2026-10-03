"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar, NavTab } from "@/components/layout/Sidebar";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { LectureCard } from "@/components/dashboard/LectureCard";
import { UploadLectureModal } from "@/components/dashboard/UploadLectureModal";
import { LectureChat } from "@/components/dashboard/LectureChat";
import { DiagnosticsView } from "@/components/dashboard/DiagnosticsView";
import { BackendStatusState } from "@/types/api";
import { CreateLectureInput, Lecture } from "@/types/lecture";
import {
  checkBackendHealth,
  fetchLectures,
  createLecture,
  toggleTaskCompletion,
} from "@/lib/api";
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Plus,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  MessageSquareText,
  ListTodo,
  Layers,
} from "lucide-react";

// ─── Static sub-components (declared outside render) ──────────────────────────

function EmptyLectures({ onAdd }: { onAdd?: () => void }) {
  return (
    <div
      className="py-12 px-6 text-center rounded-xl"
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-base)",
      }}
    >
      <div
        className="w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: "var(--accent-subtle)", color: "var(--accent)" }}
      >
        <Layers className="w-6 h-6" strokeWidth={1.5} />
      </div>
      <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
        No lecture notes yet
      </p>
      <p className="text-xs leading-relaxed mb-5" style={{ color: "var(--text-muted)" }}>
        Paste or upload your first lecture transcript to begin generating structured summaries.
      </p>
      {onAdd && (
        <button
          onClick={onAdd}
          className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Add First Lecture
        </button>
      )}
    </div>
  );
}

function LoadingSlot() {
  return (
    <div
      className="py-10 text-center rounded-xl"
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-base)",
      }}
    >
      <RefreshCw
        className="w-5 h-5 animate-spin mx-auto mb-2.5"
        style={{ color: "var(--accent)" }}
      />
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        Loading lecture notes…
      </p>
    </div>
  );
}

function SectionHeader({
  label,
  icon: Icon,
  action,
  actionLabel,
}: {
  label: string;
  icon: React.ElementType;
  action?: () => void;
  actionLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" style={{ color: "var(--accent)" }} strokeWidth={2} />
        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {label}
        </span>
      </div>
      {action && actionLabel && (
        <button
          onClick={action}
          className="flex items-center gap-1 text-xs cursor-pointer transition-colors"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.color = "var(--accent)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.color = "var(--text-muted)")
          }
        >
          <span>{actionLabel}</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSubmittingLecture, setIsSubmittingLecture] = useState(false);

  const [backendStatus, setBackendStatus] = useState<BackendStatusState>({
    healthy: false,
    loading: true,
  });
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loadingLectures, setLoadingLectures] = useState(true);
  const [lecturesError, setLecturesError] = useState<string | null>(null);

  const pingHealth = useCallback(async () => {
    try {
      const { data, latencyMs } = await checkBackendHealth();
      setBackendStatus({ healthy: data.status === "ok", loading: false, latencyMs, data, lastChecked: new Date() });
    } catch (err: unknown) {
      setBackendStatus({
        healthy: false,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to reach backend",
        lastChecked: new Date(),
      });
    }
  }, []);

  const handleManualRefresh = useCallback(() => {
    setBackendStatus((prev) => ({ ...prev, loading: true }));
    pingHealth();
  }, [pingHealth]);

  const loadLecturesData = useCallback(async () => {
    try {
      setLecturesError(null);
      const data = await fetchLectures();
      setLectures(data);
    } catch (err: unknown) {
      setLecturesError(err instanceof Error ? err.message : "Could not load lectures");
    } finally {
      setLoadingLectures(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    checkBackendHealth()
      .then(({ data, latencyMs }) => {
        if (!active) return;
        setBackendStatus({ healthy: data.status === "ok", loading: false, latencyMs, data, lastChecked: new Date() });
      })
      .catch((err: unknown) => {
        if (!active) return;
        setBackendStatus({ healthy: false, loading: false, error: err instanceof Error ? err.message : "Failed to reach backend", lastChecked: new Date() });
      });

    fetchLectures()
      .then((data) => {
        if (!active) return;
        setLectures(data);
        setLoadingLectures(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setLecturesError(err instanceof Error ? err.message : "Could not load lectures");
        setLoadingLectures(false);
      });

    const interval = setInterval(pingHealth, 20000);
    return () => { active = false; clearInterval(interval); };
  }, [pingHealth]);

  const handleCreateLecture = async (input: CreateLectureInput) => {
    setIsSubmittingLecture(true);
    try {
      const created = await createLecture(input);
      setLectures((prev) => [created, ...prev]);
      pingHealth();
    } finally {
      setIsSubmittingLecture(false);
    }
  };

  const handleToggleTask = async (lectureId: string, taskId: string, completed: boolean) => {
    setLectures((prev) =>
      prev.map((lec) =>
        lec.id === lectureId
          ? { ...lec, action_items: lec.action_items.map((item) => item.id === taskId ? { ...item, completed } : item) }
          : lec
      )
    );
    try {
      const updated = await toggleTaskCompletion(lectureId, taskId, completed);
      setLectures((prev) => prev.map((lec) => (lec.id === lectureId ? updated : lec)));
    } catch (err) {
      console.error("Task toggle failed:", err);
      loadLecturesData();
    }
  };

  const filteredLectures = lectures.filter((lec) => {
    const q = searchQuery.toLowerCase();
    return (
      lec.title.toLowerCase().includes(q) ||
      lec.subject.toLowerCase().includes(q) ||
      lec.summary?.toLowerCase().includes(q) ||
      lec.key_concepts.some((c) => c.toLowerCase().includes(q))
    );
  });

  const totalLectures = lectures.length;
  const totalConcepts = lectures.reduce((acc, curr) => acc + (curr.key_concepts?.length || 0), 0);
  const allTasks = lectures.flatMap((l) => l.action_items || []);
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t) => t.completed).length;
  const pendingTasks = allTasks.filter((t) => !t.completed);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      <Navbar
        backendStatus={backendStatus}
        onRefreshHealth={handleManualRefresh}
        onOpenUpload={() => setIsUploadOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <Sidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            lectureCount={totalLectures}
            pendingTasksCount={pendingTasks.length}
          />

          <div className="flex-1 min-w-0 space-y-5">

            {/* Error banner */}
            {lecturesError && (
              <div
                className="px-4 py-3 rounded-xl flex items-center justify-between text-xs"
                style={{
                  backgroundColor: "var(--error-bg)",
                  border: "1px solid rgba(194,96,96,0.25)",
                  color: "var(--error)",
                }}
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{lecturesError}</span>
                </div>
                <button
                  onClick={loadLecturesData}
                  className="px-2.5 py-1 rounded-lg font-semibold cursor-pointer"
                  style={{
                    backgroundColor: "rgba(194,96,96,0.15)",
                    color: "var(--error)",
                    border: "1px solid rgba(194,96,96,0.3)",
                  }}
                >
                  Retry
                </button>
              </div>
            )}

            {/* ══ DASHBOARD ══════════════════════════════════════════════ */}
            {activeTab === "dashboard" && (
              <div className="space-y-5 animate-in">

                {/* ── Hero ── */}
                <div
                  className="rounded-xl overflow-hidden"
                  style={{
                    backgroundColor: "var(--hero-bg)",
                    border: "1px solid var(--hero-border)",
                  }}
                >
                  <div
                    className="h-0.5 w-full"
                    style={{ backgroundColor: "var(--hero-bar)" }}
                  />
                  <div className="px-5 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    <div className="space-y-2 flex-1 min-w-0">
                      <h1
                        className="text-lg font-semibold"
                        style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
                      >
                        Study Workspace
                      </h1>
                      <p className="text-xs leading-relaxed max-w-sm" style={{ color: "var(--text-muted)" }}>
                        Paste your lecture notes and Recallix generates structured summaries, maps key concepts, and creates actionable study tasks — powered by Gemma.
                      </p>
                      {/* Quick stats inline */}
                      {totalLectures > 0 && (
                        <div className="flex items-center gap-4 pt-1">
                          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                              {totalLectures}
                            </span>{" "}
                            {totalLectures === 1 ? "lecture" : "lectures"}
                          </span>
                          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                              {totalConcepts}
                            </span>{" "}
                            concepts
                          </span>
                          {totalTasks > 0 && (
                            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                              <span className="font-semibold" style={{ color: pendingTasks.length === 0 ? "var(--success)" : "var(--text-primary)" }}>
                                {pendingTasks.length}
                              </span>{" "}
                              pending tasks
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setIsUploadOpen(true)}
                        className="btn-primary flex items-center gap-1.5 px-3.5 py-2 text-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Lecture</span>
                      </button>
                      <button
                        onClick={() => setActiveTab("chat")}
                        className="btn-secondary flex items-center gap-1.5 px-3.5 py-2 text-xs"
                      >
                        <MessageSquareText className="w-3.5 h-3.5" />
                        <span>Ask Q&A</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── Stats ── */}
                <StatsGrid
                  totalLectures={totalLectures}
                  totalConcepts={totalConcepts}
                  completedTasks={completedTasks}
                  totalTasks={totalTasks}
                />

                {/* ── Overview grid ── */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                  {/* Recent lectures (2/3 width) */}
                  <div className="xl:col-span-2">
                    <SectionHeader
                      label="Recent Lectures"
                      icon={BookOpen}
                      action={() => setActiveTab("lectures")}
                      actionLabel={`View all (${totalLectures})`}
                    />
                    {loadingLectures ? (
                      <LoadingSlot />
                    ) : lectures.length === 0 ? (
                      <EmptyLectures onAdd={() => setIsUploadOpen(true)} />
                    ) : (
                      <div className="space-y-3">
                        {lectures.slice(0, 2).map((lecture) => (
                          <LectureCard
                            key={lecture.id}
                            lecture={lecture}
                            onToggleTask={handleToggleTask}
                            onAskQuestion={() => setActiveTab("chat")}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pending tasks sidebar (1/3) */}
                  <div>
                    <SectionHeader
                      label="Pending Tasks"
                      icon={ListTodo}
                      action={() => setActiveTab("tasks")}
                      actionLabel="All tasks"
                    />
                    <div
                      className="rounded-xl overflow-hidden"
                      style={{
                        backgroundColor: "var(--bg-card)",
                        border: "1px solid var(--border-base)",
                      }}
                    >
                      {pendingTasks.length === 0 ? (
                        <div
                          className="py-8 px-4 text-center"
                        >
                          <CheckCircle2
                            className="w-6 h-6 mx-auto mb-2"
                            style={{ color: "var(--success)" }}
                          />
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                            All caught up — no pending tasks.
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                          {pendingTasks.slice(0, 6).map((task) => {
                            const parentLec = lectures.find((l) =>
                              l.action_items.some((i) => i.id === task.id)
                            );
                            return (
                              <div
                                key={task.id}
                                onClick={() => {
                                  if (parentLec) handleToggleTask(parentLec.id, task.id, true);
                                }}
                                className="flex items-start gap-2.5 px-3.5 py-3 cursor-pointer transition-colors"
                                style={{ borderColor: "var(--border-subtle)" }}
                                onMouseEnter={(e) =>
                                  ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-elevated)")
                                }
                                onMouseLeave={(e) =>
                                  ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")
                                }
                              >
                                <Circle
                                  className="w-3.5 h-3.5 mt-0.5 shrink-0"
                                  style={{ color: "var(--text-muted)" }}
                                  strokeWidth={1.75}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs leading-snug" style={{ color: "var(--text-secondary)" }}>
                                    {task.task}
                                  </p>
                                  {parentLec && (
                                    <span
                                      className="text-[10px] font-medium mt-0.5 inline-block"
                                      style={{ color: "var(--accent)" }}
                                    >
                                      {parentLec.subject}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ══ LECTURES ═══════════════════════════════════════════════ */}
            {activeTab === "lectures" && (
              <div className="space-y-5 animate-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                      Lectures & Structured Summaries
                    </h2>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      Full synthesis, core concepts, and raw transcripts.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsUploadOpen(true)}
                    className="btn-primary flex items-center gap-1.5 px-3.5 py-2 text-xs shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Upload Lecture</span>
                  </button>
                </div>

                {loadingLectures ? (
                  <LoadingSlot />
                ) : filteredLectures.length === 0 ? (
                  <div
                    className="p-10 text-center rounded-xl"
                    style={{
                      backgroundColor: "var(--bg-card)",
                      border: "1px solid var(--border-base)",
                    }}
                  >
                    <AlertCircle className="w-7 h-7 mx-auto mb-2" style={{ color: "var(--warning)" }} />
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {searchQuery ? `No results for "${searchQuery}"` : "No lectures yet"}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      {searchQuery ? "Try a different search term." : "Upload your first lecture to get started."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredLectures.map((lecture) => (
                      <LectureCard
                        key={lecture.id}
                        lecture={lecture}
                        onToggleTask={handleToggleTask}
                        onAskQuestion={() => setActiveTab("chat")}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ══ TASKS ══════════════════════════════════════════════════ */}
            {activeTab === "tasks" && (
              <div className="space-y-5 animate-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                      Study Tasks
                    </h2>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      Assignments, problem sets, and targeted review items.
                    </p>
                  </div>
                  <span
                    className="text-xs px-3 py-1 rounded-full font-semibold"
                    style={{
                      backgroundColor: "var(--success-bg)",
                      border: "1px solid rgba(82,168,122,0.25)",
                      color: "var(--success)",
                    }}
                  >
                    {completedTasks} / {totalTasks} done
                  </span>
                </div>

                <div className="space-y-3">
                  {lectures.map((lec) => (
                    <div
                      key={lec.id}
                      className="rounded-xl overflow-hidden"
                      style={{
                        backgroundColor: "var(--bg-card)",
                        border: "1px solid var(--border-base)",
                      }}
                    >
                      {/* Lecture header */}
                      <div
                        className="px-4 py-3 flex items-center gap-2.5"
                        style={{ borderBottom: "1px solid var(--border-subtle)" }}
                      >
                        <span
                          className="px-2 py-0.5 text-[11px] font-semibold rounded-md"
                          style={{
                            backgroundColor: "var(--accent-subtle)",
                            color: "var(--accent)",
                            border: "1px solid var(--accent-border)",
                          }}
                        >
                          {lec.subject}
                        </span>
                        <h3 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                          {lec.title}
                        </h3>
                      </div>

                      {/* Tasks */}
                      <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                        {lec.action_items.map((task) => (
                          <label
                            key={task.id}
                            className="flex items-start gap-2.5 px-4 py-2.5 cursor-pointer transition-colors text-xs"
                            style={task.completed ? { opacity: 0.45 } : {}}
                            onMouseEnter={(e) => {
                              if (!task.completed)
                                (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-elevated)";
                            }}
                            onMouseLeave={(e) => {
                              if (!task.completed)
                                (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => handleToggleTask(lec.id, task.id, !task.completed)}
                              className="mt-0.5 shrink-0 focus:outline-none cursor-pointer"
                            >
                              {task.completed ? (
                                <CheckCircle2 className="w-4 h-4" style={{ color: "var(--success)" }} />
                              ) : (
                                <Circle className="w-4 h-4" style={{ color: "var(--text-muted)" }} strokeWidth={1.75} />
                              )}
                            </button>
                            <span
                              className={`flex-1 leading-snug ${task.completed ? "line-through" : ""}`}
                              style={{ color: task.completed ? "var(--text-muted)" : "var(--text-secondary)" }}
                            >
                              {task.task}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══ CHAT ═══════════════════════════════════════════════════ */}
            {activeTab === "chat" && (
              <div className="animate-in">
                <LectureChat lectures={lectures} />
              </div>
            )}

            {/* ══ DIAGNOSTICS ════════════════════════════════════════════ */}
            {activeTab === "diagnostics" && (
              <div className="animate-in">
                <DiagnosticsView backendStatus={backendStatus} onRefresh={handleManualRefresh} />
              </div>
            )}
          </div>
        </div>
      </main>

      <UploadLectureModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSubmit={handleCreateLecture}
        loading={isSubmittingLecture}
      />
    </div>
  );
}
