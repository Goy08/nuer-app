"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { getLessonCards, submitProgress } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { FlashCard } from "@/components/FlashCard";
import { Spinner } from "@/components/ui/Spinner";
import type { FlashCard as FlashCardType } from "@/lib/types";

export default function LessonSessionPage() {
  const { category } = useParams<{ category: string }>();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);

  const [cards, setCards] = useState<FlashCardType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({ seen: 0, correct: 0 });

  const fetchCards = useCallback(async () => {
    if (!token) {
      router.push("/login");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await getLessonCards(category, token);
      setCards(res.cards);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load lesson");
    } finally {
      setLoading(false);
    }
  }, [category, token, router]);

  useEffect(() => {
    // This effect synchronizes the lesson with the selected URL category.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCards();
  }, [fetchCards]);

  async function handleQuality(quality: number) {
    if (!token || !cards[currentIndex]) return;
    const card = cards[currentIndex];
    setSubmitting(true);
    try {
      await submitProgress(
        { item_id: card.item_id, item_type: card.item_type, quality },
        token,
      );
      setStats((s) => ({
        seen: s.seen + 1,
        correct: s.correct + (quality >= 3 ? 1 : 0),
      }));
      setCurrentIndex((i) => i + 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save progress");
    } finally {
      setSubmitting(false);
    }
  }

  const done = currentIndex >= cards.length;

  if (!token) return null;

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="py-20 text-center text-red-500">{error}</p>
    );
  }

  if (done || cards.length === 0) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <CheckCircle className="mx-auto mb-4 h-14 w-14 text-emerald-500" />
        <h2 className="text-2xl font-bold text-stone-800">Session complete!</h2>
        <p className="mt-2 text-stone-500 capitalize">{category}</p>
        <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex justify-around text-center">
            <div>
              <p className="text-3xl font-bold text-stone-800">{stats.seen}</p>
              <p className="text-sm text-stone-400">Cards reviewed</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-emerald-600">{stats.correct}</p>
              <p className="text-sm text-stone-400">Correct (≥ Good)</p>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => {
              setCurrentIndex(0);
              setStats({ seen: 0, correct: 0 });
              fetchCards();
            }}
            className="rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-700"
          >
            Study again
          </button>
          <button
            onClick={() => router.push("/lessons")}
            className="rounded-xl border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            All lessons
          </button>
        </div>
      </div>
    );
  }

  const card = cards[currentIndex];
  const progress = Math.round((currentIndex / cards.length) * 100);

  return (
    <div className="mx-auto max-w-xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.push("/lessons")}
          className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Lessons
        </button>
        <span className="text-sm capitalize text-stone-700 font-medium">
          {category}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="mb-1 flex justify-between text-xs text-stone-400">
          <span>{currentIndex} / {cards.length} cards</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-stone-200">
          <div
            className="h-full rounded-full bg-amber-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <FlashCard
        key={card.item_id}
        card={card}
        onQuality={handleQuality}
        isSubmitting={submitting}
      />

      {error && (
        <p className="mt-4 text-center text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
