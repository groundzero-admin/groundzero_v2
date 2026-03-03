import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { StudentState } from "@/api/types";

export function useStudentState(studentId: string | null) {
  return useQuery<StudentState>({
    queryKey: ["student-state", studentId],
    queryFn: async () => (await api.get(`/students/${studentId}/state`)).data,
    enabled: !!studentId,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
