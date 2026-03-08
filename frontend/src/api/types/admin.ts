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
