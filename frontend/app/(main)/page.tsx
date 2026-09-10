"use client";

import { useState } from "react";
import { ArrowRightLeft, BookOpen, GraduationCap, Copy, Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { translateText, getDictionaryCategory } from "@/lib/api";
import { SourceBadge } from "@/components/SourceBadge";
import type { LangCode, TranslateResponse } from "@/lib/types";

const LANG_LABELS: Record<LangCode, string> = {
  eng_Latn: "English",
  nus_Latn: "Nuer",
};

const QUICK_PHRASES = [
  { label: "Hello",        text: "hello" },
  { label: "Thank you",    text: "thank you" },
  { label: "Good morning", text: "good morning" },
  { label: "How are you?", text: "how are you" },
  { label: "I love you",   text: "i love you" },
  { label: "Good night",   text: "good night" },
];

export default function TranslatePage() {
  const [sourceLang, setSourceLang] = useState<LangCode>("eng_Latn");
  const [targetLang, setTargetLang] = useState<LangCode>("nus_Latn");
  const [inputText, setInputText]   = useState("");
  const [result, setResult]         = useState<TranslateResponse | null>(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [copied, setCopied]         = useState(false);

  const { data: wodData } = useQuery({
    queryKey: ["wod"],
    queryFn: () => getDictionaryCategory("greetings"),
    staleTime: 24 * 60 * 60 * 1000,
  });
  const wod = wodData?.words?.[new Date().getDate() % (wodData.words.length || 1)];

  function swapLangs() {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setResult(null);
    setInputText("");
  }

  async function doTranslate(text: string) {
    if (!text.trim()) return;
    setInputText(text);
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await translateText({ text, source_lang: sourceLang, target_lang: targetLang });
      setResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Translation failed");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!result) return;
    navigator.clipboard.writeText(result.translated_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-2xl">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="mb-10 pt-4 text-center">
        {/* Top label */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          <span className="text-xs font-semibold uppercase tracking-widest text-amber-700">
            English · Nuer · nus_Latn
          </span>
        </div>

        <h1 className="font-display text-6xl font-bold italic leading-tight text-foreground">
          Naath
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Translate, learn, and help preserve the Nuer language —<br className="hidden sm:block" />
          spoken by over 1.8 million people in South Sudan & Ethiopia.
        </p>

        {/* Word of the day */}
        {wod && (
          <div className="animate-fade-in mt-5 inline-flex items-center gap-3 rounded-lg border border-amber-200/60 bg-amber-50 px-4 py-2.5">
            <div className="text-left">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Word of the Day</p>
              <p className="text-base font-bold text-amber-800">{wod.nuer_text}</p>
              <p className="text-xs text-muted-foreground">{wod.english_text}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Language selector ─────────────────────────────────────────────── */}
      <div className="mb-3 flex items-center gap-3">
        <div className="flex-1 rounded-lg border border-border bg-white px-4 py-2.5 text-center text-sm font-semibold text-foreground shadow-sm">
          {LANG_LABELS[sourceLang]}
        </div>
        <button
          onClick={swapLangs}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground shadow-sm transition hover:border-amber-300 hover:text-amber-600 active:scale-95"
          aria-label="Swap languages"
        >
          <ArrowRightLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 rounded-lg border border-border bg-white px-4 py-2.5 text-center text-sm font-semibold text-foreground shadow-sm">
          {LANG_LABELS[targetLang]}
        </div>
      </div>

      {/* ── Quick phrases ─────────────────────────────────────────────────── */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {QUICK_PHRASES.map(({ label, text }) => (
          <button
            key={text}
            onClick={() => doTranslate(text)}
            className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 active:scale-95"
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Translator card ───────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        <textarea
          className="w-full resize-none border-0 bg-transparent p-5 text-base text-foreground outline-none placeholder:text-muted-foreground/50"
          rows={4}
          placeholder={`Type ${LANG_LABELS[sourceLang]} here…`}
          value={inputText}
          onChange={(e) => { setInputText(e.target.value); if (result) setResult(null); }}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) doTranslate(inputText); }}
        />
        <div className="flex items-center justify-between border-t border-border bg-secondary/50 px-5 py-3">
          <span className="text-xs text-muted-foreground">
            {inputText.length > 0 ? `${inputText.length} chars` : "⌘ + Enter to translate"}
          </span>
          <button
            onClick={() => doTranslate(inputText)}
            disabled={!inputText.trim() || loading}
            className="rounded-lg bg-amber-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Translating…" : "Translate →"}
          </button>
        </div>
      </div>

      {/* ── Error ─────────────────────────────────────────────────────────── */}
      {error && (
        <div className="animate-fade-in mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Result ────────────────────────────────────────────────────────── */}
      {result && (
        <div className="animate-slide-up mt-3 overflow-hidden rounded-xl border border-amber-200 bg-amber-50 shadow-sm">
          <div className="flex items-center justify-between border-b border-amber-100 px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-700">
                {LANG_LABELS[targetLang]}
              </span>
              <SourceBadge source={result.source} />
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-md border border-amber-200 bg-white px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:text-amber-700"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-amber-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className="px-5 py-5">
            <p className="font-display text-3xl font-bold italic text-amber-900 leading-snug">
              {result.translated_text}
            </p>
            {result.source === "model" && (
              <p className="mt-3 text-xs text-muted-foreground">
                Know a better translation?{" "}
                <Link href="/contribute" className="font-semibold text-amber-700 hover:underline">
                  Contribute it →
                </Link>
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Nav cards ─────────────────────────────────────────────────────── */}
      <div className="mt-8 grid grid-cols-2 gap-3">
        <Link
          href="/dictionary"
          className="group flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-4 shadow-sm transition hover:border-amber-300 hover:shadow-md active:scale-[0.98]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700 transition group-hover:bg-amber-200">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Dictionary</p>
            <p className="text-xs text-muted-foreground">Browse all words</p>
          </div>
        </Link>
        <Link
          href="/lessons"
          className="group flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-4 shadow-sm transition hover:border-orange-300 hover:shadow-md active:scale-[0.98]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-700 transition group-hover:bg-orange-200">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Lessons</p>
            <p className="text-xs text-muted-foreground">Learn with flashcards</p>
          </div>
        </Link>
      </div>

      {/* ── Community note ────────────────────────────────────────────────── */}
      <div className="mt-4 flex items-start gap-3 rounded-xl border border-border bg-white px-5 py-4 shadow-sm">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Built by the community.</span>{" "}
          Naath is open — you can contribute verified translations, help review entries, and make the dictionary stronger for everyone.
        </p>
      </div>

    </div>
  );
}
