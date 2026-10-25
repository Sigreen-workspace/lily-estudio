import React from "react";
import { Trash2 } from "lucide-react";
import { ForumReport } from "@/lib/supabase";

interface ReportsTabProps {
  reportsList: ForumReport[];
  processingId: string | null;
  onResolve: (id: string, resolution: "resolved" | "dismissed") => void;
  onDelete: (id: string) => void;
}

export default function ReportsTab({ reportsList, processingId, onResolve, onDelete }: ReportsTabProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
      <div>
        <h2 className="text-base font-bold text-slate-800">Community Safety &amp; Content Reports</h2>
        <p className="text-xs text-slate-500">User-submitted flags regarding spam or violations.</p>
      </div>

      {reportsList.length === 0 ? (
        <p className="text-xs text-slate-400 py-6 text-center">No community reports logged.</p>
      ) : (
        <div className="space-y-4">
          {reportsList.map((r) => (
            <div key={r.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1 max-w-2xl">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 text-amber-700">{r.status}</span>
                <h3 className="text-sm font-bold text-rose-700">{r.reason}</h3>
                {r.details && <p className="text-xs text-slate-600">{r.details}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {r.status === "pending" && (
                  <button type="button" onClick={() => onResolve(r.id, "resolved")} disabled={processingId === r.id} className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 text-white cursor-pointer">
                    Resolve
                  </button>
                )}
                <button type="button" onClick={() => onDelete(r.id)} disabled={processingId === r.id} className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-50 text-rose-700 cursor-pointer">
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