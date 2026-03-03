import type { HTMLAttributes } from "react";
import { card } from "./Card.css";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevation?: "flat" | "low" | "mid" | "high";
  interactive?: boolean;
}

export function Card({
  elevation,
  interactive,
  className,
  children,
  ...props
}: CardProps) {
  const cls = [card({ elevation, interactive }), className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cls} {...props}>
      {children}
    </div>
  );
}
