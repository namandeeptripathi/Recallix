"use client";

import React, { useState, useRef, useEffect } from "react";
import { Lecture } from "@/types/lecture";
import { askLectureQuestion } from "@/lib/api";
import {
  Send,
  BookOpen,
  HelpCircle,
  CheckCircle,
  ChevronDown,
  AlertTriangle,
  Bot,
  WifiOff,
} from "lucide-react";

interface Props {
  lectures: Lecture[];
}

interface Message {
  id: string;
  sender: "user" | "recallix";
  text: string;
  isError?: boolean;
  citation?: { lectureTitle: string; subject: string };
}

const SAMPLE_QUESTIONS = [
  "What are the key concepts from this lecture?",
  "Explain the most important idea from these notes.",
  "What study tasks should I prioritize?",
];

export const LectureChat: React.FC<Props> = ({ lectures }) => {
  const [selectedLectureId, setSelectedLectureId] = useState<string>(
    lectures[0]?.id ?? ""
  );

  const safeSelectedId =
    lectures.find((l) => l.id === selectedLectureId)?.id ??
    lectures[0]?.id ??
    "";

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-init",
      sender: "recallix",
      text:
        lectures.length === 0
          ? "No lectures uploaded yet. Add a lecture first, then ask me questions about it."
          : "Hello! Select a lecture above and ask me anything about it. My answers are grounded strictly in your notes — powered by Gemma via Ollama.",
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectedLecture = lectures.find((l) => l.id === safeSelectedId);
  const msgCount = messages.length;

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading || !safeSelectedId) return;

    const userMsg: Message = { id: `usr-${msgCount}`, sender: "user", text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setIsLoading(true);

    try {
      const chatResp = await askLectureQuestion(safeSelectedId, text.trim());
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${msgCount + 1}`,
          sender: "recallix",
          text: chatResp.answer,
          citation: selectedLecture
            ? { lectureTitle: selectedLecture.title, subject: selectedLecture.subject }
            : undefined,
        },
      ]);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Unknown error occurred.";
      const isOllamaDown =
        errMsg.toLowerCase().includes("ai service unavailable") ||
        errMsg.toLowerCase().includes("cannot connect") ||
        errMsg.toLowerCase().includes("ollama");

      setMessages((prev) => [
        ...prev,
        {
          id: `err-${msgCount + 1}`,
          sender: "recallix",
          isError: true,
          text: isOllamaDown
            ? "Ollama is not running or the model isn't available. Run `ollama serve` and `ollama pull gemma3:1b`."
            : `Error: ${errMsg}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden"
      style={{
        height: "640px",
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-base)",
      }}
    >
      {/* ── Header ────────────────────────────────────────────────── */}
      <div
        className="px-4 py-3.5 flex flex-col gap-3"
        style={{
          backgroundColor: "var(--bg-elevated)",
          borderBottom: "1px solid var(--border-base)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: "var(--accent-subtle)", color: "var(--accent)" }}
            >
              <Bot className="w-4 h-4" strokeWidth={2} />
            </div>
            <div>
              <h3
                className="text-sm font-semibold flex items-center gap-2"
                style={{ color: "var(--text-primary)" }}
              >
                Ask Recallix
                <span
                  className="text-[10px] px-2 py-0.5 rounded font-medium"
                  style={{
                    backgroundColor: "var(--bg-card)",
                    border: "1px solid var(--border-base)",
                    color: "var(--text-muted)",
                  }}
                >
                  Gemma · Ollama
                </span>
              </h3>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                Answers grounded in the selected lecture&apos;s notes.
              </p>
            </div>
          </div>

          {safeSelectedId && (
            <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--success)" }}>
              <CheckCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ready</span>
            </div>
          )}
        </div>

        {/* Lecture selector */}
        {lectures.length > 0 && (
          <div className="relative">
            <select
              id="lecture-chat-selector"
              value={safeSelectedId}
              onChange={(e) => setSelectedLectureId(e.target.value)}
              className="w-full appearance-none pl-3 pr-8 py-2 text-xs rounded-lg cursor-pointer"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-base)",
                color: "var(--text-secondary)",
              }}
            >
              {lectures.map((lec) => (
                <option key={lec.id} value={lec.id}>
                  {lec.title} — {lec.subject}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
              style={{ color: "var(--text-muted)" }}
            />
          </div>
        )}
      </div>

      {/* ── Suggested prompts ─────────────────────────────────────── */}
      <div
        className="px-3 py-2 flex items-center gap-2 overflow-x-auto shrink-0"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <span
          className="text-[11px] shrink-0 flex items-center gap-1"
          style={{ color: "var(--text-muted)" }}
        >
          <HelpCircle className="w-3 h-3" />
          Try:
        </span>
        {SAMPLE_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={isLoading || !safeSelectedId}
            className="text-[11px] px-2.5 py-1 rounded-lg whitespace-nowrap transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "var(--bg-elevated)",
              border: "1px solid var(--border-base)",
              color: "var(--text-secondary)",
            }}
            onMouseEnter={(e) => {
              if (!isLoading && safeSelectedId) {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--accent-border)";
                (e.currentTarget as HTMLElement).style.color = "var(--accent)";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border-base)";
              (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
            }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* ── Message stream ────────────────────────────────────────── */}
      <div className="flex-1 px-4 py-4 overflow-y-auto space-y-4">
        {messages.map((m) => {
          const isUser = m.sender === "user";
          return (
            <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              <div
                className="max-w-[82%] sm:max-w-[72%]"
                style={
                  isUser
                    ? {
                        backgroundColor: "var(--accent)",
                        color: "#071210",
                        borderRadius: "14px 14px 4px 14px",
                        padding: "10px 14px",
                        fontSize: "0.8125rem",
                        lineHeight: "1.6",
                      }
                    : m.isError
                    ? {
                        backgroundColor: "var(--error-bg)",
                        border: "1px solid rgba(194,96,96,0.25)",
                        color: "var(--error)",
                        borderRadius: "14px 14px 14px 4px",
                        padding: "10px 14px",
                        fontSize: "0.8125rem",
                        lineHeight: "1.6",
                      }
                    : {
                        backgroundColor: "var(--bg-elevated)",
                        border: "1px solid var(--border-base)",
                        color: "var(--text-secondary)",
                        borderRadius: "14px 14px 14px 4px",
                        padding: "10px 14px",
                        fontSize: "0.8125rem",
                        lineHeight: "1.6",
                      }
                }
              >
                {/* Bot / error label */}
                {m.isError && (
                  <div
                    className="flex items-center gap-1.5 mb-2 text-[11px] font-semibold"
                    style={{ color: "var(--error)" }}
                  >
                    <WifiOff className="w-3.5 h-3.5" />
                    <span>AI Unavailable</span>
                  </div>
                )}
                {!isUser && !m.isError && (
                  <div
                    className="flex items-center gap-1.5 mb-2 text-[11px] font-semibold"
                    style={{ color: "var(--accent)" }}
                  >
                    <Bot className="w-3.5 h-3.5" strokeWidth={2} />
                    <span>Recallix</span>
                  </div>
                )}

                <p className="whitespace-pre-wrap">{m.text}</p>

                {/* Citation pill */}
                {m.citation && !m.isError && (
                  <div
                    className="mt-3 pt-2.5 flex items-center gap-1.5 text-[11px]"
                    style={{ borderTop: "1px solid var(--border-subtle)" }}
                  >
                    <BookOpen
                      className="w-3 h-3 shrink-0"
                      style={{ color: "var(--text-muted)" }}
                    />
                    <span style={{ color: "var(--text-muted)" }}>
                      Source:{" "}
                      <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
                        {m.citation.lectureTitle}
                      </span>
                      {" "}·{" "}
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px]"
                        style={{
                          backgroundColor: "var(--accent-subtle)",
                          color: "var(--accent)",
                        }}
                      >
                        {m.citation.subject}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div
              className="flex items-center gap-1.5 px-3.5 py-3 rounded-2xl"
              style={{
                backgroundColor: "var(--bg-elevated)",
                border: "1px solid var(--border-base)",
              }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full dot-bounce"
                  style={{
                    backgroundColor: "var(--accent)",
                    animationDelay: `${i * 0.18}s`,
                  }}
                />
              ))}
              <span className="ml-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                Thinking…
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* AI-failed notice */}
      {selectedLecture?.status === "ai_failed" && (
        <div
          className="px-4 py-2.5 flex items-center gap-2 text-xs"
          style={{
            backgroundColor: "var(--warning-bg)",
            borderTop: "1px solid rgba(196,154,74,0.2)",
            color: "var(--warning)",
          }}
        >
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>
            AI processing failed for this lecture (Ollama was offline). Q&A uses raw notes only.
          </span>
        </div>
      )}

      {/* ── Input ─────────────────────────────────────────────────── */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSend(inputQuery); }}
        className="p-3 flex items-center gap-2"
        style={{ borderTop: "1px solid var(--border-base)" }}
      >
        <input
          id="chat-query-input"
          type="text"
          placeholder={!safeSelectedId ? "Add a lecture first…" : "Ask a question about this lecture…"}
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          disabled={isLoading || !safeSelectedId}
          className="input-base flex-1 px-4 py-2.5 text-sm disabled:opacity-50"
        />
        <button
          id="send-chat-query-btn"
          type="submit"
          disabled={!inputQuery.trim() || isLoading || !safeSelectedId}
          className="btn-primary p-2.5 rounded-lg"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
