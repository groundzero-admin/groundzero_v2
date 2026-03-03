import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { Session } from "@/api/types";

export function useCohortSessions(cohortId: string | null | undefined) {
  return useQuery<Session[]>({
    queryKey: ["cohort-sessions", cohortId],
    queryFn: async () => {
      const { data } = await api.get<Session[]>("/sessions", {
        params: { cohort_id: cohortId },
      });
      return data;
    },
    enabled: !!cohortId,
    staleTime: 60_000,
  });
}
