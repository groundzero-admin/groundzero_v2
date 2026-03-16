import { ThumbsUp, Meh, AlertCircle } from "lucide-react";
import * as s from "./ConfidenceChips.css";

type Confidence = "got_it" | "kinda" | "lost";

const CHIPS: Array<{ value: Confidence; label: string; icon: typeof ThumbsUp; selectedClass: string }> = [
  { value: "got_it", label: "Got it", icon: ThumbsUp, selectedClass: s.chipGotIt },
  { value: "kinda", label: "Kinda", icon: Meh, selectedClass: s.chipKinda },
  { value: "lost", label: "Lost", icon: AlertCircle, selectedClass: s.chipLost },
];

interface ConfidenceChipsProps {
  value: Confidence | null;
  onChange: (value: Confidence | null) => void;
  disabled?: boolean;
  variant?: "dark" | "light";
}

export function ConfidenceChips({
  value,
  onChange,
  disabled,
  variant = "dark",
}: ConfidenceChipsProps) {
  const chipBase = variant === "dark" ? s.chipDark : s.chipLight;
  // for light we keep old selected style; for dark we use per-mood colour
  const getSelectedClass = (chip: typeof CHIPS[0]) =>
    variant === "dark" ? chip.selectedClass : s.chipLightSelected;

  return (
    <div className={s.root}>
      <div className={s.privacyNote[variant]}>Only you can see this — be honest!</div>
      <div className={s.label[variant]}>How confident are you?</div>
      <div className={s.chips}>
        {CHIPS.map((chip) => {
          const isSelected = value === chip.value;
          return (
            <button
              key={chip.value}
              disabled={disabled}
              className={`${chipBase} ${isSelected ? getSelectedClass(chip) : ""}`}
              onClick={() => onChange(value === chip.value ? null : chip.value)}
            >
              <chip.icon size={13} />
              {chip.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
