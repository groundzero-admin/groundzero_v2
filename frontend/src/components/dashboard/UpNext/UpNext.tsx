import type { ActivityRecommendation } from "@/api/types";
import { useActivities } from "@/api/hooks/useActivities";
import { Sparkles, Clock, ChevronRight } from "lucide-react";
import * as s from "./UpNext.css";

interface UpNextProps {
  recommendations: ActivityRecommendation[];
}

export function UpNext({ recommendations }: UpNextProps) {
  const { data: activities } = useActivities();

  if (!recommendations.length) {
    return (
      <div className={s.root}>
        <span className={s.sectionLabel}>Up Next</span>
        <div className={s.emptyState}>
          Complete your diagnostic to unlock quests!
        </div>
      </div>
    );
  }

  const hero = recommendations[0];
  const rest = recommendations.slice(1, 4);
  const heroActivity = activities?.find((a) => a.id === hero.activity_id);

  return (
    <div className={s.root}>
      <span className={s.sectionLabel}>Up Next</span>

      <div className={s.heroCard}>
        <div className={s.heroTitle}>{hero.activity_name}</div>
        {heroActivity?.description && (
          <div className={s.heroDesc}>{heroActivity.description}</div>
        )}
        <div className={s.heroMeta}>
          {heroActivity?.type && (
            <span className={s.metaBadge}>
              <Sparkles size={12} />
              {heroActivity.type.replace("_", " ")}
            </span>
          )}
          {heroActivity?.duration_minutes && (
            <span className={s.metaBadge}>
              <Clock size={12} />
              {heroActivity.duration_minutes} min
            </span>
          )}
          {heroActivity?.week && (
            <span className={s.metaBadge}>
              Week {heroActivity.week}
            </span>
          )}
          <span className={s.scoreChip}>
            Match: {Math.round(hero.score * 100)}%
          </span>
        </div>
      </div>

      {rest.length > 0 && (
        <div className={s.moreList}>
          {rest.map((rec) => (
            <div key={rec.activity_id} className={s.moreItem}>
              <span>{rec.activity_name}</span>
              <span className={s.moreScore}>
                {Math.round(rec.score * 100)}%
                <ChevronRight size={14} style={{ verticalAlign: "middle" }} />
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UpNext;
