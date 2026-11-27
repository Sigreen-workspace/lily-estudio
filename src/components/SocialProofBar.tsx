"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface StatItem {
  value: string;
  label: string;
}

interface HomepageStatsSettings {
  enabled: boolean;
  stats: StatItem[];
}

const DEFAULT_STATS: HomepageStatsSettings = {
  enabled: true,
  stats: [
    { value: "25,000+", label: "Students Learning" },
    { value: "500+", label: "Practice Tests" },
    { value: "100+", label: "Study Resources" },
    { value: "24/7", label: "AI Mentor" },
  ],
};

export default function SocialProofBar() {
  const [settings, setSettings] = useState<HomepageStatsSettings>(DEFAULT_STATS);

  useEffect(() => {
    let ignore = false;

    async function fetchStats() {
      const { data } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "homepage_stats")
        .maybeSingle();

      if (!ignore && data?.value) {
        setSettings((prev) => ({
          ...prev,
          ...(data.value as Partial<HomepageStatsSettings>),
        }));
      }
    }

    fetchStats();
    return () => {
      ignore = true;
    };
  }, []);

  if (!settings.enabled || !settings.stats?.length) {
    return null;
  }

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          {settings.stats.map((stat, idx) => (
            <div
              key={`${stat.label}-${idx}`}
              className={`space-y-1 ${idx >= 2 ? "pt-4 lg:pt-0" : ""} ${
                idx % 2 === 1 ? "border-l border-slate-100 lg:border-l-0" : ""
              }`}
            >
              <p className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">
                {stat.value}
              </p>
              <p className="text-xs sm:text-sm font-semibold text-slate-500">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}