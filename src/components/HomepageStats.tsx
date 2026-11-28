"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface StatItem {
  value: string;
  label: string;
}

export const DEFAULT_SOCIAL_PROOF: StatItem[] = [
  { value: "25,000+", label: "Students Learning" },
  { value: "500+", label: "Practice Tests" },
  { value: "100+", label: "Study Resources" },
  { value: "24/7", label: "AI Mentor" },
];

export default function HomepageStats() {
  const [stats, setStats] = useState<StatItem[]>(DEFAULT_SOCIAL_PROOF);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadStats() {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "homepage_stats")
        .maybeSingle();

      if (!ignore && !error && data?.value) {
        const val = data.value as { enabled?: boolean; stats?: StatItem[] };
        if (typeof val.enabled === "boolean") {
          setEnabled(val.enabled);
        }
        if (Array.isArray(val.stats) && val.stats.length > 0) {
          setStats(val.stats.slice(0, 4));
        }
      }
    }

    void loadStats();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <section
      aria-hidden={!enabled}
      className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 ${
        enabled ? "" : "hidden"
      }`}
    >
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 min-h-30 flex items-center">
        <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-6 text-center divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          {stats.map((stat, idx) => (
            <div
              key={`${stat.label}-${idx}`}
              className={`space-y-1 min-w-0 ${idx >= 2 ? "pt-4 lg:pt-0" : ""} ${
                idx % 2 === 1 ? "border-l border-slate-100 lg:border-l-0" : ""
              }`}
            >
              <p className="text-2xl sm:text-4xl font-extrabold text-slate-800 tracking-tight tabular-nums truncate">
                {stat.value}
              </p>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 truncate">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}