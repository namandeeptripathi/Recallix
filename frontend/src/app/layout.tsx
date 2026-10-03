import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Recallix — AI Lecture Companion",
  description:
    "Transform raw lecture notes into structured summaries, key concept breakdowns, and actionable study tasks.",
  keywords: [
    "AI study companion",
    "lecture notes",
    "summarizer",
    "Gemma",
    "FastAPI",
    "study tasks",
  ],
  authors: [{ name: "Namandeep Tripathi" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} dark h-full antialiased`}>
      <body
        className="min-h-full flex flex-col font-sans"
        style={{ backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}
      >
        {children}
      </body>
    </html>
  );
}
