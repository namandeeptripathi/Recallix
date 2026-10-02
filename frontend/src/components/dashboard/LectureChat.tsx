"use client";

import React, { useState } from "react";
import { Lecture } from "@/types/lecture";
import {
  Sparkles,
  Send,
  BookOpen,
  HelpCircle,
  CheckCircle,
} from "lucide-react";

interface Props {
  lectures: Lecture[];
}

interface Message {
  id: string;
  sender: "user" | "recallix";
  text: string;
  citation?: {
    lectureTitle: string;
    subject: string;
  };
  timestamp: string;
}

export const LectureChat: React.FC<Props> = ({ lectures }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-1",
      sender: "recallix",
      text: "Hello! I am Recallix, your AI lecture companion. Ask me any question grounded in your uploaded lectures, concepts, or formulas.",
      timestamp: "Just now",
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const sampleQuestions = [
    "What prevents gradient saturation in self-attention?",
    "Compare 2PL with Optimistic Concurrency Control",
    "What are the pending action items for Deep Learning?",
  ];

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const count = messages.length;
    const userMsg: Message = {
      id: `usr-${count + 1}`,
      sender: "user",
      text: text.trim(),
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setIsTyping(true);

    // Grounded mock answer based on available ingested lecture notes
    setTimeout(() => {
      let matchedLecture = lectures[0];
      let answerText = "Based on your notes, here is the synthesized answer:";

      const lower = text.toLowerCase();
      if (lower.includes("gradient") || lower.includes("attention") || lower.includes("transformer")) {
        matchedLecture = lectures.find((l) => l.title.toLowerCase().includes("transformer")) || lectures[0];
        answerText =
          "According to your lecture 'Introduction to Transformers & Self-Attention', the Scaled Dot-Product formula uses a scaling factor of 1/√d_k to counteract large magnitude dot products that would otherwise push the softmax activation function into regions with near-zero gradients.";
      } else if (lower.includes("concurrency") || lower.includes("2pl") || lower.includes("wal") || lower.includes("transaction")) {
        matchedLecture = lectures.find((l) => l.title.toLowerCase().includes("transactions")) || lectures[1] || lectures[0];
        answerText =
          "According to 'Distributed Transactions & WAL Protocols', Two-Phase Locking (2PL) is a pessimistic lock-based protocol guaranteeing serializability, whereas Optimistic Concurrency Control validates transactions before commit, which yields higher throughput in low-conflict workloads.";
      } else if (lower.includes("task") || lower.includes("action") || lower.includes("todo")) {
        const pending = lectures.flatMap((l) => l.action_items.filter((t) => !t.completed));
        answerText = `You currently have ${pending.length} pending study tasks across your lectures. Key priority: "${pending[0]?.task || "Review lecture notes"}".`;
      } else {
        answerText = `Grounded analysis of "${matchedLecture?.title || "your recent lectures"}": Your notes emphasize understanding the core trade-offs, theoretical derivation, and implementing practical benchmarks to solidify retention.`;
      }

      const botMsg: Message = {
        id: `bot-${count + 2}`,
        sender: "recallix",
        text: answerText,
        citation: matchedLecture
          ? {
              lectureTitle: matchedLecture.title,
              subject: matchedLecture.subject,
            }
          : undefined,
        timestamp: "Just now",
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <div className="flex flex-col h-[650px] rounded-2xl glass-panel border border-slate-800/80 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Ask Recallix (Grounded Q&A)
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-700/50 text-indigo-300">
                Gemma-ready
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Answers are strictly grounded in your ingested lecture notes and transcripts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-emerald-400">
          <CheckCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline font-medium">Grounded Mode Active</span>
        </div>
      </div>

      {/* Suggested prompts */}
      <div className="p-3 bg-slate-950/40 border-b border-slate-800/60 overflow-x-auto flex items-center gap-2">
        <span className="text-[11px] text-slate-400 shrink-0 flex items-center gap-1">
          <HelpCircle className="w-3 h-3 text-indigo-400" /> Try:
        </span>
        {sampleQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-indigo-950 hover:border-indigo-500/40 border border-slate-800 text-slate-300 whitespace-nowrap transition-colors cursor-pointer"
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
                    : "bg-slate-900/90 text-slate-200 border border-slate-800 rounded-bl-sm"
                }`}
              >
                <p>{m.text}</p>

                {m.citation && (
                  <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center gap-1.5 text-[11px] text-indigo-300">
                    <BookOpen className="w-3 h-3 text-indigo-400" />
                    <span>
                      Source: {m.citation.lectureTitle} ({m.citation.subject})
                    </span>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 px-1">
                {m.timestamp}
              </span>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-2 p-3 bg-slate-900/70 border border-slate-800 rounded-2xl w-24 text-xs text-slate-400">
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse delay-75" />
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse delay-150" />
          </div>
        )}
      </div>

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
          placeholder="Ask a question grounded in your lectures..."
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-slate-900/90 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        />
        <button
          id="send-chat-query-btn"
          type="submit"
          disabled={!inputQuery.trim()}
          className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
