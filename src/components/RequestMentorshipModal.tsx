"use client";

import React, { useState } from "react";
import { UserProfile, AcademicTrack, supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { X, Send, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import Link from "next/link";

interface RequestModalProps {
  mentor: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

export default function RequestMentorshipModal({ mentor, isOpen, onClose }: RequestModalProps) {
  const { user } = useAuth();
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

    try {
      const { error: insertErr } = await supabase
        .from("mentorship_requests")
        .insert({
          student_id: user.id,
          mentor_id: mentor.id,
          topic,
          academic_track: track,
          message,
          status: "pending",
        });

      if (insertErr) throw insertErr;

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit request.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 relative space-y-5">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C899D]">
            100% Free Peer & Academic Advisory
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
                <option value="study_abroad">Study Abroad & Admissions</option>
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
                Your Questions & Current Challenges
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
              <span>Private & Safe: Your personal email and phone are never exposed to others.</span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#74B49B] hover:bg-[#5f9c85] text-white text-xs font-semibold rounded-xl transition shadow-xs disabled:opacity-50"
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