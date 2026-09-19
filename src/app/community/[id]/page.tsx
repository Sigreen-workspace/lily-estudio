"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  supabase,
  ForumPost,
  ForumAnswer,
} from "@/lib/supabase";
import RoleBadge from "@/components/RoleBadge";
import {
  ArrowLeft,
  MessageCircle,
  Flag,
  CheckCircle2,
  Send,
  X,
  AlertTriangle,
} from "lucide-react";

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const postId = resolvedParams.id;

  const { user } = useAuth();
  const [post, setPost] = useState<ForumPost | null>(null);
  const [answers, setAnswers] = useState<ForumAnswer[]>([]);
  const [newAnswer, setNewAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Free In-House Report State
  const [reportTarget, setReportTarget] = useState<{
    type: "post" | "answer";
    id: string;
  } | null>(null);
  const [reportReason, setReportReason] = useState("Spam or misleading content");
  const [reportDetails, setReportDetails] = useState("");
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function fetchPostAndAnswers() {
      try {
        const [pRes, aRes] = await Promise.all([
          supabase
            .from("forum_posts")
            .select("*, profiles(*)")
            .eq("id", postId)
            .single(),
          supabase
            .from("forum_answers")
            .select("*, profiles(*)")
            .eq("post_id", postId)
            .order("is_accepted", { ascending: false })
            .order("upvotes_count", { ascending: false }),
        ]);

        if (!ignore) {
          if (!pRes.error && pRes.data) {
            setPost(pRes.data as ForumPost);
          }
          if (!aRes.error && aRes.data) {
            setAnswers(aRes.data as ForumAnswer[]);
          }
        }
      } catch (err) {
        console.error("Failed to load discussion:", err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchPostAndAnswers();

    return () => {
      ignore = true;
    };
  }, [postId]);

  const reloadPostAndAnswers = async () => {
    try {
      const [pRes, aRes] = await Promise.all([
        supabase
          .from("forum_posts")
          .select("*, profiles(*)")
          .eq("id", postId)
          .single(),
        supabase
          .from("forum_answers")
          .select("*, profiles(*)")
          .eq("post_id", postId)
          .order("is_accepted", { ascending: false })
          .order("upvotes_count", { ascending: false }),
      ]);

      if (!pRes.error && pRes.data) {
        setPost(pRes.data as ForumPost);
      }
      if (!aRes.error && aRes.data) {
        setAnswers(aRes.data as ForumAnswer[]);
      }
    } catch (err) {
      console.error("Failed to refresh discussion:", err);
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newAnswer.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("forum_answers").insert({
        post_id: postId,
        author_id: user.id,
        content: newAnswer.trim(),
      });

      if (!error) {
        setNewAnswer("");
        if (post) {
          await supabase
            .from("forum_posts")
            .update({ answers_count: post.answers_count + 1 })
            .eq("id", postId);
        }
        await reloadPostAndAnswers();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkAccepted = async (answerId: string) => {
    if (!user || user.id !== post?.author_id) return;

    try {
      await supabase
        .from("forum_answers")
        .update({ is_accepted: true })
        .eq("id", answerId);

      await supabase
        .from("forum_posts")
        .update({ is_solved: true })
        .eq("id", postId);

      await reloadPostAndAnswers();
    } catch {
      alert("Failed to mark accepted solution.");
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reportTarget) return;

    setReporting(true);
    try {
      const { error } = await supabase.from("forum_reports").insert({
        reporter_id: user.id,
        target_type: reportTarget.type,
        target_id: reportTarget.id,
        reason: reportReason,
        details: reportDetails.trim(),
      });

      if (!error) {
        alert("Report submitted for academic review. Thank you for keeping the forum safe.");
        setReportTarget(null);
        setReportDetails("");
      } else {
        alert("Could not submit report.");
      }
    } finally {
      setReporting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-4">
        <div className="h-44 bg-slate-100 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-3">
        <h2 className="text-xl font-bold text-slate-800">Discussion Not Found</h2>
        <Link href="/community" className="text-sm text-[#5C899D] hover:underline">
          Return to Forum
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          href="/community"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5C899D] hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to All Topics
        </Link>
      </div>

      {/* Main Question Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
              {post.category.replace("_", " ")}
            </span>
            {post.is_solved && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" /> Solved Question
              </span>
            )}
          </div>

          {user && (
            <button
              onClick={() => setReportTarget({ type: "post", id: post.id })}
              className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-600 transition"
              title="Report Question"
            >
              <Flag className="w-3 h-3" /> Report
            </button>
          )}
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800">
          {post.title}
        </h1>

        <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
          {post.content}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">
              {post.profiles?.full_name || "Scholar"}
            </span>
            <RoleBadge role={post.profiles?.role} />
          </div>

          <span>Asked on {new Date(post.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Answers Section Header */}
      <div className="flex items-center justify-between pt-2">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-[#74B49B]" /> {answers.length} Responses
        </h2>
      </div>

      {/* Answers List */}
      <div className="space-y-4">
        {answers.map((ans) => (
          <div
            key={ans.id}
            className={`p-6 rounded-3xl border transition space-y-3 ${
              ans.is_accepted
                ? "bg-emerald-50/30 border-emerald-300 ring-1 ring-emerald-300/40"
                : "bg-white border-slate-200/80 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-800">
                  {ans.profiles?.full_name || "Scholar"}
                </span>
                <RoleBadge role={ans.profiles?.role} />
                <span className="text-[10px] text-slate-400">
                  {new Date(ans.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {ans.is_accepted && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Solution
                  </span>
                )}
                {user && user.id === post.author_id && !ans.is_accepted && (
                  <button
                    onClick={() => handleMarkAccepted(ans.id)}
                    className="text-[11px] font-bold text-[#74B49B] hover:underline"
                  >
                    Accept Solution
                  </button>
                )}
                {user && (
                  <button
                    onClick={() => setReportTarget({ type: "answer", id: ans.id })}
                    className="text-slate-300 hover:text-rose-500 p-1"
                    title="Report Answer"
                  >
                    <Flag className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed">
              {ans.content}
            </p>
          </div>
        ))}
      </div>

      {/* Answer Form */}
      {user ? (
        <form
          onSubmit={handleSubmitAnswer}
          className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-3"
        >
          <label className="block text-xs font-bold text-slate-800">
            Share Your Knowledge or Solution
          </label>
          <textarea
            rows={4}
            required
            placeholder="Write a clear, academic answer. Reference textbooks or equations where applicable..."
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
            className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#74B49B] hover:bg-[#5f9c85] text-white text-xs font-semibold rounded-xl shadow-xs transition"
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? "Posting..." : "Post Solution"}
            </button>
          </div>
        </form>
      ) : (
        <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl text-center space-y-2">
          <p className="text-xs text-slate-600">Want to participate in this discussion?</p>
          <Link
            href="/auth/login"
            className="inline-block px-4 py-1.5 bg-[#5C899D] text-white text-xs font-semibold rounded-xl"
          >
            Sign In to Answer
          </Link>
        </div>
      )}

      {/* Free In-House Moderation Modal */}
      {reportTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-1.5 text-rose-600">
                <AlertTriangle className="w-4 h-4" />
                <h3 className="text-sm font-bold">Report Community Content</h3>
              </div>
              <button
                onClick={() => setReportTarget(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Reason for Report
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Spam or misleading content">Spam or misleading content</option>
                  <option value="Academic dishonesty or homework copying">Academic dishonesty or homework copying</option>
                  <option value="Harassment or inappropriate behavior">Harassment or inappropriate behavior</option>
                  <option value="Off-topic or irrelevant discussion">Off-topic or irrelevant discussion</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Additional Details (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide context for our moderators..."
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReportTarget(null)}
                  className="px-3 py-1.5 rounded-xl text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reporting}
                  className="px-4 py-1.5 bg-rose-600 text-white font-semibold rounded-xl shadow-xs"
                >
                  {reporting ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}