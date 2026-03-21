export interface EnrolledStudent {
    enrollment_id: string;
    student_id: string;
    user_id: string;
    full_name: string;
    email: string;
    board: string | null;
    grade: number | null;
    invite_status: string;
    enrolled_at: string;
}

export interface SearchStudent {
    student_id: string;
    user_id: string;
    full_name: string;
    email: string;
    already_enrolled: boolean;
}

export interface PaginatedSearch {
    students: SearchStudent[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}
