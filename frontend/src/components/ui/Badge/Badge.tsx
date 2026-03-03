import type { HTMLAttributes, CSSProperties } from "react";
import { badge } from "./Badge.css";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  size?: "sm" | "md" | "lg";
  tone?: "neutral" | "success" | "warning" | "danger" | "info" | "gold";
  /** Custom pillar color — overrides tone */
  pillarColor?: string;
}

export function Badge({
  size,
  tone,
  pillarColor,
  className,
  style,
  children,
  ...props
}: BadgeProps) {
  const cls = [badge({ size, tone: pillarColor ? undefined : tone }), className]
    .filter(Boolean)
    .join(" ");

  const overrideStyle: CSSProperties | undefined = pillarColor
    ? {
        backgroundColor: `${pillarColor}18`,
        color: pillarColor,
        ...style,
      }
    : style;

  return (
    <span className={cls} style={overrideStyle} {...props}>
      {children}
    </span>
  );
}
