"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase, SocialContactsSettings } from "@/lib/supabase";
import {
  Mail,
  Send,
  CheckCircle2,
  Sparkles,
  MessageCircle,
  Globe,
} from "lucide-react";

// Zero-dependency Brand SVGs
function YoutubeIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
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

function LinkedinIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
    </svg>
  );
}

function GithubIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
    </svg>
  );
}

function TwitterIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

export default function SupportAndContactPage() {
  const { user, profile } = useAuth();
  const [feedbackType, setFeedbackType] = useState<"suggestion" | "bug_report" | "support" | "general">("suggestion");
  const [email, setEmail] = useState(user?.email || "");
  const [name, setName] = useState(profile?.full_name || "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Dynamic Contact & Social Links
  const [socials, setSocials] = useState<SocialContactsSettings>({
    email: "supportestudio@gmail.com",
    lead_email: "gaindlalkosma23@gmail.com",
    youtube: "",
    linkedin: "",
    github: "",
    twitter: "",
    instagram: "",
    telegram: "",
    whatsapp: "",
  });

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
        console.error("Failed to load support settings:", err);
      }
    }

    loadSocialLinks();

    return () => {
      ignore = true;
    };
  }, []);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !subject.trim() || !message.trim()) {
      alert("Please fill in email, subject, and message.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("platform_feedbacks").insert({
        user_id: user?.id || null,
        user_email: email.trim(),
        user_name: name.trim() || null,
        feedback_type: feedbackType,
        subject: subject.trim(),
        message: message.trim(),
      });

      if (!error) {
        setSubmitted(true);
        setSubject("");
        setMessage("");
      } else {
        alert("Submission failed: " + error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Hero Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#74B49B]/15 text-[#427563]">
          Connect &amp; Collaborate
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">
          Help, Suggestions &amp; Community Support
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Lily Estudio is community-first. Have an idea for a new feature, syllabus request, or encountered a problem? We read and review every single submission.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Contact & Social Handles Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-5">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#74B49B]" /> Official Contacts
            </h2>
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">Email Support</span>
                <a href={`mailto:${socials.email}`} className="font-bold text-slate-700 hover:text-[#5C899D]">
                  {socials.email}
                </a>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">Project Lead &amp; Creator</span>
                <span className="font-bold text-slate-700 block">Gaindlal Kosma</span>
                <span className="text-slate-500">{socials.lead_email}</span>
              </div>
            </div>
          </div>

          {/* Social Media Channels */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#5C899D]" /> Community Channels
            </h2>
            <p className="text-xs text-slate-500">Follow our open-education tracks and announcements:</p>
            <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs font-semibold">
              {socials.youtube && (
                <a
                  href={socials.youtube}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 p-3 rounded-2xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50/50 text-slate-700 transition"
                >
                  <YoutubeIcon className="w-4 h-4 text-rose-600" /> YouTube
                </a>
              )}
              {socials.instagram && (
                <a
                  href={socials.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 p-3 rounded-2xl border border-slate-200 hover:border-pink-300 hover:bg-pink-50/50 text-slate-700 transition"
                >
                  <InstagramIcon className="w-4 h-4 text-pink-600" /> Instagram
                </a>
              )}
              {socials.linkedin && (
                <a
                  href={socials.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 p-3 rounded-2xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 text-slate-700 transition"
                >
                  <LinkedinIcon className="w-4 h-4 text-sky-600" /> LinkedIn
                </a>
              )}
              {socials.github && (
                <a
                  href={socials.github}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 p-3 rounded-2xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-slate-700 transition"
                >
                  <GithubIcon className="w-4 h-4 text-slate-800" /> GitHub
                </a>
              )}
              {socials.twitter && (
                <a
                  href={socials.twitter}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 p-3 rounded-2xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 text-slate-700 transition"
                >
                  <TwitterIcon className="w-4 h-4 text-sky-500" /> Twitter (X)
                </a>
              )}
              {socials.telegram && (
                <a
                  href={socials.telegram}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 p-3 rounded-2xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 text-slate-700 transition"
                >
                  <Send className="w-4 h-4 text-sky-500" /> Telegram
                </a>
              )}
              {socials.whatsapp && (
                <a
                  href={socials.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 p-3 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-slate-700 transition"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" /> WhatsApp
                </a>
              )}
              {!socials.youtube && !socials.instagram && !socials.linkedin && !socials.github && !socials.twitter && !socials.telegram && !socials.whatsapp && (
                <div className="col-span-2 p-3 rounded-xl bg-slate-50 text-slate-400 text-center flex items-center justify-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" /> Social channels will appear once configured by admins.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Feedback & Suggestion Submission Form */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
              Direct Feedback Pipeline
            </span>
            <h2 className="text-xl font-bold text-slate-800 mt-2">Send a Suggestion or Request Help</h2>
            <p className="text-xs text-slate-500">
              Submitted messages arrive immediately in the platform governance review dashboard.
            </p>
          </div>

          {submitted ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="text-base font-bold text-emerald-900">Thank you! Message Dispatched.</h3>
              <p className="text-xs text-emerald-700 max-w-md mx-auto">
                Your feedback has been logged directly into our administration dashboard for quality review.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs"
              >
                Send Another Response
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitFeedback} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Submission Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "suggestion", label: "Idea / Suggestion" },
                    { id: "support", label: "Help & Support" },
                    { id: "bug_report", label: "Report Bug" },
                    { id: "general", label: "General Inquiry" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFeedbackType(cat.id as typeof feedbackType)}
                      className={`py-2 px-3 rounded-xl border font-semibold text-center transition ${
                        feedbackType === cat.id
                          ? "bg-[#74B49B] text-white border-[#74B49B] shadow-2xs"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    placeholder="Enter your full name (optional)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Your Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Topic / Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter a brief subject or topic for your message"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Detailed Message *</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Share your thoughts, suggestions, or describe the issue you are facing..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-white leading-relaxed"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#74B49B] hover:bg-[#5f9c85] text-white font-semibold rounded-xl shadow-xs transition"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? "Sending..." : "Submit to Admins"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}