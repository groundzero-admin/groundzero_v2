import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { Pillar } from "@/api/types";

export function usePillars() {
  return useQuery<Pillar[]>({
    queryKey: ["pillars"],
    queryFn: async () => (await api.get("/competencies/pillars")).data,
    staleTime: Infinity,
  });
}
