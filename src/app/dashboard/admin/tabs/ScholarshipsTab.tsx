import React from "react";
import { Plus, ExternalLink, Trash2 } from "lucide-react";
import { Scholarship } from "@/lib/supabase";

interface ScholarshipsTabProps {
  scholarshipsList: Scholarship[];
  showAddScholarship: boolean;
  setShowAddScholarship: (v: boolean) => void;
  scTitle: string;
  setScTitle: (v: string) => void;
  scProvider: string;
  setScProvider: (v: string) => void;
  scCountry: string;
  setScCountry: (v: string) => void;
  scLevel: string;
  setScLevel: (v: string) => void;
  scAmount: string;
  setScAmount: (v: string) => void;
  scDeadline: string;
  setScDeadline: (v: string) => void;
  scOfficialUrl: string;
  setScOfficialUrl: (v: string) => void;
  scCriteria: string;
  setScCriteria: (v: string) => void;
  scDescription: string;
  setScDescription: (v: string) => void;
  isSubmittingSc: boolean;
  onCreate: (e: React.FormEvent) => void;
  onDelete: (id: string) => void;
}

export default function ScholarshipsTab({
  scholarshipsList,
  showAddScholarship,
  setShowAddScholarship,
  scTitle,
  setScTitle,
  scProvider,
  setScProvider,
  scCountry,
  setScCountry,
  scLevel,
  setScLevel,
  scAmount,
  setScAmount,
  scDeadline,
  setScDeadline,
  scOfficialUrl,
  setScOfficialUrl,
  scCriteria,
  setScCriteria,
  scDescription,
  setScDescription,
  isSubmittingSc,
  onCreate,
  onDelete,
}: ScholarshipsTabProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-800">Scholarship Directory Management</h2>
          <p className="text-xs text-slate-500">Add verified scholarships or remove outdated entries.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddScholarship(!showAddScholarship)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#74B49B] hover:bg-[#5f9c85] text-white text-xs font-semibold rounded-xl transition cursor-pointer"
        >
          <Plus className="w-4 h-4" /> {showAddScholarship ? "Close Form" : "Add Scholarship"}
        </button>
      </div>

      {showAddScholarship && (
        <form onSubmit={onCreate} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 text-xs">
          <h3 className="font-bold text-slate-800 text-sm">Add New Scholarship Opportunity</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Scholarship Title *</label>
              <input type="text" required value={scTitle} onChange={(e) => setScTitle(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 bg-white" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Provider *</label>
              <input type="text" required value={scProvider} onChange={(e) => setScProvider(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 bg-white" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Country</label>
              <input type="text" value={scCountry} onChange={(e) => setScCountry(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 bg-white" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Study Level</label>
              <input type="text" value={scLevel} onChange={(e) => setScLevel(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 bg-white" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Amount Benefit</label>
              <input type="text" value={scAmount} onChange={(e) => setScAmount(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 bg-white" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Deadline</label>
              <input type="date" value={scDeadline} onChange={(e) => setScDeadline(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 bg-white" />
            </div>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Official Portal Link *</label>
            <input type="url" required value={scOfficialUrl} onChange={(e) => setScOfficialUrl(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 bg-white" />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Eligibility Criteria</label>
            <textarea rows={2} value={scCriteria} onChange={(e) => setScCriteria(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 bg-white" />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Description</label>
            <textarea rows={3} value={scDescription} onChange={(e) => setScDescription(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 bg-white" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="submit" disabled={isSubmittingSc} className="px-5 py-2 bg-[#74B49B] text-white font-semibold rounded-xl cursor-pointer">
              {isSubmittingSc ? "Publishing..." : "Publish"}
            </button>
          </div>
        </form>
      )}

      {scholarshipsList.length === 0 ? (
        <p className="text-xs text-slate-400 py-6 text-center">No scholarships registered yet.</p>
      ) : (
        <div className="space-y-3">
          {scholarshipsList.map((s) => (
            <div key={s.id} className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">{s.country}</span>
                  <span className="text-[11px] text-slate-500">Provider: {s.provider}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-800">{s.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-1">{s.description || s.amount_benefit}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a href={s.official_url} target="_blank" rel="noreferrer" className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 inline-flex items-center gap-1">
                  Visit <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
                <button type="button" onClick={() => onDelete(s.id)} className="p-2 text-slate-400 hover:text-rose-600 cursor-pointer" title="Remove Scholarship">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}