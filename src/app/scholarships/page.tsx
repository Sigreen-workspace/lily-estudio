"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { supabase, Scholarship, ScholarshipApplicationStatus } from "@/lib/supabase";
import { checkAndUnlockBadge, logLearningActivity } from "@/lib/progress";
import {
  GraduationCap,
  Search,
  Globe,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  Bookmark,
  CheckCircle2,
  ChevronRight
} from "lucide-react";

export default function ScholarshipsPage() {
  const { user, profile } = useAuth();
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [trackedIds, setTrackedIds] = useState<Record<string, ScholarshipApplicationStatus>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadScholarships() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("scholarships")
          .select("*")
          .order("deadline_date", { ascending: true });

        if (!ignore && !error && data) {
          setScholarships(data as Scholarship[]);
        }

        if (user) {
          const { data: trackerData } = await supabase
            .from("student_scholarship_trackers")
            .select("scholarship_id, status")
            .eq("user_id", user.id);

          if (!ignore && trackerData) {
            const map: Record<string, ScholarshipApplicationStatus> = {};
            trackerData.forEach((t) => {
              map[t.scholarship_id] = t.status as ScholarshipApplicationStatus;
            });
            setTrackedIds(map);
          }
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadScholarships();

    return () => {
      ignore = true;
    };
  }, [user]);

  // Mentor role check placed safely after all hooks
  if (profile?.role === "mentor") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Mentor Portal Access</h2>
        <p className="text-xs text-slate-500">
          As an academic mentor, your workspace is dedicated to managing student appointments and advisory requests.
        </p>
        <Link
          href="/dashboard/mentor"
          className="inline-block px-5 py-2.5 bg-[#5C899D] text-white text-xs font-semibold rounded-xl shadow-xs"
        >
          Go to Mentor Hub
        </Link>
      </div>
    );
  }

  const handleTrackScholarship = async (scholarship: Scholarship) => {
    if (!user) {
      alert("Please log in to save and track scholarships.");
      return;
    }

    setSavingId(scholarship.id);
    try {
      if (trackedIds[scholarship.id]) {
        // Remove from tracker
        await supabase
          .from("student_scholarship_trackers")
          .delete()
          .eq("user_id", user.id)
          .eq("scholarship_id", scholarship.id);

        setTrackedIds((prev) => {
          const copy = { ...prev };
          delete copy[scholarship.id];
          return copy;
        });
      } else {
        // Add to tracker
        await supabase.from("student_scholarship_trackers").insert({
          user_id: user.id,
          scholarship_id: scholarship.id,
          status: "interested",
          target_deadline: scholarship.deadline_date,
        });

        // Also add to generic saved_resources for unified dashboard integration
        await supabase.from("saved_resources").upsert({
          user_id: user.id,
          resource_type: "scholarship",
          item_id: scholarship.id,
          title: scholarship.title,
          subtitle: scholarship.provider,
          target_url: `/scholarships#${scholarship.id}`,
        });

        // Unlock authentic milestone
        await checkAndUnlockBadge(user.id, "first_scholarship_saved");
        await logLearningActivity(
          user.id,
          "scholarship_saved",
          `Saved scholarship: ${scholarship.title}`
        );

        setTrackedIds((prev) => ({ ...prev, [scholarship.id]: "interested" }));
      }
    } catch {
      alert("Failed to update scholarship status.");
    } finally {
      setSavingId(null);
    }
  };

  const countries = Array.from(new Set(scholarships.map((s) => s.country)));

  const filtered = scholarships.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.degree_field.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.country.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLevel = levelFilter === "all" || s.study_level === levelFilter;
    const matchesCountry = countryFilter === "all" || s.country === countryFilter;
    const matchesVerified = !onlyVerified || s.is_verified;

    return matchesSearch && matchesLevel && matchesCountry && matchesVerified;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-[#A7D7C5]/30 to-[#A2C4C9]/30 rounded-3xl p-6 sm:p-8 border border-[#74B49B]/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-[#427563] shadow-2xs">
            Authentic Opportunities
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">
            Academic <span className="text-[#5C899D]">Scholarship Directory</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Curated, fully verified global and domestic student grants, fellowships, and waivers. Track official deadlines and manage application milestones securely.
          </p>
        </div>

        {user && (
          <Link
            href="/dashboard/student/scholarships"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5C899D] hover:bg-[#4a7285] text-white text-xs font-semibold rounded-xl shadow-xs transition shrink-0"
          >
            My Application Tracker <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by keyword, provider, country, or degree field..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40 focus:border-[#74B49B] transition"
            />
          </div>

          <div className="w-full sm:w-52">
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40 transition"
            >
              <option value="all">All Study Levels</option>
              <option value="School">School</option>
              <option value="Undergraduate">Undergraduate</option>
              <option value="Postgraduate">Postgraduate</option>
              <option value="PhD/Research">PhD / Research</option>
            </select>
          </div>

          <div className="w-full sm:w-48">
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40 transition"
            >
              <option value="all">All Countries</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <label className="inline-flex items-center gap-2 text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyVerified}
              onChange={(e) => setOnlyVerified(e.target.checked)}
              className="w-4 h-4 accent-[#74B49B] rounded"
            />
            <span>Show only verified official scholarships (hide demo items)</span>
          </label>

          <span className="text-slate-400 font-medium">
            Showing {filtered.length} of {scholarships.length} opportunities
          </span>
        </div>
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-44 bg-slate-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <GraduationCap className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No scholarships match your filters</h3>
          <p className="text-xs text-slate-500">
            Try resetting your country or degree level filters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((s) => {
            const isTracked = Boolean(trackedIds[s.id]);

            return (
              <div
                key={s.id}
                id={s.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs hover:border-[#74B49B]/40 transition space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      {s.is_verified ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3" /> Verified Official
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertTriangle className="w-3 h-3" /> Demo / Illustrative
                        </span>
                      )}

                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {s.study_level}
                      </span>

                      <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                        <Globe className="w-3 h-3" /> {s.country}
                      </span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-bold text-slate-800 pt-1">
                      {s.title}
                    </h2>
                    <p className="text-xs text-[#5C899D] font-semibold">{s.provider}</p>
                  </div>

                  {/* Benefit Pill */}
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      Benefit Value
                    </span>
                    <strong className="text-sm sm:text-base font-extrabold text-emerald-700">
                      {s.amount_benefit}
                    </strong>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {s.description}
                </p>

                {/* Key Metadata Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60">
                    <span className="font-bold text-slate-700 block mb-0.5">Eligibility:</span>
                    <p className="text-[11px] text-slate-600 leading-normal">
                      {s.eligibility_criteria}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60">
                    <span className="font-bold text-slate-700 block mb-0.5">Key Requirements:</span>
                    <p className="text-[11px] text-slate-600 leading-normal">
                      {s.requirements || "Check official guidelines."}
                    </p>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-4 text-slate-500 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      Deadline: <strong className="text-slate-700">{s.deadline_date || "Rolling"}</strong>
                    </span>

                    <span className="text-slate-400">
                      Verified: {new Date(s.last_verified_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={s.official_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 font-semibold transition text-xs"
                    >
                      Official Portal <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>

                    <button
                      onClick={() => handleTrackScholarship(s)}
                      disabled={savingId === s.id}
                      className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-semibold transition text-xs shadow-2xs cursor-pointer ${
                        isTracked
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : "bg-[#74B49B] hover:bg-[#5f9c85] text-white"
                      }`}
                    >
                      {isTracked ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Tracked
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-3.5 h-3.5" /> Add to Tracker
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}