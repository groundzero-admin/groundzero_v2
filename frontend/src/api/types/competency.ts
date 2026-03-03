export interface Pillar {
  id: string;
  name: string;
  color: string;
  description: string;
}

export interface Capability {
  id: string;
  pillar_id: string;
  name: string;
  description: string;
}

export interface Competency {
  id: string;
  capability_id: string;
  name: string;
  description: string;
  assessment_method: "mcq" | "llm" | "both";
  default_params: {
    p_l0: number;
    p_transit: number;
    p_guess: number;
    p_slip: number;
  };
}
