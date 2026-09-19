"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { X, AlertTriangle, CheckCircle2 } from "lucide-react";

interface ReportModalProps {
  targetUserId: string;
  targetUserName: string;
  requestId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReportModal({
  targetUserId,
  targetUserName,
  requestId,
  isOpen,
  onClose,
}: ReportModalProps) {
  const { user } = useAuth();
  const [reason, setReason] = useState("Inappropriate or abusive language");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      await supabase.from("moderation_reports").insert({
        reporter_id: user.id,
        target_user_id: targetUserId,
        request_id: requestId || null,
        reason,
        details,
        status: "under_review",
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch {
      alert("Failed to record report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-xl border border-slate-200 relative space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Report Member</h3>
            <p className="text-[11px] text-slate-500">Target: {targetUserName}</p>
          </div>
        </div>

        {success ? (
          <div className="p-4 bg-emerald-50 rounded-xl text-center space-y-1">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
            <p className="text-xs font-semibold text-emerald-800">Report Submitted to Moderators</p>
          </div>
        ) : (
          <form onSubmit={handleSubmitReport} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reason</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white"
              >
                <option value="Inappropriate or abusive language">Inappropriate or abusive language</option>
                <option value="Commercial solicitation / charging fees">Commercial solicitation / asking for payment</option>
                <option value="Spam or misleading information">Spam or misleading advice</option>
                <option value="Uncomfortable personal inquiry">Uncomfortable personal questions</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Additional Context</label>
              <textarea
                rows={3}
                required
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Explain what happened..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition"
              >
                {loading ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}