import { ThumbsUp, Meh, AlertCircle } from "lucide-react";
import * as s from "./ConfidenceChips.css";
import type { CSSProperties } from "react";

type Confidence = "got_it" | "kinda" | "lost";

const CHIPS: Array<{
  value: Confidence;
  label: string;
  icon: typeof ThumbsUp;
  selectedClass: string;
  baseClass: string;
  disabledClass: string;
  pulseColor: string;
}> = [
  {
    value: "got_it",
    label: "Got it",
    icon: ThumbsUp,
    selectedClass: s.chipGotIt,
    baseClass: s.chipGotItBase,
    disabledClass: s.chipGotItDisabled,
    pulseColor: "rgba(34,197,94,0.55)",
  },
  {
    value: "kinda",
    label: "Kinda",
    icon: Meh,
    selectedClass: s.chipKinda,
    baseClass: s.chipKindaBase,
    disabledClass: s.chipKindaDisabled,
    pulseColor: "rgba(245,158,11,0.55)",
  },
  {
    value: "lost",
    label: "Lost",
    icon: AlertCircle,
    selectedClass: s.chipLost,
    baseClass: s.chipLostBase,
    disabledClass: s.chipLostDisabled,
    pulseColor: "rgba(239,68,68,0.55)",
  },
];

interface ConfidenceChipsProps {
  value: Confidence | null;
  onChange: (value: Confidence | null) => void;
  disabled?: boolean;
  variant?: "dark" | "light";
  pulseValue?: Confidence | null;
  showSelection?: boolean;
  colorizeUnselected?: boolean;
  deselectOnSame?: boolean;
}

export function ConfidenceChips({
  value,
  onChange,
  disabled,
  variant = "dark",
  pulseValue,
  showSelection = true,
  colorizeUnselected = false,
  deselectOnSame = true,
}: ConfidenceChipsProps) {
  const chipBase = variant === "dark" ? s.chipDark : s.chipLight;

  return (
    <div className={s.root}>
      <div className={s.privacyNote[variant]}>Only you can see this — be honest!</div>
      <div className={s.label[variant]}>How confident are you?</div>
      <div className={s.chips}>
        {CHIPS.map((chip) => {
          const isSelected = showSelection && value === chip.value;
          const isPulsing = pulseValue === chip.value;
          const isDisabled = !!disabled;
          const moodClass =
            variant === "dark"
              ? isDisabled
                ? chip.disabledClass
                : colorizeUnselected
                  ? chip.baseClass
                  : ""
              : "";

          const selectionClass =
            variant === "dark"
              ? isSelected
                ? chip.selectedClass
                : ""
              : isSelected
                ? s.chipLightSelected
                : "";

          const pulseStyle: CSSProperties | undefined = isPulsing
            ? ({ "--pulse-color": chip.pulseColor } as unknown as CSSProperties)
            : undefined;

          return (
            <button
              key={chip.value}
              disabled={disabled}
              style={pulseStyle}
              className={`${chipBase} ${moodClass} ${selectionClass} ${
                isPulsing ? s.chipPulse : ""
              }`}
              onClick={() =>
                onChange(
                  value === chip.value && deselectOnSame ? null : chip.value
                )
              }
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
