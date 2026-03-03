import type { ButtonHTMLAttributes, CSSProperties } from "react";
import { button } from "./Button.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  /** Custom color — sets background directly */
  accentColor?: string;
}

export function Button({
  variant,
  size,
  accentColor,
  className,
  style,
  children,
  ...props
}: ButtonProps) {
  const cls = [button({ variant, size }), className]
    .filter(Boolean)
    .join(" ");

  const overrideStyle: CSSProperties | undefined = accentColor
    ? { backgroundColor: accentColor, color: "#fff", ...style }
    : style;

  return (
    <button className={cls} style={overrideStyle} {...props}>
      {children}
    </button>
  );
}
