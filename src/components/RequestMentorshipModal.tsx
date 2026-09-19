"use client";

import React, { useState } from "react";
import { UserProfile, AcademicTrack, supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { X, Send, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import Link from "next/link";

interface RequestModalProps {
  mentor: UserProfile & { user_id?: string };
  isOpen: boolean;
  onClose: () => void;
}

export default function RequestMentorshipModal({ mentor, isOpen, onClose }: RequestModalProps) {
  const { user, profile } = useAuth();
  const [topic, setTopic] = useState(mentor.mentorship_topics?.[0] || "Academic Roadmaps & General Guidance");
  const [track, setTrack] = useState<AcademicTrack>("college");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError(null);

    // Ensure we capture the correct target mentor ID
    const targetMentorId = mentor.user_id || mentor.id;
    console.log("Submitting Request - Student ID:", user.id, "Target Mentor ID:", targetMentorId);

    try {
      // Try inserting via the secure database function (RPC) first if available, 
      // otherwise fall back to direct insert.
      const { error: rpcErr } = await supabase.rpc("submit_mentorship_request", {
        p_student_id: user.id,
        p_mentor_input: targetMentorId,
        p_subject: topic.trim(),
        p_topic: topic.trim(),
        p_message: message.trim(),
      });

      if (rpcErr) {
        console.warn("RPC insert failed or missing, falling back to direct table insert:", rpcErr.message);
        
        // Direct table insert fallback
        const { error: insertErr } = await supabase
          .from("mentorship_requests")
          .insert({
            student_id: user.id,
            mentor_id: targetMentorId,
            subject: topic.trim(),
            topic: topic.trim(),
            message: message.trim(),
            status: "pending",
          });

        if (insertErr) {
          throw new Error(insertErr.message || "Failed to save mentorship request");
        }

        // Insert notification manually if fallback used
        try {
          const studentName = profile?.full_name || "A student";
          await supabase
            .from("notifications")
            .insert({
              user_id: targetMentorId,
              notification_type: "mentorship_request",
              title: "New Mentorship Inquiry",
              message: `${studentName} has requested guidance regarding "${topic}".`,
              target_url: "/dashboard/mentor",
              is_read: false,
            });
        } catch (notifErr) {
          console.warn("Non-blocking notification error:", notifErr);
        }
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit request.";
      console.error("Submission catch block error:", err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 relative space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C899D]">
            100% Free Peer &amp; Academic Advisory
          </span>
          <h2 className="text-xl font-bold text-slate-800">
            Request Guidance from {mentor.full_name}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Mentors provide free direction on exam pacing, university admissions, and subject study strategies.
          </p>
        </div>

        {!user ? (
          <div className="p-6 bg-slate-50 rounded-2xl text-center space-y-3">
            <p className="text-xs text-slate-600">You must be logged in to send a mentorship request.</p>
            <Link
              href="/auth/login"
              className="inline-block px-4 py-2 bg-[#74B49B] text-white rounded-xl text-xs font-semibold"
            >
              Sign In to Continue
            </Link>
          </div>
        ) : success ? (
          <div className="p-6 bg-emerald-50 rounded-2xl text-center space-y-2 border border-emerald-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-emerald-800">Guidance Request Sent!</h3>
            <p className="text-xs text-emerald-700">
              The mentor has received your request and will respond directly to your student dashboard.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Track</label>
              <select
                value={track}
                onChange={(e) => setTrack(e.target.value as AcademicTrack)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#74B49B]"
              >
                <option value="school">School (Class 1–12)</option>
                <option value="college">College / University</option>
                <option value="competitive_exam">Competitive Exam Prep</option>
                <option value="study_abroad">Study Abroad &amp; Admissions</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Topic of Consultation</label>
              <input
                type="text"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. GRE Quantitative Strategy or SOP Feedback"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#74B49B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Your Questions &amp; Current Challenges
              </label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your current semester/class, target goals, and specific questions you need advice on..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#74B49B]"
              />
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Private &amp; Safe: Your personal email and phone are never exposed to others.</span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#74B49B] hover:bg-[#5f9c85] text-white text-xs font-semibold rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                {loading ? "Sending..." : "Submit Request"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}