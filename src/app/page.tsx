import Link from "next/link";
import { GraduationCap, Award, BookCheck, Layers, Globe, Users, ArrowRight } from "lucide-react";

export default function HomePage() {
  const modules = [
    {
      title: "Course Library",
      desc: "Structured, open learning paths curated for core subjects and competitive exams.",
      icon: GraduationCap,
      href: "/courses",
      color: "bg-emerald-50 text-emerald-700 border-emerald-100",
    },
    {
      title: "Practice Tests",
      desc: "Exam-simulated mock tests with real-time feedback and diagnostic breakdowns.",
      icon: BookCheck,
      href: "/practice",
      color: "bg-teal-50 text-teal-700 border-teal-100",
    },
    {
      title: "Flashcards",
      desc: "Smart active recall cards to retain high-yield facts, vocabulary, and formulas.",
      icon: Layers,
      href: "/flashcards",
      color: "bg-sky-50 text-sky-700 border-sky-100",
    },
    {
      title: "Scholarship Tracker",
      desc: "Verified deadlines and requirements for global study-abroad opportunities.",
      icon: Globe,
      href: "/scholarships",
      color: "bg-cyan-50 text-cyan-700 border-cyan-100",
    },
    {
      title: "Community Forum",
      desc: "Connect with study partners, share resources, and resolve academic doubts.",
      icon: Users,
      href: "/community",
      color: "bg-slate-50 text-slate-700 border-slate-100",
    },
    {
      title: "Personal Dashboard",
      desc: "Track daily study hours, streaks, mastery milestones, and earned badges.",
      icon: Award,
      href: "/dashboard",
      color: "bg-amber-50 text-amber-700 border-amber-100",
    },
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-linear-to-b from-[#A7D7C5]/20 via-[#A2C4C9]/10 to-transparent pt-16 pb-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#74B49B]/15 text-[#4a806c] border border-[#74B49B]/30">
            <span>✨ 100% Free Open Education</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-800 tracking-tight leading-tight">
            Learn. Practice. <span className="text-[#5C899D]">Grow.</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Lily Estudio provides school-college learners and test takers aspirants with a focused ecosystem to organize and elevate their daily study routines.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-white bg-[#74B49B] hover:bg-[#5f9c85] rounded-xl shadow-sm transition"
            >
              Start Studying
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/courses"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition"
            >
              Browse Library
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Modules Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
            Everything you need in one calm space
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mt-2">
            No paywalls, subscriptions, or intrusive ads. Built purely for focused learning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.title}
                className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:border-[#74B49B]/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border mb-4 ${mod.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">
                    {mod.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-6">
                    {mod.desc}
                  </p>
                </div>
                <Link
                  href={mod.href}
                  className="text-xs font-semibold text-[#5C899D] hover:text-[#41687a] inline-flex items-center gap-1 transition"
                >
                  Explore module <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}