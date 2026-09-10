import { BookOpen, Cpu } from "lucide-react";

interface SourceBadgeProps {
  source: "dictionary" | "model";
}

export function SourceBadge({ source }: SourceBadgeProps) {
  if (source === "dictionary") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
        <BookOpen className="h-3.5 w-3.5" />
        From Dictionary
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700">
      <Cpu className="h-3.5 w-3.5" />
      AI Translation
    </span>
  );
}
