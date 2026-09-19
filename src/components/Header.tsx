"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BookOpen, Sparkles, Menu, X, User as UserIcon, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile, signOut, getDashboardRoute } = useAuth();

  const navLinks = [
    { label: "Courses", href: "/courses" },
    { label: "Practice", href: "/practice" },
    { label: "Mentors", href: "/mentors" },
    { label: "Flashcards", href: "/flashcards" },
    { label: "Scholarships", href: "/scholarships" },
  ];

  const dashboardPath = user ? getDashboardRoute() : "/auth/login";

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#A7D7C5]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-[#74B49B] to-[#A2C4C9] flex items-center justify-center text-white shadow-xs transition group-hover:scale-105">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-slate-800">
                Lily <span className="text-[#5C899D]">Estudio</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase -mt-1">
                Learn • Practice • Grow
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-[#5C899D] hover:bg-[#A7D7C5]/15 rounded-lg transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Right CTA / User Status */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href={dashboardPath}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-[#5C899D]" />
                  <span>Dashboard</span>
                  {profile?.role && (
                    <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-[#74B49B]/15 text-[#427563]">
                      {profile.role}
                    </span>
                  )}
                </Link>
                <Link
                  href="/profile"
                  className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
                  title="Edit Profile"
                >
                  <UserIcon className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => signOut()}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-[#5C899D] transition"
                >
                  Log in
                </Link>
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#74B49B] hover:bg-[#5f9c85] rounded-xl shadow-xs transition"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Sign Up Free</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#A7D7C5]/30 bg-white px-4 pt-2 pb-6 space-y-2 shadow-lg">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-[#A7D7C5]/15 hover:text-[#5C899D] transition"
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            {user ? (
              <>
                <Link
                  href={dashboardPath}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-slate-700 bg-slate-50 rounded-xl"
                >
                  <span className="flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4 text-[#5C899D]" />
                    Dashboard
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-[#74B49B]/15 text-[#427563]">
                    {profile?.role || "Student"}
                  </span>
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl"
                >
                  <UserIcon className="w-4 h-4 text-slate-500" />
                  My Profile
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut();
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-xl"
                >
                  Log In
                </Link>
                <Link
                  href="/auth/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-[#74B49B] rounded-xl shadow-xs"
                >
                  <Sparkles className="w-4 h-4" />
                  Sign Up Free
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}