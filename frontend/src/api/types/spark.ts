export type SparkTrigger = "wrong_answer" | "low_confidence" | "hint_request" | "free_chat";

export interface SparkConversationCreate {
  student_id: string;
  question_id?: string;
  trigger: SparkTrigger;
  competency_id?: string;
  selected_option?: string;
  confidence_report?: string;
}

export interface SparkTurnRequest {
  content: string;
}

export interface SparkHintRequest {
  student_id: string;
  question_id: string;
}

export interface SparkMessageOut {
  role: "spark" | "student" | "system";
  content: string;
  created_at: string;
}

export interface SparkStartResponse {
  conversation_id: string;
  message: SparkMessageOut;
}

export interface SparkTurnResponse {
  message: SparkMessageOut;
  evidence_submitted: boolean;
  is_complete: boolean;
}

export interface SparkEndResponse {
  message: SparkMessageOut;
  evidence_submitted: boolean;
}

export interface SparkHintResponse {
  hint: string;
}
