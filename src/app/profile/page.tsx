"use client";

import React, { useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { supabase, UserProfile } from "@/lib/supabase";
import { User, CheckCircle2, AlertCircle, Save, BookOpen, GraduationCap } from "lucide-react";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContainer />
    </ProtectedRoute>
  );
}

function ProfileContainer() {
  const { profile, loading } = useAuth();

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#A7D7C5] border-t-[#74B49B] rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  return <ProfileForm key={profile.id} initialProfile={profile} />;
}

function ProfileForm({ initialProfile }: { initialProfile: UserProfile }) {
  const { refreshProfile } = useAuth();

  const [fullName, setFullName] = useState(initialProfile.full_name || "");
  const [educationLevel, setEducationLevel] = useState(initialProfile.education_level || "Undergraduate");
  const [institution, setInstitution] = useState(initialProfile.institution || "");
  const [classSemester, setClassSemester] = useState(initialProfile.class_semester || "");
  const [courseBranch, setCourseBranch] = useState(initialProfile.course_branch || "");
  const [interests, setInterests] = useState((initialProfile.interests || []).join(", "));
  const [country, setCountry] = useState(initialProfile.country || "India");
  const [learningPref, setLearningPref] = useState(initialProfile.learning_preference || "visual");

  // Teacher/Mentor specific fields
  const [bio, setBio] = useState(initialProfile.bio || "");
  const [qualifications, setQualifications] = useState(initialProfile.qualifications || "");
  const [experienceYears, setExperienceYears] = useState(String(initialProfile.experience_years || 0));
  const [teachingSubjects, setTeachingSubjects] = useState((initialProfile.teaching_subjects || []).join(", "));
  const [teachingClasses, setTeachingClasses] = useState((initialProfile.teaching_classes || []).join(", "));

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Updated to include mentors as well
  const isEducatorOrMentor = 
    initialProfile.role === "teacher" || 
    initialProfile.role === "admin" || 
    initialProfile.role === "mentor";

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);

    const interestsArray = interests
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const subjectsArray = teachingSubjects
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const classesArray = teachingClasses
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    try {
      const payload: Partial<UserProfile> = {
        full_name: fullName,
        education_level: educationLevel,
        institution: institution,
        class_semester: classSemester,
        course_branch: courseBranch,
        interests: interestsArray,
        country: country,
        learning_preference: learningPref,
        updated_at: new Date().toISOString(),
      };

      if (isEducatorOrMentor) {
        payload.bio = bio;
        payload.qualifications = qualifications;
        payload.experience_years = parseInt(experienceYears, 10) || 0;
        payload.teaching_subjects = subjectsArray;
        payload.teaching_classes = classesArray;
      }

      const { error: updateErr } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", initialProfile.id);

      if (updateErr) throw updateErr;

      await refreshProfile();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update profile.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
          User <span className="text-[#5C899D]">Profile</span>
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          {isEducatorOrMentor
            ? "Manage your credentials, expertise, and public profile bio."
            : "Manage your student credentials, study preferences, and academic background."}
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
          <div className="w-14 h-14 rounded-2xl bg-[#A7D7C5]/30 text-[#427563] flex items-center justify-center font-bold text-xl">
            {fullName ? fullName.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">{fullName || "Learner"}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#74B49B]/15 text-[#427563]">
                Role: {initialProfile.role || "student"}
              </span>
              <span className="text-xs text-slate-400">{country}</span>
            </div>
          </div>
        </div>

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Profile saved successfully!</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          {/* General Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40"
              />
            </div>
          </div>

          {/* Academic Background */}
          <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <GraduationCap className="w-4 h-4 text-[#5C899D]" />
              <h3>Academic Background</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Education Level</label>
                <select
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40"
                >
                  <option value="High School">High School (Class 9–12)</option>
                  <option value="Middle School">Middle School (Class 6–8)</option>
                  <option value="Undergraduate">Undergraduate</option>
                  <option value="Graduate / Masters">Graduate / Masters</option>
                  <option value="Doctorate">Doctorate / Ph.D.</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Institution / School / University</label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="Enter your school / college / university name"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Class / Semester</label>
                <input
                  type="text"
                  value={classSemester}
                  onChange={(e) => setClassSemester(e.target.value)}
                  placeholder="Enter your class / semester"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Course / Branch / Stream</label>
                <input
                  type="text"
                  value={courseBranch}
                  onChange={(e) => setCourseBranch(e.target.value)}
                  placeholder="Enter your course / branch / stream"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Subjects &amp; Interests <span className="text-slate-400 font-normal">(comma-separated)</span>
              </label>
              <input
                type="text"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="e.g. Physics, Math, IELTS, Machine Learning"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40"
              />
            </div>
          </div>

          {/* Educator & Mentor Credentials Section */}
          {isEducatorOrMentor && (
            <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <BookOpen className="w-4 h-4 text-[#74B49B]" />
                <h3>Educator &amp; Mentor Credentials</h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Short Bio &amp; Mentorship Overview
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share a short summary of your background, expertise, and guidance style..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Qualifications &amp; Degrees
                  </label>
                  <input
                    type="text"
                    value={qualifications}
                    onChange={(e) => setQualifications(e.target.value)}
                    placeholder="Enter your qualifications and degrees"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subjects / Topics <span className="text-slate-400 font-normal">(comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    value={teachingSubjects}
                    onChange={(e) => setTeachingSubjects(e.target.value)}
                    placeholder="e.g. Physics, GRE Strategy, SOP Review"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Classes / Levels <span className="text-slate-400 font-normal">(comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    value={teachingClasses}
                    onChange={(e) => setTeachingClasses(e.target.value)}
                    placeholder="e.g. College, Competitive Exam, Study Abroad"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Learning Preference */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Learning / Teaching Style</label>
            <select
              value={learningPref}
              onChange={(e) => setLearningPref(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40"
            >
              <option value="visual">Visual &amp; Video-First</option>
              <option value="reading">Reading &amp; Detailed Notes</option>
              <option value="practice">Practice Tests &amp; Active Drills</option>
            </select>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#74B49B] hover:bg-[#5f9c85] text-white text-xs font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}