"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { getDictionaryCategory } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Spinner } from "@/components/ui/Spinner";

const CATEGORIES = [
  { name: "greetings", label: "Greetings",      emoji: "👋" },
  { name: "family",    label: "Family",          emoji: "👨‍👩‍👧" },
  { name: "nature",    label: "Nature",          emoji: "🌿" },
  { name: "food",      label: "Food",            emoji: "🍲" },
  { name: "common",    label: "Common Phrases",  emoji: "💬" },
];

export default function LessonsPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Lock className="mb-4 h-10 w-10 text-amber-500" />
        <h2 className="font-display text-2xl font-bold italic text-foreground">Sign in to start lessons</h2>
        <p className="mt-2 text-muted-foreground">
          Lessons use spaced repetition to help you remember Nuer words.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="mt-6 rounded-lg bg-amber-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 active:scale-95"
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display mb-1 text-4xl font-bold italic text-foreground">Lessons</h1>
      <p className="mb-8 text-muted-foreground">
        Choose a category to start a spaced-repetition flashcard session.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((cat) => (
          <CategoryCard
            key={cat.name}
            name={cat.name}
            label={cat.label}
            emoji={cat.emoji}
            onClick={() => router.push(`/lessons/${cat.name}`)}
          />
        ))}
      </div>
    </div>
  );
}

function CategoryCard({
  name,
  label,
  emoji,
  onClick,
}: {
  name: string;
  label: string;
  emoji: string;
  onClick: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["dictionary-category", name],
    queryFn: () => getDictionaryCategory(name),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-start rounded-xl border border-border bg-white p-6 text-left shadow-sm transition hover:border-amber-300 hover:shadow-md active:scale-[0.98]"
    >
      <span className="mb-3 text-3xl">{emoji}</span>
      <h3 className="font-display text-lg font-bold italic text-foreground transition group-hover:text-amber-700">
        {label}
      </h3>
      {isLoading ? (
        <Spinner size="sm" className="mt-1" />
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">
          {data ? `${data.total} item${data.total !== 1 ? "s" : ""}` : "—"}
        </p>
      )}
    </button>
  );
}
