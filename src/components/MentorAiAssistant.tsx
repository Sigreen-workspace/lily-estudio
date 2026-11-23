"use client";

import React, { useState } from "react";
import { Sparkles, X } from "lucide-react";

interface MentorAiAssistantProps {
  courseTitle?: string;
  courseLevel?: string;
  academicTrack?: string;
}

export default function MentorAiAssistant({
  courseTitle,
}: MentorAiAssistantProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#5C899D] hover:bg-[#4a7285] text-white text-xs font-bold shadow-lg transition cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-emerald-200" />
          Mentor AI
        </button>
      ) : (
        <div className="w-72 bg-white rounded-3xl border border-slate-200 shadow-2xl p-5 space-y-3 text-center">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-800 truncate">
              {courseTitle ? `Mentor AI · ${courseTitle}` : "Mentor AI"}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close Mentor AI"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-lg font-extrabold text-[#427563] py-2">Coming Soon</p>
          <p className="text-xs text-slate-500">
            Academic AI mentoring is on the way.
          </p>
        </div>
      )}
    </div>
  );
}