"use client";

import React, { useState, useRef, useEffect } from "react";
import { Lecture } from "@/types/lecture";
import { askLectureQuestion } from "@/lib/api";
import {
  Sparkles,
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
  citation?: {
    lectureTitle: string;
    subject: string;
  };
}

const SAMPLE_QUESTIONS = [
  "What are the key concepts covered in this lecture?",
  "Explain the most important idea from these notes.",
  "What study tasks should I prioritize?",
];

export const LectureChat: React.FC<Props> = ({ lectures }) => {
  // Select the first available lecture by default
  const [selectedLectureId, setSelectedLectureId] = useState<string>(
    lectures[0]?.id ?? ""
  );
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-init",
      sender: "recallix",
      text:
        lectures.length === 0
          ? "No lectures uploaded yet. Add a lecture first, then ask me questions about it."
          : "Hello! Select a lecture from the dropdown above and ask me a question. I will answer based strictly on its notes — powered by Gemma via Ollama.",
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Keep the selected lecture in sync if lectures list changes
  useEffect(() => {
    if (lectures.length > 0 && !lectures.find((l) => l.id === selectedLectureId)) {
      setSelectedLectureId(lectures[0].id);
    }
  }, [lectures, selectedLectureId]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectedLecture = lectures.find((l) => l.id === selectedLectureId);
  const msgCount = messages.length;

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading || !selectedLectureId) return;

    const userMsg: Message = {
      id: `usr-${msgCount}`,
      sender: "user",
      text: text.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setIsLoading(true);

    try {
      const chatResp = await askLectureQuestion(selectedLectureId, text.trim());
      const botMsg: Message = {
        id: `bot-${msgCount + 1}`,
        sender: "recallix",
        text: chatResp.answer,
        citation: selectedLecture
          ? { lectureTitle: selectedLecture.title, subject: selectedLecture.subject }
          : undefined,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error ? err.message : "Unknown error occurred.";

      const isOllamaDown =
        errMsg.toLowerCase().includes("ai service unavailable") ||
        errMsg.toLowerCase().includes("cannot connect") ||
        errMsg.toLowerCase().includes("ollama");

      const errorMsg: Message = {
        id: `err-${msgCount + 1}`,
        sender: "recallix",
        isError: true,
        text: isOllamaDown
          ? "Ollama is not running or the model is not available. Start Ollama with `ollama serve` and pull the model with `ollama pull gemma3:1b`."
          : `Error: ${errMsg}`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[650px] rounded-2xl glass-panel border border-slate-800/80 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/50 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Ask Recallix
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-700/50 text-indigo-300">
                  Gemma via Ollama
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Answers grounded strictly in the selected lecture&apos;s notes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <CheckCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-medium">Live Gemma</span>
          </div>
        </div>

        {/* Lecture selector */}
        {lectures.length > 0 && (
          <div className="relative">
            <select
              id="lecture-chat-selector"
              value={selectedLectureId}
              onChange={(e) => setSelectedLectureId(e.target.value)}
              className="w-full appearance-none pl-3 pr-8 py-2 text-xs bg-slate-900/80 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
            >
              {lectures.map((lec) => (
                <option key={lec.id} value={lec.id}>
                  {lec.title} — {lec.subject}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Suggested prompts */}
      <div className="p-3 bg-slate-950/40 border-b border-slate-800/60 overflow-x-auto flex items-center gap-2">
        <span className="text-[11px] text-slate-400 shrink-0 flex items-center gap-1">
          <HelpCircle className="w-3 h-3 text-indigo-400" /> Try:
        </span>
        {SAMPLE_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={isLoading || !selectedLectureId}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-indigo-950 hover:border-indigo-500/40 border border-slate-800 text-slate-300 whitespace-nowrap transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((m) => {
          const isUser = m.sender === "user";
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? "bg-indigo-600 text-white rounded-br-sm"
                    : m.isError
                    ? "bg-rose-950/60 text-rose-300 border border-rose-800/50 rounded-bl-sm"
                    : "bg-slate-900/90 text-slate-200 border border-slate-800 rounded-bl-sm"
                }`}
              >
                {m.isError && (
                  <div className="flex items-center gap-1.5 mb-1.5 text-rose-400 text-[11px] font-semibold">
                    <WifiOff className="w-3.5 h-3.5" />
                    <span>AI Unavailable</span>
                  </div>
                )}
                {!isUser && !m.isError && (
                  <div className="flex items-center gap-1.5 mb-1.5 text-indigo-400 text-[11px] font-semibold">
                    <Bot className="w-3.5 h-3.5" />
                    <span>Recallix</span>
                  </div>
                )}
                <p className="whitespace-pre-wrap">{m.text}</p>

                {m.citation && !m.isError && (
                  <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center gap-1.5 text-[11px] text-indigo-300">
                    <BookOpen className="w-3 h-3 text-indigo-400 shrink-0" />
                    <span>
                      Based on: {m.citation.lectureTitle} ({m.citation.subject})
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-start">
            <div className="flex items-center gap-2 p-3 bg-slate-900/70 border border-slate-800 rounded-2xl text-xs text-slate-400">
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse delay-75" />
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse delay-150" />
              <span className="ml-1 text-slate-500">Gemma is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Ollama-offline notice if no lectures have AI data */}
      {selectedLecture?.status === "ai_failed" && (
        <div className="px-4 py-2 bg-amber-950/30 border-t border-amber-800/30 flex items-center gap-2 text-xs text-amber-300">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>
            This lecture&apos;s AI processing failed (Ollama was offline). Q&A will use raw notes only.
          </span>
        </div>
      )}

      {/* Input form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(inputQuery);
        }}
        className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center gap-2"
      >
        <input
          id="chat-query-input"
          type="text"
          placeholder={
            !selectedLectureId
              ? "Add a lecture first..."
              : "Ask a question about this lecture..."
          }
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          disabled={isLoading || !selectedLectureId}
          className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-slate-900/90 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50"
        />
        <button
          id="send-chat-query-btn"
          type="submit"
          disabled={!inputQuery.trim() || isLoading || !selectedLectureId}
          className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
