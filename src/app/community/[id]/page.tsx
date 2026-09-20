"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Trash2,
  ThumbsUp,
  ShieldAlert,
} from "lucide-react";

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const postId = resolvedParams.id;
  const router = useRouter();

  const { user, profile } = useAuth();
  const [post, setPost] = useState<ForumPost | null>(null);
  const [answers, setAnswers] = useState<ForumAnswer[]>([]);
  const [userUpvotes, setUserUpvotes] = useState<Set<string>>(new Set());
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

        if (user) {
          const { data: upvoteData } = await supabase
            .from("forum_upvotes")
            .select("target_id")
            .eq("user_id", user.id);

          if (!ignore && upvoteData) {
            setUserUpvotes(new Set(upvoteData.map((u) => u.target_id)));
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
  }, [postId, user]);

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

      if (user) {
        const { data: upvoteData } = await supabase
          .from("forum_upvotes")
          .select("target_id")
          .eq("user_id", user.id);

        if (upvoteData) {
          setUserUpvotes(new Set(upvoteData.map((u) => u.target_id)));
        }
      }
    } catch (err) {
      console.error("Failed to refresh discussion:", err);
    }
  };

  const handleToggleUpvote = async (targetId: string, targetType: "post" | "answer", currentCount: number) => {
    if (!user) {
      alert("Please log in to like/upvote discussions.");
      return;
    }

    const isUpvoted = userUpvotes.has(targetId);
    const newCount = isUpvoted ? Math.max(0, currentCount - 1) : currentCount + 1;

    setUserUpvotes((prev) => {
      const next = new Set(prev);
      if (isUpvoted) next.delete(targetId);
      else next.add(targetId);
      return next;
    });

    if (targetType === "post") {
      if (post) setPost({ ...post, upvotes_count: newCount });
    } else {
      setAnswers((prev) =>
        prev.map((a) => (a.id === targetId ? { ...a, upvotes_count: newCount } : a))
      );
    }

    try {
      if (isUpvoted) {
        await supabase
          .from("forum_upvotes")
          .delete()
          .eq("user_id", user.id)
          .eq("target_type", targetType)
          .eq("target_id", targetId);
      } else {
        await supabase.from("forum_upvotes").insert({
          user_id: user.id,
          target_type: targetType,
          target_id: targetId,
        });
      }

      const tableName = targetType === "post" ? "forum_posts" : "forum_answers";
      await supabase
        .from(tableName)
        .update({ upvotes_count: newCount })
        .eq("id", targetId);
    } catch {
      await reloadPostAndAnswers();
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please sign in to post a solution.");
      return;
    }
    if (!newAnswer.trim()) {
      alert("Please write a response before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Insert answer into forum_answers table
      const { error: insertError } = await supabase.from("forum_answers").insert({
        post_id: postId,
        author_id: user.id,
        content: newAnswer.trim(),
      });

      if (insertError) throw new Error(insertError.message);

      // 2. Fetch total actual answers count and update forum_posts
      const { count } = await supabase
        .from("forum_answers")
        .select("*", { count: "exact", head: true })
        .eq("post_id", postId);

      const totalCount = count || 0;

      await supabase
        .from("forum_posts")
        .update({ answers_count: totalCount })
        .eq("id", postId);

      setNewAnswer("");
      await reloadPostAndAnswers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      alert("Failed to post solution: " + msg);
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

  const handleDeletePost = async () => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    const { error } = await supabase.from("forum_posts").delete().eq("id", postId);
    if (!error) {
      router.push("/community");
    } else {
      alert("Failed to delete post: " + error.message);
    }
  };

  const handleDeleteAnswer = async (answerId: string) => {
    if (!confirm("Are you sure you want to delete this answer?")) return;
    const { error } = await supabase.from("forum_answers").delete().eq("id", answerId);
    if (!error) {
      if (post) {
        await supabase
          .from("forum_posts")
          .update({ answers_count: Math.max(0, post.answers_count - 1) })
          .eq("id", postId);
      }
      await reloadPostAndAnswers();
    } else {
      alert("Failed to delete answer: " + error.message);
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

  const isAdmin = profile?.role === "admin" || profile?.assigned_roles?.includes("admin");
  const isTeacher = profile?.role === "teacher" || profile?.is_teacher_verified;
  const isMentor = profile?.role === "mentor";
  const canAnswer = Boolean(isAdmin || isTeacher || isMentor);

  const isPostAuthor = user?.id === post.author_id;
  const isPostUpvoted = userUpvotes.has(post.id);

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

          <div className="flex items-center gap-3">
            {user && (isPostAuthor || isAdmin) && (
              <button
                onClick={handleDeletePost}
                className="inline-flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-800 font-semibold transition cursor-pointer"
                title="Delete Question"
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            )}

            {user && (
              <button
                onClick={() => setReportTarget({ type: "post", id: post.id })}
                className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-600 transition cursor-pointer"
                title="Report Question"
              >
                <Flag className="w-3 h-3" /> Report
              </button>
            )}
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800">
          {post.title}
        </h1>

        <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
          {post.content}
        </p>

        {/* Upvote / Like Action Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
          <button
            onClick={() => handleToggleUpvote(post.id, "post", post.upvotes_count)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition cursor-pointer ${
              isPostUpvoted
                ? "bg-[#74B49B]/10 border-[#74B49B] text-[#427563]"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${isPostUpvoted ? "fill-[#74B49B]" : ""}`} />
            <span className="font-bold">{post.upvotes_count} Likes</span>
          </button>

          <div className="flex items-center gap-2 text-slate-500">
            <span className="font-semibold text-slate-700">
              {post.profiles?.full_name || "Scholar"}
            </span>
            <RoleBadge role={post.profiles?.role} />
            <span>• {new Date(post.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Answers Section Header */}
      <div className="flex items-center justify-between pt-2">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-[#74B49B]" /> {answers.length} {answers.length === 1 ? "Response" : "Responses"}
        </h2>
      </div>

      {/* Answers List */}
      <div className="space-y-4">
        {answers.map((ans) => {
          const isAnswerAuthor = user?.id === ans.author_id;
          const isAnsUpvoted = userUpvotes.has(ans.id);

          return (
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

                <div className="flex items-center gap-3">
                  {ans.is_accepted && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Solution
                    </span>
                  )}
                  {user && user.id === post.author_id && !ans.is_accepted && (
                    <button
                      onClick={() => handleMarkAccepted(ans.id)}
                      className="text-[11px] font-bold text-[#74B49B] hover:underline cursor-pointer"
                    >
                      Accept Solution
                    </button>
                  )}

                  {user && (isAnswerAuthor || isAdmin) && (
                    <button
                      onClick={() => handleDeleteAnswer(ans.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500 hover:text-rose-700 transition cursor-pointer"
                      title="Delete Answer"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  )}

                  {user && (
                    <button
                      onClick={() => setReportTarget({ type: "answer", id: ans.id })}
                      className="text-slate-300 hover:text-rose-500 p-1 cursor-pointer"
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

              {/* Answer Upvote Button */}
              <div className="pt-2 flex items-center">
                <button
                  onClick={() => handleToggleUpvote(ans.id, "answer", ans.upvotes_count)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border text-xs transition cursor-pointer ${
                    isAnsUpvoted
                      ? "bg-[#74B49B]/10 border-[#74B49B] text-[#427563]"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <ThumbsUp className={`w-3 h-3 ${isAnsUpvoted ? "fill-[#74B49B]" : ""}`} />
                  <span className="font-semibold">{ans.upvotes_count} Likes</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Answer Form (Restricted to Teachers, Mentors, and Admins) */}
      {user ? (
        canAnswer ? (
          <form
            onSubmit={handleSubmitAnswer}
            className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-3"
          >
            <label className="block text-xs font-bold text-slate-800">
              Share Your Knowledge or Solution (Educator / Mentor Portal)
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
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#74B49B] hover:bg-[#5f9c85] text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                {submitting ? "Posting..." : "Post Solution"}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 bg-amber-50/50 border border-amber-200/80 rounded-3xl text-center space-y-2">
            <ShieldAlert className="w-6 h-6 text-amber-600 mx-auto" />
            <h3 className="text-xs font-bold text-slate-800">Educator &amp; Mentor Privilege Only</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Only verified teachers, academic mentors, and administrators are permitted to post answers and solutions in this academic network.
            </p>
          </div>
        )
      ) : (
        <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl text-center space-y-2">
          <p className="text-xs text-slate-600">Want to participate in this discussion?</p>
          <Link
            href="/auth/login"
            className="inline-block px-4 py-1.5 bg-[#5C899D] text-white text-xs font-semibold rounded-xl"
          >
            Sign In to Account
          </Link>
        </div>
      )}

      {/* Moderation Report Modal */}
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
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
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
                  className="px-3 py-1.5 rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reporting}
                  className="px-4 py-1.5 bg-rose-600 text-white font-semibold rounded-xl shadow-xs cursor-pointer"
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