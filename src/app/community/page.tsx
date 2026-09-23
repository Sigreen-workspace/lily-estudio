"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { supabase, ForumPost, CommunityCategory } from "@/lib/supabase";
import RoleBadge from "@/components/RoleBadge";
import {
  MessageSquare,
  Search,
  PlusCircle,
  ThumbsUp,
  MessageCircle,
  Tag,
  CheckCircle2,
  Filter,
  X,
  Send,
} from "lucide-react";

const CATEGORIES: { id: CommunityCategory | "all"; label: string }[] = [
  { id: "all", label: "All Topics" },
  { id: "school", label: "School (1-12)" },
  { id: "college", label: "College / University" },
  { id: "exams", label: "Competitive Exams" },
  { id: "scholarships", label: "Scholarships & Aid" },
  { id: "study_abroad", label: "Study Abroad" },
  { id: "career", label: "Career & Internships" },
  { id: "general", label: "General Learning" },
];

export default function CommunityPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [userUpvotes, setUserUpvotes] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CommunityCategory | "all">("all");
  const [loading, setLoading] = useState(true);

  // New Post Modal State
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<CommunityCategory>("college");
  const [newTags, setNewTags] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function fetchForumData() {
      try {
        const { data, error } = await supabase
          .from("forum_posts")
          .select("*, profiles(*)")
          .order("created_at", { ascending: false });

        if (!ignore && !error && data) {
          setPosts(data as ForumPost[]);
        }

        if (user) {
          const { data: upvoteData } = await supabase
            .from("forum_upvotes")
            .select("target_id")
            .eq("user_id", user.id)
            .eq("target_type", "post");

          if (!ignore && upvoteData) {
            setUserUpvotes(new Set(upvoteData.map((u) => u.target_id)));
          }
        }
      } catch (err) {
        console.error("Failed to load forum posts:", err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchForumData();

    return () => {
      ignore = true;
    };
  }, [user]);

  const reloadForumData = async () => {
    try {
      const { data, error } = await supabase
        .from("forum_posts")
        .select("*, profiles(*)")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setPosts(data as ForumPost[]);
      }

      if (user) {
        const { data: upvoteData } = await supabase
          .from("forum_upvotes")
          .select("target_id")
          .eq("user_id", user.id)
          .eq("target_type", "post");

        if (upvoteData) {
          setUserUpvotes(new Set(upvoteData.map((u) => u.target_id)));
        }
      }
    } catch (err) {
      console.error("Failed to reload forum posts:", err);
    }
  };

  const handleToggleUpvote = async (postId: string, currentCount: number) => {
    if (!user) {
      alert("Please log in to upvote discussions.");
      return;
    }

    const isUpvoted = userUpvotes.has(postId);
    const newCount = isUpvoted ? Math.max(0, currentCount - 1) : currentCount + 1;

    setUserUpvotes((prev) => {
      const next = new Set(prev);
      if (isUpvoted) next.delete(postId);
      else next.add(postId);
      return next;
    });

    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, upvotes_count: newCount } : p))
    );

    try {
      if (isUpvoted) {
        await supabase
          .from("forum_upvotes")
          .delete()
          .eq("user_id", user.id)
          .eq("target_type", "post")
          .eq("target_id", postId);
      } else {
        await supabase.from("forum_upvotes").insert({
          user_id: user.id,
          target_type: "post",
          target_id: postId,
        });
      }

      await supabase
        .from("forum_posts")
        .update({ upvotes_count: newCount })
        .eq("id", postId);
    } catch {
      await reloadForumData();
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!newTitle.trim() || !newContent.trim()) {
      alert("Please provide both a title and details.");
      return;
    }

    setSubmitting(true);
    const tagsArray = newTags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    try {
      const { error } = await supabase.from("forum_posts").insert({
        author_id: user.id,
        title: newTitle.trim(),
        content: newContent.trim(),
        category: newCategory,
        tags: tagsArray,
      });

      if (!error) {
        setNewTitle("");
        setNewContent("");
        setNewTags("");
        setShowModal(false);
        await reloadForumData();
      } else {
        alert("Failed to submit question. Check character lengths.");
      }
    } catch {
      alert("An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPosts = posts.filter((p) => {
    const matchesCategory =
      selectedCategory === "all" || p.category === selectedCategory;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      p.title.toLowerCase().includes(query) ||
      p.content.toLowerCase().includes(query) ||
      (p.tags && p.tags.some((t) => t.toLowerCase().includes(query)));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-[#A7D7C5]/30 to-[#A2C4C9]/30 rounded-3xl p-6 sm:p-8 border border-[#74B49B]/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-[#427563] shadow-2xs">
            Academic Community Forum
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">
            Teacher &amp; Mentor <span className="text-[#5C899D]">Knowledge Network</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Collaborative academic discussions, course inquiries, exam advice, and scholarship application insights.
          </p>
        </div>

        {user ? (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#74B49B] hover:bg-[#5f9c85] text-white text-xs font-semibold rounded-xl shadow-xs transition shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" /> Ask a Question
          </button>
        ) : (
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5C899D] hover:bg-[#4a7285] text-white text-xs font-semibold rounded-xl shadow-xs transition shrink-0"
          >
            Sign in to Ask
          </Link>
        )}
      </div>

      {/* Search & Category Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search questions by topic, tags, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#74B49B]/40 focus:border-[#74B49B] transition"
          />
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-[#74B49B] text-white shadow-2xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Post List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 bg-slate-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No discussions found</h3>
          <p className="text-xs text-slate-500">
            Be the first to ask an academic question in this category!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => {
            const isUpvoted = userUpvotes.has(post.id);
            const authorRole = post.profiles?.role;

            return (
              <div
                key={post.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:border-[#74B49B]/50 transition flex flex-col sm:flex-row gap-5 items-start"
              >
                {/* Upvote Column */}
                <button
                  type="button"
                  onClick={() => handleToggleUpvote(post.id, post.upvotes_count)}
                  className={`flex sm:flex-col items-center gap-1.5 px-3 py-2 sm:px-3 sm:py-2.5 rounded-2xl border transition shrink-0 cursor-pointer ${
                    isUpvoted
                      ? "bg-[#74B49B]/10 border-[#74B49B] text-[#427563]"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <ThumbsUp className={`w-4 h-4 ${isUpvoted ? "fill-[#74B49B]" : ""}`} />
                  <span className="text-xs font-bold">{post.upvotes_count}</span>
                </button>

                {/* Content Area */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                      {post.category.replace("_", " ")}
                    </span>
                    {post.is_solved && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Solved
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <Link href={`/community/${post.id}`} className="block group">
                    <h2 className="text-base sm:text-lg font-bold text-slate-800 group-hover:text-[#5C899D] transition leading-snug">
                      {post.title}
                    </h2>
                  </Link>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {post.content}
                  </p>

                  {/* Tags & Meta Row */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {post.tags &&
                        post.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] bg-slate-50 text-slate-500 border border-slate-200"
                          >
                            <Tag className="w-2.5 h-2.5" /> {tag}
                          </span>
                        ))}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      {/* Name removed, only RoleBadge shown */}
                      <RoleBadge role={authorRole} />

                      <Link
                        href={`/community/${post.id}`}
                        className="inline-flex items-center gap-1 text-[#5C899D] font-semibold hover:underline"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> {post.answers_count || 0} {post.answers_count === 1 ? "Answer" : "Answers"}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Question Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">Ask the Academic Community</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Topic Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as CommunityCategory)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="school">School (Class 1-12)</option>
                  <option value="college">College / University</option>
                  <option value="exams">Competitive Exams</option>
                  <option value="scholarships">Scholarships & Aid</option>
                  <option value="study_abroad">Study Abroad</option>
                  <option value="career">Career & Internships</option>
                  <option value="general">General Learning</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Question Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Best resources for JEE Advanced Physics rotational dynamics?"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Details & Context
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide background, what you have tried, and specific questions..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="physics, mechanics, syllabus"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#74B49B] text-white font-semibold rounded-xl shadow-xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submitting ? "Posting..." : "Publish Question"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}