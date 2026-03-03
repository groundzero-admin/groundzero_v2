import type { ElementType, ReactNode, CSSProperties } from "react";
import { sprinkles } from "@/styles/sprinkles.css";

interface TextProps {
  as?: ElementType;
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  weight?: "regular" | "medium" | "semibold" | "bold" | "extrabold";
  color?: "primary" | "secondary" | "tertiary" | "inverse" | "link" | "success" | "warning" | "danger" | "gold";
  align?: "left" | "center" | "right";
  leading?: "tight" | "normal" | "relaxed";
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

export function Text({
  as: Component = "span",
  size = "base",
  weight = "regular",
  color = "primary",
  align,
  leading,
  className,
  style,
  children,
}: TextProps) {
  const cls = sprinkles({
    fontSize: size,
    fontWeight: weight,
    color,
    ...(align && { textAlign: align }),
    ...(leading && { lineHeight: leading }),
  } as any);

  return (
    <Component className={[cls, className].filter(Boolean).join(" ")} style={style}>
      {children}
    </Component>
  );
}
