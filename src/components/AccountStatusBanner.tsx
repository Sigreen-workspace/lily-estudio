"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { AlertTriangle, ShieldAlert, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AccountStatusBanner() {
  const { profile } = useAuth();

  if (!profile) return null;

  const isSuspended =
    profile.account_status === "suspended" &&
    Boolean(profile.suspended_until) &&
    new Date(profile.suspended_until as string) > new Date();

  const isWarned =
    profile.account_status === "warned" && Boolean(profile.warning_message);

  if (!isSuspended && !isWarned) return null;

  if (isSuspended) {
    const formattedDate = profile.suspended_until
      ? new Date(profile.suspended_until).toLocaleString()
      : "further notice";

    return (
      <div className="bg-rose-600 text-white px-4 py-3 text-center text-xs font-semibold flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md">
        <ShieldAlert className="w-4 h-4 shrink-0" />
        <span>
          Account Temporarily Suspended until <strong>{formattedDate}</strong> due to policy violation. Platform actions are currently locked.
        </span>
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="ml-3 underline font-bold inline-flex items-center gap-1 hover:text-rose-100"
        >
          <LogOut className="w-3 h-3" /> Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="bg-amber-500 text-slate-900 px-4 py-2.5 text-center text-xs font-semibold flex items-center justify-center gap-2 sticky top-0 z-50 shadow-xs">
      <AlertTriangle className="w-4 h-4 text-slate-900 shrink-0" />
      <span>
        <strong>Official Administrative Warning:</strong> {profile.warning_message}
      </span>
    </div>
  );
}