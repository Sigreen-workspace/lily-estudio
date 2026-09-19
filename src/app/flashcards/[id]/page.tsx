"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { supabase, FlashcardDeck, FlashcardCard, FlashcardReview } from "@/lib/supabase";
import {
  ArrowLeft,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Plus,
  Trash2,
  Layers,
  Calendar,
  Sparkles
} from "lucide-react";

export default function FlashcardStudyPage() {
  const params = useParams();
  const deckId = params?.id as string;
  const { user } = useAuth();

  const [deck, setDeck] = useState<FlashcardDeck | null>(null);
  const [cards, setCards] = useState<FlashcardCard[]>([]);
  const [reviews, setReviews] = useState<Record<string, FlashcardReview>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [loading, setLoading] = useState(true);

  // Card authoring drawer for owners
  const [showAddCard, setShowAddCard] = useState(false);
  const [frontText, setFrontText] = useState("");
  const [backText, setBackText] = useState("");
  const [hintText, setHintText] = useState("");
  const [savingCard, setSavingCard] = useState(false);

  // Session stats
  const [sessionStats, setSessionStats] = useState({ known: 0, needReview: 0 });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: deckData } = await supabase
        .from("flashcard_decks")
        .select("*")
        .eq("id", deckId)
        .single();

      const { data: cardData } = await supabase
        .from("flashcard_cards")
        .select("*")
        .eq("deck_id", deckId)
        .order("order_index", { ascending: true });

      setDeck(deckData as FlashcardDeck);
      setCards((cardData as FlashcardCard[]) || []);

      if (user) {
        const { data: revData } = await supabase
          .from("flashcard_reviews")
          .select("*")
          .eq("deck_id", deckId)
          .eq("user_id", user.id);

        if (revData) {
          const map: Record<string, FlashcardReview> = {};
          revData.forEach((r: FlashcardReview) => {
            map[r.card_id] = r;
          });
          setReviews(map);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [deckId, user]);

  useEffect(() => {
    if (deckId) loadData();
  }, [deckId, loadData]);

  // Handle Card Response with Leitner Spaced Repetition Logic
  const handleAnswer = async (known: boolean) => {
    if (!cards[currentIndex]) return;
    const currentCard = cards[currentIndex];
    setIsFlipped(false);
    setShowHint(false);

    if (known) {
      setSessionStats((s) => ({ ...s, known: s.known + 1 }));
    } else {
      setSessionStats((s) => ({ ...s, needReview: s.needReview + 1 }));
    }

    if (user) {
      const existingRev = reviews[currentCard.id];
      const currentBox = existingRev?.box_level || 1;

      // Spaced Repetition interval mapping
      const nextBox = known ? Math.min(5, currentBox + 1) : 1;
      let intervalDays = 1;
      if (nextBox === 2) intervalDays = 3;
      if (nextBox === 3) intervalDays = 7;
      if (nextBox === 4) intervalDays = 14;
      if (nextBox === 5) intervalDays = 30;

      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + (known ? intervalDays : 0));

      const payload = {
        user_id: user.id,
        card_id: currentCard.id,
        deck_id: deckId,
        box_level: nextBox,
        interval_days: intervalDays,
        consecutive_correct: known ? (existingRev?.consecutive_correct || 0) + 1 : 0,
        total_reviews: (existingRev?.total_reviews || 0) + 1,
        last_reviewed_at: new Date().toISOString(),
        next_review_at: nextDate.toISOString(),
      };

      try {
        const { data: updated } = await supabase
          .from("flashcard_reviews")
          .upsert(payload, { onConflict: "user_id,card_id" })
          .select()
          .single();

        if (updated) {
          setReviews((prev) => ({ ...prev, [currentCard.id]: updated as FlashcardReview }));
        }
      } catch (err) {
        console.error("SRS sync error:", err);
      }
    }

    // Move to next card
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0); // Cycle back or complete session
    }
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!frontText.trim() || !backText.trim()) return;
    setSavingCard(true);

    try {
      const { data, error } = await supabase
        .from("flashcard_cards")
        .insert({
          deck_id: deckId,
          front_text: frontText,
          back_text: backText,
          hint_text: hintText || null,
          order_index: cards.length + 1,
        })
        .select()
        .single();

      if (error) throw error;

      // Update card count on deck
      await supabase
        .from("flashcard_decks")
        .update({ card_count: cards.length + 1, updated_at: new Date().toISOString() })
        .eq("id", deckId);

      setCards((prev) => [...prev, data as FlashcardCard]);
      setFrontText("");
      setBackText("");
      setHintText("");
      setShowAddCard(false);
    } catch {
      alert("Failed to attach card.");
    } finally {
      setSavingCard(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      await supabase.from("flashcard_cards").delete().eq("id", cardId);
      const remaining = cards.filter((c) => c.id !== cardId);
      setCards(remaining);
      if (currentIndex >= remaining.length && remaining.length > 0) {
        setCurrentIndex(0);
      }
    } catch {
      alert("Failed to remove card.");
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-10 h-10 border-3 border-[#A7D7C5] border-t-[#74B49B] rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500">Loading flashcards...</p>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Deck Not Found</h2>
        <Link href="/flashcards" className="text-xs text-[#5C899D] underline">
          Return to Deck Catalog
        </Link>
      </div>
    );
  }

  const isOwner = user && deck.created_by === user.id;
  const currentCard = cards[currentIndex];
  const currentReview = currentCard ? reviews[currentCard.id] : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/flashcards"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5C899D] hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to All Decks
        </Link>

        {isOwner && (
          <button
            onClick={() => setShowAddCard(!showAddCard)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#74B49B] text-white rounded-xl shadow-2xs hover:bg-[#5f9c85] transition"
          >
            <Plus className="w-3.5 h-3.5" /> Add Card to Deck
          </button>
        )}
      </div>

      {/* Deck Header & Progress */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C899D]">
            {deck.subject_name} • {deck.academic_track}
          </span>
          <h1 className="text-2xl font-bold text-slate-800">{deck.title}</h1>
          <p className="text-xs text-slate-500 mt-0.5">{deck.description}</p>
        </div>

        {/* Live Session Counter */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Known: {sessionStats.known}
          </div>
          <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
            <RotateCw className="w-3.5 h-3.5" /> Review: {sessionStats.needReview}
          </div>
        </div>
      </div>

      {/* Add Card Drawer (Owner Only) */}
      {showAddCard && (
        <form
          onSubmit={handleAddCard}
          className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4 shadow-xs"
        >
          <h3 className="text-sm font-bold text-slate-800">Add New Card</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Front (Question or Prompt)
              </label>
              <textarea
                rows={2}
                required
                placeholder="Enter question, concept, or term..."
                value={frontText}
                onChange={(e) => setFrontText(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Back (Answer or Explanation)
              </label>
              <textarea
                rows={3}
                required
                placeholder="Enter complete answer, formula, or proof..."
                value={backText}
                onChange={(e) => setBackText(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hint / Mnemonic (Optional)
              </label>
              <input
                type="text"
                placeholder="Helpful clue without giving away the answer..."
                value={hintText}
                onChange={(e) => setHintText(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddCard(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingCard}
              className="px-4 py-1.5 bg-[#74B49B] text-white text-xs font-semibold rounded-xl shadow-xs"
            >
              {savingCard ? "Saving..." : "Save Card"}
            </button>
          </div>
        </form>
      )}

      {/* Main Flashcard Interactive Area */}
      {cards.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <Layers className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">This deck is currently empty</h3>
          <p className="text-xs text-slate-500">
            {isOwner
              ? "Click 'Add Card to Deck' above to create your first question and answer card."
              : "The author has not populated cards for this deck yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Card Indicator & SRS Box Badge */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-2">
            <span className="font-semibold text-slate-700">
              Card {currentIndex + 1} of {cards.length}
            </span>

            {currentReview && (
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-[#5C899D]/15 text-[#5C899D] font-bold text-[10px]">
                  Leitner Box {currentReview.box_level}/5
                </span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Interval: {currentReview.interval_days}d
                </span>
              </div>
            )}
          </div>

          {/* 3D Flip Card Container */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="cursor-pointer min-h-80 bg-white rounded-3xl border-2 border-slate-200/90 shadow-md hover:border-[#74B49B]/50 transition-all p-8 flex flex-col justify-between select-none relative"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {isFlipped ? "Answer (Back)" : "Prompt (Front)"}
              </span>
              <span className="text-[11px] font-medium text-[#5C899D] flex items-center gap-1">
                <RotateCw className="w-3 h-3" /> Click to flip
              </span>
            </div>

            {/* Card Content Text */}
            <div className="py-8 text-center my-auto">
              <p className="text-lg sm:text-xl font-bold text-slate-800 whitespace-pre-line leading-relaxed">
                {isFlipped ? currentCard.back_text : currentCard.front_text}
              </p>

              {/* Hint Accordion */}
              {!isFlipped && currentCard.hint_text && (
                <div className="mt-4">
                  {showHint ? (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 inline-block max-w-md">
                      <span className="font-bold">Hint:</span> {currentCard.hint_text}
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowHint(true);
                      }}
                      className="text-xs font-semibold text-slate-400 hover:text-amber-600 inline-flex items-center gap-1"
                    >
                      <HelpCircle className="w-3.5 h-3.5" /> Show Hint
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Card Footer */}
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Press Space or Click to flip</span>
              {isOwner && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCard(currentCard.id);
                  }}
                  className="p-1 hover:text-rose-500 rounded"
                  title="Delete Card"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Action Responses (Know vs Need Review) */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleAnswer(false)}
              className="py-3 px-4 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-2xl text-amber-800 text-xs font-bold transition flex items-center justify-center gap-2 shadow-2xs"
            >
              <RotateCw className="w-4 h-4" /> Need Review (Box 1)
            </button>

            <button
              onClick={() => handleAnswer(true)}
              className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" /> Know (Advance Interval)
            </button>
          </div>
        </div>
      )}

      {/* Spaced Repetition Info Box */}
      <div className="bg-slate-50/70 border border-slate-200/80 rounded-3xl p-5 text-xs text-slate-600 space-y-2">
        <div className="flex items-center gap-1.5 font-bold text-slate-800">
          <Sparkles className="w-4 h-4 text-[#74B49B]" />
          About the Leitner Spaced Repetition Engine
        </div>
        <p className="leading-relaxed text-[11px] text-slate-500">
          Cards advance through boxes (1 to 5) as you answer &quot;Know&quot;. Cards rated &quot;Need Review&quot; reset to Box 1 for immediate consolidation, optimizing long-term memory consolidation before major academic exams.
        </p>
      </div>
    </div>
  );
}