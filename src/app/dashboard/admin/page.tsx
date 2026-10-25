"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import NoticeBoard from "@/components/NoticeBoard";
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
import { ShieldAlert, ExternalLink, Share2, Users } from "lucide-react";

import OverviewTab from "./tabs/OverviewTab";
import SocialSettingsTab from "./tabs/SocialSettingsTab";
import TeamManagementTab from "./tabs/TeamManagementTab";
import ScholarshipsTab from "./tabs/ScholarshipsTab";
import FeedbacksTab from "./tabs/FeedbacksTab";
import TeacherVerificationsTab from "./tabs/TeacherVerificationsTab";
import MentorVerificationsTab from "./tabs/MentorVerificationsTab";
import AdminApplicantsTab from "./tabs/AdminApplicantsTab";
import CourseReviewsTab from "./tabs/CourseReviewsTab";
import ReportsTab from "./tabs/ReportsTab";
import UsersRegistryTab from "./tabs/UsersRegistryTab";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  image_url: string;
  bio: string;
  display_order: number;
}

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
    | "team"
  >("overview");

  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [teachersList, setTeachersList] = useState<UserProfile[]>([]);
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [mentorsList, setMentorsList] = useState<MentorProfile[]>([]);
  const [reportsList, setReportsList] = useState<ForumReport[]>([]);
  const [scholarshipsList, setScholarshipsList] = useState<Scholarship[]>([]);
  const [feedbacksList, setFeedbacksList] = useState<PlatformFeedback[]>([]);
  const [adminApplicants, setAdminApplicants] = useState<UserProfile[]>([]);
  const [teamList, setTeamList] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

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

  const [showAddTeam, setShowAddTeam] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");
  const [teamRole, setTeamRole] = useState("");
  const [teamImage, setTeamImage] = useState("");
  const [teamBio, setTeamBio] = useState("");
  const [teamOrder, setTeamOrder] = useState("1");
  const [isSubmittingTeam, setIsSubmittingTeam] = useState(false);

  const [actionReason, setActionReason] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadAdminData() {
      try {
        const [uRes, cRes, mRes, rRes, tRes, sRes, fRes, setRes, adminAppRes, teamRes] = await Promise.all([
          supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(50),
          supabase.from("courses").select("*, subjects(*)").order("created_at", { ascending: false }),
          supabase.from("mentor_profiles").select("*").order("created_at", { ascending: false }),
          supabase.from("forum_reports").select("*").order("created_at", { ascending: false }),
          supabase.from("profiles").select("*").or("role.eq.teacher,teacher_verification_status.in.(pending,under_review)").order("created_at", { ascending: false }),
          supabase.from("scholarships").select("*").order("created_at", { ascending: false }),
          supabase.from("platform_feedbacks").select("*").order("created_at", { ascending: false }),
          supabase.from("platform_settings").select("*").eq("key", "social_contacts").maybeSingle(),
          supabase.from("profiles").select("*").eq("admin_verification_status", "pending").order("created_at", { ascending: false }),
          supabase.from("team_members").select("*").order("display_order", { ascending: true }),
        ]);

        if (!ignore) {
          if (uRes.data) setUsersList(uRes.data as UserProfile[]);
          if (cRes.data) setCoursesList(cRes.data as Course[]);
          if (mRes.data && uRes.data) {
            setMentorsList(mRes.data.map((m) => ({ ...m, profiles: uRes.data.find((p) => p.id === m.user_id) || null })));
          }
          if (rRes.data) setReportsList(rRes.data as ForumReport[]);
          if (tRes.data) setTeachersList(tRes.data as UserProfile[]);
          if (sRes.data) setScholarshipsList(sRes.data as Scholarship[]);
          if (fRes.data) setFeedbacksList(fRes.data as PlatformFeedback[]);
          if (setRes.data?.value) setSocials(setRes.data.value as SocialContactsSettings);
          if (adminAppRes.data) setAdminApplicants(adminAppRes.data as UserProfile[]);
          if (teamRes.data) setTeamList(teamRes.data as TeamMember[]);
        }
      } catch (err) {
        console.error("Failed to load admin telemetry:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadAdminData();
    return () => { ignore = true; };
  }, []);

  const handleSaveSocials = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSocials(true);
    try {
      await supabase.from("platform_settings").upsert({ key: "social_contacts", value: socials, updated_at: new Date().toISOString() });
      setSocialsSavedMsg(true);
      setTimeout(() => setSocialsSavedMsg(false), 3000);
    } finally {
      setSavingSocials(false);
    }
  };

  const handleResetTeamForm = () => {
    setShowAddTeam(false);
    setEditingTeamId(null);
    setTeamName("");
    setTeamRole("");
    setTeamImage("");
    setTeamBio("");
    setTeamOrder("1");
  };

  const handleSaveTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingTeam(true);
    const payload = { name: teamName.trim(), role: teamRole.trim(), image_url: teamImage.trim() || null, bio: teamBio.trim() || null, display_order: parseInt(teamOrder) || 1 };
    try {
      if (editingTeamId) {
        const { data } = await supabase.from("team_members").update(payload).eq("id", editingTeamId).select().single();
        if (data) setTeamList((prev) => prev.map((m) => (m.id === editingTeamId ? (data as TeamMember) : m)));
      } else {
        const { data } = await supabase.from("team_members").insert(payload).select().single();
        if (data) setTeamList((prev) => [...prev, data as TeamMember]);
      }
      handleResetTeamForm();
    } finally {
      setIsSubmittingTeam(false);
    }
  };

  const handleDeleteTeamMember = async (id: string) => {
    if (!confirm("Remove this member?")) return;
    await supabase.from("team_members").delete().eq("id", id);
    setTeamList((prev) => prev.filter((m) => m.id !== id));
  };

  const handleStartEditTeam = (m: TeamMember) => {
    setEditingTeamId(m.id);
    setTeamName(m.name);
    setTeamRole(m.role);
    setTeamImage(m.image_url);
    setTeamBio(m.bio);
    setTeamOrder(String(m.display_order));
    setShowAddTeam(true);
  };

  const handleModerateUser = async (userId: string, newStatus: "active" | "warned" | "suspended", hours = 24) => {
    setProcessingId(userId);
    try {
      await supabase.rpc("admin_moderate_user", { target_user_id: userId, new_status: newStatus, reason_or_warning: "Moderated by Admin", suspend_hours: hours });
      setUsersList((prev) => prev.map((u) => u.id === userId ? { ...u, account_status: newStatus } : u));
    } finally {
      setProcessingId(null);
    }
  };

  const handleDemoteUser = async (userId: string) => {
    if (!confirm("Revoke privileges?")) return;
    setProcessingId(userId);
    try {
      await supabase.rpc("admin_demote_user", { target_user_id: userId });
      setUsersList((prev) => prev.map((u) => u.id === userId ? { ...u, role: "student" } : u));
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Delete user account?")) return;
    setProcessingId(userId);
    try {
      await supabase.rpc("admin_delete_user_profile", { target_user_id: userId });
      setUsersList((prev) => prev.filter((u) => u.id !== userId));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReviewTeacher = async (teacherId: string, status: "approved" | "under_review" | "rejected") => {
    setProcessingId(teacherId);
    try {
      await supabase.rpc("admin_review_teacher", { target_user_id: teacherId, new_review_status: status, reason: actionReason || null });
      setTeachersList((prev) => prev.map((t) => t.id === teacherId ? { ...t, teacher_verification_status: status } : t));
    } finally {
      setProcessingId(null);
    }
  };

  const handleVerifyMentor = async (mentorId: string, status: "approved" | "rejected" | "under_review") => {
    setProcessingId(mentorId);
    try {
      await supabase.rpc("admin_verify_mentor", { target_mentor_id: mentorId, new_status: status });
      setMentorsList((prev) => prev.map((m) => m.id === mentorId ? { ...m, verification_status: status } : m));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReviewAdminApplicant = async (applicantId: string, status: "approved" | "rejected") => {
    setProcessingId(applicantId);
    try {
      await supabase.rpc("admin_review_admin_applicant", { target_user_id: applicantId, approve_status: status });
      setAdminApplicants((prev) => prev.filter((a) => a.id !== applicantId));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReviewCourse = async (courseId: string, status: "approved" | "rejected" | "published") => {
    setProcessingId(courseId);
    try {
      await supabase.from("courses").update({ review_status: status }).eq("id", courseId);
      setCoursesList((prev) => prev.map((c) => c.id === courseId ? { ...c, review_status: status } : c));
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreateScholarship = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingSc(true);
    try {
      const { data } = await supabase.from("scholarships").insert({
        title: scTitle, provider: scProvider, country: scCountry, study_level: scLevel, degree_field: "All", amount_benefit: scAmount, deadline_date: scDeadline || null, official_url: scOfficialUrl, eligibility_criteria: scCriteria, description: scDescription, requirements: "Standard", is_verified: true, is_demo: false
      }).select().single();
      if (data) setScholarshipsList((prev) => [data as Scholarship, ...prev]);
      setShowAddScholarship(false);
    } finally {
      setIsSubmittingSc(false);
    }
  };

  const handleDeleteScholarship = async (id: string) => {
    await supabase.from("scholarships").delete().eq("id", id);
    setScholarshipsList((prev) => prev.filter((s) => s.id !== id));
  };

  const handleUpdateFeedbackStatus = async (id: string, newStatus: "in_review" | "resolved") => {
    setProcessingId(id);
    try {
      await supabase.from("platform_feedbacks").update({ status: newStatus }).eq("id", id);
      setFeedbacksList((prev) => prev.map((f) => f.id === id ? { ...f, status: newStatus } : f));
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    setProcessingId(id);
    try {
      await supabase.from("platform_feedbacks").delete().eq("id", id);
      setFeedbacksList((prev) => prev.filter((f) => f.id !== id));
    } finally {
      setProcessingId(null);
    }
  };

  const handleResolveReport = async (reportId: string, resolution: "resolved" | "dismissed") => {
    setProcessingId(reportId);
    try {
      await supabase.from("forum_reports").update({ status: resolution }).eq("id", reportId);
      setReportsList((prev) => prev.map((r) => r.id === reportId ? { ...r, status: resolution } : r));
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    setProcessingId(reportId);
    try {
      await supabase.from("forum_reports").delete().eq("id", reportId);
      setReportsList((prev) => prev.filter((r) => r.id !== reportId));
    } finally {
      setProcessingId(null);
    }
  };

  const unreadFeedbacksCount = feedbacksList.filter((f) => f.status === "unread").length;
  const pendingTeachersCount = teachersList.filter((t) => t.teacher_verification_status === "pending").length;
  const pendingMentorsCount = mentorsList.filter((m) => m.verification_status === "pending").length;
  const pendingAdminCount = adminApplicants.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-[#5C899D]/20 to-[#74B49B]/20 rounded-3xl p-6 sm:p-8 border border-[#5C899D]/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-[#427563]">
            <ShieldAlert className="w-3.5 h-3.5 text-purple-600" /> Administrative Governance
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">Platform Control &amp; Moderation Hub</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/support" className="px-4 py-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl inline-flex items-center gap-1">
            Public Support <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>
          <Link href="/dashboard/student" className="px-4 py-2 bg-slate-800 text-white hover:bg-slate-900 text-xs font-semibold rounded-xl">
            Exit to Student View
          </Link>
        </div>
      </div>

      <NoticeBoard />

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <button type="button" onClick={() => setActiveTab("overview")} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${activeTab === "overview" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"}`}>Overview</button>
        <button type="button" onClick={() => setActiveTab("social_settings")} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 ${activeTab === "social_settings" ? "bg-purple-700 text-white" : "bg-slate-100 text-slate-600"}`}><Share2 className="w-3.5 h-3.5" /> Socials</button>
        <button type="button" onClick={() => setActiveTab("team")} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 ${activeTab === "team" ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600"}`}><Users className="w-3.5 h-3.5" /> Team ({teamList.length})</button>
        <button type="button" onClick={() => setActiveTab("scholarships")} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${activeTab === "scholarships" ? "bg-[#74B49B] text-white" : "bg-slate-100 text-slate-600"}`}>Scholarships</button>
        <button type="button" onClick={() => setActiveTab("feedbacks")} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${activeTab === "feedbacks" ? "bg-[#5C899D] text-white" : "bg-slate-100 text-slate-600"}`}>Suggestions {unreadFeedbacksCount > 0 && <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500 text-white">{unreadFeedbacksCount}</span>}</button>
        <button type="button" onClick={() => setActiveTab("teachers")} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${activeTab === "teachers" ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600"}`}>Teachers {pendingTeachersCount > 0 && <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-900">{pendingTeachersCount}</span>}</button>
        <button type="button" onClick={() => setActiveTab("mentors")} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${activeTab === "mentors" ? "bg-[#74B49B] text-white" : "bg-slate-100 text-slate-600"}`}>Mentors {pendingMentorsCount > 0 && <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-900">{pendingMentorsCount}</span>}</button>
        <button type="button" onClick={() => setActiveTab("admin_applicants")} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${activeTab === "admin_applicants" ? "bg-purple-800 text-white" : "bg-slate-100 text-slate-600"}`}>Admin Req {pendingAdminCount > 0 && <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-900">{pendingAdminCount}</span>}</button>
        <button type="button" onClick={() => setActiveTab("content_review")} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${activeTab === "content_review" ? "bg-[#5C899D] text-white" : "bg-slate-100 text-slate-600"}`}>Courses</button>
        <button type="button" onClick={() => setActiveTab("reports")} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${activeTab === "reports" ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-600"}`}>Reports</button>
        <button type="button" onClick={() => setActiveTab("users")} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${activeTab === "users" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"}`}>Users Registry</button>
      </div>

      {loading ? (
        <div className="h-40 bg-slate-100 rounded-3xl animate-pulse" />
      ) : (
        <>
          {activeTab === "overview" && <OverviewTab scholarshipsList={scholarshipsList} feedbacksList={feedbacksList} teachersList={teachersList} usersList={usersList} />}
          {activeTab === "social_settings" && <SocialSettingsTab socials={socials} setSocials={setSocials} onSave={handleSaveSocials} saving={savingSocials} savedMsg={socialsSavedMsg} />}
          {activeTab === "team" && <TeamManagementTab teamList={teamList} showAddTeam={showAddTeam} setShowAddTeam={setShowAddTeam} editingTeamId={editingTeamId} teamName={teamName} setTeamName={setTeamName} teamRole={teamRole} setTeamRole={setTeamRole} teamImage={teamImage} setTeamImage={setTeamImage} teamBio={teamBio} setTeamBio={setTeamBio} teamOrder={teamOrder} setTeamOrder={setTeamOrder} isSubmittingTeam={isSubmittingTeam} onSave={handleSaveTeamMember} onEdit={handleStartEditTeam} onDelete={handleDeleteTeamMember} onReset={handleResetTeamForm} />}
          {activeTab === "scholarships" && <ScholarshipsTab scholarshipsList={scholarshipsList} showAddScholarship={showAddScholarship} setShowAddScholarship={setShowAddScholarship} scTitle={scTitle} setScTitle={setScTitle} scProvider={scProvider} setScProvider={setScProvider} scCountry={scCountry} setScCountry={setScCountry} scLevel={scLevel} setScLevel={setScLevel} scAmount={scAmount} setScAmount={setScAmount} scDeadline={scDeadline} setScDeadline={setScDeadline} scOfficialUrl={scOfficialUrl} setScOfficialUrl={setScOfficialUrl} scCriteria={scCriteria} setScCriteria={setScCriteria} scDescription={scDescription} setScDescription={setScDescription} isSubmittingSc={isSubmittingSc} onCreate={handleCreateScholarship} onDelete={handleDeleteScholarship} />}
          {activeTab === "feedbacks" && <FeedbacksTab feedbacksList={feedbacksList} processingId={processingId} onUpdateStatus={handleUpdateFeedbackStatus} onDelete={handleDeleteFeedback} />}
          {activeTab === "teachers" && <TeacherVerificationsTab teachersList={teachersList} processingId={processingId} onReview={handleReviewTeacher} setActionReason={setActionReason} />}
          {activeTab === "mentors" && <MentorVerificationsTab mentorsList={mentorsList} processingId={processingId} onVerify={handleVerifyMentor} />}
          {activeTab === "admin_applicants" && <AdminApplicantsTab adminApplicants={adminApplicants} processingId={processingId} onReview={handleReviewAdminApplicant} />}
          {activeTab === "content_review" && <CourseReviewsTab coursesList={coursesList} processingId={processingId} onReview={handleReviewCourse} />}
          {activeTab === "reports" && <ReportsTab reportsList={reportsList} processingId={processingId} onResolve={handleResolveReport} onDelete={handleDeleteReport} />}
          {activeTab === "users" && <UsersRegistryTab usersList={usersList} mentorsList={mentorsList} processingId={processingId} onModerate={handleModerateUser} onDemote={handleDemoteUser} onDelete={handleDeleteUser} />}
        </>
      )}
    </div>
  );
}