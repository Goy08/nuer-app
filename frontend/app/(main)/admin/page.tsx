"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Check, X } from "lucide-react";
import { listContributions, reviewContribution } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import type { ContributionResponse } from "@/lib/types";

export default function AdminPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const queryClient = useQueryClient();

  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");

  // Role guard
  useEffect(() => {
    if (!token || (user?.role !== "moderator" && user?.role !== "admin")) {
      router.push("/");
    }
  }, [token, user, router]);

  const { data: contributions, isLoading } = useQuery({
    queryKey: ["contributions", "pending"],
    queryFn: () => listContributions(token!, "pending"),
    enabled: !!token && (user?.role === "moderator" || user?.role === "admin"),
  });

  const reviewMutation = useMutation({
    mutationFn: ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: "approved" | "rejected";
      notes?: string;
    }) =>
      reviewContribution(id, { status, review_notes: notes ?? null }, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contributions", "pending"] });
      setRejectTarget(null);
      setRejectNotes("");
    },
  });

  if (!token || (user?.role !== "moderator" && user?.role !== "admin")) {
    return null;
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Shield className="h-6 w-6 text-amber-600" />
        <h1 className="text-3xl font-bold text-stone-800">Admin — Review</h1>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {!isLoading && contributions?.length === 0 && (
        <div className="py-24 text-center">
          <Check className="mx-auto mb-4 h-12 w-12 text-emerald-400" />
          <p className="text-stone-500">No pending contributions. All clear!</p>
        </div>
      )}

      {contributions && contributions.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-left text-xs uppercase tracking-wider text-stone-400">
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Payload preview</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {contributions.map((c) => (
                <ContributionRow
                  key={c.id}
                  contribution={c}
                  onApprove={() =>
                    reviewMutation.mutate({ id: c.id, status: "approved" })
                  }
                  onReject={() => setRejectTarget(c.id)}
                  isActing={reviewMutation.isPending}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={(e) => e.target === e.currentTarget && setRejectTarget(null)}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-3 text-lg font-semibold text-stone-800">
              Reject contribution
            </h2>
            <textarea
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="Reason for rejection (optional)"
              rows={4}
              className="mb-4 w-full resize-none rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 focus:border-amber-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setRejectTarget(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                loading={reviewMutation.isPending}
                onClick={() =>
                  reviewMutation.mutate({
                    id: rejectTarget,
                    status: "rejected",
                    notes: rejectNotes || undefined,
                  })
                }
              >
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ContributionRow({
  contribution,
  onApprove,
  onReject,
  isActing,
}: {
  contribution: ContributionResponse;
  onApprove: () => void;
  onReject: () => void;
  isActing: boolean;
}) {
  const typeVariant =
    contribution.type === "word"
      ? "amber"
      : contribution.type === "phrase"
        ? "emerald"
        : contribution.type === "audio"
          ? "violet"
          : "stone";

  // Build a short preview from the payload
  const preview = Object.entries(contribution.payload)
    .slice(0, 2)
    .map(([k, v]) => `${k}: ${v}`)
    .join(" · ");

  return (
    <tr className="hover:bg-amber-50/40">
      <td className="px-4 py-3">
        <Badge variant={typeVariant as "amber" | "emerald" | "violet" | "stone"}>
          {contribution.type}
        </Badge>
      </td>
      <td className="px-4 py-3 text-stone-500">
        {formatDate(contribution.created_at)}
      </td>
      <td className="max-w-xs truncate px-4 py-3 text-stone-600">{preview}</td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-2">
          <button
            onClick={onApprove}
            disabled={isActing}
            className="flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" />
            Approve
          </button>
          <button
            onClick={onReject}
            disabled={isActing}
            className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" />
            Reject
          </button>
        </div>
      </td>
    </tr>
  );
}
