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

  // Modal / Action state
  const [actionReason, setActionReason] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadAdminData() {
      try {
        const [uRes, cRes, mRes, rRes, tRes, sRes, fRes, setRes] = await Promise.all([
          supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(50),
          supabase.from("courses").select("*, subjects(*)").order("created_at", { ascending: false }),
          supabase.from("mentor_profiles").select("*, profiles(*)").order("created_at", { ascending: false }),
          supabase.from("forum_reports").select("*").order("created_at", { ascending: false }),
          supabase.from("profiles").select("*").eq("role", "teacher").order("created_at", { ascending: false }),
          supabase.from("scholarships").select("*").order("created_at", { ascending: false }),
          supabase.from("platform_feedbacks").select("*").order("created_at", { ascending: false }),
          supabase.from("platform_settings").select("*").eq("key", "social_contacts").maybeSingle(),
        ]);

        if (!ignore) {
          if (uRes.data) setUsersList(uRes.data as UserProfile[]);
          if (cRes.data) setCoursesList(cRes.data as Course[]);
          if (mRes.data) setMentorsList(mRes.data as MentorProfile[]);
          if (rRes.data) setReportsList(rRes.data as ForumReport[]);
          if (tRes.data) setTeachersList(tRes.data as UserProfile[]);
          if (sRes.data) setScholarshipsList(sRes.data as Scholarship[]);
          if (fRes.data) setFeedbacksList(fRes.data as PlatformFeedback[]);
          if (setRes.data?.value) setSocials(setRes.data.value as SocialContactsSettings);
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
      const { error } = await supabase.from("platform_settings").upsert({
        key: "social_contacts",
        value: socials,
        updated_at: new Date().toISOString(),
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
                  teacher_verification_status: status,
                  is_teacher_verified: status === "approved",
                  verification_notes: actionReason || null,
                }
              : t
          )
        );
        setActionReason("");
      } else {
        alert("Failed to update teacher verification status.");
      }
    } catch {
      alert("An unexpected error occurred while reviewing teacher.");
    } finally {
      setProcessingId(null);
    }
  };

  // Course Review Actions
  const handleReviewCourse = async (courseId: string, status: "approved" | "rejected" | "published") => {
    setProcessingId(courseId);
    try {
      const { error } = await supabase
        .from("courses")
        .update({
          review_status: status,
          rejection_reason: status === "rejected" ? actionReason || "Does not meet syllabus standards" : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", courseId);

      if (!error) {
        setCoursesList((prev) =>
          prev.map((c) => (c.id === courseId ? { ...c, review_status: status } : c))
        );
        setActionReason("");
      } else {
        alert("Failed to update course status.");
      }
    } finally {
      setProcessingId(null);
    }
  };

  // Mentor Verification Actions
  const handleVerifyMentor = async (mentorId: string, status: "approved" | "rejected" | "under_review") => {
    setProcessingId(mentorId);
    try {
      const { error } = await supabase
        .from("mentor_profiles")
        .update({
          verification_status: status,
          is_verified: status === "approved",
          verified_at: status === "approved" ? new Date().toISOString() : null,
          review_notes: actionReason || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", mentorId);

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
        setActionReason("");
      } else {
        alert("Failed to update mentor verification.");
      }
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
          last_verified_at: new Date().toISOString(),
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

  // Feedback Status Update
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

  // Report Resolution
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

  // Telemetry aggregates
  const studentCount = usersList.filter((u) => u.role === "student").length;
  const teacherCount = teachersList.length;
  const verifiedTeacherCount = teachersList.filter((t) => t.is_teacher_verified || t.teacher_verification_status === "approved").length;
  const pendingTeachersCount = teachersList.filter((t) => t.teacher_verification_status === "pending" || t.teacher_verification_status === "under_review").length;
  const unreadFeedbacksCount = feedbacksList.filter((f) => f.status === "unread").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-[#5C899D]/20 to-[#74B49B]/20 rounded-3xl p-6 sm:p-8 border border-[#5C899D]/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-[#427563] shadow-2xs">
            <ShieldAlert className="w-3.5 h-3.5 text-purple-600" /> Administrative Governance
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
            Platform Control &amp; Community Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Manage live scholarships, social links, scholar suggestions, teacher verification, and course approvals.
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
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
            activeTab === "overview" ? "bg-slate-800 text-white shadow-2xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Overview Telemetry
        </button>

        <button
          onClick={() => setActiveTab("social_settings")}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === "social_settings" ? "bg-purple-700 text-white shadow-2xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Share2 className="w-3.5 h-3.5" /> Social Media &amp; Contacts
        </button>

        <button
          onClick={() => setActiveTab("scholarships")}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === "scholarships" ? "bg-[#74B49B] text-white shadow-2xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Scholarships ({scholarshipsList.length})
        </button>

        <button
          onClick={() => setActiveTab("feedbacks")}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
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
          onClick={() => setActiveTab("teachers")}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
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
          onClick={() => setActiveTab("mentors")}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === "mentors" ? "bg-[#74B49B] text-white shadow-2xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Mentor Verifications
        </button>

        <button
          onClick={() => setActiveTab("content_review")}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === "content_review" ? "bg-[#5C899D] text-white shadow-2xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Course Reviews
        </button>

        <button
          onClick={() => setActiveTab("reports")}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === "reports" ? "bg-rose-600 text-white shadow-2xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Community Reports
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
            activeTab === "users" ? "bg-slate-800 text-white shadow-2xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Users Registry
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
                      placeholder="support@lilyestudio.org"
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
                      placeholder="https://youtube.com/@lilyestudio"
                      value={socials.youtube}
                      onChange={(e) => setSocials({ ...socials, youtube: e.target.value })}
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
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#74B49B] hover:bg-[#5f9c85] text-white font-semibold rounded-xl shadow-xs transition"
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
                  onClick={() => setShowAddScholarship(!showAddScholarship)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#74B49B] hover:bg-[#5f9c85] text-white text-xs font-semibold rounded-xl transition shadow-2xs shrink-0 self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" /> {showAddScholarship ? "Close Form" : "Add Scholarship"}
                </button>
              </div>

              {/* Add Scholarship Form */}
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
                      className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-200/60"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingSc}
                      className="px-5 py-2 bg-[#74B49B] text-white font-semibold rounded-xl shadow-xs"
                    >
                      {isSubmittingSc ? "Publishing..." : "Publish to Directory"}
                    </button>
                  </div>
                </form>
              )}

              {/* Scholarship Listing */}
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
                          onClick={() => handleDeleteScholarship(s.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
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
                            onClick={() => handleUpdateFeedbackStatus(fb.id, "in_review")}
                            disabled={processingId === fb.id}
                            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                          >
                            Mark In Review
                          </button>
                        )}
                        {fb.status !== "resolved" && (
                          <button
                            onClick={() => handleUpdateFeedbackStatus(fb.id, "resolved")}
                            disabled={processingId === fb.id}
                            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                          >
                            Mark Resolved
                          </button>
                        )}
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
                <p className="text-xs text-slate-400 py-6 text-center">No educator accounts registered.</p>
              ) : (
                <div className="space-y-4">
                  {teachersList.map((t) => (
                    <div
                      key={t.id}
                      className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 max-w-2xl">
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
                        </div>
                        <p className="text-xs text-slate-600">
                          <strong>Institution:</strong> {t.institution || "Not specified"} •{" "}
                          <strong>Qualifications:</strong> {t.qualifications || "Not specified"}
                        </p>
                        {t.verification_notes && (
                          <p className="text-[11px] text-rose-600 font-medium">Notes: {t.verification_notes}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {t.teacher_verification_status !== "approved" && (
                          <button
                            onClick={() => handleReviewTeacher(t.id, "approved")}
                            disabled={processingId === t.id}
                            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs inline-flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve Teacher
                          </button>
                        )}

                        {t.teacher_verification_status !== "under_review" && t.teacher_verification_status !== "approved" && (
                          <button
                            onClick={() => handleReviewTeacher(t.id, "under_review")}
                            disabled={processingId === t.id}
                            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                          >
                            Under Review
                          </button>
                        )}

                        {t.teacher_verification_status !== "rejected" && (
                          <button
                            onClick={() => {
                              const reason = prompt("Enter reason for rejection or needed credentials:");
                              if (reason) {
                                setActionReason(reason);
                                handleReviewTeacher(t.id, "rejected");
                              }
                            }}
                            disabled={processingId === t.id}
                            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
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
                            {m.verification_status}
                          </span>
                          <span className="text-xs text-slate-600 font-bold">{m.profiles?.full_name || "Applicant"}</span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-800">{m.headline || "Academic Counselor"}</h3>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {m.verification_status !== "approved" && (
                          <button
                            onClick={() => handleVerifyMentor(m.id, "approved")}
                            disabled={processingId === m.id}
                            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs inline-flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve Credentials
                          </button>
                        )}
                        {m.verification_status !== "rejected" && (
                          <button
                            onClick={() => handleVerifyMentor(m.id, "rejected")}
                            disabled={processingId === m.id}
                            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
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
                            onClick={() => handleReviewCourse(c.id, "published")}
                            disabled={processingId === c.id}
                            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs inline-flex items-center gap-1"
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
                              onClick={() => handleResolveReport(r.id, "resolved")}
                              disabled={processingId === r.id}
                              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                            >
                              Resolve / Moderated
                            </button>
                            <button
                              onClick={() => handleResolveReport(r.id, "dismissed")}
                              disabled={processingId === r.id}
                              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700"
                            >
                              Dismiss Flag
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* USERS REGISTRY TAB */}
          {activeTab === "users" && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-800">User Account Telemetry</h2>
                <p className="text-xs text-slate-500">Role assignments across students, educators, and verified counselors.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">Registered Date</th>
                      <th className="py-2.5 px-3">User ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{u.full_name || "Anonymous Scholar"}</td>
                        <td className="py-2.5 px-3">
                          <RoleBadge role={u.role} isVerified={u.is_teacher_verified} />
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