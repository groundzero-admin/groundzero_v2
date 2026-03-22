import { useCallback, useState } from "react";
import * as s from "./StudentConfidenceBar.css";

export type ConfidenceMood = "got_it" | "confused" | "kinda" | "lost";

const MOODS: { id: ConfidenceMood; label: string; className: string }[] = [
  { id: "got_it", label: "Got it", className: s.btnGotIt },
  { id: "confused", label: "Confused", className: s.btnConfused },
  { id: "kinda", label: "Kinda", className: s.btnKinda },
  { id: "lost", label: "Lost", className: s.btnLost },
];

export interface StudentConfidenceBarProps {
  /** Display name sent to teacher feed */
  studentName: string;
  /** HMS broadcast — must be connected */
  sendBroadcastMessage: (payload: string) => void | Promise<void>;
  disabled?: boolean;
}

/**
 * Lets students signal how well they're following. Uses the same HMS JSON payload
 * as FeedTab expects: `{ type: "confidence_pulse", studentName, value }`.
 */
export function StudentConfidenceBar({ studentName, sendBroadcastMessage, disabled }: StudentConfidenceBarProps) {
  const [flashId, setFlashId] = useState<ConfidenceMood | null>(null);
  const [busy, setBusy] = useState(false);

  const onPick = useCallback(
    async (mood: ConfidenceMood) => {
      if (disabled || busy) return;
      setFlashId(mood);
      window.setTimeout(() => setFlashId(null), 450);
      setBusy(true);
      try {
        const payload = JSON.stringify({
          type: "confidence_pulse",
          studentName: studentName || "Student",
          value: mood,
        });
        await Promise.resolve(sendBroadcastMessage(payload));
      } finally {
        setBusy(false);
      }
    },
    [disabled, busy, sendBroadcastMessage, studentName],
  );

  return (
    <div className={s.root} role="group" aria-label="How confident are you?">
      <span className={s.label}>Feel</span>
      {MOODS.map((m) => (
        <button
          key={m.id}
          type="button"
          className={`${m.className} ${flashId === m.id ? s.btnFlash : ""}`}
          onClick={() => onPick(m.id)}
          disabled={disabled || busy}
          title={`I'm ${m.label.toLowerCase()}`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
