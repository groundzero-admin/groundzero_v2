import { useNavigate } from "react-router";
import { Sparkles, ChevronRight, Loader2 } from "lucide-react";
import { useRecommendedTopics } from "@/api/hooks/useRecommendedTopics";
import { Card } from "@/components/ui";
import * as s from "./RecommendedTopics.css";

interface RecommendedTopicsProps {
  studentId: string | null;
  board: string;
  grade: number;
}

const RANK_STYLES: Record<number, { bg: string; color: string }> = {
  0: { bg: "#805AD520", color: "#805AD5" },
  1: { bg: "#3182CE18", color: "#3182CE" },
  2: { bg: "#38A16918", color: "#38A169" },
  3: { bg: "#E53E3E15", color: "#E53E3E" },
  4: { bg: "#A0AEC015", color: "#718096" },
};

export function RecommendedTopics({ studentId, board, grade }: RecommendedTopicsProps) {
  const navigate = useNavigate();
  const { data: topics, isLoading } = useRecommendedTopics(studentId, {
    board,
    grade,
    subject: "mathematics",
    limit: 5,
  });

  function handleClick(topicId: string) {
    navigate(`/practice?topic=${topicId}`);
  }

  return (
    <Card elevation="low">
      <div className={s.root}>
        <div className={s.heading}>
          <Sparkles size={16} />
          Recommended for You
        </div>

        {isLoading ? (
          <div className={s.loading}>
            <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
          </div>
        ) : !topics || topics.length === 0 ? (
          <div className={s.empty}>
            Complete some practice to get personalized recommendations.
          </div>
        ) : (
          <div className={s.topicList}>
            {topics.map((rec, idx) => {
              const rankStyle = RANK_STYLES[idx] ?? RANK_STYLES[4];
              return (
                <div
                  key={rec.topic.id}
                  className={s.topicCard}
                  onClick={() => handleClick(rec.topic.id)}
                >
                  <span
                    className={s.rank}
                    style={{ backgroundColor: rankStyle.bg, color: rankStyle.color }}
                  >
                    {idx + 1}
                  </span>

                  <div className={s.topicBody}>
                    <span className={s.topicName}>{rec.topic.name}</span>
                    <div className={s.topicMeta}>
                      <span className={s.chapterLabel}>
                        Ch. {rec.topic.chapter_number}
                      </span>
                      {rec.weak_competencies.slice(0, 2).map((wc) => (
                        <span
                          key={wc.competency_id}
                          className={s.weakChip}
                          style={{
                            backgroundColor: `${rankStyle.color}12`,
                            color: rankStyle.color,
                          }}
                        >
                          {wc.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <ChevronRight size={16} className={s.arrow} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
