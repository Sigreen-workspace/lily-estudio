"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function DashboardRedirectPage() {
  const { user, profile, loading, getDashboardRoute } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/login?redirect=/dashboard");
      } else {
        router.replace(getDashboardRoute(profile?.role));
      }
    }
  }, [user, profile, loading, router, getDashboardRoute]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-[#A7D7C5] border-t-[#74B49B] rounded-full animate-spin" />
        <p className="text-xs font-medium text-slate-500">Loading your workspace...</p>
      </div>
    </div>
  );
}