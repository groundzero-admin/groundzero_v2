import * as styles from "./ProgressBar.css";

interface ProgressBarProps {
  value: number; // 0–100
  color?: string;
  height?: "sm" | "md" | "lg";
  label?: string;
  showPercent?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  color = "#805AD5",
  height = "md",
  label,
  showPercent = false,
  className,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(" ")}>
      {(label || showPercent) && (
        <div className={styles.labelRow}>
          {label && <span className={styles.labelText}>{label}</span>}
          {showPercent && (
            <span className={styles.percentText}>{Math.round(clamped)}%</span>
          )}
        </div>
      )}
      <div className={styles.track({ height })}>
        <div
          className={styles.fill}
          style={{ width: `${clamped}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
