export interface Student {
  id: string;
  name: string;
  board: "cbse" | "icse" | "ib";
  grade: number;
  grade_band: "4-5" | "6-7" | "8-9";
  cohort_id: string | null;
  diagnostic_completed: boolean;
  created_at: string;
}

export interface CompetencyState {
  competency_id: string;
  p_learned: number;
  p_transit: number;
  p_guess: number;
  p_slip: number;
  total_evidence: number;
  consecutive_failures: number;
  is_stuck: boolean;
  last_evidence_at: string | null;
  stability: number;
  avg_response_time_ms: number | null;
  stage: number;
  confidence: number;
  updated_at: string | null;
}

export interface StudentState {
  student: Student;
  states: CompetencyState[];
}
