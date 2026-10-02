"use client";

import React, { useState } from "react";
import { CreateLectureInput } from "@/types/lecture";
import { X, Sparkles, UploadCloud } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateLectureInput) => Promise<void>;
  loading: boolean;
}

export const UploadLectureModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
}) => {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [rawNotes, setRawNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePreFill = () => {
    setTitle("Virtual Memory & Paging Mechanisms");
    setSubject("Operating Systems");
    setRawNotes(
      "Virtual memory abstracts physical DRAM using a hierarchical page table. " +
      "TLB (Translation Lookaside Buffer) acts as a high-speed associative hardware cache for virtual-to-physical address mappings. " +
      "When a page is not present in physical frames, MMU raises a Page Fault trap to the OS kernel. " +
      "The page replacement algorithm (e.g. LRU or Clock) selects a victim frame, writes back if dirty, and loads the demanded page from disk."
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subject.trim() || !rawNotes.trim()) {
      setError("Please fill out all required fields.");
      return;
    }

    setError(null);
    try {
      await onSubmit({
        title: title.trim(),
        subject: subject.trim(),
        raw_notes: rawNotes.trim(),
      });
      setTitle("");
      setSubject("");
      setRawNotes("");
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create lecture note.";
      setError(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl glass-panel border border-slate-700/80 shadow-2xl p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-md">
            <UploadCloud className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Ingest Lecture Notes</h2>
            <p className="text-xs text-slate-400">
              Convert raw transcripts into structured summaries, key concepts, and study tasks.
            </p>
          </div>
        </div>

        {/* Pre-fill Quick Button */}
        <div className="mb-4 flex items-center justify-between p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-xs">
          <span className="text-slate-300">Need sample notes to test right away?</span>
          <button
            type="button"
            onClick={handlePreFill}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 font-semibold cursor-pointer transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Load Sample</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-lg bg-rose-950/60 border border-rose-800/40 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Lecture Title *
              </label>
              <input
                id="lecture-title-input"
                type="text"
                placeholder="e.g. Distributed Consensus"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-slate-900/80 border border-slate-700/80 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Subject / Course *
              </label>
              <input
                id="lecture-subject-input"
                type="text"
                placeholder="e.g. Computer Systems"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-slate-900/80 border border-slate-700/80 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Lecture Notes / Transcript *
            </label>
            <textarea
              id="lecture-notes-textarea"
              rows={5}
              placeholder="Paste raw bullet points, transcript, or lecture takeaways..."
              value={rawNotes}
              onChange={(e) => setRawNotes(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm bg-slate-900/80 border border-slate-700/80 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              id="submit-lecture-btn"
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Synthesize with AI</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
