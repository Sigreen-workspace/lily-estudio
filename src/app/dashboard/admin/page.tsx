"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  supabase,
  Course,
  MentorProfile,
  ForumReport,
  UserProfile,
  Scholarship,
  PlatformFeedback,
  SocialContactsSettings,
  UserRole,
} from "@/lib/supabase";
import RoleBadge from "@/components/RoleBadge";
import {
  ShieldAlert,
  Users,
  GraduationCap,
  CheckCircle2,
  ExternalLink,
  Plus,
  Trash2,
  Calendar,
  Globe,
  MessageSquareHeart,
  Share2,
  Save,
  AlertTriangle,
  Ban,
  RotateCcw,
  FileText,
  UserCheck,
  XCircle,
  UserX,
} from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}

function AdminDashboardContent() {
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "social_settings"
    | "scholarships"
    | "feedbacks"
    | "teachers"
    | "mentors"
    | "admin_applicants"
    | "content_review"
    | "reports"
    | "users"
  >("overview");

  // State Lists
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [teachersList, setTeachersList] = useState<UserProfile[]>([]);
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [mentorsList, setMentorsList] = useState<MentorProfile[]>([]);
  const [reportsList, setReportsList] = useState<ForumReport[]>([]);
  const [scholarshipsList, setScholarshipsList] = useState<Scholarship[]>([]);
  const [feedbacksList, setFeedbacksList] = useState<PlatformFeedback[]>([]);
  const [adminApplicants, setAdminApplicants] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Social Contacts Settings State
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
  const [savingSocials, setSavingSocials] = useState(false);
  const [socialsSavedMsg, setSocialsSavedMsg] = useState(false);

  // New Scholarship Form State
  const [showAddScholarship, setShowAddScholarship] = useState(false);
  const [scTitle, setScTitle] = useState("");
  const [scProvider, setScProvider] = useState("");
  const [scCountry, setScCountry] = useState("Global");
  const [scLevel, setScLevel] = useState("Undergraduate & Masters");
  const [scAmount, setScAmount] = useState("Full Tuition + Living Stipend");
  const [scDeadline, setScDeadline] = useState("");
  const [scOfficialUrl, setScOfficialUrl] = useState("");
  const [scCriteria, setScCriteria] = useState("");
  const [scDescription, setScDescription] = useState("");
  const [isSubmittingSc, setIsSubmittingSc] = useState(false);

  // Action state
  const [actionReason, setActionReason] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadAdminData() {
      try {
        const [uRes, cRes, mRes, rRes, tRes, sRes, fRes, setRes, adminAppRes] = await Promise.all([
          supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(50),
          supabase.from("courses").select("*, subjects(*)").order("created_at", { ascending: false }),
          supabase.from("mentor_profiles").select("*").order("created_at", { ascending: false }),
          supabase.from("forum_reports").select("*").order("created_at", { ascending: false }),
          supabase
            .from("profiles")
            .select("*")
            .or("role.eq.teacher,teacher_verification_status.in.(pending,under_review)")
            .order("created_at", { ascending: false }),
          supabase.from("scholarships").select("*").order("created_at", { ascending: false }),
          supabase.from("platform_feedbacks").select("*").order("created_at", { ascending: false }),
          supabase.from("platform_settings").select("*").eq("key", "social_contacts").maybeSingle(),
          supabase.from("profiles").select("*").eq("admin_verification_status", "pending").order("created_at", { ascending: false }),
        ]);

        if (!ignore) {
          if (uRes.data) setUsersList(uRes.data as UserProfile[]);
          if (cRes.data) setCoursesList(cRes.data as Course[]);
          
          if (mRes.data && uRes.data) {
            const enrichedMentors = mRes.data.map((mentor) => {
              const matchedProfile = uRes.data.find((p) => p.id === mentor.user_id);
              return {
                ...mentor,
                profiles: matchedProfile || null,
              };
            });
            setMentorsList(enrichedMentors as MentorProfile[]);
          }

          if (rRes.data) setReportsList(rRes.data as ForumReport[]);
          if (tRes.data) setTeachersList(tRes.data as UserProfile[]);
          if (sRes.data) setScholarshipsList(sRes.data as Scholarship[]);
          if (fRes.data) setFeedbacksList(fRes.data as PlatformFeedback[]);
          if (setRes.data?.value) setSocials(setRes.data.value as SocialContactsSettings);
          if (adminAppRes.data) setAdminApplicants(adminAppRes.data as UserProfile[]);
        }
      } catch (err) {
        console.error("Failed to load admin telemetry:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadAdminData();

    return () => {
      ignore = true;
    };
  }, []);

  // Save Social Settings Action
  const handleSaveSocials = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSocials(true);
    setSocialsSavedMsg(false);
    try {
      const nowIso = new Date().toISOString();
      const { error } = await supabase.from("platform_settings").upsert({
        key: "social_contacts",
        value: socials,
        updated_at: nowIso,
      });

      if (!error) {
        setSocialsSavedMsg(true);
        setTimeout(() => setSocialsSavedMsg(false), 3000);
      } else {
        alert("Failed to save settings: " + error.message);
      }
    } finally {
      setSavingSocials(false);
    }
  };

  // User Moderation: Warn, Suspend, Unblock
  const handleModerateUser = async (
    userId: string,
    newStatus: "active" | "warned" | "suspended",
    hours = 24
  ) => {
    let reason = "";
    if (newStatus === "warned") {
      reason = prompt("Enter official warning notice for this user:") || "";
      if (!reason.trim()) return;
    } else if (newStatus === "suspended") {
      reason = prompt(`Enter suspension reason (Account will be locked for ${hours}h):`) || "";
      if (!reason.trim()) return;
    }

    const nowMs = new Date().getTime();
    const calculatedSuspension =
      newStatus === "suspended"
        ? new Date(nowMs + hours * 60 * 60 * 1000).toISOString()
        : undefined;

    setProcessingId(userId);
    try {
      const { error } = await supabase.rpc("admin_moderate_user", {
        target_user_id: userId,
        new_status: newStatus,
        reason_or_warning: reason,
        suspend_hours: hours,
      });

      if (!error) {
        const updateProfile = (u: UserProfile): UserProfile =>
          u.id === userId
            ? {
                ...u,
                account_status: newStatus,
                warning_message: newStatus === "warned" ? reason : u.warning_message,
                suspended_until:
                  newStatus === "active"
                    ? undefined
                    : (calculatedSuspension ?? u.suspended_until),
              }
            : u;

        setUsersList((prev) => prev.map(updateProfile));
        setTeachersList((prev) => prev.map(updateProfile));

        alert(`User status successfully updated to: ${newStatus}`);
      } else {
        alert("Failed to moderate user: " + error.message);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      alert("Moderation action failed: " + message);
    } finally {
      setProcessingId(null);
    }
  };

  // Demote Teacher/Mentor to Student
  const handleDemoteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to remove teacher/mentor privileges from ${userName || "this user"} and demote them to a Student?`)) {
      return;
    }
    setProcessingId(userId);
    try {
      const { error } = await supabase.rpc("admin_demote_user", { target_user_id: userId });
      if (!error) {
        setUsersList((prev) =>
          prev.map((u) =>
            u.id === userId
              ? {
                  ...u,
                  role: "student" as UserRole,
                  is_teacher_verified: false,
                  teacher_verification_status: "rejected",
                }
              : u
          )
        );
        alert("User role successfully revoked to Student.");
      } else {
        alert("Failed to demote user: " + error.message);
      }
    } finally {
      setProcessingId(null);
    }
  };

  // Permanently Delete User Profile
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`DANGER: Are you sure you want to permanently delete ${userName || "this user"}? This action cannot be undone.`)) {
      return;
    }
    setProcessingId(userId);
    try {
      const { error } = await supabase.rpc("admin_delete_user_profile", { target_user_id: userId });
      if (!error) {
        setUsersList((prev) => prev.filter((u) => u.id !== userId));
        setTeachersList((prev) => prev.filter((t) => t.id !== userId));
        alert("User account successfully deleted.");
      } else {
        alert("Failed to delete user: " + error.message);
      }
    } finally {
      setProcessingId(null);
    }
  };

  // Teacher Review Action via RPC
  const handleReviewTeacher = async (
    teacherId: string,
    status: "approved" | "under_review" | "rejected"
  ) => {
    setProcessingId(teacherId);
    try {
      const { error } = await supabase.rpc("admin_review_teacher", {
        target_user_id: teacherId,
        new_review_status: status,
        reason: actionReason || null,
      });

      if (!error) {
        setTeachersList((prev) =>
          prev.map((t) =>
            t.id === teacherId
              ? {
                  ...t,
                  role: status === "approved" ? "teacher" : t.role,
                  teacher_verification_status: status,
                  is_teacher_verified: status === "approved",
                  verification_notes: actionReason || null,
                }
              : t
          )
        );
        setActionReason("");
        alert(`Teacher verification status successfully updated to ${status}!`);
      } else {
        alert("Failed to update teacher verification status: " + error.message);
      }
    } catch {
      alert("An unexpected error occurred while reviewing teacher.");
    } finally {
      setProcessingId(null);
    }
  };

  // Review Admin Applicant Action
  const handleReviewAdminApplicant = async (applicantId: string, status: "approved" | "rejected") => {
    setProcessingId(applicantId);
    try {
      const { error } = await supabase.rpc("admin_review_admin_applicant", {
        target_user_id: applicantId,
        approve_status: status,
      });

      if (!error) {
        setAdminApplicants((prev) => prev.filter((a) => a.id !== applicantId));
        alert(`Admin request successfully ${status}!`);
      } else {
        alert("Failed to review admin applicant: " + error.message);
      }
    } catch {
      alert("Unexpected error during admin review.");
    } finally {
      setProcessingId(null);
    }
  };

  // Course Review Actions
  const handleReviewCourse = async (courseId: string, status: "approved" | "rejected" | "published") => {
    setProcessingId(courseId);
    try {
      const nowIso = new Date().toISOString();
      const { error } = await supabase
        .from("courses")
        .update({
          review_status: status,
          rejection_reason: status === "rejected" ? actionReason || "Does not meet syllabus standards" : null,
          updated_at: nowIso,
        })
        .eq("id", courseId);

      if (!error) {
        setCoursesList((prev) =>
          prev.map((c) => (c.id === courseId ? { ...c, review_status: status } : c))
        );
        setActionReason("");
      } else {
        alert("Failed to update course status: " + error.message);
      }
    } finally {
      setProcessingId(null);
    }
  };

  // Mentor Verification Actions via RPC
  const handleVerifyMentor = async (mentorId: string, status: "approved" | "rejected" | "under_review") => {
    setProcessingId(mentorId);
    try {
      const { error } = await supabase.rpc("admin_verify_mentor", {
        target_mentor_id: mentorId,
        new_status: status,
      });

      if (!error) {
        setMentorsList((prev) =>
          prev.map((m) =>
            m.id === mentorId
              ? {
                  ...m,
                  verification_status: status,
                  is_verified: status === "approved",
                }
              : m
          )
        );
        alert(`Mentor application successfully ${status}!`);
      } else {
        alert("Failed to update mentor verification: " + error.message);
      }
    } catch {
      alert("An unexpected error occurred while reviewing mentor.");
    } finally {
      setProcessingId(null);
    }
  };

  // Scholarship Creation Action
  const handleCreateScholarship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scTitle || !scProvider || !scOfficialUrl) {
      alert("Please enter title, provider, and official URL.");
      return;
    }

    setIsSubmittingSc(true);
    try {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("scholarships")
        .insert({
          title: scTitle.trim(),
          provider: scProvider.trim(),
          country: scCountry.trim(),
          study_level: scLevel.trim(),
          degree_field: "All Academic Disciplines",
          amount_benefit: scAmount.trim(),
          deadline_date: scDeadline || null,
          official_url: scOfficialUrl.trim(),
          eligibility_criteria: scCriteria.trim(),
          description: scDescription.trim(),
          is_verified: true,
          is_demo: false,
          last_verified_at: nowIso,
        })
        .select()
        .single();

      if (!error && data) {
        setScholarshipsList((prev) => [data as Scholarship, ...prev]);
        setShowAddScholarship(false);
        setScTitle("");
        setScProvider("");
        setScOfficialUrl("");
        setScCriteria("");
        setScDescription("");
        setScDeadline("");
      } else {
        alert("Failed to create scholarship: " + error?.message);
      }
    } finally {
      setIsSubmittingSc(false);
    }
  };

  // Scholarship Deletion Action
  const handleDeleteScholarship = async (id: string) => {
    if (!confirm("Are you sure you want to remove this scholarship from the public catalog?")) return;
    try {
      const { error } = await supabase.from("scholarships").delete().eq("id", id);
      if (!error) {
        setScholarshipsList((prev) => prev.filter((s) => s.id !== id));
      }
    } catch {
      alert("Error deleting scholarship.");
    }
  };

  // Feedback Status Update & Deletion
  const handleUpdateFeedbackStatus = async (id: string, newStatus: "in_review" | "resolved") => {
    setProcessingId(id);
    try {
      const { error } = await supabase
        .from("platform_feedbacks")
        .update({ status: newStatus })
        .eq("id", id);

      if (!error) {
        setFeedbacksList((prev) =>
          prev.map((f) => (f.id === id ? { ...f, status: newStatus } : f))
        );
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this suggestion/feedback?")) return;
    setProcessingId(id);
    try {
      const { error } = await supabase.from("platform_feedbacks").delete().eq("id", id);
      if (!error) {
        setFeedbacksList((prev) => prev.filter((f) => f.id !== id));
      } else {
        alert("Failed to delete feedback: " + error.message);
      }
    } finally {
      setProcessingId(null);
    }
  };

  // Report Resolution & Deletion
  const handleResolveReport = async (reportId: string, resolution: "resolved" | "dismissed") => {
    setProcessingId(reportId);
    try {
      const { error } = await supabase
        .from("forum_reports")
        .update({ status: resolution })
        .eq("id", reportId);

      if (!error) {
        setReportsList((prev) =>
          prev.map((r) => (r.id === reportId ? { ...r, status: resolution } : r))
        );
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm("Are you sure you want to delete this report log?")) return;
    setProcessingId(reportId);
    try {
      const { error } = await supabase.from("forum_reports").delete().eq("id", reportId);
      if (!error) {
        setReportsList((prev) => prev.filter((r) => r.id !== reportId));
      } else {
        alert("Failed to delete report: " + error.message);
      }
    } finally {
      setProcessingId(null);
    }
  };

  // Telemetry Aggregates
  const studentCount = usersList.filter((u) => u.role === "student").length;
  const teacherCount = teachersList.length;
  const verifiedTeacherCount = teachersList.filter((t) => t.is_teacher_verified || t.teacher_verification_status === "approved").length;
  const pendingTeachersCount = teachersList.filter((t) => t.teacher_verification_status === "pending" || t.teacher_verification_status === "under_review").length;
  const pendingMentorsCount = mentorsList.filter((m) => m.verification_status === "pending" || m.verification_status === "under_review").length;
  const unreadFeedbacksCount = feedbacksList.filter((f) => f.status === "unread").length;
  const pendingAdminCount = adminApplicants.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-[#5C899D]/20 to-[#74B49B]/20 rounded-3xl p-6 sm:p-8 border border-[#5C899D]/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-[#427563] shadow-2xs">
            <ShieldAlert className="w-3.5 h-3.5 text-purple-600" /> Administrative Governance
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
            Platform Control &amp; Moderation Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Manage live scholarships, social links, scholar suggestions, teacher verification, and user moderation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/support"
            className="px-4 py-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl transition shadow-2xs inline-flex items-center gap-1"
          >
            Public Support Page <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>
          <Link
            href="/dashboard/student"
            className="px-4 py-2 bg-slate-800 text-white hover:bg-slate-900 text-xs font-semibold rounded-xl transition shadow-2xs"
          >
            Exit to Student View
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            activeTab === "overview" ? "bg-slate-800 text-white shadow-2xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Overview Telemetry
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("social_settings")}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === "social_settings" ? "bg-purple-700 text-white shadow-2xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Share2 className="w-3.5 h-3.5" /> Social Media &amp; Contacts
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("scholarships")}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === "scholarships" ? "bg-[#74B49B] text-white shadow-2xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Scholarships ({scholarshipsList.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("feedbacks")}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === "feedbacks" ? "bg-[#5C899D] text-white shadow-2xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          User Suggestions
          {unreadFeedbacksCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-extrabold">
              {unreadFeedbacksCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("teachers")}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === "teachers" ? "bg-emerald-700 text-white shadow-2xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Teacher Verifications
          {pendingTeachersCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-900 font-extrabold">
              {pendingTeachersCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("mentors")}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === "mentors" ? "bg-[#74B49B] text-white shadow-2xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Mentor Verifications
          {pendingMentorsCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-900 font-extrabold">
              {pendingMentorsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("admin_applicants")}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === "admin_applicants" ? "bg-purple-800 text-white shadow-2xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Admin Requests
          {pendingAdminCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-900 font-extrabold">
              {pendingAdminCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("content_review")}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === "content_review" ? "bg-[#5C899D] text-white shadow-2xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Course Reviews
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reports")}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === "reports" ? "bg-rose-600 text-white shadow-2xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Community Reports
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            activeTab === "users" ? "bg-slate-800 text-white shadow-2xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Users Registry &amp; Moderation
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 bg-slate-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* SOCIAL MEDIA & CONTACTS SETTINGS TAB */}
          {activeTab === "social_settings" && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-800">Dynamic Social Media &amp; Support Contacts</h2>
                <p className="text-xs text-slate-500">
                  Update your channels and contact details at any time. Blank fields will be automatically hidden from the Footer and Support page.
                </p>
              </div>

              {socialsSavedMsg && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Social media links and contact details updated successfully across the platform!</span>
                </div>
              )}

              <form onSubmit={handleSaveSocials} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Official Support Email</label>
                    <input
                      type="email"
                      required
                      placeholder="supportestudio@gmail.com"
                      value={socials.email}
                      onChange={(e) => setSocials({ ...socials, email: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Project Lead / Contact Email</label>
                    <input
                      type="email"
                      required
                      placeholder="gaindlalkosma23@gmail.com"
                      value={socials.lead_email}
                      onChange={(e) => setSocials({ ...socials, lead_email: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">YouTube Channel URL</label>
                    <input
                      type="url"
                      placeholder="https://youtube.com/@..."
                      value={socials.youtube}
                      onChange={(e) => setSocials({ ...socials, youtube: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Instagram Profile / Page URL</label>
                    <input
                      type="url"
                      placeholder="https://instagram.com/..."
                      value={socials.instagram || ""}
                      onChange={(e) => setSocials({ ...socials, instagram: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">LinkedIn Profile / Page URL</label>
                    <input
                      type="url"
                      placeholder="https://linkedin.com/in/..."
                      value={socials.linkedin}
                      onChange={(e) => setSocials({ ...socials, linkedin: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">GitHub Repository / Org URL</label>
                    <input
                      type="url"
                      placeholder="https://github.com/..."
                      value={socials.github}
                      onChange={(e) => setSocials({ ...socials, github: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Twitter / X Profile URL</label>
                    <input
                      type="url"
                      placeholder="https://x.com/..."
                      value={socials.twitter}
                      onChange={(e) => setSocials({ ...socials, twitter: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Telegram Community (Optional)</label>
                    <input
                      type="url"
                      placeholder="https://t.me/..."
                      value={socials.telegram || ""}
                      onChange={(e) => setSocials({ ...socials, telegram: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">WhatsApp Channel / Group (Optional)</label>
                    <input
                      type="url"
                      placeholder="https://chat.whatsapp.com/..."
                      value={socials.whatsapp || ""}
                      onChange={(e) => setSocials({ ...socials, whatsapp: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={savingSocials}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#74B49B] hover:bg-[#5f9c85] text-white font-semibold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    {savingSocials ? "Saving Settings..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SCHOLARSHIPS TAB */}
          {activeTab === "scholarships" && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Scholarship Directory Management</h2>
                  <p className="text-xs text-slate-500">
                    Add verified international and domestic scholarships or remove outdated entries.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddScholarship(!showAddScholarship)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#74B49B] hover:bg-[#5f9c85] text-white text-xs font-semibold rounded-xl transition shadow-2xs shrink-0 self-start sm:self-auto cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> {showAddScholarship ? "Close Form" : "Add Scholarship"}
                </button>
              </div>

              {showAddScholarship && (
                <form onSubmit={handleCreateScholarship} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 text-xs">
                  <h3 className="font-bold text-slate-800 text-sm">Add New Scholarship Opportunity</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Scholarship Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Inlaks Shivdasani Foundation Scholarships"
                        value={scTitle}
                        onChange={(e) => setScTitle(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Granting Provider / Body *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Inlaks Foundation"
                        value={scProvider}
                        onChange={(e) => setScProvider(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Eligible Country / Region</label>
                      <input
                        type="text"
                        placeholder="e.g. UK, USA, Europe, or Global"
                        value={scCountry}
                        onChange={(e) => setScCountry(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Study Level</label>
                      <input
                        type="text"
                        placeholder="e.g. Masters, PhD, Undergraduate"
                        value={scLevel}
                        onChange={(e) => setScLevel(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Funding / Amount Benefit</label>
                      <input
                        type="text"
                        placeholder="e.g. Full tuition fee + $100,000 allowance"
                        value={scAmount}
                        onChange={(e) => setScAmount(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Application Deadline</label>
                      <input
                        type="date"
                        value={scDeadline}
                        onChange={(e) => setScDeadline(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Official Portal Link *</label>
                    <input
                      type="url"
                      required
                      placeholder="https://official-scholarship-portal.org"
                      value={scOfficialUrl}
                      onChange={(e) => setScOfficialUrl(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Eligibility Criteria</label>
                    <textarea
                      rows={2}
                      placeholder="Requirements, age limit, nationality, and required minimum marks..."
                      value={scCriteria}
                      onChange={(e) => setScCriteria(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Detailed Description</label>
                    <textarea
                      rows={3}
                      placeholder="Summary of terms, funding breakdown, and steps to apply..."
                      value={scDescription}
                      onChange={(e) => setScDescription(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddScholarship(false)}
                      className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-200/60 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingSc}
                      className="px-5 py-2 bg-[#74B49B] text-white font-semibold rounded-xl shadow-xs cursor-pointer"
                    >
                      {isSubmittingSc ? "Publishing..." : "Publish to Directory"}
                    </button>
                  </div>
                </form>
              )}

              {scholarshipsList.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No scholarships registered yet.</p>
              ) : (
                <div className="space-y-3">
                  {scholarshipsList.map((s) => (
                    <div
                      key={s.id}
                      className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition"
                    >
                      <div className="space-y-1 max-w-2xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {s.country}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">Provider: {s.provider}</span>
                          {s.deadline_date && (
                            <span className="text-[11px] text-amber-700 flex items-center gap-1 font-semibold">
                              <Calendar className="w-3 h-3" /> Due: {s.deadline_date}
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-slate-800">{s.title}</h3>
                        <p className="text-xs text-slate-600 line-clamp-1">{s.description || s.amount_benefit}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={s.official_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 inline-flex items-center gap-1"
                        >
                          Visit Portal <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteScholarship(s.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                          title="Remove Scholarship"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* FEEDBACK & SUGGESTIONS TAB */}
          {activeTab === "feedbacks" && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-800">User Suggestions &amp; Inquiries</h2>
                <p className="text-xs text-slate-500">
                  Direct suggestions, bug reports, and support requests submitted by platform students and teachers.
                </p>
              </div>

              {feedbacksList.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No feedback entries submitted yet.</p>
              ) : (
                <div className="space-y-4">
                  {feedbacksList.map((fb) => (
                    <div
                      key={fb.id}
                      className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 max-w-2xl">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              fb.feedback_type === "bug_report"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : fb.feedback_type === "support"
                                ? "bg-sky-50 text-sky-700 border border-sky-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            {fb.feedback_type.replace("_", " ")}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              fb.status === "resolved"
                                ? "bg-slate-200 text-slate-700"
                                : fb.status === "in_review"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {fb.status}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(fb.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-800">{fb.subject}</h3>
                        <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">{fb.message}</p>
                        <p className="text-[11px] text-slate-400">
                          Sender: <span className="font-semibold text-slate-600">{fb.user_name || "Scholar"}</span> ({fb.user_email})
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {fb.status !== "in_review" && fb.status !== "resolved" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateFeedbackStatus(fb.id, "in_review")}
                            disabled={processingId === fb.id}
                            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 cursor-pointer"
                          >
                            Mark In Review
                          </button>
                        )}
                        {fb.status !== "resolved" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateFeedbackStatus(fb.id, "resolved")}
                            disabled={processingId === fb.id}
                            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                          >
                            Mark Resolved
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteFeedback(fb.id)}
                          disabled={processingId === fb.id}
                          className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 inline-flex items-center gap-1 cursor-pointer"
                          title="Delete Suggestion"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[11px] font-bold uppercase text-slate-400">Available Scholarships</span>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-extrabold text-[#74B49B]">{scholarshipsList.length}</span>
                    <Globe className="w-5 h-5 text-[#74B49B]" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[11px] font-bold uppercase text-slate-400">User Suggestions</span>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-extrabold text-[#5C899D]">{feedbacksList.length}</span>
                    <MessageSquareHeart className="w-5 h-5 text-[#5C899D]" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[11px] font-bold uppercase text-slate-400">Verified Educators</span>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-extrabold text-emerald-700">
                      {verifiedTeacherCount} / {teacherCount}
                    </span>
                    <GraduationCap className="w-5 h-5 text-emerald-500" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[11px] font-bold uppercase text-slate-400">Enrolled Scholars</span>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-extrabold text-slate-800">{studentCount}</span>
                    <Users className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TEACHER VERIFICATION TAB */}
          {activeTab === "teachers" && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-800">Educator Credential Verification Queue</h2>
                <p className="text-xs text-slate-500">
                  Review qualifications and institutional affiliations before granting the Verified Teacher badge.
                </p>
              </div>

              {teachersList.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No educator accounts or verification applications found.</p>
              ) : (
                <div className="space-y-4">
                  {teachersList.map((t) => (
                    <div
                      key={t.id}
                      className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="space-y-2 max-w-2xl">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              t.teacher_verification_status === "approved"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : t.teacher_verification_status === "rejected"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            Status: {t.teacher_verification_status || "pending"}
                          </span>
                          <span className="text-xs font-bold text-slate-800">{t.full_name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({t.role})</span>
                        </div>

                        <p className="text-xs text-slate-600">
                          <strong>Institution:</strong> {t.institution || "Not specified"} •{" "}
                          <strong>Qualifications:</strong> {t.qualifications || "Not specified"}
                        </p>

                        {t.teaching_subjects && t.teaching_subjects.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-500">Subjects:</span>
                            {t.teaching_subjects.map((sub, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-slate-200/70 text-slate-700 rounded-md text-[10px]"
                              >
                                {sub}
                              </span>
                            ))}
                          </div>
                        )}

                        {t.credentials_url && (
                          <div className="pt-1">
                            <a
                              href={t.credentials_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-[#5C899D] hover:underline"
                            >
                              <FileText className="w-3.5 h-3.5" /> View Submitted Proof Document <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}

                        {t.verification_notes && (
                          <p className="text-[11px] text-rose-600 font-medium">Notes: {t.verification_notes}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {t.teacher_verification_status !== "approved" && (
                          <button
                            type="button"
                            onClick={() => handleReviewTeacher(t.id, "approved")}
                            disabled={processingId === t.id}
                            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve Teacher
                          </button>
                        )}

                        {t.teacher_verification_status !== "under_review" && t.teacher_verification_status !== "approved" && (
                          <button
                            type="button"
                            onClick={() => handleReviewTeacher(t.id, "under_review")}
                            disabled={processingId === t.id}
                            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 cursor-pointer"
                          >
                            Under Review
                          </button>
                        )}

                        {t.teacher_verification_status !== "rejected" && (
                          <button
                            type="button"
                            onClick={() => {
                              const reason = prompt("Enter reason for rejection or needed credentials:");
                              if (reason) {
                                setActionReason(reason);
                                handleReviewTeacher(t.id, "rejected");
                              }
                            }}
                            disabled={processingId === t.id}
                            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 cursor-pointer"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MENTOR VERIFICATION TAB */}
          {activeTab === "mentors" && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-800">Academic Mentor Verification Queue</h2>
                <p className="text-xs text-slate-500">Ensure students connect solely with verified, authentic mentors.</p>
              </div>

              {mentorsList.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No mentor applications registered.</p>
              ) : (
                <div className="space-y-4">
                  {mentorsList.map((m) => (
                    <div
                      key={m.id}
                      className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="space-y-1 max-w-2xl">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              m.verification_status === "approved"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-sky-50 text-sky-700 border border-sky-200"
                            }`}
                          >
                            {m.verification_status || "pending"}
                          </span>
                          <span className="text-xs text-slate-600 font-bold">
                            {m.profiles?.full_name || "Applicant (ID: " + m.user_id.slice(0, 8) + ")"}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-800">{m.headline || "Academic Counselor"}</h3>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {m.verification_status !== "approved" && (
                          <button
                            type="button"
                            onClick={() => handleVerifyMentor(m.id, "approved")}
                            disabled={processingId === m.id}
                            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve Credentials
                          </button>
                        )}
                        {m.verification_status !== "rejected" && (
                          <button
                            type="button"
                            onClick={() => handleVerifyMentor(m.id, "rejected")}
                            disabled={processingId === m.id}
                            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 cursor-pointer"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ADMIN ACCESS REQUESTS TAB */}
          {activeTab === "admin_applicants" && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-800">Admin Access Requests</h2>
                <p className="text-xs text-slate-500">
                  Teachers and mentors requesting cross-role administrative delegation privileges.
                </p>
              </div>

              {adminApplicants.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No pending admin access requests.</p>
              ) : (
                <div className="space-y-4">
                  {adminApplicants.map((applicant) => (
                    <div
                      key={applicant.id}
                      className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 max-w-2xl">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                            Requested Admin Role
                          </span>
                          <span className="text-xs font-bold text-slate-800">{applicant.full_name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({applicant.role})</span>
                        </div>
                        <p className="text-xs text-slate-600">
                          <strong>Institution:</strong> {applicant.institution || "Not specified"} •{" "}
                          <strong>Qualifications:</strong> {applicant.qualifications || "Not specified"}
                        </p>
                        {applicant.admin_application_reason && (
                          <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-700">
                            <strong>Reason:</strong> {applicant.admin_application_reason}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleReviewAdminApplicant(applicant.id, "approved")}
                          disabled={processingId === applicant.id}
                          className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-purple-700 hover:bg-purple-800 text-white shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5" /> Grant Admin Rights
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReviewAdminApplicant(applicant.id, "rejected")}
                          disabled={processingId === applicant.id}
                          className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Deny
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CONTENT REVIEW TAB */}
          {activeTab === "content_review" && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-800">Course &amp; Syllabus Submissions</h2>
                <p className="text-xs text-slate-500">Verify academic quality before releasing teacher-created course units.</p>
              </div>

              {coursesList.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No courses in the system.</p>
              ) : (
                <div className="space-y-4">
                  {coursesList.map((c) => (
                    <div
                      key={c.id}
                      className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="space-y-1 max-w-2xl">
                        <h3 className="text-sm font-bold text-slate-800">{c.title}</h3>
                        <p className="text-xs text-slate-600 line-clamp-2">{c.description}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {c.review_status !== "published" && (
                          <button
                            type="button"
                            onClick={() => handleReviewCourse(c.id, "published")}
                            disabled={processingId === c.id}
                            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve &amp; Publish
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* REPORTS MODERATION TAB */}
          {activeTab === "reports" && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-800">Community Safety &amp; Content Reports</h2>
                <p className="text-xs text-slate-500">
                  User-submitted flags regarding spam, academic dishonesty, or policy violations.
                </p>
              </div>

              {reportsList.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No community reports logged.</p>
              ) : (
                <div className="space-y-4">
                  {reportsList.map((r) => (
                    <div
                      key={r.id}
                      className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="space-y-1 max-w-2xl">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              r.status === "pending"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : r.status === "resolved"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                          >
                            {r.status}
                          </span>
                          <span className="text-xs font-bold text-slate-700">Target Type: {r.target_type}</span>
                        </div>
                        <h3 className="text-sm font-bold text-rose-700">{r.reason}</h3>
                        {r.details && <p className="text-xs text-slate-600">{r.details}</p>}
                        <span className="text-[10px] text-slate-400">Logged on {new Date(r.created_at).toLocaleDateString()}</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {r.status === "pending" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleResolveReport(r.id, "resolved")}
                              disabled={processingId === r.id}
                              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs cursor-pointer"
                            >
                              Resolve / Moderated
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResolveReport(r.id, "dismissed")}
                              disabled={processingId === r.id}
                              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 cursor-pointer"
                            >
                              Dismiss Flag
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteReport(r.id)}
                          disabled={processingId === r.id}
                          className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 inline-flex items-center gap-1 cursor-pointer"
                          title="Delete Report Log"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* USERS REGISTRY & MODERATION TAB */}
          {activeTab === "users" && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-800">User Accounts &amp; Moderation Registry</h2>
                <p className="text-xs text-slate-500">
                  Role assignments and community safety controls (issue warnings, 24h suspensions, demote roles, or delete accounts).
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                      <th className="py-2.5 px-3">User Name</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">Account Status</th>
                      <th className="py-2.5 px-3">Moderation Actions</th>
                      <th className="py-2.5 px-3">Registered Date</th>
                      <th className="py-2.5 px-3">User ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {u.full_name || "Anonymous Scholar"}
                        </td>
                        <td className="py-2.5 px-3">
                          <RoleBadge role={u.role} isVerified={u.is_teacher_verified} />
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              u.account_status === "suspended"
                                ? "bg-rose-100 text-rose-800 border border-rose-200"
                                : u.account_status === "warned"
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            }`}
                          >
                            {u.account_status || "active"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {u.role !== "admin" ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {u.account_status !== "warned" && (
                                <button
                                  type="button"
                                  onClick={() => handleModerateUser(u.id, "warned")}
                                  disabled={processingId === u.id}
                                  className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold rounded-lg border border-amber-200 transition disabled:opacity-50 inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <AlertTriangle className="w-3 h-3 text-amber-600" /> Warn
                                </button>
                              )}

                              {u.account_status === "suspended" ? (
                                <button
                                  type="button"
                                  onClick={() => handleModerateUser(u.id, "active")}
                                  disabled={processingId === u.id}
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-lg border border-emerald-200 transition disabled:opacity-50 inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <RotateCcw className="w-3 h-3 text-emerald-600" /> Unblock
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleModerateUser(u.id, "suspended", 24)}
                                  disabled={processingId === u.id}
                                  className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold rounded-lg border border-rose-200 transition disabled:opacity-50 inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Ban className="w-3 h-3 text-rose-600" /> Suspend
                                </button>
                              )}

                              {(u.role === "teacher" || u.role === "mentor") && (
                                <button
                                  type="button"
                                  onClick={() => handleDemoteUser(u.id, u.full_name || "")}
                                  disabled={processingId === u.id}
                                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg border border-indigo-200 transition disabled:opacity-50 inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <UserX className="w-3 h-3 text-indigo-600" /> Demote
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u.id, u.full_name || "")}
                                disabled={processingId === u.id}
                                className="px-2 py-1 bg-rose-700 hover:bg-rose-800 text-white text-[10px] font-bold rounded-lg transition disabled:opacity-50 inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3 text-white" /> Delete
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">Root Admin</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400">{u.id.slice(0, 8)}...</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}