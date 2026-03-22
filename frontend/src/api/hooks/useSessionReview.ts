import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { SessionViewOut } from "@/api/types/admin";

export interface SessionReview {
  id: string;
  title: string | null;
  description: string | null;
  order: number | null;
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  cohort_name: string;
  cohort_id: string;
  recording_playback_url: string | null;
  recording_status: string;
}

export function useSessionReview(sessionId: string | undefined) {
  return useQuery<SessionReview>({
    queryKey: ["session-review", sessionId],
    queryFn: () =>
      api.get(`/students/me/sessions/${sessionId}/review`).then((r) => r.data),
    enabled: !!sessionId,
    staleTime: 60_000,
  });
}

/** Activities + questions for a session (enrolled student); same shape as teacher preview. */
export function useStudentSessionView(sessionId: string | undefined) {
  return useQuery<SessionViewOut>({
    queryKey: ["student-session-view", sessionId],
    queryFn: () =>
      api.get(`/students/me/sessions/${sessionId}/view`).then((r) => r.data),
    enabled: !!sessionId,
    staleTime: 60_000,
  });
}
