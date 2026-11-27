"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";

export default function AskMentorForm() {
  const router = useRouter();
  const [aiQuestion, setAiQuestion] = useState("");

  const handleAskMentor = (e: React.FormEvent) => {
    e.preventDefault();
    const q = aiQuestion.trim();
    router.push(q ? `/mentor-ai?q=${encodeURIComponent(q)}` : "/mentor-ai");
  };

  return (
    <form onSubmit={handleAskMentor} className="flex flex-col sm:flex-row gap-3">
      <input
        type="text"
        value={aiQuestion}
        onChange={(e) => setAiQuestion(e.target.value)}
        placeholder="e.g. Explain Nyquist Criterion or make a revision plan..."
        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#74B49B]"
      />
      <button
        type="submit"
        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#5C899D] hover:bg-[#4a7285] text-white text-xs sm:text-sm font-bold transition cursor-pointer shrink-0"
      >
        <Send className="w-4 h-4" /> Ask Mentor
      </button>
    </form>
  );
}