"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, BookOpen } from "lucide-react";
import Link from "next/link";
import { searchDictionary, getDictionaryCategory } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import type { PhraseResponse, WordResponse } from "@/lib/types";

const CATEGORIES = [
  { name: "greetings", emoji: "👋" },
  { name: "family",    emoji: "👨‍👩‍👧" },
  { name: "animals",   emoji: "🐘" },
  { name: "nature",    emoji: "🌿" },
  { name: "food",      emoji: "🍽️" },
  { name: "body",      emoji: "💪" },
  { name: "colors",    emoji: "🎨" },
  { name: "emotions",  emoji: "😊" },
  { name: "school",    emoji: "📚" },
  { name: "home",      emoji: "🏠" },
  { name: "people",    emoji: "👥" },
  { name: "common",    emoji: "⭐" },
];

export default function DictionaryPage() {
  const [query, setQuery]               = useState("");
  const [submitted, setSubmitted]       = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { data: searchData, isFetching: searchFetching } = useQuery({
    queryKey: ["dictionary-search", submitted],
    queryFn:  () => searchDictionary(submitted),
    enabled:  submitted.length > 0 && !activeCategory,
  });

  const { data: categoryData, isFetching: categoryFetching } = useQuery({
    queryKey: ["dictionary-category", activeCategory],
    queryFn:  () => getDictionaryCategory(activeCategory!),
    enabled:  !!activeCategory,
  });

  const data    = activeCategory ? categoryData : searchData;
  const loading = searchFetching || categoryFetching;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setActiveCategory(null);
    setSubmitted(query.trim());
  }

  function handleCategory(cat: string) {
    setActiveCategory(cat === activeCategory ? null : cat);
    setSubmitted("");
    setQuery("");
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 shadow-lg shadow-teal-500/25">
          <BookOpen className="h-6 w-6 text-background" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dictionary</h1>
          <p className="text-sm text-muted-foreground">Browse or search Nuer words and phrases</p>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="bg-card pl-10 border-border focus:border-teal-500/50 focus-visible:ring-teal-500/20"
            placeholder="Search English or Nuer…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button type="submit" className="bg-teal-500 text-background hover:bg-teal-400 font-semibold shadow-md shadow-teal-500/20">
          Search
        </Button>
      </form>

      {/* Category chips */}
      <div className="mb-8 flex flex-wrap gap-2">
        {CATEGORIES.map(({ name, emoji }) => (
          <button
            key={name}
            onClick={() => handleCategory(name)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium capitalize transition-all hover:scale-105 active:scale-95 ${
              activeCategory === name
                ? "border-teal-500/50 bg-teal-500/10 text-teal-400 shadow-sm shadow-teal-500/10"
                : "border-border bg-secondary text-muted-foreground hover:border-teal-500/30 hover:text-teal-400"
            }`}
          >
            <span>{emoji}</span>
            {name}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading && (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {!loading && data && (
        <div className="animate-fade-in">
          <p className="mb-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {data.total} result{data.total !== 1 ? "s" : ""}
          </p>

          {data.words.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Words</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.words.map((word) => <WordCard key={word.id} word={word} />)}
              </div>
            </section>
          )}

          {data.phrases.length > 0 && (
            <section>
              <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Phrases</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {data.phrases.map((phrase) => <PhraseCard key={phrase.id} phrase={phrase} />)}
              </div>
            </section>
          )}

          {data.total === 0 && (
            <div className="py-16 text-center">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-muted-foreground">No results found.</p>
            </div>
          )}
        </div>
      )}

      {!loading && !data && (
        <div className="py-16 text-center">
          <p className="text-5xl mb-4">📖</p>
          <p className="text-muted-foreground">Search or pick a category to explore.</p>
        </div>
      )}
    </div>
  );
}

function WordCard({ word }: { word: WordResponse }) {
  return (
    <Link
      href={`/dictionary/${word.id}`}
      className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-all hover:border-teal-500/40 hover:shadow-lg hover:shadow-teal-500/5 hover:-translate-y-0.5"
    >
      <div className="absolute left-0 top-0 h-full w-0.5 rounded-l-xl bg-gradient-to-b from-teal-400 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-foreground group-hover:text-teal-400 transition-colors">
            {word.nuer_text}
          </p>
          <p className="text-sm text-muted-foreground">{word.english_text}</p>
          {word.pronunciation && (
            <p className="mt-1 text-xs italic text-muted-foreground/60">/{word.pronunciation}/</p>
          )}
        </div>
        {word.part_of_speech && (
          <Badge variant="secondary" className="border border-teal-500/20 bg-teal-500/10 text-teal-400 text-xs shrink-0">
            {word.part_of_speech}
          </Badge>
        )}
      </div>
    </Link>
  );
}

function PhraseCard({ phrase }: { phrase: PhraseResponse }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 transition-all hover:border-blue-500/30 hover:-translate-y-0.5">
      <p className="font-bold text-foreground">{phrase.nuer_text}</p>
      <p className="text-sm text-muted-foreground">{phrase.english_text}</p>
      {phrase.context && (
        <p className="mt-1 text-xs italic text-muted-foreground/60">{phrase.context}</p>
      )}
    </div>
  );
}
