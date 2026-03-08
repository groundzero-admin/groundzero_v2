export interface Activity {
  id: string;
  module_id: string;
  name: string;
  type: "warmup" | "key_topic" | "diy" | "ai_lab" | "artifact";
  mode: "timed_mcq" | "open_ended" | "discussion" | "default";
  week: number | null;
  session_number: number | null;
  duration_minutes: number | null;
  grade_bands: string[] | null;
  description: string | null;
  learning_outcomes: string[] | null;
  primary_competencies:
    | Array<{ competency_id: string; expected_gain: number }>
    | null;
  secondary_competencies:
    | Array<{ competency_id: string; expected_gain: number }>
    | null;
  prerequisites:
    | Array<{ competency_id: string; min_stage: number }>
    | null;
}

export interface ActivityRecommendation {
  activity_id: string;
  activity_name: string;
  module_id: string;
  score: number;
  reasons: string[];
}

export interface Question {
  id: string;
  module_id: string;
  competency_id: string;
  text: string;
  type: "mcq" | "short_answer";
  options: Array<{ label: string; text: string; is_correct: boolean }> | null;
  correct_answer: string | null;
  difficulty: number;
  grade_band: string;
  explanation: string | null;
}
