import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { Session } from "@/api/types";

export function useActiveSession(cohortId: string | null | undefined) {
  return useQuery<Session | null>({
    queryKey: ["active-session", cohortId],
    queryFn: async () => {
      const { data } = await api.get<Session[]>("/sessions", {
        params: { cohort_id: cohortId, active: true },
      });
      return data[0] ?? null;
    },
    enabled: !!cohortId,
    refetchInterval: 15_000,
  });
}
