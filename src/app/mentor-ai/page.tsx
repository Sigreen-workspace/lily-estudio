"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowLeft, BookOpen } from "lucide-react";

export default function MentorAiPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 text-center shadow-xs space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-[#74B49B]/15 text-[#427563] flex items-center justify-center mx-auto">
          <Sparkles className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#A7D7C5]/25 text-[#427563]">
            Lily Mentor AI
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">
            Coming Soon
          </h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            We are crafting a reliable academic AI mentor experience for Lily Estudio. Stay tuned!
          </p>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#74B49B] hover:bg-emerald-600 text-white text-xs font-semibold transition"
          >
            <BookOpen className="w-3.5 h-3.5" /> Browse Courses
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}