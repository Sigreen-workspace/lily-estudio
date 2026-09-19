"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { supabase, MentorshipRequest } from "@/lib/supabase";
import { ArrowLeft, Compass } from "lucide-react";

export default function StudentRequestsPage() {
  return (
    <ProtectedRoute allowedRoles={["student", "admin"]}>
      <StudentRequestsContent />
    </ProtectedRoute>
  );
}

function StudentRequestsContent() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadRequests() {
      if (!user) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("mentorship_requests")
          .select("*, profiles:mentor_id(*)")
          .eq("student_id", user.id)
          .order("created_at", { ascending: false });

        if (!ignore && !error && data) {
          setRequests(data as unknown as MentorshipRequest[]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadRequests();

    return () => {
      ignore = true;
    };
  }, [user]);

  const handleCancelRequest = async (reqId: string) => {
    if (!confirm("Cancel this mentorship consultation request?")) return;
    try {
      await supabase
        .from("mentorship_requests")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", reqId);

      setRequests((prev) =>
        prev.map((r) => (r.id === reqId ? { ...r, status: "cancelled" } : r))
      );
    } catch {
      alert("Failed to cancel request.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          href="/dashboard/student"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5C899D] hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C899D]">
              Free Mentorship Status
            </span>
            <h1 className="text-2xl font-bold text-slate-800">My Advisory Inquiries</h1>
          </div>
          <Link
            href="/mentors"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#74B49B] text-white rounded-xl text-xs font-semibold hover:bg-[#5f9c85] transition"
          >
            <Compass className="w-3.5 h-3.5" /> Find More Mentors
          </Link>
        </div>

        {loading ? (
          <div className="h-40 bg-slate-100 rounded-2xl animate-pulse" />
        ) : requests.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <Compass className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No mentorship requests sent yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Need feedback on an SOP, college choice, or exam roadmap? Browse our verified educators for free guidance.
            </p>
            <Link
              href="/mentors"
              className="inline-block mt-2 px-4 py-2 bg-[#5C899D] text-white rounded-xl text-xs font-semibold"
            >
              Browse Mentors
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {requests.map((r) => (
              <div key={r.id} className="py-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          r.status === "pending"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : r.status === "accepted"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : r.status === "declined"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {r.status}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-800 mt-1">{r.topic}</h3>
                    <p className="text-xs text-slate-500">
                      Advisor: <strong className="text-slate-700">{r.profiles?.full_name || "Mentor"}</strong>
                    </p>
                  </div>

                  {r.status === "pending" && (
                    <button
                      onClick={() => handleCancelRequest(r.id)}
                      className="text-xs text-slate-400 hover:text-rose-600 transition"
                    >
                      Cancel Request
                    </button>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700">
                  <span className="font-semibold text-slate-800">Your Message:</span> {r.message}
                </div>

                {r.mentor_response && (
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200/60 rounded-xl text-xs space-y-1">
                    <span className="font-bold text-emerald-800">Response from {r.profiles?.full_name}:</span>
                    <p className="text-slate-800 leading-relaxed">{r.mentor_response}</p>
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