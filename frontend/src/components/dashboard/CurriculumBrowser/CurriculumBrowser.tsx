import { useState } from "react";
import { useNavigate } from "react-router";
import { BookOpen, Loader2 } from "lucide-react";
import { useTopics } from "@/api/hooks/useTopics";
import { Card } from "@/components/ui";
import * as s from "./CurriculumBrowser.css";

interface CurriculumBrowserProps {
  defaultBoard?: string;
  defaultGrade?: number;
}

const BOARDS = [
  { value: "cbse", label: "CBSE" },
  { value: "icse", label: "ICSE" },
  { value: "ib", label: "IB" },
];

const GRADES = [4, 5, 6, 7, 8, 9];

export function CurriculumBrowser({
  defaultBoard = "cbse",
  defaultGrade = 6,
}: CurriculumBrowserProps) {
  const navigate = useNavigate();
  const [board, setBoard] = useState(defaultBoard);
  const [grade, setGrade] = useState(defaultGrade);

  const { data: topics, isLoading } = useTopics({
    board,
    subject: "mathematics",
    grade,
  });

  function handleClick(topicId: string) {
    navigate(`/practice?topic=${topicId}`);
  }

  return (
    <Card elevation="low">
      <div className={s.root}>
        <div className={s.heading}>
          <BookOpen size={16} />
          Curriculum Topics
        </div>

        <div className={s.filters}>
          <select
            className={s.select}
            value={board}
            onChange={(e) => setBoard(e.target.value)}
          >
            {BOARDS.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>

          <select
            className={s.select}
            value={grade}
            onChange={(e) => setGrade(Number(e.target.value))}
          >
            {GRADES.map((g) => (
              <option key={g} value={g}>
                Class {g}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className={s.loading}>
            <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
          </div>
        ) : !topics || topics.length === 0 ? (
          <div className={s.empty}>
            No topics available for {board.toUpperCase()} Class {grade} yet.
          </div>
        ) : (
          <div className={s.topicList}>
            {topics
              .sort((a, b) => a.chapter_number - b.chapter_number)
              .map((topic) => (
                <div
                  key={topic.id}
                  className={s.topicRow}
                  onClick={() => handleClick(topic.id)}
                >
                  <span className={s.chapterNum}>{topic.chapter_number}</span>
                  <span className={s.topicName}>{topic.name}</span>
                </div>
              ))}
          </div>
        )}
      </div>
    </Card>
  );
}
