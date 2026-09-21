"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import {
  supabase,
  UserCourseProgress,
  TestAttempt,
  FlashcardReview,
  SavedResource,
  UserBadge,
  UserActivityLog,
} from "@/lib/supabase";
import { AVAILABLE_BADGES, checkAndUnlockBadge } from "@/lib/progress";
import {
  BookOpen,
  BookCheck,
  Compass,
  ArrowRight,
  Layers,
  Award,
  Bookmark,
  Calendar,
  Clock,
  ExternalLink,
  Target,
  CheckCircle2,
  Lock,
  GraduationCap,
  Sparkles,
  X,
  Send,
  ShieldCheck,
} from "lucide-react";

export default function StudentDashboardPage() {
  return (
    // Allow teachers and mentors to view the student syllabus workspace as well
    <ProtectedRoute allowedRoles={["student", "teacher", "mentor", "admin"]}>
      <StudentDashboardContent />
    </ProtectedRoute>
  );
}

function StudentDashboardContent() {
  const { user, profile, refreshProfile } = useAuth();

  const [courseProgress, setCourseProgress] = useState<UserCourseProgress[]>([]);
  const [testAttempts, setTestAttempts] = useState<TestAttempt[]>([]);
  const [flashcardReviews, setFlashcardReviews] = useState<FlashcardReview[]>([]);
  const [savedResources, setSavedResources] = useState<SavedResource[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [activities, setActivities] = useState<UserActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Application Modal States
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyRole, setApplyRole] = useState<"teacher" | "mentor">("teacher");
  const [institution, setInstitution] = useState(profile?.institution || "");
  const [qualifications, setQualifications] = useState(profile?.qualifications || "");
  const [proofUrl, setProofUrl] = useState("");
  const [teachingSubjects, setTeachingSubjects] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState(profile?.bio || "");
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);
  const [appSuccessMsg, setAppSuccessMsg] = useState(false);

  // Live application status tracker for the button
  const [mentorAppStatus, setMentorAppStatus] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadDashboardData() {
      if (!user) return;
      setLoading(true);

      try {
        const [progRes, testRes, fcRes, savedRes, badgeRes, actRes, mentorRes] = await Promise.all([
          supabase
            .from("user_course_progress")
            .select("*, courses(*)")
            .eq("user_id", user.id)
            .order("last_accessed_at", { ascending: false }),
          supabase
            .from("test_attempts")
            .select("*, tests(*)")
            .order("completed_at", { ascending: false })
            .limit(5),
          supabase
            .from("flashcard_reviews")
            .select("*")
            .eq("user_id", user.id),
          supabase
            .from("saved_resources")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("user_badges")
            .select("*")
            .eq("user_id", user.id),
          supabase
            .from("user_activity_log")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(6),
          supabase
            .from("mentor_profiles")
            .select("verification_status")
            .eq("user_id", user.id)
            .maybeSingle(),
        ]);

        if (!ignore) {
          setCourseProgress((progRes.data as UserCourseProgress[]) || []);
          setTestAttempts((testRes.data as TestAttempt[]) || []);
          setFlashcardReviews((fcRes.data as FlashcardReview[]) || []);
          setSavedResources((savedRes.data as SavedResource[]) || []);
          setUserBadges((badgeRes.data as UserBadge[]) || []);
          setActivities((actRes.data as UserActivityLog[]) || []);

          if (mentorRes.data?.verification_status) {
            setMentorAppStatus(mentorRes.data.verification_status);
          }

          // Verify milestones based on true activity
          if (testRes.data && testRes.data.length > 0) {
            checkAndUnlockBadge(user.id, "first_test");
            const totalQuestionsAnswered = testRes.data.reduce(
              (acc: number, cur: TestAttempt) => acc + (cur.total_questions || 0),
              0
            );
            if (totalQuestionsAnswered >= 10) {
              checkAndUnlockBadge(user.id, "ten_questions");
            }
          }
          if (fcRes.data && fcRes.data.length > 0) {
            checkAndUnlockBadge(user.id, "first_deck");
          }
          if (progRes.data && progRes.data.length > 0) {
            checkAndUnlockBadge(user.id, "first_course");
          }
        }
      } catch (err) {
        console.error("Failed to load student dashboard:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadDashboardData();

    return () => {
      ignore = true;
    };
  }, [user]);

  // Handle Application Submission
  const handleApplyForRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmittingApp(true);
    try {
      if (applyRole === "teacher") {
        const subjectsArray = teachingSubjects
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        const { error: rpcErr } = await supabase.rpc("apply_for_teacher_review", {
          target_institution: institution.trim(),
          target_qualifications: qualifications.trim(),
          target_subjects: subjectsArray,
          target_proof_url: proofUrl.trim() || null,
        });

        if (rpcErr) throw new Error(rpcErr.message || "Failed to submit teacher application");
      } else {
        const nowIso = new Date().toISOString();

        const { error: profileErr } = await supabase
          .from("profiles")
          .update({
            institution: institution.trim(),
            qualifications: qualifications.trim(),
            bio: bio.trim(),
            updated_at: nowIso,
          })
          .eq("id", user.id);

        if (profileErr) throw new Error(profileErr.message || "Failed to update profile details");

        const { error: mentorErr } = await supabase
          .from("mentor_profiles")
          .upsert(
            {
              user_id: user.id,
              headline: headline.trim() || "Academic Counselor & Guide",
              bio: bio.trim(),
              institution: institution.trim(),
              expertise: [profile?.target_track || "college"],
              verification_status: "pending",
              is_verified: false,
              updated_at: nowIso,
            },
            { onConflict: "user_id" }
          );

        if (mentorErr) throw new Error(mentorErr.message || "Failed to submit mentor application");
        setMentorAppStatus("pending");
      }

      await refreshProfile();
      setAppSuccessMsg(true);
      setTimeout(() => {
        setAppSuccessMsg(false);
        setShowApplyModal(false);
      }, 2500);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Unexpected submission error";
      console.error("Application error:", errorMsg);
      alert("Application submission failed: " + errorMsg);
    } finally {
      setIsSubmittingApp(false);
    }
  };

  // Authentic distinct learning days calculation
  const distinctActiveDays = Array.from(
    new Set(activities.map((a) => a.activity_date))
  ).length;

  const totalCardsReviewed = flashcardReviews.reduce(
    (acc, cur) => acc + (cur.total_reviews || 0),
    0
  );
  const masteredCards = flashcardReviews.filter((f) => f.box_level >= 4).length;
  const unlockedKeys = new Set(userBadges.map((b) => b.badge_key));

  // Strict Role Checking: Only true if role is explicitly 'teacher' AND verification status is approved
  const isTeacherApproved = Boolean(
    profile?.role === "teacher" &&
    (profile?.is_teacher_verified === true || profile?.teacher_verification_status === "approved")
  );

  const isMentorApproved = Boolean(
    profile?.role === "mentor" && mentorAppStatus === "approved"
  );

  const isPendingReview = Boolean(
    !isTeacherApproved &&
    !isMentorApproved &&
    (profile?.teacher_verification_status === "pending" ||
     profile?.teacher_verification_status === "under_review" ||
     mentorAppStatus === "pending" ||
     mentorAppStatus === "under_review")
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Profile Banner */}
      <div className="bg-linear-to-r from-[#A7D7C5]/30 to-[#A2C4C9]/30 rounded-3xl p-6 sm:p-8 border border-[#74B49B]/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-[#427563] shadow-2xs">
            Student Academic Workspace
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
            Welcome back, {profile?.full_name || "Scholar"}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            {profile?.institution ? `${profile.institution} • ` : ""}
            Track: <strong className="capitalize text-slate-700">{profile?.target_track || "College"}</strong> • Learning Preference: {profile?.learning_preference || "Visual"}
          </p>
        </div>

        {/* Verification & Milestone Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <div className="p-4 bg-white/90 backdrop-blur-xs rounded-2xl border border-slate-200/80 text-xs text-slate-700 space-y-1 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Authentic Effort Log
            </span>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#74B49B]" />
              <strong className="text-sm font-bold text-slate-800">
                {distinctActiveDays} Active Study {distinctActiveDays === 1 ? "Day" : "Days"}
              </strong>
            </div>
            <p className="text-[11px] text-slate-500">
              Milestone days through honest study.
            </p>
          </div>

          {/* Apply as Educator / Mentor Action */}
          <div className="p-4 bg-white/90 backdrop-blur-xs rounded-2xl border border-slate-200/80 text-xs flex flex-col justify-between gap-2 shadow-2xs min-w-44">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Educator Portal
              </span>
              <strong className="text-xs font-bold text-slate-800">
                {isTeacherApproved
                  ? "Verified Educator"
                  : isMentorApproved
                  ? "Verified Mentor"
                  : isPendingReview
                  ? "Verification In Review"
                  : "Educator / Mentor?"}
              </strong>
            </div>

            {isTeacherApproved ? (
              <Link
                href="/dashboard/teacher"
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl font-bold text-[11px] hover:bg-emerald-700 transition text-center"
              >
                Go to Teacher Hub
              </Link>
            ) : isMentorApproved ? (
              <Link
                href="/dashboard/mentor"
                className="px-3 py-1.5 bg-[#5C899D] text-white rounded-xl font-bold text-[11px] hover:bg-[#486f80] transition text-center"
              >
                Go to Mentor Hub
              </Link>
            ) : isPendingReview ? (
              <span className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-[10px] font-bold text-center">
                Application Under Review
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setShowApplyModal(true)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#74B49B] hover:bg-[#5f9c85] text-white rounded-xl font-semibold text-[11px] transition shadow-xs cursor-pointer"
              >
                <GraduationCap className="w-3.5 h-3.5" /> Apply for Review
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Primary Navigation Launchers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link
          href="/courses"
          className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-[#74B49B] transition space-y-2 group"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <strong className="text-xs font-bold text-slate-800 block">Course Library</strong>
            <span className="text-[11px] text-slate-500">Syllabi &amp; notes</span>
          </div>
        </Link>

        <Link
          href="/practice"
          className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-[#74B49B] transition space-y-2 group"
        >
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition">
            <BookCheck className="w-4 h-4" />
          </div>
          <div>
            <strong className="text-xs font-bold text-slate-800 block">Practice Tests</strong>
            <span className="text-[11px] text-slate-500">Diagnostics</span>
          </div>
        </Link>

        <Link
          href="/flashcards"
          className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-[#74B49B] transition space-y-2 group"
        >
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:bg-[#5C899D] group-hover:text-white transition">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <strong className="text-xs font-bold text-slate-800 block">Flashcards (SRS)</strong>
            <span className="text-[11px] text-slate-500">Leitner review</span>
          </div>
        </Link>

        <Link
          href="/dashboard/student/requests"
          className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-[#74B49B] transition space-y-2 group"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <strong className="text-xs font-bold text-slate-800 block">Mentorship</strong>
            <span className="text-[11px] text-slate-500">Inquiry status</span>
          </div>
        </Link>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Section: Courses in Progress */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#74B49B]" />
                <h2 className="text-base font-bold text-slate-800">Course Progress</h2>
              </div>
              <Link href="/courses" className="text-xs text-[#5C899D] hover:underline flex items-center gap-1">
                Explore Syllabi <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
            ) : courseProgress.length === 0 ? (
              <div className="py-6 text-center space-y-2">
                <p className="text-xs text-slate-500">You haven&apos;t enrolled in any syllabus modules yet.</p>
                <Link
                  href="/courses"
                  className="inline-block px-3 py-1.5 bg-[#74B49B] text-white text-xs font-semibold rounded-xl"
                >
                  Browse Available Courses
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {courseProgress.map((cp) => (
                  <div key={cp.id} className="p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-200/70">
                    <div className="flex items-center justify-between">
                      <strong className="text-xs font-bold text-slate-800">
                        {cp.courses?.title || "Academic Syllabus"}
                      </strong>
                      <span className="text-[10px] font-bold text-slate-500">
                        {cp.progress_percent}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#74B49B] h-1.5 rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.max(5, cp.progress_percent))}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{cp.completed_lessons} of {cp.total_lessons} lessons</span>
                      <Link
                        href={`/courses/${cp.courses?.slug || ""}`}
                        className="text-[#5C899D] font-semibold hover:underline"
                      >
                        Continue Studying
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Diagnostic Test Scores */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#5C899D]" />
                <h2 className="text-base font-bold text-slate-800">Diagnostic Practice Scores</h2>
              </div>
              <Link href="/practice" className="text-xs text-[#5C899D] hover:underline flex items-center gap-1">
                Take Diagnostic <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
            ) : testAttempts.length === 0 ? (
              <div className="py-6 text-center space-y-2">
                <p className="text-xs text-slate-500">No test attempts recorded yet.</p>
                <Link
                  href="/practice"
                  className="inline-block px-3 py-1.5 bg-[#5C899D] text-white text-xs font-semibold rounded-xl"
                >
                  Take a Quick Self-Check
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {testAttempts.map((attempt) => (
                  <div key={attempt.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <strong className="text-xs font-bold text-slate-800 block">
                        {attempt.tests?.title || "Diagnostic Assessment"}
                      </strong>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(attempt.completed_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <strong className="text-sm font-bold text-slate-800 block">
                          {attempt.score} / {attempt.total_questions}
                        </strong>
                        <span
                          className={`text-[10px] font-semibold ${
                            attempt.passed ? "text-emerald-600" : "text-amber-600"
                          }`}
                        >
                          {attempt.passed ? "Proficient" : "Needs Review"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Spaced Repetition Flashcards Recall Summary */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-800">Spaced Repetition Performance</h2>
              </div>
              <Link href="/flashcards" className="text-xs text-[#5C899D] hover:underline flex items-center gap-1">
                Study Decks <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Reviews</span>
                <strong className="text-xl font-extrabold text-slate-800">{totalCardsReviewed}</strong>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70">
                <span className="text-[10px] uppercase font-bold text-emerald-600 block">Box 4 &amp; 5 (Mastered)</span>
                <strong className="text-xl font-extrabold text-emerald-700">{masteredCards}</strong>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 col-span-2 sm:col-span-1">
                <span className="text-[10px] uppercase font-bold text-amber-600 block">Active In Box 1-3</span>
                <strong className="text-xl font-extrabold text-amber-700">
                  {Math.max(0, flashcardReviews.length - masteredCards)}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Badges, Saved Resources & Recent Activity */}
        <div className="space-y-8">
          {/* Ethical Milestone Badges */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-800">Milestone Badges</h3>
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                {unlockedKeys.size} / {AVAILABLE_BADGES.length}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Earned solely through genuine course engagement and practice milestones.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {AVAILABLE_BADGES.map((b) => {
                const isUnlocked = unlockedKeys.has(b.badge_key);

                return (
                  <div
                    key={b.badge_key}
                    className={`p-3 rounded-2xl border flex flex-col justify-between space-y-2 transition ${
                      isUnlocked
                        ? "bg-emerald-50/60 border-emerald-200/80 text-emerald-900"
                        : "bg-slate-50/60 border-slate-200/60 text-slate-400 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                          isUnlocked ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-400"
                        }`}
                      >
                        {isUnlocked ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <Lock className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <span className="text-[9px] font-bold uppercase">
                        {isUnlocked ? "Unlocked" : "Locked"}
                      </span>
                    </div>

                    <div>
                      <strong className="text-[11px] font-bold block leading-tight text-slate-800">
                        {b.title}
                      </strong>
                      <span className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">
                        {b.description}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Saved Resources & Scholarships */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-[#5C899D]" />
                <h3 className="text-sm font-bold text-slate-800">Saved Resources &amp; Aids</h3>
              </div>
            </div>

            {savedResources.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">No bookmarks saved yet.</p>
            ) : (
              <div className="space-y-2.5">
                {savedResources.map((res) => (
                  <Link
                    key={res.id}
                    href={res.target_url}
                    className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/70 flex items-center justify-between text-xs transition"
                  >
                    <div>
                      <strong className="text-slate-800 block">{res.title}</strong>
                      <span className="text-[10px] text-slate-400 capitalize">{res.resource_type}</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity Log */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
              Recent Activity
            </h3>

            {activities.length === 0 ? (
              <p className="text-xs text-slate-400 py-2 text-center">No recent sessions recorded.</p>
            ) : (
              <div className="space-y-2 text-xs">
                {activities.map((act) => (
                  <div key={act.id} className="flex items-start justify-between gap-2 py-1">
                    <span className="text-slate-700 font-medium line-clamp-1">{act.title}</span>
                    <span className="text-[10px] text-slate-400 shrink-0">{act.activity_date}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Educator & Mentor Application Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#74B49B]" />
                <h2 className="text-lg font-bold text-slate-800">Apply as Educator or Mentor</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {appSuccessMsg ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">Application Submitted!</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Your credentials have been routed to the platform administrative review queue. You will receive access upon approval.
                </p>
              </div>
            ) : (
              <form onSubmit={handleApplyForRole} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Domain *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setApplyRole("teacher")}
                      className={`p-3 rounded-2xl border text-left transition ${
                        applyRole === "teacher"
                          ? "border-emerald-600 bg-emerald-50 text-emerald-900 font-bold"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <GraduationCap className="w-4 h-4 mb-1 text-emerald-600" />
                      <div>Verified Teacher</div>
                      <span className="text-[10px] font-normal text-slate-500">Create &amp; publish courses</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setApplyRole("mentor")}
                      className={`p-3 rounded-2xl border text-left transition ${
                        applyRole === "mentor"
                          ? "border-[#5C899D] bg-sky-50 text-sky-900 font-bold"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Compass className="w-4 h-4 mb-1 text-[#5C899D]" />
                      <div>Academic Mentor</div>
                      <span className="text-[10px] font-normal text-slate-500">Guide scholars 1-on-1</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Affiliated University / School / Organization *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your affiliated institution name"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Highest Degree / Qualifications *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your highest academic degree or professional qualifications"
                    value={qualifications}
                    onChange={(e) => setQualifications(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs"
                  />
                </div>

                {applyRole === "teacher" ? (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Teaching Subjects (comma separated) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Physics, Calculus, Organic Chemistry"
                      value={teachingSubjects}
                      onChange={(e) => setTeachingSubjects(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs"
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Mentor Headline *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. College Admissions Counselor &amp; Competitive Exam Mentor"
                        value={headline}
                        onChange={(e) => setHeadline(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Short Guidance Bio</label>
                      <textarea
                        rows={2}
                        placeholder="Brief summary of how you plan to assist students..."
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Credential Proof Link (LinkedIn / Google Drive / ID Document)
                  </label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/... or drive link"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs"
                  />
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    To maintain educational integrity, administrative reviewers verify your identity before elevating account privileges.
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowApplyModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingApp}
                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#74B49B] hover:bg-[#5f9c85] text-white font-semibold rounded-xl shadow-xs transition disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isSubmittingApp ? "Submitting..." : "Submit for Verification"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}