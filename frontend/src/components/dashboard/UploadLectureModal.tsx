"use client";

import React, { useState } from "react";
import { CreateLectureInput } from "@/types/lecture";
import { X, UploadCloud, Zap } from "lucide-react";

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
      await onSubmit({ title: title.trim(), subject: subject.trim(), raw_notes: rawNotes.trim() });
      setTitle(""); setSubject(""); setRawNotes("");
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create lecture note.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.80)" }}
    >
      <div
        className="w-full max-w-xl rounded-xl shadow-2xl relative animate-in overflow-hidden"
        style={{
          backgroundColor: "var(--bg-elevated)",
          border: "1px solid var(--border-base)",
        }}
      >
        {/* Top accent bar */}
        <div className="h-0.5 w-full" style={{ backgroundColor: "var(--accent)" }} />

        <div className="p-6">
          {/* Close */}
          <button
            onClick={onClose}
            className="btn-ghost absolute top-4 right-4 p-1.5"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div
              className="p-2.5 rounded-lg"
              style={{ backgroundColor: "var(--accent-subtle)", color: "var(--accent)" }}
            >
              <UploadCloud className="w-5 h-5" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Ingest Lecture Notes
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Convert raw transcripts into summaries, concepts, and tasks.
              </p>
            </div>
          </div>

          {/* Sample prefill */}
          <div
            className="mb-4 flex items-center justify-between px-3 py-2.5 rounded-lg"
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-base)",
            }}
          >
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Want to test with sample notes?
            </span>
            <button
              type="button"
              onClick={handlePreFill}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors"
              style={{
                backgroundColor: "var(--accent-subtle)",
                color: "var(--accent)",
                border: "1px solid var(--accent-border)",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.backgroundColor = "rgba(78,158,138,0.18)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--accent-subtle)")
              }
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Load Sample</span>
            </button>
          </div>

          {/* Error */}
          {error && (
            <div
              className="mb-4 px-3 py-2.5 rounded-lg text-xs"
              style={{
                backgroundColor: "var(--error-bg)",
                border: "1px solid rgba(194,96,96,0.2)",
                color: "var(--error)",
              }}
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Lecture Title *
                </label>
                <input
                  id="lecture-title-input"
                  type="text"
                  placeholder="e.g. Distributed Consensus"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="input-base w-full px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Subject / Course *
                </label>
                <input
                  id="lecture-subject-input"
                  type="text"
                  placeholder="e.g. Computer Systems"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="input-base w-full px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Lecture Notes / Transcript *
              </label>
              <textarea
                id="lecture-notes-textarea"
                rows={5}
                placeholder="Paste raw bullet points, transcript, or lecture takeaways…"
                value={rawNotes}
                onChange={(e) => setRawNotes(e.target.value)}
                required
                className="input-base w-full px-3 py-2 text-sm resize-none"
              />
            </div>

            <div
              className="flex items-center justify-end gap-3 pt-3"
              style={{ borderTop: "1px solid var(--border-base)" }}
            >
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost px-4 py-2 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                id="submit-lecture-btn"
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center gap-2 px-4 py-2 text-xs"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    <span>Processing…</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Synthesize with AI</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
