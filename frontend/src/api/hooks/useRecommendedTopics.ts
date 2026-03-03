import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { RecommendedTopic } from "@/api/types";

export function useRecommendedTopics(
  studentId: string | null,
  opts: { board: string; grade: number; subject?: string; limit?: number },
) {
  return useQuery<RecommendedTopic[]>({
    queryKey: [
      "recommended-topics",
      studentId,
      opts.board,
      opts.grade,
      opts.subject,
    ],
    queryFn: async () =>
      (
        await api.get(`/students/${studentId}/recommended-topics`, {
          params: opts,
        })
      ).data,
    enabled: !!studentId && !!opts.board && !!opts.grade,
    staleTime: 30_000,
  });
}
