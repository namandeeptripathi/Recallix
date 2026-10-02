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
  Sparkles,
  BookOpen,
  CheckCircle2,
  Circle,
  Plus,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  Brain,
} from "lucide-react";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSubmittingLecture, setIsSubmittingLecture] = useState(false);

  // Backend Health State (initialized with loading: true)
  const [backendStatus, setBackendStatus] = useState<BackendStatusState>({
    healthy: false,
    loading: true,
  });

  // Lectures State
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loadingLectures, setLoadingLectures] = useState(true);
  const [lecturesError, setLecturesError] = useState<string | null>(null);

  // Health ping callback
  const pingHealth = useCallback(async () => {
    try {
      const { data, latencyMs } = await checkBackendHealth();
      setBackendStatus({
        healthy: data.status === "ok",
        loading: false,
        latencyMs,
        data,
        lastChecked: new Date(),
      });
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to reach backend";
      setBackendStatus({
        healthy: false,
        loading: false,
        error: errorMsg,
        lastChecked: new Date(),
      });
    }
  }, []);

  const handleManualRefresh = useCallback(() => {
    setBackendStatus((prev) => ({ ...prev, loading: true }));
    pingHealth();
  }, [pingHealth]);

  // Fetch Lectures callback
  const loadLecturesData = useCallback(async () => {
    try {
      setLecturesError(null);
      const data = await fetchLectures();
      setLectures(data);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Could not load lectures";
      setLecturesError(errorMsg);
    } finally {
      setLoadingLectures(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    checkBackendHealth()
      .then(({ data, latencyMs }) => {
        if (!active) return;
        setBackendStatus({
          healthy: data.status === "ok",
          loading: false,
          latencyMs,
          data,
          lastChecked: new Date(),
        });
      })
      .catch((err: unknown) => {
        if (!active) return;
        setBackendStatus({
          healthy: false,
          loading: false,
          error: err instanceof Error ? err.message : "Failed to reach backend",
          lastChecked: new Date(),
        });
      });

    fetchLectures()
      .then((data) => {
        if (!active) return;
        setLectures(data);
        setLoadingLectures(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setLecturesError(
          err instanceof Error ? err.message : "Could not load lectures"
        );
        setLoadingLectures(false);
      });

    // Auto-ping every 20 seconds
    const interval = setInterval(() => {
      pingHealth();
    }, 20000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [pingHealth]);

  // Handle Create Lecture
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

  // Handle Task Toggle
  const handleToggleTask = async (
    lectureId: string,
    taskId: string,
    completed: boolean
  ) => {
    // Optimistic UI update
    setLectures((prev) =>
      prev.map((lec) => {
        if (lec.id === lectureId) {
          return {
            ...lec,
            action_items: lec.action_items.map((item) =>
              item.id === taskId ? { ...item, completed } : item
            ),
          };
        }
        return lec;
      })
    );

    try {
      const updated = await toggleTaskCompletion(lectureId, taskId, completed);
      setLectures((prev) =>
        prev.map((lec) => (lec.id === lectureId ? updated : lec))
      );
    } catch (err) {
      console.error("Task toggle failed:", err);
      // Revert on error
      loadLecturesData();
    }
  };

  const handleAskQuestionFromLecture = () => {
    setActiveTab("chat");
  };

  // Filtered lectures for search
  const filteredLectures = lectures.filter((lec) => {
    const q = searchQuery.toLowerCase();
    return (
      lec.title.toLowerCase().includes(q) ||
      lec.subject.toLowerCase().includes(q) ||
      lec.summary?.toLowerCase().includes(q) ||
      lec.key_concepts.some((c) => c.toLowerCase().includes(q))
    );
  });

  // Calculate statistics
  const totalLectures = lectures.length;
  const totalConcepts = lectures.reduce(
    (acc, curr) => acc + (curr.key_concepts?.length || 0),
    0
  );
  const allTasks = lectures.flatMap((l) => l.action_items || []);
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t) => t.completed).length;
  const pendingTasks = allTasks.filter((t) => !t.completed);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Navbar */}
      <Navbar
        backendStatus={backendStatus}
        onRefreshHealth={handleManualRefresh}
        onOpenUpload={() => setIsUploadOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar */}
          <Sidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            lectureCount={totalLectures}
            pendingTasksCount={pendingTasks.length}
          />

          {/* Right Main Body */}
          <div className="flex-1 space-y-6">
            {/* Error banner if backend failed */}
            {lecturesError && (
              <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{lecturesError}</span>
                </div>
                <button
                  onClick={loadLecturesData}
                  className="px-2.5 py-1 rounded-lg bg-rose-900/60 hover:bg-rose-900 text-white font-medium transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {/* TAB: DASHBOARD OVERVIEW */}
            {activeTab === "dashboard" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Hero Header */}
                <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-indigo-500/20 relative overflow-hidden bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-purple-950/30">
                  <div className="relative z-10 max-w-2xl space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Ready to accelerate your learning</span>
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                      Recallix — Your AI Lecture Companion
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      Convert raw lecture notes into structured summaries, key concept breakdowns, and actionable study tasks. Ask questions grounded directly in your coursework.
                    </p>

                    <div className="pt-2 flex flex-wrap gap-3">
                      <button
                        onClick={() => setIsUploadOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Lecture Notes</span>
                      </button>

                      <button
                        onClick={() => setActiveTab("chat")}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-900/80 hover:bg-slate-800 text-indigo-300 border border-indigo-500/30 transition-all cursor-pointer"
                      >
                        <Brain className="w-4 h-4 text-purple-400" />
                        <span>Ask Grounded Q&A</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
                </div>

                {/* Stats Grid */}
                <StatsGrid
                  totalLectures={totalLectures}
                  totalConcepts={totalConcepts}
                  completedTasks={completedTasks}
                  totalTasks={totalTasks}
                />

                {/* Split Overview: Recent Lectures & Urgent Tasks */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Recent Lectures */}
                  <div className="xl:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-indigo-400" />
                        <h2 className="text-base font-bold text-white">
                          Recent Lectures
                        </h2>
                      </div>
                      <button
                        onClick={() => setActiveTab("lectures")}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                      >
                        <span>View all ({totalLectures})</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    {loadingLectures ? (
                      <div className="p-8 text-center glass-panel rounded-2xl border-slate-800">
                        <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin mx-auto mb-2" />
                        <p className="text-xs text-slate-400">Loading lecture notes...</p>
                      </div>
                    ) : lectures.length === 0 ? (
                      <div className="p-8 text-center glass-panel rounded-2xl border-slate-800">
                        <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-slate-300">
                          No lecture notes added yet
                        </p>
                        <p className="text-xs text-slate-500 mt-1 mb-4">
                          Upload your first lecture note or transcript to begin.
                        </p>
                        <button
                          onClick={() => setIsUploadOpen(true)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white"
                        >
                          Add Lecture
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {lectures.slice(0, 2).map((lecture) => (
                          <LectureCard
                            key={lecture.id}
                            lecture={lecture}
                            onToggleTask={handleToggleTask}
                            onAskQuestion={handleAskQuestionFromLecture}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Pending Action Items */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <h2 className="text-base font-bold text-white">
                          Action Items
                        </h2>
                      </div>
                      <button
                        onClick={() => setActiveTab("tasks")}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        View all
                      </button>
                    </div>

                    <div className="p-4 rounded-2xl glass-panel border border-slate-800/80 space-y-3">
                      {pendingTasks.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-400">
                          <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                          <span>All caught up! No pending study tasks.</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {pendingTasks.slice(0, 5).map((task) => {
                            const parentLec = lectures.find((l) =>
                              l.action_items.some((i) => i.id === task.id)
                            );
                            return (
                              <div
                                key={task.id}
                                onClick={() => {
                                  if (parentLec) {
                                    handleToggleTask(parentLec.id, task.id, true);
                                  }
                                }}
                                className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800/60 transition-colors cursor-pointer text-xs"
                              >
                                <Circle className="w-4 h-4 text-slate-500 hover:text-emerald-400 shrink-0 mt-0.5" />
                                <div className="space-y-0.5 flex-1">
                                  <p className="text-slate-200 leading-snug">
                                    {task.task}
                                  </p>
                                  {parentLec && (
                                    <span className="text-[10px] text-indigo-400 font-medium">
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

            {/* TAB: LECTURES LIST */}
            {activeTab === "lectures" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Lectures & Structured Summaries
                    </h2>
                    <p className="text-xs text-slate-400">
                      View full synthesis, core concepts, and raw transcripts.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsUploadOpen(true)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Upload New Lecture</span>
                  </button>
                </div>

                {loadingLectures ? (
                  <div className="p-12 text-center glass-panel rounded-2xl border-slate-800">
                    <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-400">Loading your lectures...</p>
                  </div>
                ) : filteredLectures.length === 0 ? (
                  <div className="p-12 text-center glass-panel rounded-2xl border-slate-800">
                    <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                    <p className="text-sm font-bold text-white">No lectures found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchQuery
                        ? `No lectures match "${searchQuery}".`
                        : "No lectures have been ingested yet."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredLectures.map((lecture) => (
                      <LectureCard
                        key={lecture.id}
                        lecture={lecture}
                        onToggleTask={handleToggleTask}
                        onAskQuestion={handleAskQuestionFromLecture}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: ACTION ITEMS */}
            {activeTab === "tasks" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Actionable Study Tasks
                    </h2>
                    <p className="text-xs text-slate-400">
                      Stay on top of assignments, problem sets, and targeted review topics.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-500/30">
                    {completedTasks} / {totalTasks} Completed
                  </span>
                </div>

                <div className="space-y-4">
                  {lectures.map((lec) => (
                    <div
                      key={lec.id}
                      className="p-5 rounded-2xl glass-panel border border-slate-800/80 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-indigo-950 border border-indigo-500/30 text-indigo-300">
                            {lec.subject}
                          </span>
                          <h3 className="text-sm font-bold text-white">
                            {lec.title}
                          </h3>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {lec.action_items.map((task) => (
                          <label
                            key={task.id}
                            className={`flex items-start gap-2.5 p-2 rounded-lg transition-colors cursor-pointer text-xs ${
                              task.completed
                                ? "bg-slate-900/30 text-slate-500 line-through"
                                : "bg-slate-900/60 hover:bg-slate-800/60 text-slate-200"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleTask(lec.id, task.id, !task.completed)
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
                  ))}
                </div>
              </div>
            )}

            {/* TAB: ASK RECALLIX */}
            {activeTab === "chat" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <LectureChat lectures={lectures} />
              </div>
            )}

            {/* TAB: DIAGNOSTICS */}
            {activeTab === "diagnostics" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <DiagnosticsView
                  backendStatus={backendStatus}
                  onRefresh={handleManualRefresh}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Upload Modal */}
      <UploadLectureModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSubmit={handleCreateLecture}
        loading={isSubmittingLecture}
      />
    </div>
  );
}
