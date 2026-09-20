"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, SocialContactsSettings } from "@/lib/supabase";
import {
  BookOpen,
  Heart,
  MessageSquareHeart,
  Send,
  MessageCircle,
} from "lucide-react";

function YoutubeIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
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

export default function Footer() {
  const [socials, setSocials] = useState<SocialContactsSettings | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadSocialLinks() {
      try {
        const { data, error } = await supabase
          .from("platform_settings")
          .select("value")
          .eq("key", "social_contacts")
          .maybeSingle();

        if (!ignore && !error && data?.value) {
          setSocials(data.value as SocialContactsSettings);
        }
      } catch (err) {
        console.error("Failed to load footer social links:", err);
      }
    }

    loadSocialLinks();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <footer className="mt-auto bg-white border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Mission */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#74B49B] flex items-center justify-center text-white">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-slate-800">
                Lily <span className="text-[#5C899D]">Estudio</span>
              </span>
            </div>
            <p className="text-sm text-slate-600 max-w-sm leading-relaxed">
              Empowering school-college learners and test takers aspirants with a focused, community-driven study environment.
            </p>

            {/* Dynamic Social Icons */}
            <div className="flex items-center gap-2.5 pt-1 text-slate-400">
              {socials?.youtube && (
                <a
                  href={socials.youtube}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                  title="YouTube"
                  aria-label="YouTube Channel"
                >
                  <YoutubeIcon className="w-4 h-4" />
                </a>
              )}
              {socials?.instagram && (
                <a
                  href={socials.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 hover:text-pink-600 hover:bg-slate-100 rounded-lg transition"
                  title="Instagram"
                  aria-label="Instagram Profile"
                >
                  <InstagramIcon className="w-4 h-4" />
                </a>
              )}
              {socials?.linkedin && (
                <a
                  href={socials.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition"
                  title="LinkedIn"
                  aria-label="LinkedIn Profile"
                >
                  <LinkedinIcon className="w-4 h-4" />
                </a>
              )}
              {socials?.github && (
                <a
                  href={socials.github}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                  title="GitHub"
                  aria-label="GitHub Repository"
                >
                  <GithubIcon className="w-4 h-4" />
                </a>
              )}
              {socials?.twitter && (
                <a
                  href={socials.twitter}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 hover:text-sky-500 hover:bg-slate-100 rounded-lg transition"
                  title="Twitter (X)"
                  aria-label="Twitter Profile"
                >
                  <TwitterIcon className="w-4 h-4" />
                </a>
              )}
              {socials?.telegram && (
                <a
                  href={socials.telegram}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 hover:text-sky-500 hover:bg-slate-100 rounded-lg transition"
                  title="Telegram"
                  aria-label="Telegram Channel"
                >
                  <Send className="w-4 h-4" />
                </a>
              )}
              {socials?.whatsapp && (
                <a
                  href={socials.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition"
                  title="WhatsApp"
                  aria-label="WhatsApp Community"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Study Modules */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">
              Study Modules
            </h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link href="/courses" className="hover:text-[#74B49B] transition">Course Library</Link></li>
              <li><Link href="/practice" className="hover:text-[#74B49B] transition">Practice Tests</Link></li>
              <li><Link href="/flashcards" className="hover:text-[#74B49B] transition">Flashcards</Link></li>
              <li><Link href="/scholarships" className="hover:text-[#74B49B] transition">Scholarships</Link></li>
            </ul>
          </div>

          {/* Ecosystem & Support */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">
              Ecosystem &amp; Support
            </h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link href="/community" className="hover:text-[#74B49B] transition">Community</Link></li>
              <li><Link href="/mentors" className="hover:text-[#74B49B] transition">Find a Mentor</Link></li>
              <li>
                <Link
                  href="/support"
                  className="text-[#5C899D] font-medium hover:text-[#74B49B] transition inline-flex items-center gap-1.5"
                >
                  <MessageSquareHeart className="w-3.5 h-3.5 text-[#74B49B]" /> Help &amp; Suggestions
                </Link>
              </li>
              <li><span className="text-slate-400 text-xs">100% Free &amp; Open Access</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Attribution */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Lily Estudio. Free education platform.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-[#74B49B] fill-[#74B49B]" /> for ambitious learners
          </p>
        </div>
      </div>
    </footer>
  );
}