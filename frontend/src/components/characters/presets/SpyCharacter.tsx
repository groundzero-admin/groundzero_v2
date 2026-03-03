import { CharacterBase } from "../CharacterBase";
import type { CharacterConfig, Expression, Action } from "../types";

const config: CharacterConfig = {
  headShape: "square",
  skinColor: "#D4EFDF",
  outfitColor: "#2C3E50",
  accessories: ["sunglasses", "antenna"],
  eyeColor: "#1A1A2E",
};

interface SpyCharacterProps {
  expression?: Expression;
  action?: Action;
  size?: number;
}

export function SpyCharacter({ expression, action, size }: SpyCharacterProps) {
  return <CharacterBase config={config} expression={expression} action={action} size={size} />;
}
