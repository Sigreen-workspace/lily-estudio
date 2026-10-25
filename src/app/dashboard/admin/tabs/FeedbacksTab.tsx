import React from "react";
import { Trash2 } from "lucide-react";
import { PlatformFeedback } from "@/lib/supabase";

interface FeedbacksTabProps {
  feedbacksList: PlatformFeedback[];
  processingId: string | null;
  onUpdateStatus: (id: string, status: "in_review" | "resolved") => void;
  onDelete: (id: string) => void;
}

export default function FeedbacksTab({ feedbacksList, processingId, onUpdateStatus, onDelete }: FeedbacksTabProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
      <div>
        <h2 className="text-base font-bold text-slate-800">User Suggestions &amp; Inquiries</h2>
        <p className="text-xs text-slate-500">Direct feedback and bug reports from users.</p>
      </div>

      {feedbacksList.length === 0 ? (
        <p className="text-xs text-slate-400 py-6 text-center">No feedback entries submitted yet.</p>
      ) : (
        <div className="space-y-4">
          {feedbacksList.map((fb) => (
            <div key={fb.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700">{fb.feedback_type}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 text-slate-700">{fb.status}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-800">{fb.subject}</h3>
                <p className="text-xs text-slate-600">{fb.message}</p>
                <p className="text-[11px] text-slate-400">Sender: {fb.user_name || "Scholar"} ({fb.user_email})</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {fb.status !== "resolved" && (
                  <button type="button" onClick={() => onUpdateStatus(fb.id, "resolved")} disabled={processingId === fb.id} className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 text-white cursor-pointer">
                    Resolve
                  </button>
                )}
                <button type="button" onClick={() => onDelete(fb.id)} disabled={processingId === fb.id} className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-50 text-rose-700 cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}