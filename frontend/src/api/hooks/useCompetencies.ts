import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";

export interface CompetencyInfo {
  id: string;
  capability_id: string;
  name: string;
  description: string;
  assessment_method: "mcq" | "llm" | "both";
}

export interface PillarInfo {
  id: string;
  name: string;
  color: string;
  description: string;
}

export interface CapabilityInfo {
  id: string;
  pillar_id: string;
  name: string;
  description: string;
}

export interface PrerequisiteEdge {
  source_id: string;
  target_id: string;
  min_stage: number;
}

export interface CodevelopmentEdge {
  source_id: string;
  target_id: string;
  transfer_weight: number;
  rationale: string | null;
}

export interface SkillGraph {
  competencies: CompetencyInfo[];
  prerequisite_edges: PrerequisiteEdge[];
  codevelopment_edges: CodevelopmentEdge[];
  pillars: PillarInfo[];
  capabilities: CapabilityInfo[];
}

export function useCompetencies() {
  return useQuery<CompetencyInfo[]>({
    queryKey: ["competencies"],
    queryFn: async () => (await api.get("/competencies")).data,
    staleTime: Infinity,
  });
}

export function useSkillGraph() {
  return useQuery<SkillGraph>({
    queryKey: ["skill-graph"],
    queryFn: async () => (await api.get("/skill-graph")).data,
    staleTime: Infinity,
  });
}
