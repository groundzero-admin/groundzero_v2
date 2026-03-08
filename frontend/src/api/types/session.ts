export interface Session {
  id: string;
  cohort_id: string | null;
  session_number: number;
  current_activity_id: string | null;
  teacher_id: string | null;
  started_at: string;
  ended_at: string | null;
}

export interface Cohort {
  id: string;
  name: string;
  grade_band: string;
  level: number;
  schedule: string | null;
  board: string | null;
  current_session_number: number;
  created_at: string;
}

export interface SessionActivity {
  id: string;
  session_id: string;
  activity_id: string;
  order: number;
  status: "pending" | "active" | "completed";
  launched_at: string | null;
  activity_name: string | null;
  activity_type: string | null;
  duration_minutes: number | null;
}

export interface StudentScore {
  student_id: string;
  student_name: string;
  correct: number;
  total: number;
}

export interface LivePulseEvent {
  id: string;
  student_id: string;
  student_name: string;
  competency_id: string;
  competency_name: string | null;
  source: string;
  outcome: number;
  meta: Record<string, unknown> | null;
  created_at: string;
}
