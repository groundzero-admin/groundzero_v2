import type { ReactNode } from "react";
import { sprinkles } from "@/styles/sprinkles.css";

interface StackProps {
  direction?: "row" | "column";
  gap?: "0" | "1" | "2" | "3" | "4" | "5" | "6" | "8" | "10" | "12" | "16";
  align?: "stretch" | "flex-start" | "center" | "flex-end" | "baseline";
  justify?: "stretch" | "flex-start" | "center" | "flex-end" | "space-between" | "space-around";
  wrap?: boolean;
  className?: string;
  children: ReactNode;
}

export function Stack({
  direction = "column",
  gap = "4",
  align,
  justify,
  wrap = false,
  className,
  children,
}: StackProps) {
  const cls = sprinkles({
    display: "flex",
    flexDirection: direction,
    gap: gap as keyof typeof sprinkles extends never ? never : typeof gap extends string ? any : never,
    ...(align && { alignItems: align }),
    ...(justify && { justifyContent: justify }),
    ...(wrap && { flexWrap: "wrap" }),
  } as any);

  return (
    <div className={[cls, className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}
