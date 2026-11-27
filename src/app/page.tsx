"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  GraduationCap,
  Award,
  BookCheck,
  Layers,
  Globe,
  Users,
  ArrowRight,
  Bot,
  CheckCircle2,
  XCircle,
  UserCheck,
  Lock,
  Send,
} from "lucide-react";

interface StatItem {
  value: string;
  label: string;
}

const DEFAULT_SOCIAL_PROOF: StatItem[] = [
  { value: "25,000+", label: "Students Learning" },
  { value: "500+", label: "Practice Tests" },
  { value: "100+", label: "Study Resources" },
  { value: "24/7", label: "AI Mentor" },
];

export default function HomePage() {
  const router = useRouter();
  const [socialProofStats, setSocialProofStats] = useState<StatItem[]>(DEFAULT_SOCIAL_PROOF);
  const [statsVisible, setStatsVisible] = useState(true);
  const [aiQuestion, setAiQuestion] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadHomepageStats() {
      const { data } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "homepage_stats")
        .maybeSingle();

      if (!ignore && data?.value) {
        const val = data.value as { enabled?: boolean; stats?: StatItem[] };
        if (typeof val.enabled === "boolean") setStatsVisible(val.enabled);
        if (Array.isArray(val.stats) && val.stats.length > 0) {
          setSocialProofStats(val.stats);
        }
      }
    }

    void loadHomepageStats();
    return () => {
      ignore = true;
    };
  }, []);

  const handleAskMentor = (e: React.FormEvent) => {
    e.preventDefault();
    const q = aiQuestion.trim();
    router.push(q ? `/mentor-ai?q=${encodeURIComponent(q)}` : "/mentor-ai");
  };

  const learningTracks = [
    "School (Classes 1–12)",
    "Semester & Board Exams",
    "Campus Placements",
    "GATE & CAT",
    "Scholarships & Study Abroad",
  ];

  const comparisonRows = [
    {
      feature: "Structured Notes & Courses",
      lily: "Classes 1–12, college & exam tracks",
      others: "Scattered playlists or locked paywalls",
    },
    {
      feature: "AI Doubt Mentor + Practice",
      lily: "Built-in & private to your account",
      others: "Generic chat without mocks or structure",
    },
    {
      feature: "Mock Tests & Flashcards",
      lily: "100% Free active recall & practice",
      others: "Paid passes & subscription upsells",
    },
    {
      feature: "Student Privacy",
      lily: "No public names, scores, or tracking",
      others: "Public boards & ad-heavy feeds",
    },
  ];

  const modules = [
    {
      title: "Course Library",
      desc: "Ordered PDFs, slides, and notes from Classes 1–12 through college and exams.",
      icon: GraduationCap,
      href: "/courses",
      color: "bg-emerald-50 text-emerald-700 border-emerald-100",
    },
    {
      title: "Practice Tests",
      desc: "Topic quizzes and exam-style tests with instant feedback and breakdowns.",
      icon: BookCheck,
      href: "/practice",
      color: "bg-teal-50 text-teal-700 border-teal-100",
    },
    {
      title: "Smart Flashcards",
      desc: "Active recall decks to retain key formulas, definitions, and concepts.",
      icon: Layers,
      href: "/flashcards",
      color: "bg-sky-50 text-sky-700 border-sky-100",
    },
    {
      title: "Mentors",
      desc: "Guidance for school-to-college choices, placements, GATE, CAT, and careers.",
      icon: UserCheck,
      href: "/mentors",
      color: "bg-purple-50 text-purple-700 border-purple-100",
    },
    {
      title: "Scholarship Tracker",
      desc: "Filter verified opportunities by country, amount, degree, and deadline.",
      icon: Globe,
      href: "/scholarships",
      color: "bg-cyan-50 text-cyan-700 border-cyan-100",
    },
    {
      title: "Personal Dashboard",
      desc: "Private streaks, saved resources, and study progress visible only to you.",
      icon: Award,
      href: "/dashboard",
      color: "bg-amber-50 text-amber-700 border-amber-100",
    },
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-linear-to-b from-[#A7D7C5]/25 via-[#A2C4C9]/15 to-transparent pt-14 pb-14 px-4 sm:px-6 lg:px-8 border-b border-slate-200/60">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/90 text-[#427563] border border-[#74B49B]/30 shadow-2xs">
            <Lock className="w-3.5 h-3.5 text-[#5C899D]" />
            <span>Free • Classes 1–12, College &amp; Competitive Exams</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-[3.2rem] font-extrabold text-slate-800 tracking-tight leading-[1.15]">
            Study Smarter with AI, Practice Tests, Flashcards &amp; Mentors —{" "}
            <span className="text-[#5C899D]">Completely Free</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Everything you need for school (Classes 1–12), sem exams, placements, GATE, CAT and competitive exams in one calm platform.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-3.5 pt-1">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm sm:text-base font-bold text-white bg-[#74B49B] hover:bg-[#5f9c85] rounded-xl shadow-sm transition cursor-pointer"
            >
              Start Learning Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/mentor-ai"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm sm:text-base font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition cursor-pointer"
            >
              <Bot className="w-4 h-4 text-[#5C899D]" />
              Try AI Mentor
            </Link>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
            {learningTracks.map((track) => (
              <span
                key={track}
                className="px-3 py-1 rounded-lg bg-white/85 border border-slate-200/80 text-[11px] font-semibold text-slate-600"
              >
                {track}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Social Proof Metrics (Admin Editable, Stable Layout) */}
      {statsVisible && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-2">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 min-h-28 flex items-center">
            <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-6 text-center divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
              {socialProofStats.map((stat, idx) => (
                <div
                  key={`${stat.label}-${idx}`}
                  className={`space-y-1 ${idx >= 2 ? "pt-4 lg:pt-0" : ""} ${
                    idx % 2 === 1 ? "border-l border-slate-100 lg:border-l-0" : ""
                  }`}
                >
                  <p className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight tabular-nums">
                    {stat.value}
                  </p>
                  <p className="text-xs sm:text-sm font-semibold text-slate-500">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. Focused AI Mentor Prompt */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-5">
          <div className="text-center space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">
              Ask AI Mentor a Question
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Clear explanations and study steps—kept private to your session.
            </p>
          </div>

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
        </div>
      </section>

      {/* 4. Why Lily Estudio (Comparison) */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#5C899D]/10 text-[#5C899D]">
            Why Lily Estudio?
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            One organized workspace instead of scattered tabs
          </h2>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="grid grid-cols-12 bg-slate-50/90 border-b border-slate-200/80 px-5 py-3.5 text-xs font-extrabold text-slate-700">
            <div className="col-span-4">Feature</div>
            <div className="col-span-4 text-[#427563]">Lily Estudio</div>
            <div className="col-span-4 text-slate-500">Typical Alternatives</div>
          </div>

          <div className="divide-y divide-slate-100">
            {comparisonRows.map((row) => (
              <div
                key={row.feature}
                className="grid grid-cols-12 items-center px-5 py-4 text-xs sm:text-sm gap-2"
              >
                <div className="col-span-4 font-bold text-slate-800">{row.feature}</div>
                <div className="col-span-4 flex items-start gap-1.5 font-semibold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{row.lily}</span>
                </div>
                <div className="col-span-4 flex items-start gap-1.5 text-slate-500">
                  <XCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{row.others}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Core Modules Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            Explore Core Study Modules
          </h2>
          <p className="text-slate-600 text-sm mt-1.5">
            Every module is free from day one—no paywalls or subscriptions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.title}
                className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:border-[#74B49B]/60 transition-all flex flex-col justify-between"
              >
                <div>
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center border mb-4 ${mod.color}`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">{mod.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-6">{mod.desc}</p>
                </div>
                <Link
                  href={mod.href}
                  className="text-xs font-bold text-[#5C899D] hover:text-[#41687a] inline-flex items-center gap-1 transition cursor-pointer"
                >
                  Open {mod.title} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Bottom CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-linear-to-r from-[#5C899D]/15 via-[#74B49B]/15 to-[#A7D7C5]/20 rounded-3xl p-8 sm:p-10 border border-[#74B49B]/30 text-center space-y-5">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            Ready to start your free study workspace?
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
            Create an account in seconds for Classes 1–12, college semesters, placements, GATE, CAT, and scholarships.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-1">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-[#74B49B] hover:bg-[#5f9c85] rounded-xl shadow-xs transition"
            >
              Start Learning Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/scholarships"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition"
            >
              <Users className="w-4 h-4 text-[#5C899D]" />
              Browse Scholarships
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}