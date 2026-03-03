import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import type { BKTUpdate } from "@/api/types";
import { useCompetencies } from "@/api/hooks/useCompetencies";
import * as s from "./BKTUpdateToast.css";

interface BKTUpdateToastProps {
  updates: BKTUpdate[];
  onDone: () => void;
}

export function BKTUpdateToast({ updates, onDone }: BKTUpdateToastProps) {
  const [exiting, setExiting] = useState(false);
  const { data: competencies } = useCompetencies();

  useEffect(() => {
    const timer = setTimeout(() => setExiting(true), 3500);
    const removeTimer = setTimeout(onDone, 3800);
    return () => {
      clearTimeout(timer);
      clearTimeout(removeTimer);
    };
  }, [onDone]);

  if (updates.length === 0) return null;

  const getName = (id: string) =>
    competencies?.find((c) => c.id === id)?.name ?? "Skill updated";

  return (
    <div className={`${s.root} ${exiting ? s.rootExiting : ""}`}>
      {updates.map((u) => {
        const delta = u.p_learned_after - u.p_learned_before;
        const pct = Math.round(delta * 100);
        const stageChanged = u.stage_after > u.stage_before;
        const isUp = delta >= 0;

        return (
          <div key={u.competency_id}>
            <div className={s.toast}>
              <div
                className={s.iconBox}
                style={{
                  backgroundColor: isUp
                    ? "rgba(72, 187, 120, 0.15)"
                    : "rgba(229, 62, 62, 0.15)",
                  color: isUp ? "#48BB78" : "#E53E3E",
                }}
              >
                {isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              </div>
              <div className={s.content}>
                <div className={s.title}>{getName(u.competency_id)}</div>
                <div className={s.detail}>
                  {Math.round(u.p_learned_before * 100)}%
                  {" → "}
                  {Math.round(u.p_learned_after * 100)}%
                </div>
              </div>
              <div
                className={s.change}
                style={{ color: isUp ? "#48BB78" : "#E53E3E" }}
              >
                {isUp ? "+" : ""}
                {pct}%
              </div>
            </div>

            {stageChanged && (
              <div className={s.stageUp}>
                <Sparkles size={20} />
                <div>
                  <div className={s.stageUpText}>Level Up!</div>
                  <div className={s.stageUpSub}>
                    {getName(u.competency_id)}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
