"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import {
  supabase,
  StudentScholarshipTracker,
  ScholarshipApplicationStatus
} from "@/lib/supabase";
import {
  ArrowLeft,
  GraduationCap,
  Calendar,
  ExternalLink,
  Trash2,
  Edit3,
  CheckCircle2,
  Clock,
  Send,
  XCircle,
  Trophy
} from "lucide-react";

export default function StudentScholarshipsTrackerPage() {
  return (
    <ProtectedRoute allowedRoles={["student", "admin"]}>
      <StudentScholarshipsTrackerContent />
    </ProtectedRoute>
  );
}

const STATUS_CONFIG: Record<
  ScholarshipApplicationStatus,
  { label: string; bg: string; text: string; icon: React.ElementType }
> = {
  interested: { label: "Interested", bg: "bg-slate-100", text: "text-slate-700", icon: Clock },
  planning: { label: "Planning", bg: "bg-amber-50", text: "text-amber-700", icon: Edit3 },
  applied: { label: "Applied", bg: "bg-sky-50", text: "text-sky-700", icon: Send },
  shortlisted: { label: "Shortlisted", bg: "bg-purple-50", text: "text-purple-700", icon: CheckCircle2 },
  rejected: { label: "Not Selected", bg: "bg-rose-50", text: "text-rose-700", icon: XCircle },
  completed: { label: "Received / Awarded", bg: "bg-emerald-50", text: "text-emerald-700", icon: Trophy },
};

function StudentScholarshipsTrackerContent() {
  const { user } = useAuth();
  const [trackers, setTrackers] = useState<StudentScholarshipTracker[]>([]);
  const [statusFilter, setStatusFilter] = useState<ScholarshipApplicationStatus | "all">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadTrackers() {
      if (!user) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("student_scholarship_trackers")
          .select("*, scholarships(*)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (!ignore && !error && data) {
          setTrackers(data as StudentScholarshipTracker[]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadTrackers();

    return () => {
      ignore = true;
    };
  }, [user]);

  const handleUpdateStatus = async (
    trackerId: string,
    newStatus: ScholarshipApplicationStatus
  ) => {
    try {
      await supabase
        .from("student_scholarship_trackers")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", trackerId);

      setTrackers((prev) =>
        prev.map((t) => (t.id === trackerId ? { ...t, status: newStatus } : t))
      );
    } catch {
      alert("Failed to update application status.");
    }
  };

  const handleSaveNotes = async (trackerId: string) => {
    try {
      await supabase
        .from("student_scholarship_trackers")
        .update({
          personal_notes: editNotes,
          target_deadline: editDeadline || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", trackerId);

      setTrackers((prev) =>
        prev.map((t) =>
          t.id === trackerId
            ? { ...t, personal_notes: editNotes, target_deadline: editDeadline || null }
            : t
        )
      );
      setEditingId(null);
    } catch {
      alert("Failed to save personal notes.");
    }
  };

  const handleDelete = async (trackerId: string) => {
    if (!confirm("Remove this scholarship from your application tracker?")) return;
    try {
      await supabase
        .from("student_scholarship_trackers")
        .delete()
        .eq("id", trackerId);

      setTrackers((prev) => prev.filter((t) => t.id !== trackerId));
    } catch {
      alert("Failed to remove item.");
    }
  };

  const filteredTrackers = trackers.filter(
    (t) => statusFilter === "all" || t.status === statusFilter
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          href="/dashboard/student"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5C899D] hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C899D]">
            Private Workspace
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
            My Scholarship Applications
          </h1>
          <p className="text-xs text-slate-500">
            Track milestones, personal notes, and submission deadlines securely.
          </p>
        </div>

        <Link
          href="/scholarships"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#74B49B] hover:bg-[#5f9c85] text-white text-xs font-semibold rounded-xl transition shadow-xs"
        >
          <GraduationCap className="w-4 h-4" /> Browse More Scholarships
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            statusFilter === "all"
              ? "bg-slate-800 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          All ({trackers.length})
        </button>
        {(Object.keys(STATUS_CONFIG) as ScholarshipApplicationStatus[]).map((key) => {
          const count = trackers.filter((t) => t.status === key).length;
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                statusFilter === key
                  ? "bg-[#5C899D] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {STATUS_CONFIG[key].label} ({count})
            </button>
          );
        })}
      </div>

      {/* Tracked List */}
      {loading ? (
        <div className="h-44 bg-slate-100 rounded-3xl animate-pulse" />
      ) : filteredTrackers.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <GraduationCap className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No scholarships in this stage</h3>
          <p className="text-xs text-slate-500">
            Explore the directory and click &quot;Add to Tracker&quot; on opportunities you want to pursue.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTrackers.map((t) => {
            const sch = t.scholarships;
            if (!sch) return null;

            const config = STATUS_CONFIG[t.status];
            const StatusIcon = config.icon;

            return (
              <div
                key={t.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${config.bg} ${config.text}`}
                      >
                        <StatusIcon className="w-3 h-3" /> {config.label}
                      </span>
                      <span className="text-xs text-slate-400">
                        Level: {sch.study_level}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-800 pt-1">{sch.title}</h3>
                    <p className="text-xs text-[#5C899D] font-semibold">{sch.provider}</p>
                  </div>

                  {/* Stage Dropdown Selector */}
                  <div className="flex items-center gap-2">
                    <select
                      value={t.status}
                      onChange={(e) =>
                        handleUpdateStatus(
                          t.id,
                          e.target.value as ScholarshipApplicationStatus
                        )
                      }
                      className="text-xs py-1.5 px-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-[#74B49B]"
                    >
                      <option value="interested">Interested</option>
                      <option value="planning">Planning</option>
                      <option value="applied">Applied</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="rejected">Not Selected</option>
                      <option value="completed">Received / Awarded</option>
                    </select>

                    <button
                      onClick={() => handleDelete(t.id)}
                      className="p-1.5 text-slate-300 hover:text-rose-600 rounded transition"
                      title="Remove from tracker"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Deadlines & Benefit */}
                <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/60">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    <span>Official Deadline: <strong className="text-slate-800">{sch.deadline_date || "Rolling"}</strong></span>
                  </div>
                  {t.target_deadline && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#5C899D]" />
                      <span>My Target: <strong className="text-slate-800">{t.target_deadline}</strong></span>
                    </div>
                  )}
                  <div>
                    Benefit: <strong className="text-emerald-700">{sch.amount_benefit}</strong>
                  </div>
                  <a
                    href={sch.official_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-[#5C899D] hover:underline inline-flex items-center gap-1 font-semibold"
                  >
                    Portal <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Personal Notes Box */}
                {editingId === t.id ? (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-[#74B49B]/40 space-y-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Personal Application Notes & Checklist
                      </label>
                      <textarea
                        rows={3}
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Draft SOP status, documents needed, recommendation contacts..."
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-[#74B49B]"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-600 font-medium">Target Deadline:</label>
                        <input
                          type="date"
                          value={editDeadline}
                          onChange={(e) => setEditDeadline(e.target.value)}
                          className="px-2 py-1 text-xs border border-slate-200 rounded-xl bg-white"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-200 rounded-xl"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveNotes(t.id)}
                          className="px-4 py-1.5 bg-[#74B49B] text-white text-xs font-semibold rounded-xl shadow-xs"
                        >
                          Save Notes
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/50 text-xs">
                    <div className="space-y-1">
                      <span className="font-bold text-slate-700 block">Personal Notes:</span>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        {t.personal_notes || "No notes added yet. Click 'Edit Notes' to add your preparation checklist."}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingId(t.id);
                        setEditNotes(t.personal_notes || "");
                        setEditDeadline(t.target_deadline || "");
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5C899D] hover:underline shrink-0 ml-3"
                    >
                      <Edit3 className="w-3 h-3" /> Edit Notes
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}