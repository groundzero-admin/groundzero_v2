import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Dumbbell,
  BookOpen,
  Brain,
  ChevronRight,
  Loader2,
} from "lucide-react";
import type { CompetencyState } from "@/api/types";
import type { CompetencyInfo } from "@/api/hooks/useCompetencies";
import { useTopics } from "@/api/hooks/useTopics";
import { Card, ProgressBar } from "@/components/ui";
import { competencyToPillarId } from "@/lib/pillar-helpers";
import * as s from "./SelfServePractice.css";

interface PillarData {
  id: string;
  name: string;
  color: string;
}

interface SelfServePracticeProps {
  pillars: PillarData[];
  competencies: CompetencyInfo[];
  states: CompetencyState[];
  board: string;
  grade: number;
}

type Tab = "curriculum" | "skill";

const BOARD_LABELS: Record<string, string> = {
  cbse: "CBSE",
  icse: "ICSE",
  ib: "IB",
};

export function SelfServePractice({
  pillars,
  competencies,
  states,
  board,
  grade,
}: SelfServePracticeProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("curriculum");

  /* ── Curriculum ── */
  const { data: topics, isLoading: topicsLoading } = useTopics({
    board,
    subject: "mathematics",
    grade,
  });

  /* ── Skill state ── */
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);

  const byPillar = useMemo(() => {
    const map: Record<string, CompetencyInfo[]> = {};
    for (const c of competencies) {
      const pid = competencyToPillarId(c.id);
      if (!map[pid]) map[pid] = [];
      map[pid].push(c);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => a.id.localeCompare(b.id));
    }
    return map;
  }, [competencies]);

  const stateMap = useMemo(() => {
    const map: Record<string, CompetencyState> = {};
    for (const st of states) map[st.competency_id] = st;
    return map;
  }, [states]);

  function pillarAvg(pillarId: string): number {
    const comps = byPillar[pillarId] ?? [];
    if (comps.length === 0) return 0;
    return comps.reduce((sum, c) => sum + (stateMap[c.id]?.p_learned ?? 0), 0) / comps.length;
  }

  return (
    <Card elevation="low">
      <div className={s.root}>
        <div className={s.heading}>
          <Dumbbell size={16} />
          Practice
        </div>

        {/* ── Tab switcher ── */}
        <div className={s.tabs}>
          <button
            className={`${s.tab} ${activeTab === "curriculum" ? s.tabActive : ""}`}
            onClick={() => setActiveTab("curriculum")}
          >
            <BookOpen size={13} />
            {BOARD_LABELS[board] ?? board.toUpperCase()} Class {grade}
          </button>
          <button
            className={`${s.tab} ${activeTab === "skill" ? s.tabActive : ""}`}
            onClick={() => setActiveTab("skill")}
          >
            <Brain size={13} />
            By Skill
          </button>
        </div>

        {/* ── Curriculum view ── */}
        {activeTab === "curriculum" && (
          <>
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
          </>
        )}

        {/* ── Skill view ── */}
        {activeTab === "skill" && (
          <div className={s.pillars}>
            {pillars.map((pillar) => {
              const isExpanded = expandedPillar === pillar.id;
              const avg = pillarAvg(pillar.id);
              const comps = byPillar[pillar.id] ?? [];

              return (
                <div key={pillar.id}>
                  <button
                    className={`${s.pillarBtn} ${isExpanded ? s.pillarBtnExpanded : ""}`}
                    onClick={() => setExpandedPillar(isExpanded ? null : pillar.id)}
                  >
                    <span className={s.pillarDot} style={{ backgroundColor: pillar.color }} />
                    <span className={s.pillarName}>{pillar.name}</span>
                    <span className={s.pillarPct}>{Math.round(avg * 100)}%</span>
                    <ChevronRight
                      size={14}
                      className={`${s.chevron} ${isExpanded ? s.chevronOpen : ""}`}
                    />
                  </button>

                  {isExpanded && (
                    <div className={s.compList}>
                      {comps.map((comp) => {
                        const st = stateMap[comp.id];
                        const pL = st?.p_learned ?? 0;

                        return (
                          <div
                            key={comp.id}
                            className={s.compRow}
                            onClick={() => navigate(`/practice?competency=${comp.id}`)}
                          >
                            <span className={s.compName}>
                              {comp.name}
                            </span>
                            <span className={s.compPct} style={{ color: pillar.color }}>
                              {Math.round(pL * 100)}%
                            </span>
                            <div className={s.compBar}>
                              <ProgressBar
                                value={Math.round(pL * 100)}
                                color={pillar.color}
                                height="sm"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
