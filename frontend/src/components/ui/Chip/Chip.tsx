import type { ButtonHTMLAttributes, CSSProperties } from "react";
import * as styles from "./Chip.css";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  /** When selected, uses this color for border + text */
  activeColor?: string;
}

export function Chip({
  selected = false,
  activeColor,
  className,
  style,
  children,
  ...props
}: ChipProps) {
  const cls = [
    styles.chip,
    selected && styles.chipSelected,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const overrideStyle: CSSProperties | undefined =
    selected && activeColor
      ? {
          backgroundColor: `${activeColor}15`,
          borderColor: activeColor,
          color: activeColor,
          ...style,
        }
      : style;

  return (
    <button className={cls} style={overrideStyle} {...props}>
      {children}
    </button>
  );
}
