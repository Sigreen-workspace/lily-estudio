import React from "react";
import { CheckCircle2 } from "lucide-react";
import { MentorProfile } from "@/lib/supabase";

interface MentorTabProps {
  mentorsList: MentorProfile[];
  processingId: string | null;
  onVerify: (id: string, status: "approved" | "rejected" | "under_review") => void;
}

export default function MentorVerificationsTab({ mentorsList, processingId, onVerify }: MentorTabProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
      <div>
        <h2 className="text-base font-bold text-slate-800">Academic Mentor Verification Queue</h2>
        <p className="text-xs text-slate-500">Ensure students connect solely with verified mentors.</p>
      </div>

      {mentorsList.length === 0 ? (
        <p className="text-xs text-slate-400 py-6 text-center">No mentor applications registered.</p>
      ) : (
        <div className="space-y-4">
          {mentorsList.map((m) => (
            <div key={m.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1 max-w-2xl">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-sky-50 text-sky-700">{m.verification_status || "pending"}</span>
                <h3 className="text-sm font-bold text-slate-800">{m.headline || "Academic Counselor"}</h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {m.verification_status !== "approved" && (
                  <button type="button" onClick={() => onVerify(m.id, "approved")} disabled={processingId === m.id} className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 text-white cursor-pointer inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                  </button>
                )}
                <button type="button" onClick={() => onVerify(m.id, "rejected")} disabled={processingId === m.id} className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-50 text-rose-700 cursor-pointer">
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}