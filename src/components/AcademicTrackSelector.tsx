"use client";

import React, { useState } from "react";
import { AcademicTrack, supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { School, GraduationCap, Trophy, Globe, Sparkles, Check } from "lucide-react";

interface TrackSelectorProps {
  selectedTrack: AcademicTrack | "all";
  onSelectTrack: (track: AcademicTrack | "all") => void;
}

export default function AcademicTrackSelector({
  selectedTrack,
  onSelectTrack,
}: TrackSelectorProps) {
  const { user, profile, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);

  const tracks: { id: AcademicTrack | "all"; label: string; desc: string; icon: React.ElementType }[] = [
    { id: "all", label: "All Tracks", desc: "Browse everything", icon: Sparkles },
    { id: "school", label: "School", desc: "Class 1–12 (CBSE / ICSE)", icon: School },
    { id: "college", label: "College / Univ", desc: "B.Tech, B.Sc, Semesters", icon: GraduationCap },
    { id: "competitive_exam", label: "Exam Prep", desc: "JEE, NEET, GRE, CAT", icon: Trophy },
    { id: "study_abroad", label: "Study Abroad", desc: "IELTS, TOEFL, Admissions", icon: Globe },
  ];

  const handleTrackChange = async (track: AcademicTrack | "all") => {
    onSelectTrack(track);
    if (typeof window !== "undefined") {
      localStorage.setItem("lily_selected_track", track);
      window.dispatchEvent(new Event("storage"));
    }

    if (user && profile && track !== "all") {
      setSaving(true);
      try {
        await supabase
          .from("profiles")
          .update({ target_track: track, updated_at: new Date().toISOString() })
          .eq("id", user.id);
        await refreshProfile();
      } catch (err) {
        console.error("Failed to sync track preference:", err);
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C899D]">
            Personalize Your Study Track
          </span>
          <h2 className="text-lg font-bold text-slate-800">
            What are you studying right now?
          </h2>
        </div>
        {saving && (
          <span className="text-xs text-slate-400 animate-pulse">Syncing preference...</span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {tracks.map((t) => {
          const Icon = t.icon;
          const isSelected = selectedTrack === t.id;

          return (
            <button
              key={t.id}
              type="button"
              onClick={() => handleTrackChange(t.id)}
              className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between gap-2 ${
                isSelected
                  ? "bg-[#74B49B]/10 border-[#74B49B] shadow-2xs"
                  : "bg-slate-50/70 border-slate-200/80 hover:bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    isSelected
                      ? "bg-[#74B49B] text-white"
                      : "bg-white text-slate-600 border border-slate-200"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {isSelected && <Check className="w-4 h-4 text-[#74B49B]" />}
              </div>

              <div>
                <strong className="block text-xs font-bold text-slate-800">
                  {t.label}
                </strong>
                <span className="text-[10px] text-slate-500 line-clamp-1">
                  {t.desc}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}