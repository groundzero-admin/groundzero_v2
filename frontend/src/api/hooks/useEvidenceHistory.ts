import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { EvidenceOut } from "@/api/types";

export function useEvidenceHistory(opts?: {
  student_id?: string | null;
  competency_id?: string;
  limit?: number;
}) {
  return useQuery<EvidenceOut[]>({
    queryKey: ["evidence", opts?.student_id, opts?.competency_id],
    queryFn: async () =>
      (
        await api.get("/evidence", {
          params: {
            student_id: opts?.student_id,
            competency_id: opts?.competency_id,
            limit: opts?.limit ?? 50,
          },
        })
      ).data,
    enabled: !!opts?.student_id,
  });
}
