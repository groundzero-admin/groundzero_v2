import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";

interface SessionScore {
  total: number;
  correct: number;
}

export function useSessionScore(
  studentId: string | null,
  sessionId: string | null | undefined,
) {
  return useQuery<SessionScore>({
    queryKey: ["session-score", studentId, sessionId],
    queryFn: async () =>
      (
        await api.get(`/students/${studentId}/session-score`, {
          params: { session_id: sessionId },
        })
      ).data,
    enabled: !!studentId && !!sessionId,
    staleTime: 5_000,
  });
}
