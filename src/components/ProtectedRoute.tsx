"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase, UserRole } from "@/lib/supabase";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, profile, loading, getDashboardRoute } = useAuth();
  const [currentRole, setCurrentRole] = useState<UserRole | undefined>(profile?.role);
  const [verifying, setVerifying] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let ignore = false;

    async function verifyLatestRole() {
      if (!loading && !user) {
        router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      if (user) {
        // Database se bilkul latest role fetch karein taaki promotion turant reflect ho
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (!ignore) {
          if (data?.role) {
            setCurrentRole(data.role as UserRole);
          } else if (profile?.role) {
            setCurrentRole(profile.role);
          }
          setVerifying(false);
        }
      } else if (!loading) {
        setVerifying(false);
      }
    }

    verifyLatestRole();

    return () => {
      ignore = true;
    };
  }, [user, loading, profile, router]);

  if (loading || verifying) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#A7D7C5] border-t-[#74B49B] rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-500">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Check role authorization with latest fetched role
  if (allowedRoles && currentRole && !allowedRoles.includes(currentRole)) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Access Restricted</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Your account role (<strong>{currentRole}</strong>) does not have authorization to view this section.
        </p>
        <div>
          <Link
            href={getDashboardRoute(currentRole)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#74B49B] text-white rounded-xl text-xs font-semibold shadow-xs hover:bg-[#5f9c85] transition"
          >
            <ArrowLeft className="w-4 h-4" /> Go to Your Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}