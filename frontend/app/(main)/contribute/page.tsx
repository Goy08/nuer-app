"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { Lock, CheckCircle } from "lucide-react";
import { submitContribution } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";

type Tab = "word" | "phrase" | "correction" | "audio";

const TABS: { id: Tab; label: string }[] = [
  { id: "word", label: "Word" },
  { id: "phrase", label: "Phrase" },
  { id: "correction", label: "Correction" },
  { id: "audio", label: "Audio" },
];

const CATEGORIES = ["greetings", "family", "nature", "food", "common", "other"];
const PARTS_OF_SPEECH = ["noun", "verb", "adjective", "adverb", "pronoun", "other"];

function ContributeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuthStore();

  // Pre-fill correction tab from URL params (e.g. coming from word detail page)
  const prefilledId = searchParams.get("id") ?? "";
  const prefilledType = (searchParams.get("type") as "word" | "phrase") ?? "word";
  const initialTab = (searchParams.get("tab") as Tab) ?? "word";

  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Lock className="mb-4 h-10 w-10 text-amber-400" />
        <h2 className="text-xl font-semibold text-stone-700">
          Sign in to contribute
        </h2>
        <p className="mt-2 text-stone-500">
          Help grow the Nuer language resource by adding words, phrases, or corrections.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="mt-6 rounded-xl bg-amber-600 px-6 py-3 text-sm font-medium text-white hover:bg-amber-700"
        >
          Sign in
        </button>
      </div>
    );
  }

  async function handleSubmit(payload: Record<string, unknown>) {
    setLoading(true);
    setError("");
    try {
      await submitContribution({ type: activeTab, payload }, token!);
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <CheckCircle className="mx-auto mb-4 h-14 w-14 text-emerald-500" />
        <h2 className="text-2xl font-bold text-stone-800">Thank you!</h2>
        <p className="mt-2 text-stone-500">
          Your contribution has been submitted for review.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => setSuccess(false)}
            className="rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-700"
          >
            Add another
          </button>
          <button
            onClick={() => router.push("/")}
            className="rounded-xl border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Go home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-2 text-3xl font-bold text-stone-800">Contribute</h1>
      <p className="mb-6 text-stone-500">
        Submit a new word, phrase, correction, or audio recording.
      </p>

      {/* Tab switcher */}
      <div className="mb-6 flex gap-1 rounded-xl border border-stone-200 bg-white p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
              activeTab === tab.id
                ? "bg-amber-600 text-white shadow-sm"
                : "text-stone-600 hover:text-stone-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {activeTab === "word" && (
        <WordForm onSubmit={handleSubmit} loading={loading} />
      )}
      {activeTab === "phrase" && (
        <PhraseForm onSubmit={handleSubmit} loading={loading} />
      )}
      {activeTab === "correction" && (
        <CorrectionForm
          onSubmit={handleSubmit}
          loading={loading}
          prefilledId={prefilledId}
          prefilledType={prefilledType}
        />
      )}
      {activeTab === "audio" && (
        <AudioForm onSubmit={handleSubmit} loading={loading} />
      )}
    </div>
  );
}

export default function ContributePage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Spinner size="lg" /></div>}>
      <ContributeInner />
    </Suspense>
  );
}

// ── Sub-forms ─────────────────────────────────────────────────────────────────

function WordForm({
  onSubmit,
  loading,
}: {
  onSubmit: (p: Record<string, unknown>) => void;
  loading: boolean;
}) {
  const [f, setF] = useState({
    nuer_text: "",
    english_text: "",
    pronunciation: "",
    part_of_speech: "",
    category: "",
    dialect: "",
  });

  function update(k: string, v: string) {
    setF((prev) => ({ ...prev, [k]: v }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(Object.fromEntries(Object.entries(f).filter(([, v]) => v)));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Nuer text *"
        value={f.nuer_text}
        onChange={(e) => update("nuer_text", e.target.value)}
        required
        placeholder="e.g. goa"
      />
      <Input
        label="English text *"
        value={f.english_text}
        onChange={(e) => update("english_text", e.target.value)}
        required
        placeholder="e.g. water"
      />
      <Input
        label="Pronunciation"
        value={f.pronunciation}
        onChange={(e) => update("pronunciation", e.target.value)}
        placeholder="e.g. ɡo̤a"
      />
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Part of speech
          </label>
          <select
            value={f.part_of_speech}
            onChange={(e) => update("part_of_speech", e.target.value)}
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus:border-amber-500 focus:outline-none"
          >
            <option value="">Select…</option>
            {PARTS_OF_SPEECH.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Category
          </label>
          <select
            value={f.category}
            onChange={(e) => update("category", e.target.value)}
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus:border-amber-500 focus:outline-none"
          >
            <option value="">Select…</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Input
        label="Dialect"
        value={f.dialect}
        onChange={(e) => update("dialect", e.target.value)}
        placeholder="e.g. Lou, Gaawar"
      />
      <Button type="submit" loading={loading} size="lg">
        Submit word
      </Button>
    </form>
  );
}

function PhraseForm({
  onSubmit,
  loading,
}: {
  onSubmit: (p: Record<string, unknown>) => void;
  loading: boolean;
}) {
  const [f, setF] = useState({
    nuer_text: "",
    english_text: "",
    context: "",
    category: "",
  });

  function update(k: string, v: string) {
    setF((prev) => ({ ...prev, [k]: v }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(Object.fromEntries(Object.entries(f).filter(([, v]) => v)));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Nuer phrase *"
        value={f.nuer_text}
        onChange={(e) => update("nuer_text", e.target.value)}
        required
        placeholder="e.g. Malo ke?"
      />
      <Input
        label="English translation *"
        value={f.english_text}
        onChange={(e) => update("english_text", e.target.value)}
        required
        placeholder="e.g. How are you?"
      />
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">
          Context / notes
        </label>
        <textarea
          value={f.context}
          onChange={(e) => update("context", e.target.value)}
          placeholder="When is this phrase used?"
          rows={3}
          className="w-full resize-none rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">
          Category
        </label>
        <select
          value={f.category}
          onChange={(e) => update("category", e.target.value)}
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus:border-amber-500 focus:outline-none"
        >
          <option value="">Select…</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" loading={loading} size="lg">
        Submit phrase
      </Button>
    </form>
  );
}

const CORRECTABLE_FIELDS = [
  { value: "nuer_text", label: "Nuer text" },
  { value: "english_text", label: "English text" },
  { value: "pronunciation", label: "Pronunciation" },
  { value: "part_of_speech", label: "Part of speech" },
  { value: "category", label: "Category" },
];

function CorrectionForm({
  onSubmit,
  loading,
  prefilledId = "",
  prefilledType = "word",
}: {
  onSubmit: (p: Record<string, unknown>) => void;
  loading: boolean;
  prefilledId?: string;
  prefilledType?: string;
}) {
  const [f, setF] = useState({
    target_id: prefilledId,
    target_type: prefilledType,
    field: "nuer_text",
    correct_value: "",
    notes: "",
  });

  function update(k: string, v: string) {
    setF((prev) => ({ ...prev, [k]: v }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Build payload matching backend: { target_type, target_id, updates: { field: value } }
    onSubmit({
      target_type: f.target_type,
      target_id: f.target_id,
      updates: { [f.field]: f.correct_value },
      notes: f.notes || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
        Find the word in the{" "}
        <Link href="/dictionary" className="font-medium underline">Dictionary</Link>,
        click it to open the detail page, then copy the ID from the URL bar.
      </p>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-stone-700">Entry type</label>
          <select
            value={f.target_type}
            onChange={(e) => update("target_type", e.target.value)}
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus:border-amber-500 focus:outline-none"
          >
            <option value="word">Word</option>
            <option value="phrase">Phrase</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-stone-700">Field to fix *</label>
          <select
            value={f.field}
            onChange={(e) => update("field", e.target.value)}
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus:border-amber-500 focus:outline-none"
          >
            {CORRECTABLE_FIELDS.map((cf) => (
              <option key={cf.value} value={cf.value}>{cf.label}</option>
            ))}
          </select>
        </div>
      </div>

      <Input
        label="Entry ID (from URL) *"
        value={f.target_id}
        onChange={(e) => update("target_id", e.target.value)}
        required
        placeholder="e.g. 968cd183-6cef-4db6-bbf3-217667ec793f"
      />

      <Input
        label="Correct value *"
        value={f.correct_value}
        onChange={(e) => update("correct_value", e.target.value)}
        required
        placeholder="What the correct Nuer text / pronunciation should be"
      />

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Notes (optional)</label>
        <textarea
          value={f.notes}
          onChange={(e) => update("notes", e.target.value)}
          placeholder="Any extra context for the reviewer"
          rows={3}
          className="w-full resize-none rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none"
        />
      </div>

      <Button type="submit" loading={loading} size="lg">
        Submit correction
      </Button>
    </form>
  );
}

function AudioForm({
  onSubmit,
  loading,
}: {
  onSubmit: (p: Record<string, unknown>) => void;
  loading: boolean;
}) {
  const [f, setF] = useState({ entry_id: "", entry_type: "word", audio_note: "" });
  function update(k: string, v: string) {
    setF((prev) => ({ ...prev, [k]: v }));
  }
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(Object.fromEntries(Object.entries(f).filter(([, v]) => v)));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
        Audio upload via the app is coming soon. For now, submit the entry ID and a
        note — a moderator will follow up.
      </p>
      <Input
        label="Entry ID (UUID) *"
        value={f.entry_id}
        onChange={(e) => update("entry_id", e.target.value)}
        required
        placeholder="Word or phrase UUID"
      />
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">
          Entry type
        </label>
        <select
          value={f.entry_type}
          onChange={(e) => update("entry_type", e.target.value)}
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus:border-amber-500 focus:outline-none"
        >
          <option value="word">Word</option>
          <option value="phrase">Phrase</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Notes</label>
        <textarea
          value={f.audio_note}
          onChange={(e) => update("audio_note", e.target.value)}
          placeholder="Any notes about the recording"
          rows={3}
          className="w-full resize-none rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none"
        />
      </div>
      <Button type="submit" loading={loading} size="lg">
        Submit audio request
      </Button>
    </form>
  );
}
