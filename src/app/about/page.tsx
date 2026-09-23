"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Mail, Users, ArrowLeft, User } from "lucide-react";
import Link from "next/link";

function GithubIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

function LinkedinIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  );
}

function TwitterIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  image_url: string;
  bio: string;
  social_links?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    instagram?: string;
    email?: string;
  };
}

export default function AboutUsPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function fetchTeam() {
      try {
        const { data, error } = await supabase
          .from("team_members")
          .select("*")
          .order("display_order", { ascending: true });

        if (!ignore && !error && data) {
          setTeam(data as TeamMember[]);
        }
      } catch (err) {
        console.error("Failed to load team members:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchTeam();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Back link */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5C899D] hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-linear-to-r from-[#5C899D]/20 to-[#74B49B]/20 rounded-3xl p-8 sm:p-12 border border-[#5C899D]/30 text-center space-y-4">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-white/90 text-[#427563] shadow-2xs">
          <Users className="w-3.5 h-3.5 text-[#5C899D]" /> Meet Our Visionaries
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800">
          About Lily Estudio
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          We are dedicated to empowering students, educators, and scholars with advanced tools, structured syllabi, and transparent academic guidance.
        </p>
      </div>

      {/* Team Grid */}
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-slate-800">Founders &amp; Leadership</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            The minds driving innovation, education, and community growth.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-80 bg-slate-100 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : team.length === 0 ? (
          <div className="py-16 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
            <p className="text-xs text-slate-500">Team profiles will be updated soon by the administrator.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {team.map((member) => (
              <div
                key={member.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:border-[#74B49B] transition flex flex-col items-center text-center space-y-4"
              >
                {/* Circular Image / WhatsApp Style No-DP Fallback */}
                <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-[#74B49B]/20 shadow-sm bg-slate-100 flex items-center justify-center">
                  {member.image_url && member.image_url.trim() !== "" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={member.image_url}
                      alt={member.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to No-DP icon if external link fails
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    // WhatsApp / Instagram No-DP Default Initial Avatar
                    <div className="w-full h-full bg-linear-to-tr from-[#5C899D] to-[#74B49B] text-white flex items-center justify-center text-2xl font-extrabold uppercase">
                      {member.name ? member.name.charAt(0) : <User className="w-10 h-10 text-white/80" />}
                    </div>
                  )}
                </div>

                {/* Name & Role */}
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-800">{member.name}</h3>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {member.role}
                  </span>
                </div>

                {/* Bio */}
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {member.bio}
                </p>

                {/* Social Links */}
                <div className="flex items-center gap-3 pt-2">
                  {member.social_links?.github && (
                    <a
                      href={member.social_links.github}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-[#74B49B] hover:text-white transition"
                      title="GitHub"
                    >
                      <GithubIcon className="w-4 h-4" />
                    </a>
                  )}
                  {member.social_links?.linkedin && (
                    <a
                      href={member.social_links.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-[#5C899D] hover:text-white transition"
                      title="LinkedIn"
                    >
                      <LinkedinIcon className="w-4 h-4" />
                    </a>
                  )}
                  {member.social_links?.twitter && (
                    <a
                      href={member.social_links.twitter}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-sky-500 hover:text-white transition"
                      title="Twitter / X"
                    >
                      <TwitterIcon className="w-4 h-4" />
                    </a>
                  )}
                  {member.social_links?.instagram && (
                    <a
                      href={member.social_links.instagram}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-pink-600 hover:text-white transition"
                      title="Instagram"
                    >
                      <InstagramIcon className="w-4 h-4" />
                    </a>
                  )}
                  {member.social_links?.email && (
                    <a
                      href={`mailto:${member.social_links.email}`}
                      className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-emerald-600 hover:text-white transition"
                      title="Email"
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}