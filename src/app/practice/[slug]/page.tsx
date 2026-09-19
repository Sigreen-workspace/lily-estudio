"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShieldAlert, Play, AlertCircle } from "lucide-react";
import { supabase, PracticeTest } from "@/lib/supabase";

export default function TestInstructionsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [test, setTest] = useState<PracticeTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadTest() {
      try {
        const { data, error: tErr } = await supabase
          .from("tests")
          .select("*, categories:category_id(*)")
          .eq("slug", slug)
          .single();

        if (!ignore) {
          if (tErr) throw tErr;
          setTest(data);
          setError(null);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : "Test not found.";
          setError(msg);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    if (slug) {
      loadTest();
    }

    return () => {
      ignore = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-6 w-32 bg-slate-200 rounded-md" />
        <div className="h-10 w-2/3 bg-slate-200 rounded-lg" />
        <div className="h-60 bg-slate-200 rounded-3xl" />
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Test Not Found</h2>
        <p className="text-sm text-slate-600">{error}</p>
        <Link
          href="/practice"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#74B49B] text-white rounded-xl text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Practice
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <Link
          href="/practice"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5C899D] hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Practice Tests
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#74B49B]/15 text-[#427563]">
            {test.difficulty} Diagnostic
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            {test.title}
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            {test.description}
          </p>
        </div>

        {/* Test Spec Grid */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">Duration</span>
            <strong className="text-base text-slate-800 font-bold">{test.duration_minutes} Mins</strong>
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">Questions</span>
            <strong className="text-base text-slate-800 font-bold">{test.total_questions} MCQs</strong>
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">Pass Mark</span>
            <strong className="text-base text-slate-800 font-bold">{test.passing_score}%</strong>
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-3 pt-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Instructions & Rules
          </h2>
          <ul className="space-y-2.5 text-sm text-slate-600">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#74B49B] shrink-0 mt-0.5" />
              <span>Each question features multiple choice options with exactly one correct answer.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#74B49B] shrink-0 mt-0.5" />
              <span>You can jump between questions freely before submitting.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-[#5C899D] shrink-0 mt-0.5" />
              <span>The timer automatically submits the test if time expires. Progress is autosaved locally.</span>
            </li>
          </ul>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => router.push(`/practice/${test.slug}/take`)}
            className="w-full sm:flex-1 py-3 px-6 rounded-xl bg-[#74B49B] hover:bg-[#5f9c85] text-white font-semibold text-sm transition flex items-center justify-center gap-2 shadow-xs"
          >
            <Play className="w-4 h-4 fill-white" /> Start Practice Test
          </button>
        </div>
      </div>
    </div>
  );
}