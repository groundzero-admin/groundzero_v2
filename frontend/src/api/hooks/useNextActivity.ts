import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { ActivityRecommendation } from "@/api/types";

export function useNextActivity(
  studentId: string | null,
  opts?: { module_id?: string; limit?: number }
) {
  return useQuery<ActivityRecommendation[]>({
    queryKey: ["next-activity", studentId, opts?.module_id],
    queryFn: async () =>
      (
        await api.get(`/students/${studentId}/next-activity`, {
          params: { module_id: opts?.module_id, limit: opts?.limit ?? 5 },
        })
      ).data,
    enabled: !!studentId,
    staleTime: 60_000,
  });
}
