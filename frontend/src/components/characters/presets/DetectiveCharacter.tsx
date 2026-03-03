import { CharacterBase } from "../CharacterBase";
import type { CharacterConfig, Expression, Action } from "../types";

const config: CharacterConfig = {
  headShape: "oval",
  skinColor: "#F5CBA7",
  outfitColor: "#8B6914",
  hairColor: "#2C1810",
  hairStyle: "short",
  accessories: ["magnifying-glass"],
  eyeColor: "#2C3E50",
};

interface DetectiveCharacterProps {
  expression?: Expression;
  action?: Action;
  size?: number;
}

export function DetectiveCharacter({ expression, action, size }: DetectiveCharacterProps) {
  return <CharacterBase config={config} expression={expression} action={action} size={size} />;
}
