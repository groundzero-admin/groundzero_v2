import type { SessionActivity } from "@/api/types";
import { Send, Check } from "lucide-react";
import * as s from "./ActivityCard.css";

interface ActivityCardProps {
  sa: SessionActivity;
  onLaunch: (activityId: string) => void;
  isLaunching?: boolean;
}

export default function ActivityCard({ sa, onLaunch, isLaunching }: ActivityCardProps) {
  return (
    <div className={s.card}>
      <div className={s.info}>
        <div className={s.name}>{sa.activity_name ?? sa.activity_id}</div>
        <div className={s.description}>
          {sa.activity_type} · Order {sa.order}
        </div>
      </div>
      {sa.status === "completed" ? (
        <span className={s.badge}>
          <Check size={14} /> Done
        </span>
      ) : sa.status === "active" ? (
        <span className={s.liveBadge}>
          <span className={s.liveDot} /> Live
        </span>
      ) : (
        <button
          className={s.launchBtn}
          onClick={() => onLaunch(sa.activity_id)}
          disabled={isLaunching}
        >
          {isLaunching ? "..." : "Launch"} <Send size={14} />
        </button>
      )}
    </div>
  );
}
