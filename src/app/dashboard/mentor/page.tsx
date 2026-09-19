"use client";

import React, { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  Compass,
  CheckCircle2,
  UserCheck,
  MessageSquare,
  Users,
  Calendar,
  Send,
  Trash2,
} from "lucide-react";

export default function MentorDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["mentor", "admin"]}>
      <MentorDashboardContent />
    </ProtectedRoute>
  );
}

interface MentorshipRequestItem {
  id: string;
  student_id: string;
  topic: string;
  message: string;
  status: string;
  mentor_response?: string | null;
  created_at: string;
  profiles?: {
    full_name: string;
    institution: string;
    target_track: string;
  };
}

function MentorDashboardContent() {
  const { user, profile } = useAuth();
  const [requests, setRequests] = useState<MentorshipRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [responseTexts, setResponseTexts] = useState<Record<string, string>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadMentorData() {
      if (!user) return;
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from("mentorship_requests")
          .select("*")
          .eq("mentor_id", user.id)
          .order("created_at", { ascending: false });

        if (!ignore && !error && data) {
          const studentIds = data.map((r) => r.student_id).filter(Boolean);
          
          const profileMap: Record<string, { full_name?: string; institution?: string; target_track?: string }> = {};
          if (studentIds.length > 0) {
            const { data: profilesData } = await supabase
              .from("profiles")
              .select("id, full_name, institution, target_track")
              .in("id", studentIds);

            if (profilesData) {
              profilesData.forEach((p) => {
                profileMap[p.id] = p;
              });
            }
          }

          const formattedRequests = data.map((req) => ({
            ...req,
            profiles: profileMap[req.student_id] || {
              full_name: "Student",
              institution: "College / School",
              target_track: "college",
            },
          }));

          setRequests(formattedRequests as MentorshipRequestItem[]);
          
          const initialResponses: Record<string, string> = {};
          data.forEach((r) => {
            if (r.mentor_response) {
              initialResponses[r.id] = r.mentor_response;
            }
          });
          setResponseTexts(initialResponses);
        }
      } catch (err) {
        console.error("Failed to load mentor requests:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadMentorData();

    return () => {
      ignore = true;
    };
  }, [user]);

  // Handle Request Status Update (Accept / Completed)
  const handleUpdateStatus = async (requestId: string, newStatus: string) => {
    setProcessingId(requestId);
    try {
      const { error } = await supabase
        .from("mentorship_requests")
        .update({ status: newStatus })
        .eq("id", requestId);

      if (!error) {
        setRequests((prev) =>
          prev.map((req) => (req.id === requestId ? { ...req, status: newStatus } : req))
        );
      } else {
        alert("Failed to update status: " + error.message);
      }
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Sending Mentor Contact / Response Link
  const handleSendResponse = async (requestId: string) => {
    const messageText = responseTexts[requestId];
    if (!messageText || !messageText.trim()) {
      alert("Please enter a WhatsApp, Instagram or contact link first.");
      return;
    }

    setSendingId(requestId);
    try {
      const { error } = await supabase
        .from("mentorship_requests")
        .update({ 
          mentor_response: messageText.trim(),
          status: "accepted" 
        })
        .eq("id", requestId);

      if (!error) {
        setRequests((prev) =>
          prev.map((req) => (req.id === requestId ? { ...req, mentor_response: messageText.trim(), status: "accepted" } : req))
        );
        alert("Contact link & response shared successfully with the student!");
      } else {
        alert("Failed to share link: " + error.message);
      }
    } finally {
      setSendingId(null);
    }
  };

  // Handle Delete Request for Mentor
  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm("Kya aap is mentorship record ko permanently delete karna chahte hain?")) return;
    setDeletingId(requestId);

    try {
      const { error } = await supabase
        .from("mentorship_requests")
        .delete()
        .eq("id", requestId);

      if (!error) {
        setRequests((prev) => prev.filter((req) => req.id !== requestId));
      } else {
        alert("Failed to delete request: " + error.message);
      }
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const acceptedCount = requests.filter((r) => r.status === "accepted").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Mentor Header Banner */}
      <div className="bg-linear-to-r from-[#74B49B]/20 to-[#5C899D]/20 rounded-3xl p-6 sm:p-8 border border-[#74B49B]/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-[#427563] shadow-2xs">
            <Compass className="w-3.5 h-3.5" /> Academic Mentor Hub &amp; Advisory
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
            Welcome back, {profile?.full_name || "Mentor"}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Manage your student consultation requests, share contact links, and guide scholars 1-on-1.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="p-4 bg-white/90 backdrop-blur-xs rounded-2xl border border-slate-200 text-xs space-y-0.5 shadow-2xs min-w-32">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Pending Requests</span>
            <strong className="text-lg font-extrabold text-amber-600">{pendingCount}</strong>
          </div>
          <div className="p-4 bg-white/90 backdrop-blur-xs rounded-2xl border border-slate-200 text-xs space-y-0.5 shadow-2xs min-w-32">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Active Sessions</span>
            <strong className="text-lg font-extrabold text-emerald-600">{acceptedCount}</strong>
          </div>
        </div>
      </div>

      {/* Requests Queue Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#5C899D]" />
            <h2 className="text-base font-bold text-slate-800">Student Appointment &amp; Advisory Inquiries</h2>
          </div>
          <span className="text-xs font-semibold text-slate-500">Total Inquiries: {requests.length}</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No mentorship requests yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              When students submit consultation requests through the public Mentors directory, they will appear here instantly.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {requests.map((req) => (
              <div
                key={req.id}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4 hover:border-slate-300 transition"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          req.status === "pending"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : req.status === "accepted"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        Status: {req.status}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {req.profiles?.full_name || "Scholar"}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        ({req.profiles?.institution || "Student"} • Track: <strong className="capitalize text-slate-700">{req.profiles?.target_track || "College"}</strong>)
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-xs font-bold text-[#5C899D] uppercase tracking-wide">
                        Topic: {req.topic}
                      </h3>
                      <p className="text-xs text-slate-700 bg-white p-3.5 rounded-xl border border-slate-200/80 leading-relaxed shadow-2xs">
                        &quot;{req.message}&quot;
                      </p>
                    </div>

                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" /> Requested on {new Date(req.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Actions & Delete Button */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 self-end md:self-center">
                    {req.status === "pending" && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(req.id, "accepted")}
                        disabled={processingId === req.id}
                        className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Accept Request
                      </button>
                    )}
                    {req.status !== "completed" && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(req.id, "completed")}
                        disabled={processingId === req.id}
                        className="px-4 py-2 text-xs font-semibold bg-[#5C899D] hover:bg-[#486f80] text-white rounded-xl transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Mark Completed
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteRequest(req.id)}
                      disabled={deletingId === req.id}
                      className="inline-flex items-center gap-1 px-3 py-2 text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl transition cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {deletingId === req.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>

                {/* Mentor Contact & Social Sharing Section */}
                <div className="pt-3 border-t border-slate-200/60 space-y-2 bg-white/70 p-4 rounded-xl border">
                  <label className="block text-xs font-bold text-slate-700">
                    Share WhatsApp / Instagram / Meeting Link with Student:
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="e.g. WhatsApp: https://wa.me/91XXXXXXXXXX or Insta: @myhandle"
                      value={responseTexts[req.id] || ""}
                      onChange={(e) => setResponseTexts({ ...responseTexts, [req.id]: e.target.value })}
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#74B49B]"
                    />
                    <button
                      type="button"
                      onClick={() => handleSendResponse(req.id)}
                      disabled={sendingId === req.id}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#74B49B] hover:bg-[#5f9c85] text-white text-xs font-semibold rounded-xl transition shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {sendingId === req.id ? "Sharing..." : "Share Contact"}
                    </button>
                  </div>
                  {req.mentor_response && (
                    <p className="text-[11px] text-emerald-700 font-medium">
                      ✓ Currently shared link/message: <span className="underline">{req.mentor_response}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}