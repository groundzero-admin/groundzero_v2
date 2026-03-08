import { useNavigate } from "react-router";
import {
  Dumbbell,
  BookOpen,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useTopics } from "@/api/hooks/useTopics";
import { Card } from "@/components/ui";
import * as s from "./SelfServePractice.css";

const BOARD_LABELS: Record<string, string> = {
  cbse: "CBSE",
  icse: "ICSE",
  ib: "IB",
};

interface SelfServePracticeProps {
  board: string;
  grade: number;
}

export function SelfServePractice({
  board,
  grade,
}: SelfServePracticeProps) {
  const navigate = useNavigate();

  const { data: topics, isLoading: topicsLoading } = useTopics({
    board,
    subject: "mathematics",
    grade,
  });

  return (
    <Card elevation="low">
      <div className={s.root}>
        <div className={s.heading}>
          <Dumbbell size={16} />
          Practice
        </div>

        <div className={s.tabs}>
          <button className={`${s.tab} ${s.tabActive}`}>
            <BookOpen size={13} />
            {BOARD_LABELS[board] ?? board.toUpperCase()} Class {grade}
          </button>
        </div>

        {topicsLoading ? (
          <div className={s.loading}>
            <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
          </div>
        ) : !topics || topics.length === 0 ? (
          <div className={s.empty}>
            No topics for {BOARD_LABELS[board] ?? board.toUpperCase()} Class {grade} yet.
          </div>
        ) : (
          <div className={s.topicList}>
            {[...topics]
              .sort((a, b) => a.chapter_number - b.chapter_number)
              .map((topic) => (
                <div
                  key={topic.id}
                  className={s.topicRow}
                  onClick={() => navigate(`/practice?topic=${topic.id}`)}
                >
                  <span className={s.chapterNum}>{topic.chapter_number}</span>
                  <span className={s.topicName}>{topic.name}</span>
                  <ChevronRight size={14} className={s.topicArrow} />
                </div>
              ))}
          </div>
        )}
      </div>
    </Card>
  );
}
