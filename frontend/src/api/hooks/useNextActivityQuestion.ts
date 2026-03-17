import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";

export interface NextActivityQuestion {
  activity_question_id: string;
  template_slug: string;
  title: string;
  data: Record<string, unknown>;
  competency_id: string;
  competency_name: string;
  difficulty: number;
  p_learned: number;
  stage: number;
}

export function useNextActivityQuestion(
  studentId: string | null,
  activityId: string | null,
) {
  return useQuery<NextActivityQuestion | null>({
    queryKey: ["next-activity-question", studentId, activityId],
    queryFn: async () =>
      (
        await api.get(`/students/${studentId}/next-activity-question`, {
          params: { activity_id: activityId },
        })
      ).data,
    enabled: !!studentId && !!activityId,
  });
}
