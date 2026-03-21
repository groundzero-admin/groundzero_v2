export interface EvidenceCreate {
  student_id: string;
  competency_id: string;
  outcome: number;
  source: string;
  question_id?: string;
  module_id?: string;
  session_id?: string;
  weight?: number;
  response_time_ms?: number;
  confidence_report?: "got_it" | "kinda" | "lost";
  ai_interaction?: "none" | "hint" | "conversation";
}

export interface EvidenceOut {
  id: string;
  student_id: string;
  competency_id: string;
  source: string;
  module_id: string | null;
  session_id: string | null;
  outcome: number;
  weight: number;
  /** Server JSONB — usually an object, but may be other JSON shapes */
  meta: unknown | null;
  is_propagated: boolean;
  source_event_id: string | null;
  created_at: string;
}

export interface BKTUpdate {
  competency_id: string;
  p_learned_before: number;
  p_learned_after: number;
  stage_before: number;
  stage_after: number;
  is_stuck: boolean;
}

export interface EvidenceResult {
  event: EvidenceOut;
  updates: BKTUpdate[];
}
