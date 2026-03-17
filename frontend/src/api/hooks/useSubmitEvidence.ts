import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { EvidenceCreate, EvidenceResult } from "@/api/types";

export function useSubmitEvidence(studentId: string | null) {
  const queryClient = useQueryClient();

  return useMutation<EvidenceResult, Error, EvidenceCreate>({
    mutationFn: async (data) => (await api.post("/evidence", data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-state", studentId] });
      queryClient.invalidateQueries({ queryKey: ["evidence", studentId] });
    },
  });
}
