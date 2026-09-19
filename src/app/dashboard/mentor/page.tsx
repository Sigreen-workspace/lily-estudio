"use client";

import React, { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { supabase, MentorshipRequest, MentorshipStatus } from "@/lib/supabase";
import {
  Compass,
  CheckCircle2,
  Send,
  UserCheck,
  Check,
  Power
} from "lucide-react";

export default function MentorDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["mentor", "admin"]}>
      <MentorDashboardContent />
    </ProtectedRoute>
  );
}

function MentorDashboardContent() {
  const { user, profile, refreshProfile } = useAuth();
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [activeTab, setActiveTab] = useState<MentorshipStatus | "all">("pending");
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(profile?.is_available_for_mentorship ?? true);

  // Response form states
  const [activeRespondId, setActiveRespondId] = useState<string | null>(null);
  const [mentorNotes, setMentorNotes] = useState("");
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadMentorRequests() {
      if (!user) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("mentorship_requests")
          .select("*, profiles:student_id(*)")
          .eq("mentor_id", user.id)
          .order("created_at", { ascending: false });

        if (!ignore && !error && data) {
          setRequests(data as unknown as MentorshipRequest[]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadMentorRequests();

    return () => {
      ignore = true;
    };
  }, [user]);

  const handleToggleAvailability = async () => {
    if (!user) return;
    const newStatus = !isAvailable;
    setIsAvailable(newStatus);
    try {
      await supabase
        .from("profiles")
        .update({ is_available_for_mentorship: newStatus, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      await refreshProfile();
      setActionMsg(`Availability set to ${newStatus ? "Available" : "Busy"}.`);
      setTimeout(() => setActionMsg(null), 3000);
    } catch {
      alert("Failed to update status.");
    }
  };

  const handleStatusUpdate = async (requestId: string, newStatus: MentorshipStatus) => {
    try {
      const payload: Partial<MentorshipRequest> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (mentorNotes) {
        payload.mentor_response = mentorNotes;
      }

      const { error } = await supabase
        .from("mentorship_requests")
        .update(payload)
        .eq("id", requestId);

      if (error) throw error;

      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? { ...r, status: newStatus, mentor_response: mentorNotes || r.mentor_response }
            : r
        )
      );

      setActiveRespondId(null);
      setMentorNotes("");
      setActionMsg(`Request updated to ${newStatus}.`);
      setTimeout(() => setActionMsg(null), 3000);
    } catch {
      alert("Failed to process request.");
    }
  };

  // Metrics
  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const acceptedCount = requests.filter((r) => r.status === "accepted").length;
  const completedCount = requests.filter((r) => r.status === "completed").length;

  const filteredRequests = requests.filter(
    (r) => activeTab === "all" || r.status === activeTab
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-[#A7D7C5]/30 to-[#A2C4C9]/30 rounded-3xl p-6 sm:p-8 border border-[#74B49B]/30 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-[#427563] shadow-2xs">
            Mentor Advisory Lounge
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
            Mentor Portal: {profile?.full_name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            {profile?.institution || "Independent Mentor"} • Free Academic & Career Consultation
          </p>
        </div>

        {/* Availability Toggle */}
        <button
          onClick={handleToggleAvailability}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
            isAvailable
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-slate-200 text-slate-700 hover:bg-slate-300"
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          {isAvailable ? "Accepting Students" : "Temporarily Away"}
        </button>
      </div>

      {actionMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">Pending</span>
          <strong className="text-2xl font-bold text-slate-800 block">{pendingCount}</strong>
        </div>
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-[#5C899D] uppercase tracking-wider">Active</span>
          <strong className="text-2xl font-bold text-slate-800 block">{acceptedCount}</strong>
        </div>
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Completed</span>
          <strong className="text-2xl font-bold text-slate-800 block">{completedCount}</strong>
        </div>
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Received</span>
          <strong className="text-2xl font-bold text-slate-800 block">{requests.length}</strong>
        </div>
      </div>

      {/* Request Management Lounge */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
        {/* Tab Filters */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === "pending"
                ? "bg-amber-500 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Pending Review ({pendingCount})
          </button>
          <button
            onClick={() => setActiveTab("accepted")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === "accepted"
                ? "bg-[#5C899D] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Active Guidance ({acceptedCount})
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === "completed"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Completed ({completedCount})
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === "all"
                ? "bg-slate-800 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All History
          </button>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
        ) : filteredRequests.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <Compass className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm text-slate-600 font-medium">No requests currently in this state.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredRequests.map((req) => (
              <div key={req.id} className="py-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-[#5C899D]">
                        Track: {req.academic_track}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          req.status === "pending"
                            ? "bg-amber-50 text-amber-700"
                            : req.status === "accepted"
                            ? "bg-sky-50 text-sky-700"
                            : req.status === "completed"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {req.status}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(req.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-800">{req.topic}</h3>
                    <p className="text-xs text-slate-500">
                      Student: <strong className="text-slate-700">{req.profiles?.full_name || "Scholar"}</strong> (
                      {req.profiles?.education_level || "College"})
                    </p>
                  </div>

                  {/* Action Controls */}
                  <div className="flex items-center gap-2">
                    {req.status === "pending" && (
                      <>
                        <button
                          onClick={() => setActiveRespondId(activeRespondId === req.id ? null : req.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#74B49B] hover:bg-[#5f9c85] text-white text-xs font-semibold rounded-xl transition"
                        >
                          <UserCheck className="w-3.5 h-3.5" /> Respond / Accept
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(req.id, "declined")}
                          className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold rounded-xl transition"
                        >
                          Decline
                        </button>
                      </>
                    )}

                    {req.status === "accepted" && (
                      <button
                        onClick={() => handleStatusUpdate(req.id, "completed")}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition"
                      >
                        <Check className="w-3.5 h-3.5" /> Mark Completed
                      </button>
                    )}
                  </div>
                </div>

                {/* Inquiry Body */}
                <div className="p-4 bg-slate-50/70 border border-slate-200/70 rounded-2xl text-xs text-slate-700 leading-relaxed">
                  <span className="font-bold text-slate-800 block mb-1">Student Message:</span>
                  {req.message}
                </div>

                {/* Existing Mentor Response if already given */}
                {req.mentor_response && (
                  <div className="p-4 bg-emerald-50/50 border border-emerald-200/60 rounded-2xl text-xs text-slate-800 space-y-1">
                    <span className="font-bold text-emerald-800 block">Your Guidance Note:</span>
                    <p className="leading-relaxed">{req.mentor_response}</p>
                  </div>
                )}

                {/* Response Drawer */}
                {activeRespondId === req.id && (
                  <div className="p-4 bg-white border border-[#74B49B]/40 rounded-2xl space-y-3 shadow-xs">
                    <h4 className="text-xs font-bold text-slate-800">
                      Write Advice / Meeting Schedule for Student
                    </h4>
                    <textarea
                      rows={3}
                      value={mentorNotes}
                      onChange={(e) => setMentorNotes(e.target.value)}
                      placeholder="Share your recommendations, feedback, or proposed consultation schedule..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#74B49B]"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setActiveRespondId(null)}
                        className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(req.id, "accepted")}
                        className="inline-flex items-center gap-1 px-4 py-1.5 bg-[#74B49B] text-white text-xs font-semibold rounded-xl shadow-xs hover:bg-[#5f9c85]"
                      >
                        <Send className="w-3 h-3" /> Send & Accept
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}