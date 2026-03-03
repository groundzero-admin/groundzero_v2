export type UserRole = "student" | "teacher" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  role: "student" | "teacher";
  board?: string;
  grade?: number;
  grade_band?: string;
}
