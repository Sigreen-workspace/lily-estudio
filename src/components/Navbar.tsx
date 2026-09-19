"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  Menu,
  X,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  User,
  Bell,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [appStatus, setAppStatus] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadNavbarData() {
      if (!user) {
        setUnreadCount(0);
        setAppStatus(null);
        return;
      }

      try {
        // Fetch unread notifications count
        const { count, error } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", false);

        if (!ignore && !error && count !== null) {
          setUnreadCount(count);
        }

        // Check if user has a pending mentor application
        const { data: mentorData } = await supabase
          .from("mentor_profiles")
          .select("verification_status")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!ignore) {
          if (mentorData?.verification_status) {
            setAppStatus(mentorData.verification_status);
          } else if (profile?.teacher_verification_status) {
            setAppStatus(profile.teacher_verification_status);
          }
        }
      } catch (err) {
        console.error("Failed to load navbar telemetry:", err);
      }
    }

    loadNavbarData();

    const channel = supabase
      .channel("navbar-telemetry-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: user ? `user_id=eq.${user.id}` : undefined,
        },
        () => {
          loadNavbarData();
        }
      )
      .subscribe();

    return () => {
      ignore = true;
      supabase.removeChannel(channel);
    };
  }, [user, pathname, profile]);

  const getDashboardHref = () => {
    if (!profile) return "/dashboard/student";
    switch (profile.role) {
      case "admin":
        return "/dashboard/admin";
      case "teacher":
        return "/dashboard/teacher";
      case "mentor":
        return "/dashboard/mentor";
      default:
        return "/dashboard/student";
    }
  };

  // Dynamic Navigation Links based on User Role
  const getNavLinks = () => {
    const role = profile?.role;
    if (role === "mentor") {
      return [
        { href: "/dashboard/mentor", label: "Mentor Hub" },
        { href: "/scholarships", label: "Scholarships" },
        { href: "/community", label: "Community" },
      ];
    }
    if (role === "teacher") {
      return [
        { href: "/dashboard/teacher", label: "Teacher Hub" },
        { href: "/courses", label: "Courses" },
        { href: "/community", label: "Community" },
      ];
    }
    if (role === "admin") {
      return [
        { href: "/dashboard/admin", label: "Admin Hub" },
        { href: "/scholarships", label: "Scholarships" },
        { href: "/community", label: "Community" },
      ];
    }
    return [
      { href: "/courses", label: "Courses" },
      { href: "/practice", label: "Practice" },
      { href: "/flashcards", label: "Flashcards" },
      { href: "/scholarships", label: "Scholarships" },
      { href: "/community", label: "Community" },
      { href: "/mentors", label: "Mentors" },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-linear-to-br from-[#74B49B] to-[#5C899D] flex items-center justify-center text-white shadow-2xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-slate-800 text-lg leading-tight tracking-tight">
                Lily <span className="text-[#5C899D]">Estudio</span>
              </span>
              <span className="text-[9px] uppercase tracking-widest text-[#74B49B] font-bold">
                Open Education
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? "bg-[#74B49B]/15 text-[#427563]"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right Action Items */}
          <div className="hidden md:flex items-center gap-2.5">
            {user ? (
              <>
                <Link
                  href="/notifications"
                  className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
                  title="Notifications & Reminders"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                    </span>
                  )}
                </Link>

                <Link
                  href={getDashboardHref()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#74B49B] hover:bg-[#5f9c85] text-white text-xs font-semibold rounded-xl transition shadow-2xs"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                  {appStatus === "pending" || appStatus === "under_review" ? (
                    <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold bg-amber-400 text-slate-900">
                      Pending
                    </span>
                  ) : profile?.role && profile.role !== "student" ? (
                    <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold bg-white/20 text-white">
                      {profile.role}
                    </span>
                  ) : null}
                </Link>

                <Link
                  href="/profile"
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
                  title="My Profile"
                >
                  <User className="w-4 h-4" />
                </Link>

                <button
                  type="button"
                  onClick={() => signOut()}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-1.5 bg-[#74B49B] hover:bg-[#5f9c85] text-white text-xs font-semibold rounded-xl shadow-2xs transition"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200/80 bg-white p-4 space-y-3">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-xl text-sm font-semibold ${
                    isActive ? "bg-[#74B49B]/15 text-[#427563]" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2">
            {user ? (
              <>
                <Link
                  href={getDashboardHref()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-sm font-semibold bg-[#74B49B] text-white"
                >
                  <span className="flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
                  </span>
                  {appStatus === "pending" || appStatus === "under_review" ? (
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-amber-400 text-slate-900">
                      Pending
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-white/20 text-white">
                      {profile?.role || "student"}
                    </span>
                  )}
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <User className="w-4 h-4" /> Profile Settings
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut();
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 text-xs font-semibold border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 text-xs font-semibold bg-[#74B49B] text-white rounded-xl shadow-xs"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}