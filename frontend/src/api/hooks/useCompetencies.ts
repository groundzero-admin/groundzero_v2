import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";

export interface CompetencyInfo {
  id: string;
  capability_id: string;
  name: string;
  description: string;
  assessment_method: "mcq" | "llm" | "both";
}

export function useCompetencies() {
  return useQuery<CompetencyInfo[]>({
    queryKey: ["competencies"],
    queryFn: async () => (await api.get("/competencies")).data,
    staleTime: Infinity,
  });
}
