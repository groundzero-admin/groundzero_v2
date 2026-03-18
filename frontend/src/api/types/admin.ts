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

export interface InputField {
    key: string;
    type: string;
    label: string;
    required: boolean;
    options?: string[];
    /** For type "categorized_list": the key of the field that holds category names. */
    category_source?: string;
}

export interface QuestionTemplate {
    id: string;
    slug: string;
    name: string;
    description: string;
    example_use_cases: string;
    frontend_component: string;
    icon: string;
    scorable: boolean;
    input_schema: { fields: InputField[] };
    llm_prompt_template: string;
    is_active: boolean;
    sort_order: number;
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
    teacher_id?: string | null;
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

export interface ActivityQuestion {
    id: string;
    template_id: string;
    template_slug: string | null;
    template_name: string | null;
    title: string;
    data: Record<string, unknown>;
    grade_band: string;
    competency_id: string;
    competency_ids: string[];
    difficulty: number;
    created_by: string | null;
    is_published: boolean;
    created_at: string;
    updated_at: string;
}

export interface SessionViewQuestion {
    id: string;
    template_id: string;
    template_slug: string | null;
    template_name: string | null;
    title: string;
    data: Record<string, unknown>;
    grade_band: string;
    competency_id: string;
    difficulty: number;
    is_published: boolean;
    created_at: string;
    updated_at: string;
}

export interface SessionViewActivity {
    session_activity_id: string;
    order: number;
    status: string;
    launched_at: string | null;
    activity_id: string;
    name: string;
    type: string;
    mode: string;
    module_id: string;
    duration_minutes: number | null;
    description: string | null;
    question_ids: string[];
    questions: SessionViewQuestion[];
}

export interface SessionViewOut {
    session: CohortSession;
    activities: SessionViewActivity[];
}
