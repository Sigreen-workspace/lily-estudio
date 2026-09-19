"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { supabase, MentorshipRequest } from "@/lib/supabase";
import { ArrowLeft, Compass, Clock, CheckCircle2, XCircle, Trash2 } from "lucide-react";

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
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadRequests() {
      if (!user) return;
      setLoading(true);

      try {
        type RawRequest = Record<string, unknown> & { mentor_id?: string };
        let rawData: RawRequest[] = [];
        const res1 = await supabase
          .from("mentorship_requests")
          .select("*")
          .eq("student_id", user.id)
          .order("created_at", { ascending: false });

        if (res1.data && res1.data.length > 0) {
          rawData = (res1.data ?? []) as RawRequest[];
        } else {
          const res2 = await supabase
            .from("mentor_requests")
            .select("*")
            .eq("student_id", user.id)
            .order("created_at", { ascending: false });

          if (res2.data) {
            rawData = res2.data as RawRequest[];
          }
        }

        if (!ignore && rawData.length > 0) {
          const mentorIds = Array.from(
            new Set(
              rawData
                .map((r) => r.mentor_id)
                .filter((id): id is string => typeof id === "string" && id.length > 0)
            )
          );
          
          const profileMap: Record<string, { full_name?: string; institution?: string; avatar_url?: string }> = {};
          if (mentorIds.length > 0) {
            const { data: profilesData } = await supabase
              .from("profiles")
              .select("id, full_name, institution, avatar_url")
              .in("id", mentorIds);

            if (profilesData) {
              profilesData.forEach((p) => {
                profileMap[p.id] = p;
              });
            }
          }

          const formattedRequests = rawData.map((req) => ({
            ...req,
            profiles: profileMap[req.mentor_id ?? ""] || {
              full_name: "Academic Mentor",
              institution: "Independent Advisor",
            },
          }));

          setRequests(formattedRequests as unknown as MentorshipRequest[]);
        } else if (!ignore) {
          setRequests([]);
        }
      } catch (err) {
        console.error("Failed to load student consultation inquiries:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadRequests();

    return () => {
      ignore = true;
    };
  }, [user]);

  // Handle Delete Request
  const handleDeleteRequest = async (reqId: string) => {
    if (!confirm("Kya aap is mentorship request ko permanently delete karna chahte hain?")) return;
    setActionId(reqId);

    try {
      const { error } = await supabase
        .from("mentorship_requests")
        .delete()
        .eq("id", reqId);

      if (error) {
        await supabase
          .from("mentor_requests")
          .delete()
          .eq("id", reqId);
      }

      setRequests((prev) => prev.filter((r) => r.id !== reqId));
    } catch {
      alert("Request delete karne mein asafalta rahi. Kripya dobara koshish karein.");
    } finally {
      setActionId(null);
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
              className="inline-block mt-2 px-4 py-2 bg-[#5C899D] text-white rounded-xl text-xs font-semibold hover:bg-[#4a7285] transition"
            >
              Browse Mentors
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {requests.map((r) => {
              const studentNote = r.message || r.notes || "No message content attached.";
              const mentorName = r.profiles?.full_name || "Academic Mentor";

              return (
                <div key={r.id} className="py-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded flex items-center gap-1 ${
                            r.status === "pending"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : r.status === "accepted"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : r.status === "declined"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {r.status === "pending" && <Clock className="w-3 h-3" />}
                          {r.status === "accepted" && <CheckCircle2 className="w-3 h-3" />}
                          {r.status === "declined" && <XCircle className="w-3 h-3" />}
                          {r.status}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(r.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-800 mt-1">{r.topic}</h3>
                      <p className="text-xs text-slate-500">
                        Advisor: <strong className="text-slate-700">{mentorName}</strong>
                        {r.profiles?.institution && (
                          <span className="text-slate-400 font-normal"> ({r.profiles.institution})</span>
                        )}
                      </p>
                    </div>

                    {/* Delete Request Button */}
                    <button
                      onClick={() => handleDeleteRequest(r.id)}
                      disabled={actionId === r.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl transition disabled:opacity-50 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {actionId === r.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 leading-relaxed border border-slate-100">
                    <span className="font-semibold text-slate-800">Your Message:</span> {studentNote}
                  </div>

                  {r.mentor_response && (
                    <div className="p-4 bg-emerald-50/70 border border-emerald-200/60 rounded-xl text-xs space-y-1">
                      <span className="font-bold text-emerald-800">Response &amp; Contact from {mentorName}:</span>
                      <p className="text-slate-800 font-medium break-all leading-relaxed">{r.mentor_response}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}