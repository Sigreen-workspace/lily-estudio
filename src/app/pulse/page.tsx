"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  Activity,
  Flame,
  MessageSquare,
  Lock,
  ShieldCheck,
  ArrowRight,
  BookOpen,
  Layers,
  Globe,
  Users,
  LogIn,
} from "lucide-react";

interface TopSubjectItem {
  name: string;
  count: number;
}

interface PublicPulseData {
  totalLearners: number;
  totalCourses: number;
  totalDecks: number;
  totalFlashcards: number;
  totalScholarships: number;
  communityDiscussions: number;
  topSubjects: TopSubjectItem[];
  updatedAt: string;
}

const FALLBACK_SUBJECTS: string[] = [
  "Control Systems",
  "Data Structures",
  "Operating Systems",
  "Aptitude",
  "Engineering Mathematics",
];

export default function PlatformPulsePage() {
  const { user, loading: authLoading } = useAuth();
  const [pulse, setPulse] = useState<PublicPulseData | null>(null);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    let ignore = false;

    async function runFetch() {
      setFetching(true);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        if (!accessToken) {
          if (!ignore) setPulse(null);
          return;
        }

        const res = await fetch("/api/public-pulse", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!ignore) {
          if (res.ok) {
            const data = (await res.json()) as PublicPulseData;
            setPulse(data);
          } else {
            setPulse(null);
          }
        }
      } finally {
        if (!ignore) setFetching(false);
      }
    }

    void runFetch();

    return () => {
      ignore = true;
    };
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="h-48 rounded-3xl bg-slate-100 animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 text-center shadow-xs space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-[#5C899D]/15 text-[#5C899D] flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h1 className="text-2xl font-extrabold text-slate-800">
              Sign In to View Learning Pulse
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Platform pulse and study trends are available to signed-in learners while keeping all personal data strictly private.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-1">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#74B49B] hover:bg-[#5f9c85] text-white text-xs sm:text-sm font-bold transition"
            >
              <LogIn className="w-4 h-4" /> Sign In
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-bold transition"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const trendingSubjects: string[] =
    pulse && Array.isArray(pulse.topSubjects) && pulse.topSubjects.length > 0
      ? pulse.topSubjects.map((s: TopSubjectItem) => s.name)
      : FALLBACK_SUBJECTS;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="bg-linear-to-r from-[#A7D7C5]/25 via-[#A2C4C9]/20 to-[#5C899D]/15 rounded-3xl p-6 sm:p-8 border border-[#74B49B]/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-[#427563]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#5C899D]" /> Signed-In Learner View • Privacy-Safe
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">
            Live Learning <span className="text-[#5C899D]">Pulse &amp; Trends</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Real-time aggregate learning momentum across Lily Estudio—computed directly from platform totals with zero personal user data exposed.
          </p>
        </div>

        <Link
          href="/courses"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#74B49B] hover:bg-[#5f9c85] text-white text-xs font-bold shadow-xs transition shrink-0"
        >
          Explore Courses <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Top Aggregate Counters */}
      {fetching ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 rounded-3xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-1">
            <Users className="w-5 h-5 text-[#5C899D] mb-2" />
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-800">
              {pulse ? `${pulse.totalLearners.toLocaleString()}+` : "0"}
            </p>
            <p className="text-xs font-semibold text-slate-500">Registered Learners</p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-1">
            <BookOpen className="w-5 h-5 text-emerald-600 mb-2" />
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-800">
              {pulse ? pulse.totalCourses.toLocaleString() : "0"}
            </p>
            <p className="text-xs font-semibold text-slate-500">Structured Courses</p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-1">
            <Layers className="w-5 h-5 text-sky-600 mb-2" />
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-800">
              {pulse ? pulse.totalFlashcards.toLocaleString() : "0"}
            </p>
            <p className="text-xs font-semibold text-slate-500">Active Flashcards</p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-1">
            <Globe className="w-5 h-5 text-amber-600 mb-2" />
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-800">
              {pulse ? pulse.totalScholarships.toLocaleString() : "0"}
            </p>
            <p className="text-xs font-semibold text-slate-500">Verified Scholarships</p>
          </div>
        </div>
      )}

      {/* Study Trends + Community Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" /> Most Studied Subjects
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700">
              Live Study Trends
            </span>
          </div>

          <ol className="space-y-2.5 text-xs sm:text-sm">
            {trendingSubjects.map((subject: string, idx: number) => (
              <li
                key={subject}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-xs font-extrabold text-[#5C899D] flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-slate-800">{subject}</span>
                </div>
                <Link
                  href="/courses"
                  className="text-xs font-semibold text-[#5C899D] hover:underline"
                >
                  Open Materials →
                </Link>
              </li>
            ))}
          </ol>
        </div>

        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#5C899D]" /> Community Statistics
            </h2>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50">
                <span className="text-slate-600">💬 Forum Discussions</span>
                <strong className="font-extrabold text-slate-800">
                  {pulse ? pulse.communityDiscussions.toLocaleString() : "0"}
                </strong>
              </div>
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50">
                <span className="text-slate-600">📚 Flashcard Decks Created</span>
                <strong className="font-extrabold text-emerald-700">
                  {pulse ? pulse.totalDecks.toLocaleString() : "0"}
                </strong>
              </div>
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50">
                <span className="text-slate-600">🔥 Top Subject Focus</span>
                <strong className="font-extrabold text-[#5C899D]">{trendingSubjects[0]}</strong>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5 text-xs text-slate-600">
            <Lock className="w-4 h-4 text-[#5C899D] shrink-0 mt-0.5" />
            <p>
              <strong>Privacy Guarantee:</strong> All counters are aggregate platform totals. Individual student names, scores, and online statuses are never published.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Timestamp */}
      {pulse?.updatedAt && (
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <Activity className="w-3.5 h-3.5 text-emerald-500" />
          <span>
            Last synced:{" "}
            {new Date(pulse.updatedAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      )}
    </div>
  );
}