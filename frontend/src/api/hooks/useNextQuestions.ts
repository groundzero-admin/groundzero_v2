import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { Question } from "@/api/types";

export function useNextQuestions(
  studentId: string | null,
  competencyId: string | null,
  opts?: { count?: number; module_id?: string }
) {
  return useQuery<Question[]>({
    queryKey: ["next-questions", studentId, competencyId],
    queryFn: async () =>
      (
        await api.get(`/students/${studentId}/next-questions`, {
          params: {
            competency_id: competencyId,
            count: opts?.count ?? 5,
            module_id: opts?.module_id,
          },
        })
      ).data,
    enabled: !!studentId && !!competencyId,
  });
}
