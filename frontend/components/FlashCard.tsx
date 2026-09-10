"use client";

import { useState } from "react";
import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { FlashCard as FlashCardType } from "@/lib/types";

interface FlashCardProps {
  card: FlashCardType;
  onQuality: (quality: number) => void;
  isSubmitting?: boolean;
}

const qualityOptions = [
  { label: "Again", value: 0, className: "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200" },
  { label: "Hard", value: 2, className: "bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200" },
  { label: "Good", value: 4, className: "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200" },
  { label: "Easy", value: 5, className: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200" },
];

export function FlashCard({ card, onQuality, isSubmitting }: FlashCardProps) {
  const [flipped, setFlipped] = useState(false);

  function playAudio() {
    if (card.audio_url) {
      new Audio(card.audio_url).play().catch(() => {});
    }
  }

  function handleQuality(quality: number) {
    setFlipped(false);
    onQuality(quality);
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Card with flip animation */}
      <div
        className="card-flip-container w-full max-w-md cursor-pointer"
        onClick={() => setFlipped((f) => !f)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setFlipped((f) => !f)}
        aria-label={flipped ? "Flip to Nuer side" : "Flip to see English"}
      >
        <div className={`card-flip-inner ${flipped ? "flipped" : ""}`}>
          {/* Front — Nuer */}
          <div className="card-flip-front rounded-2xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="text-xs font-medium uppercase tracking-widest text-amber-500">
                Nuer
              </span>
              <p className="text-3xl font-semibold text-stone-800">{card.nuer_text}</p>
              {card.audio_url && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playAudio();
                  }}
                  className="mt-1 flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs text-amber-600 shadow-sm hover:bg-amber-100"
                >
                  <Volume2 className="h-3.5 w-3.5" />
                  Play audio
                </button>
              )}
              <p className="mt-2 text-xs text-stone-400">Tap to reveal</p>
            </div>
          </div>

          {/* Back — English */}
          <div className="card-flip-back rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="text-xs font-medium uppercase tracking-widest text-stone-400">
                English
              </span>
              <p className="text-3xl font-semibold text-stone-800">
                {card.english_text}
              </p>
              {card.item_type === "word" && (
                <p className="text-sm text-stone-400">({card.item_type})</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quality buttons — only shown when flipped */}
      {flipped && (
        <div className="flex w-full max-w-md gap-2">
          {qualityOptions.map(({ label, value, className }) => (
            <button
              key={value}
              onClick={() => handleQuality(value)}
              disabled={isSubmitting}
              className={`flex-1 rounded-xl py-3 text-sm font-medium transition-colors disabled:opacity-50 ${className}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {!flipped && (
        <p className="text-sm text-stone-400">
          Click the card to reveal the answer
        </p>
      )}
    </div>
  );
}
