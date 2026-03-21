// Shared types for CreateQuestionPage sub-components

export interface CompetencyOption {
  id: string;
  name: string;
}

export interface McqOption {
  text: string;
  is_correct: boolean;
}

export interface NodeDef {
  id: string;
  type: string;
  label: string;
  blank: boolean;
  correct: string;
}

export interface EdgeDef {
  from: string;
  to: string;
  label: string;
}

export interface StepDef {
  step_number: number;
  type: string;
  data: Record<string, unknown>;
}

export interface CategorizedItem {
  label: string;
  correct_category: string;
}
