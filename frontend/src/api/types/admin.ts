/** Admin-specific types for templates and cohorts. */

export interface Template {
    id: string;
    title: string;
    description: string | null;
    order: number | null;
    activities: string[];
    created_at: string;
    updated_at: string;
}

export interface Cohort {
    id: string;
    name: string;
    description: string | null;
    grade_band: string;
    board: string | null;
    created_at: string;
    updated_at: string;
}

export interface CohortSession {
    id: string;
    cohort_id: string;
    template_id: string | null;
    title: string | null;
    description: string | null;
    order: number | null;
    session_number: number;
    scheduled_at: string | null;
    is_live: boolean;
    hms_room_id: string | null;
    room_code_host: string | null;
    room_code_guest: string | null;
    created_at: string;
    updated_at: string;
}

export interface CohortWithSessions extends Cohort {
    sessions: CohortSession[];
}
