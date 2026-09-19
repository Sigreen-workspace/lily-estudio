"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Sparkles, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [educationLevel, setEducationLevel] = useState("Undergraduate");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    try {
      // Role is NEVER passed from the client for security.
      // The Supabase handle_new_user trigger strictly defaults all new users to 'student'.
      const { data, error: signupErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            education_level: educationLevel,
          },
        },
      });

      if (signupErr) throw signupErr;

      if (data.session) {
        // Direct session established (email confirmation disabled)
        router.push("/dashboard/student");
      } else {
        // Email confirmation enabled
        setSuccess(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create account.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Account Created!</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          A confirmation link was sent to <strong>{email}</strong>. Please check your inbox to confirm your email and access your student dashboard.
        </p>
        <Link
          href="/auth/login"
          className="inline-block mt-4 px-6 py-2.5 bg-[#74B49B] text-white rounded-xl text-xs font-semibold shadow-xs hover:bg-[#5f9c85] transition"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-12 px-4 sm:px-6">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="text-center space-y-1">
          <div className="w-10 h-10 bg-[#74B49B]/15 text-[#5C899D] rounded-xl flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Create Free Scholar Account</h1>
          <p className="text-xs text-slate-500">Join Lily Estudio</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40 focus:border-[#74B49B]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40 focus:border-[#74B49B]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40 focus:border-[#74B49B]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Current Education Level</label>
            <select
              value={educationLevel}
              onChange={(e) => setEducationLevel(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40"
            >
              <option value="School (Class 1-10)">School (Class 1–10)</option>
              <option value="High School (11th-12th)">High School (11th–12th)</option>
              <option value="Undergraduate">Undergraduate (College)</option>
              <option value="Graduate / Masters">Graduate / Masters</option>
              <option value="Competitive Exam Aspirant">Competitive Exam Aspirant</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-[11px] text-slate-500 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-[#74B49B] shrink-0 mt-0.5" />
            <span>
              All new accounts begin with scholar privileges. Educators and mentors can submit institutional credentials for review inside their dashboard after signing up.
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-[#74B49B] hover:bg-[#5f9c85] text-white font-semibold text-sm transition shadow-xs disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Create Free Account"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-[#5C899D] font-semibold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}