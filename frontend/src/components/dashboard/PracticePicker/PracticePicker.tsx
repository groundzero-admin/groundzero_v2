import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { Dumbbell, ChevronRight } from "lucide-react";
import type { CompetencyState } from "@/api/types";
import type { CompetencyInfo } from "@/api/hooks/useCompetencies";
import { Card, ProgressBar } from "@/components/ui";
import { STAGE_LABELS } from "@/lib/constants";
import { competencyToPillarId } from "@/lib/pillar-helpers";
import * as s from "./PracticePicker.css";

interface PillarData {
  id: string;
  name: string;
  color: string;
}

interface PracticePickerProps {
  pillars: PillarData[];
  competencies: CompetencyInfo[];
  states: CompetencyState[];
}

export function PracticePicker({ pillars, competencies, states }: PracticePickerProps) {
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);
  const navigate = useNavigate();

  // Group competencies by pillar
  const byPillar = useMemo(() => {
    const map: Record<string, CompetencyInfo[]> = {};
    for (const c of competencies) {
      const pillarId = competencyToPillarId(c.id);
      if (!map[pillarId]) map[pillarId] = [];
      map[pillarId].push(c);
    }
    // Sort within each pillar
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => a.id.localeCompare(b.id));
    }
    return map;
  }, [competencies]);

  // State lookup
  const stateMap = useMemo(() => {
    const map: Record<string, CompetencyState> = {};
    for (const st of states) {
      map[st.competency_id] = st;
    }
    return map;
  }, [states]);

  // Pillar average p_learned
  function pillarAvg(pillarId: string): number {
    const comps = byPillar[pillarId] ?? [];
    if (comps.length === 0) return 0;
    const total = comps.reduce((sum, c) => sum + (stateMap[c.id]?.p_learned ?? 0), 0);
    return total / comps.length;
  }

  function handlePractice(competencyId: string) {
    navigate(`/practice?competency=${competencyId}`);
  }

  return (
    <Card elevation="low">
      <div className={s.root}>
        <div className={s.heading}>
          <Dumbbell size={16} />
          Self-Serve Practice
        </div>

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
                  <span
                    className={s.pillarDot}
                    style={{ backgroundColor: pillar.color }}
                  />
                  <span className={s.pillarName}>{pillar.name}</span>
                  <span className={s.pillarPct}>
                    {Math.round(avg * 100)}%
                  </span>
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
                      const canPractice = comp.assessment_method !== "llm";

                      return (
                        <div
                          key={comp.id}
                          className={s.compRow}
                          onClick={() => canPractice && handlePractice(comp.id)}
                          style={{ opacity: canPractice ? 1 : 0.5, cursor: canPractice ? "pointer" : "default" }}
                        >
                          <span className={s.compName}>
                            {comp.id} — {comp.name}
                          </span>
                          <span className={s.compStage}>
                            {STAGE_LABELS[st?.stage ?? 1]}
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
      </div>
    </Card>
  );
}
