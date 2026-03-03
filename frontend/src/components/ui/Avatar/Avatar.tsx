import { avatar } from "./Avatar.css";
import { pillarColors } from "@/styles/tokens";

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const COLORS = [
  pillarColors.communication,
  pillarColors.creativity,
  pillarColors.ai,
  pillarColors.math,
  "#D69E2E",
  "#DD6B20",
  "#319795",
  "#B83280",
];

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function Avatar({ name, size, className }: AvatarProps) {
  const color = COLORS[hashName(name) % COLORS.length];

  const cls = [avatar({ size }), className].filter(Boolean).join(" ");

  return (
    <div className={cls} style={{ backgroundColor: color }} title={name}>
      {initials(name)}
    </div>
  );
}
