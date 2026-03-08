import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { Question } from "@/api/types";

interface NextQuestionResponse {
  question: Question;
  competency_id: string;
  competency_name: string;
  p_learned: number;
  stage: number;
}

export function useNextQuestion(
  studentId: string | null,
  activityId: string | null,
  topicId?: string | null
) {
  const hasContext = !!activityId || !!topicId;
  return useQuery<NextQuestionResponse | null>({
    queryKey: ["next-question", studentId, activityId, topicId],
    queryFn: async () =>
      (
        await api.get(`/students/${studentId}/next-question`, {
          params: {
            ...(activityId ? { activity_id: activityId } : {}),
            ...(topicId ? { topic_id: topicId } : {}),
          },
        })
      ).data,
    enabled: !!studentId && hasContext,
  });
}
