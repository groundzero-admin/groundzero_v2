export interface CurriculumTopic {
  id: string;
  board: string;
  subject: string;
  grade: number;
  chapter_number: number;
  name: string;
  description: string | null;
  ncert_ref: string | null;
  content: Array<Record<string, unknown>> | null;
}

export interface TopicCompetencyMapping {
  competency_id: string;
  competency_name: string;
  relevance: number;
}

export interface TopicDetail {
  topic: CurriculumTopic;
  competencies: TopicCompetencyMapping[];
}

export interface RecommendedTopic {
  topic: CurriculumTopic;
  score: number;
  weak_competencies: Array<{
    competency_id: string;
    name: string;
    p_learned: number;
    stage: number;
    relevance: number;
  }>;
}
