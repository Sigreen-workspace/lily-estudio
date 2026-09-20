"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase, FlashcardDeck, AcademicTrack } from "@/lib/supabase";
import {
  Layers,
  Plus,
  Search,
  BookOpen,
  Sparkles,
  Lock,
  Globe,
  Trash2
} from "lucide-react";

export default function FlashcardsPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "my">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [trackFilter, setTrackFilter] = useState<AcademicTrack | "all">("all");
  const [loading, setLoading] = useState(true);

  // New deck creation modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newTrack, setNewTrack] = useState<AcademicTrack>("college");
  const [newSubject, setNewSubject] = useState("");
  const [newIsPublic, setNewIsPublic] = useState(false);
  const [creating, setCreating] = useState(false);

  // Check if user is teacher or admin
  const isTeacherOrAdmin = profile?.role === "teacher" || profile?.role === "admin" || profile?.assigned_roles?.includes("admin");

  useEffect(() => {
    let ignore = false;

    async function loadDecks() {
      setLoading(true);
      try {
        let query = supabase.from("flashcard_decks").select("*");
        if (activeTab === "my" && user) {
          query = query.eq("created_by", user.id);
        }

        const { data, error } = await query.order("created_at", { ascending: false });
        if (!ignore && !error && data) {
          setDecks(data as FlashcardDeck[]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadDecks();

    return () => {
      ignore = true;
    };
  }, [user, activeTab]);

  if (profile?.role === "mentor") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Mentor Portal Access</h2>
        <p className="text-xs text-slate-500">
          As an academic mentor, your workspace is dedicated to managing student appointments and advisory requests.
        </p>
        <Link
          href="/dashboard/mentor"
          className="inline-block px-5 py-2.5 bg-[#5C899D] text-white text-xs font-semibold rounded-xl shadow-xs"
        >
          Go to Mentor Hub
        </Link>
      </div>
    );
  }

  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTitle.trim()) return;
    setCreating(true);

    try {
      const finalIsPublic = isTeacherOrAdmin ? newIsPublic : false;

      const { data, error } = await supabase
        .from("flashcard_decks")
        .insert({
          title: newTitle,
          description: newDescription,
          academic_track: newTrack,
          subject_name: newSubject || "General",
          is_public: finalIsPublic,
          created_by: user.id,
          card_count: 0,
        })
        .select()
        .single();

      if (error) throw error;

      setShowCreateModal(false);
      setNewTitle("");
      setNewDescription("");
      setNewSubject("");
      setNewIsPublic(false);

      // Deck banne ke baad seedhe us deck ke study/management page par redirect karein jahan multiple cards add kiye ja sakein
      if (data) {
        router.push(`/flashcards/${data.id}`);
      }
    } catch {
      alert("Failed to create deck.");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteDeck = async (deckId: string) => {
    if (!confirm("Are you sure you want to delete this deck and all its cards?")) return;
    try {
      const { error } = await supabase.from("flashcard_decks").delete().eq("id", deckId);
      if (error) throw error;
      setDecks((prev) => prev.filter((d) => d.id !== deckId));
    } catch {
      alert("Failed to delete deck.");
    }
  };

  const filteredDecks = decks.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      Boolean(d.description?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      d.subject_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTrack = trackFilter === "all" || d.academic_track === trackFilter;
    return matchesSearch && matchesTrack;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-[#A7D7C5]/30 to-[#A2C4C9]/30 rounded-3xl p-6 sm:p-8 border border-[#74B49B]/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-[#427563] shadow-2xs">
            Spaced Repetition &amp; Recall
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">
            Interactive <span className="text-[#5C899D]">Flashcards</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Master definitions, exam formulas, and key concepts through Leitner spaced repetition. Retain knowledge longer with confidence ratings.
          </p>
        </div>

        {user && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#74B49B] hover:bg-[#5f9c85] text-white text-xs font-semibold rounded-xl shadow-xs transition shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Flashcard Deck
          </button>
        )}
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "all"
                ? "bg-[#74B49B] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Decks
          </button>
          {user && (
            <button
              onClick={() => setActiveTab("my")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === "my"
                  ? "bg-[#5C899D] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              My Decks
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search decks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-[#74B49B]"
            />
          </div>

          <select
            value={trackFilter}
            onChange={(e) => setTrackFilter(e.target.value as AcademicTrack | "all")}
            className="py-2 px-3 text-xs border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#74B49B]"
          >
            <option value="all">All Tracks</option>
            <option value="school">School</option>
            <option value="college">College</option>
            <option value="competitive_exam">Exams</option>
            <option value="study_abroad">Abroad</option>
          </select>
        </div>
      </div>

      {/* Decks Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-48 bg-slate-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filteredDecks.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <Layers className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No flashcard decks found</h3>
          <p className="text-xs text-slate-500">Create your own revision deck to start active recall practice.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDecks.map((deck) => {
            const isOwner = user && deck.created_by === user.id;

            return (
              <div
                key={deck.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#74B49B]/15 text-[#427563]">
                        {deck.subject_name}
                      </span>
                      <span className="text-[10px] text-slate-400 capitalize">
                        {deck.academic_track}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-400">
                      {deck.is_public ? (
                        <span title="Public Deck" className="inline-flex">
                          <Globe className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span title="Private Deck" className="inline-flex">
                          <Lock className="w-3.5 h-3.5" />
                        </span>
                      )}
                      {isOwner && (
                        <button
                          onClick={() => handleDeleteDeck(deck.id)}
                          className="p-1 text-slate-300 hover:text-rose-500 rounded transition cursor-pointer"
                          title="Delete Deck"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-800 line-clamp-1">
                    {deck.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {deck.description || "Active recall flashcards for exam review."}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-[#5C899D]" />
                    {deck.card_count || 0} Cards
                  </span>

                  <Link
                    href={`/flashcards/${deck.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#5C899D] hover:bg-[#4a7285] text-white text-xs font-semibold rounded-xl transition shadow-2xs"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> Study Deck
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Deck Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-800">Create New Flashcard Deck</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateDeck} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deck Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GRE High-Frequency Vocabulary"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#74B49B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="What concepts does this deck cover?"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#74B49B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vocabulary / Math"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Track</label>
                  <select
                    value={newTrack}
                    onChange={(e) => setNewTrack(e.target.value as AcademicTrack)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="school">School</option>
                    <option value="college">College</option>
                    <option value="competitive_exam">Competitive Exam</option>
                    <option value="study_abroad">Study Abroad</option>
                  </select>
                </div>
              </div>

              {isTeacherOrAdmin ? (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="is_public_checkbox"
                    checked={newIsPublic}
                    onChange={(e) => setNewIsPublic(e.target.checked)}
                    className="w-4 h-4 accent-[#74B49B] rounded cursor-pointer"
                  />
                  <label htmlFor="is_public_checkbox" className="text-xs text-slate-600 cursor-pointer">
                    Make deck publicly available to all students (Teacher Console)
                  </label>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">
                  Note: As a student, your decks are created as private by default for your personal revision.
                </p>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-[#74B49B] hover:bg-[#5f9c85] text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
                >
                  {creating ? "Creating..." : "Create Deck & Add Cards"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}