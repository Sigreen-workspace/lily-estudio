"use client";

import React from "react";
import { BarChart3, Save, Loader2, CheckCircle2, Eye, EyeOff, Plus, Trash2 } from "lucide-react";

export interface HomepageStatItem {
  value: string;
  label: string;
}

export interface HomepageStatsSettings {
  enabled: boolean;
  stats: HomepageStatItem[];
}

interface HomepageStatsTabProps {
  statsSettings: HomepageStatsSettings;
  setStatsSettings: React.Dispatch<React.SetStateAction<HomepageStatsSettings>>;
  onSave: (e: React.FormEvent) => Promise<void>;
  saving: boolean;
  savedMsg: boolean;
}

export default function HomepageStatsTab({
  statsSettings,
  setStatsSettings,
  onSave,
  saving,
  savedMsg,
}: HomepageStatsTabProps) {
  const handleItemChange = (index: number, field: keyof HomepageStatItem, val: string) => {
    setStatsSettings((prev) => ({
      ...prev,
      stats: prev.stats.map((item, idx) =>
        idx === index ? { ...item, [field]: val } : item
      ),
    }));
  };

  const handleAddStat = () => {
    setStatsSettings((prev) => ({
      ...prev,
      stats: [...prev.stats, { value: "100%", label: "Free Access" }],
    }));
  };

  const handleRemoveStat = (index: number) => {
    if (statsSettings.stats.length <= 1) return;
    setStatsSettings((prev) => ({
      ...prev,
      stats: prev.stats.filter((_, idx) => idx !== index),
    }));
  };

  return (
    <form
      onSubmit={onSave}
      className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#5C899D] flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-800">
              Homepage Social Proof Metrics
            </h2>
            <p className="text-xs text-slate-500">
              Edit numbers and labels shown on the homepage or toggle visibility.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            setStatsSettings((prev) => ({ ...prev, enabled: !prev.enabled }))
          }
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
            statsSettings.enabled
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-slate-100 text-slate-600 border-slate-200"
          }`}
        >
          {statsSettings.enabled ? (
            <>
              <Eye className="w-3.5 h-3.5" /> Visible on Homepage
            </>
          ) : (
            <>
              <EyeOff className="w-3.5 h-3.5" /> Hidden from Homepage
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsSettings.stats.map((stat, idx) => (
          <div
            key={idx}
            className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-slate-400">
                Metric #{idx + 1}
              </span>
              {statsSettings.stats.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveStat(idx)}
                  aria-label="Remove metric"
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Number / Value
              </label>
              <input
                type="text"
                required
                value={stat.value}
                onChange={(e) => handleItemChange(idx, "value", e.target.value)}
                placeholder="e.g. 25,000+"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-extrabold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Label
              </label>
              <input
                type="text"
                required
                value={stat.label}
                onChange={(e) => handleItemChange(idx, "label", e.target.value)}
                placeholder="e.g. Students Learning"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40"
              />
            </div>
          </div>
        ))}
      </div>

      {savedMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Homepage stats saved!</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={handleAddStat}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-[#5C899D]" /> Add Metric
        </button>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#74B49B] hover:bg-emerald-600 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          <span>Save Homepage Stats</span>
        </button>
      </div>
    </form>
  );
}