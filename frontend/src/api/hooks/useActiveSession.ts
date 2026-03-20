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
    // Keep student live state in sync with teacher launch/pause actions.
    refetchInterval: 3_000,
    refetchOnWindowFocus: true,
  });
}
