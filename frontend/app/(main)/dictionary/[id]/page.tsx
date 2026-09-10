"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Volume2, Pencil } from "lucide-react";
import Link from "next/link";
import { getWord } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { formatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

export default function WordDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);

  const { data: word, isLoading, error } = useQuery({
    queryKey: ["word", id],
    queryFn: () => getWord(id),
  });

  function playAudio() {
    if (word?.audio_url) {
      new Audio(word.audio_url).play().catch(() => {});
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !word) {
    return (
      <p className="py-20 text-center text-red-500">
        Word not found or an error occurred.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-stone-800">{word.nuer_text}</h1>
            {word.pronunciation && (
              <p className="mt-1 text-stone-400 italic">/{word.pronunciation}/</p>
            )}
          </div>
          {word.part_of_speech && (
            <Badge variant="amber" className="mt-1 shrink-0">
              {word.part_of_speech}
            </Badge>
          )}
        </div>

        <p className="text-xl text-stone-600">{word.english_text}</p>

        {word.audio_url && (
          <button
            onClick={playAudio}
            className="mt-5 flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700 hover:bg-amber-100"
          >
            <Volume2 className="h-4 w-4" />
            Play pronunciation
          </button>
        )}

        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-stone-100 pt-6 text-sm">
          {word.category && (
            <div>
              <span className="text-stone-400">Category</span>
              <p className="mt-0.5 font-medium capitalize text-stone-700">
                {word.category}
              </p>
            </div>
          )}
          {word.dialect && (
            <div>
              <span className="text-stone-400">Dialect</span>
              <p className="mt-0.5 font-medium text-stone-700">{word.dialect}</p>
            </div>
          )}
          <div>
            <span className="text-stone-400">Verified</span>
            <p className={`mt-0.5 font-medium ${word.is_verified ? "text-emerald-600" : "text-amber-600"}`}>
              {word.is_verified ? "Yes" : "Needs review"}
            </p>
          </div>
          <div>
            <span className="text-stone-400">Added</span>
            <p className="mt-0.5 font-medium text-stone-700">
              {formatDate(word.created_at)}
            </p>
          </div>
        </div>

        {/* ID for reference */}
        <div className="mt-4 rounded-lg bg-stone-50 px-3 py-2">
          <p className="text-xs text-stone-400">Entry ID</p>
          <p className="mt-0.5 break-all font-mono text-xs text-stone-500">{word.id}</p>
        </div>

        {/* Correct this word button */}
        {token && (
          <Link
            href={`/contribute?tab=correction&id=${word.id}&type=word`}
            className="mt-4 flex items-center gap-2 rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50"
          >
            <Pencil className="h-4 w-4" />
            Suggest a correction
          </Link>
        )}
      </div>
    </div>
  );
}
