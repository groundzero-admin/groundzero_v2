/** Admin-specific types for template cohorts and live batches. */

export interface TemplateCohort {
    id: string;
    name: string;
    level: number;
    mode: "online" | "offline";
    description: string | null;
    created_at: string;
    updated_at: string;
}

export interface TemplateSession {
    id: string;
    template_cohort_id: string;
    title: string;
    description: string | null;
    day: number;
    order: number;
    created_at: string;
    updated_at: string;
}

export interface TemplateCohortWithSessions extends TemplateCohort {
    sessions: TemplateSession[];
}

export interface LiveBatch {
    id: string;
    name: string;
    description: string | null;
    start_date: string;
    daily_timing: string;
    created_at: string;
    updated_at: string;
}

export interface LiveBatchSession {
    id: string;
    batch_id: string;
    template_session_id: string | null;
    title: string;
    description: string | null;
    day: number;
    order: number;
    is_locally_modified: boolean;
    scheduled_date: string | null;
    daily_timing: string | null;
    hms_room_id: string | null;
    hms_room_code_host: string | null;
    hms_room_code_guest: string | null;
    is_live: boolean;
    created_at: string;
    updated_at: string;
}

export interface LiveBatchWithSessions extends LiveBatch {
    sessions: LiveBatchSession[];
}

// ── Competency Hierarchy ──

export interface Pillar {
    id: string;         // communication, creativity, ai_systems, math_logic
    name: string;
    color: string;      // hex e.g. #E53E3E
    description: string;
}

export interface Capability {
    id: string;         // A through P
    pillar_id: string;
    name: string;
    description: string;
}

export interface Competency {
    id: string;           // C1.1
    capability_id: string;
    name: string;
    description: string;
    assessment_method: "mcq" | "llm" | "both";
    default_params: Record<string, number>;
}

export interface Activity {
    id: string;
    module_id: string;
    name: string;
    type: "warmup" | "key_topic" | "diy" | "ai_lab" | "artifact";
    week: number | null;
    session_number: number | null;
    duration_minutes: number | null;
    grade_bands: string[] | null;
    description: string | null;
    learning_outcomes: string[] | null;
    primary_competencies: { competency_id: string; expected_gain: number }[] | null;
    secondary_competencies: { competency_id: string; expected_gain: number }[] | null;
    prerequisites: { competency_id: string; min_stage: number }[] | null;
}

export interface Question {
    id: string;
    module_id: string;
    competency_id: string;
    text: string;
    type: "mcq" | "short_answer";
    options: { label: string; text: string; isCorrect: boolean }[] | null;
    correct_answer: string | null;
    difficulty: number;    // 0.0 – 1.0
    grade_band: string;    // "4-5" | "6-7" | "8-9"
    topic_id: string | null;
    explanation: string | null;
}
