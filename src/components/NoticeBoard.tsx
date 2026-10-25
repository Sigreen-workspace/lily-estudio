"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { ExternalLink, Megaphone, Plus, Trash2, X } from "lucide-react";

interface Notice {
  id: string;
  title: string;
  content: string;
  link?: string;
  is_active: boolean;
  created_at: string;
}

export default function NoticeBoard() {
  const { profile } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states for adding notice
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [link, setLink] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Check if current user can manage notices (teacher, mentor, admin)
  const canManage = profile?.role && ["teacher", "mentor", "admin"].includes(profile.role);

  useEffect(() => {
    fetchNotices();
  }, []);

  async function fetchNotices() {
    try {
      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setNotices(data);
      }
    } catch (err) {
      console.error("Failed to load notices:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("notices").insert({
        title: title.trim(),
        content: content.trim(),
        link: link.trim() || null,
        is_active: true,
      });

      if (error) throw error;

      setTitle("");
      setContent("");
      setLink("");
      setShowAddModal(false);
      fetchNotices();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create notice";
      alert("Error: " + msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNotice = async (id: string) => {
    if (!confirm("Are you sure you want to remove this notice?")) return;

    try {
      const { error } = await supabase.from("notices").delete().eq("id", id);
      if (error) throw error;
      setNotices(notices.filter((n) => n.id !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete notice";
      alert("Error: " + msg);
    }
  };

  if (loading) return null;
  if (notices.length === 0 && !canManage) return null;

  return (
    <div className="bg-linear-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-5 shadow-xs space-y-3">
      <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
            <Megaphone className="w-4 h-4 animate-bounce" />
          </div>
          <h3 className="text-sm font-bold text-amber-900 tracking-tight">
            Important Notices &amp; Announcements
          </h3>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Post Notice
          </button>
        )}
      </div>

      {notices.length === 0 ? (
        <p className="text-xs text-slate-500 text-py py-2 text-center">No active announcements right now.</p>
      ) : (
        <div className="space-y-2.5">
          {notices.map((notice) => (
            <div
              key={notice.id}
              className="bg-white/90 backdrop-blur-xs p-3.5 rounded-xl border border-amber-100 flex items-start justify-between gap-3 shadow-2xs transition hover:shadow-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <strong className="text-xs font-bold text-slate-800">
                    {notice.title}
                  </strong>
                  <span className="text-[10px] text-slate-400">
                    {new Date(notice.created_at).toLocaleDateString()}
                  </span>
                </div>
                {notice.content && (
                  <p className="text-xs text-slate-600 pl-4 leading-relaxed">
                    {notice.content}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {notice.link && (
                  <a
                    href={notice.link}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 text-amber-700 hover:bg-amber-100 rounded-lg transition"
                    title="View Link"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

                {canManage && (
                  <button
                    type="button"
                    onClick={() => handleDeleteNotice(notice.id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete Notice"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal to Post Notice */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">Post New Notice</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNotice} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="Notice Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Content / Description</label>
                <textarea
                  rows={3}
                  placeholder="Detailed announcement description..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Action Link (Optional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl shadow-xs transition disabled:opacity-50"
                >
                  {submitting ? "Posting..." : "Publish Notice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}