"use client";

import React, { useState, useEffect } from "react";
import { supabase, UserProfile, AcademicTrack } from "@/lib/supabase";
import RequestMentorshipModal from "@/components/RequestMentorshipModal";
import ReportModal from "@/components/ReportModal";
import {
  Compass,
  Search,
  Globe,
  GraduationCap,
  MessageSquare,
  ShieldCheck,
  AlertTriangle
} from "lucide-react";

export default function MentorsPage() {
  const [mentors, setMentors] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [trackFilter, setTrackFilter] = useState<AcademicTrack | "all">("all");
  const [loading, setLoading] = useState(true);

  // Modal states
  const [selectedMentor, setSelectedMentor] = useState<UserProfile | null>(null);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<UserProfile | null>(null);

  useEffect(() => {
    let ignore = false;

    async function fetchMentors() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .in("role", ["mentor", "admin"])
          .order("full_name", { ascending: true });

        if (!ignore && !error && data) {
          setMentors(data);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchMentors();

    return () => {
      ignore = true;
    };
  }, []);

  const filteredMentors = mentors.filter((m) => {
    const matchesSearch =
      m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      Boolean(m.bio?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      Boolean(m.mentorship_topics?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesTrack =
      trackFilter === "all" ||
      Boolean(m.expertise_tracks?.includes(trackFilter));

    return matchesSearch && matchesTrack;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-[#A7D7C5]/30 to-[#A2C4C9]/30 rounded-3xl p-6 sm:p-8 border border-[#74B49B]/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-[#427563] shadow-2xs">
            100% Free Mentorship & Guidance
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">
            Academic & Career <span className="text-[#5C899D]">Mentors</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Connect directly with verified educators, researchers, and senior peers for personalized advice on school, college, study-abroad applications, and competitive exams.
          </p>
        </div>
        <div className="p-4 bg-white/90 backdrop-blur-xs rounded-2xl border border-slate-200/80 text-xs text-slate-600 space-y-1.5 shadow-2xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <ShieldCheck className="w-4 h-4 text-[#74B49B]" /> Free & Safe Promise
          </div>
          <p className="text-[11px] text-slate-500">
            No bookings fees or commercial services. Private credentials remain encrypted.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by mentor name, topic , or background..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40 focus:border-[#74B49B] transition"
          />
        </div>

        <div className="w-full sm:w-60">
          <select
            value={trackFilter}
            onChange={(e) => setTrackFilter(e.target.value as AcademicTrack | "all")}
            className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40 transition"
          >
            <option value="all">All Guidance Tracks</option>
            <option value="school">School (Class 1–12)</option>
            <option value="college">College / University</option>
            <option value="competitive_exam">Competitive Exams</option>
            <option value="study_abroad">Study Abroad & Admissions</option>
          </select>
        </div>
      </div>

      {/* Mentors Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 bg-slate-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filteredMentors.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <Compass className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No mentors match your search</h3>
          <p className="text-xs text-slate-500">
            Try broadening your keyword or selecting &quot;All Guidance Tracks&quot;.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMentors.map((mentor) => (
            <div
              key={mentor.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#A7D7C5]/20 text-[#427563] flex items-center justify-center font-extrabold text-lg">
                      {mentor.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-800">{mentor.full_name}</h3>
                      <p className="text-xs text-slate-500">{mentor.institution || "Independent Advisor"}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      mentor.is_available_for_mentorship
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {mentor.is_available_for_mentorship ? "Available" : "Busy"}
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {mentor.bio || "Dedicated mentor offering free academic advice and pacing strategy."}
                </p>

                {/* Topics / Specialties */}
                {mentor.mentorship_topics && mentor.mentorship_topics.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {mentor.mentorship_topics.map((top, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#74B49B]/10 text-[#427563]"
                      >
                        {top}
                      </span>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 space-y-1 text-xs text-slate-500">
                  {mentor.qualifications && (
                    <div className="flex items-center gap-1.5 truncate">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{mentor.qualifications}</span>
                    </div>
                  )}
                  {mentor.languages_spoken && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{mentor.languages_spoken.join(", ")}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setReportTarget(mentor)}
                  className="p-2 text-slate-300 hover:text-rose-500 transition"
                  title="Report user"
                >
                  <AlertTriangle className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setSelectedMentor(mentor);
                    setIsRequestOpen(true);
                  }}
                  disabled={!mentor.is_available_for_mentorship}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#74B49B] hover:bg-[#5f9c85] text-white text-xs font-semibold transition shadow-2xs disabled:opacity-40"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Request Guidance
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {selectedMentor && (
        <RequestMentorshipModal
          mentor={selectedMentor}
          isOpen={isRequestOpen}
          onClose={() => {
            setIsRequestOpen(false);
            setSelectedMentor(null);
          }}
        />
      )}

      {reportTarget && (
        <ReportModal
          targetUserId={reportTarget.id}
          targetUserName={reportTarget.full_name}
          isOpen={Boolean(reportTarget)}
          onClose={() => setReportTarget(null)}
        />
      )}
    </div>
  );
}