import { ThumbsUp, Meh, AlertCircle } from "lucide-react";
import * as s from "./ConfidenceChips.css";

type Confidence = "got_it" | "kinda" | "lost";

const CHIPS: Array<{ value: Confidence; label: string; icon: typeof ThumbsUp }> = [
  { value: "got_it", label: "Got it", icon: ThumbsUp },
  { value: "kinda", label: "Kinda", icon: Meh },
  { value: "lost", label: "Lost", icon: AlertCircle },
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
  const chipSel = variant === "dark" ? s.chipDarkSelected : s.chipLightSelected;

  return (
    <div className={s.root}>
      <div className={s.privacyNote[variant]}>
        Only you can see this — be honest!
      </div>
      <div className={s.label[variant]}>How confident are you?</div>
      <div className={s.chips}>
        {CHIPS.map(({ value: chipValue, label, icon: Icon }) => (
          <button
            key={chipValue}
            disabled={disabled}
            className={`${chipBase} ${value === chipValue ? chipSel : ""}`}
            onClick={() =>
              onChange(value === chipValue ? null : chipValue)
            }
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
