import { CharacterBase } from "../CharacterBase";
import type { CharacterConfig, Expression, Action } from "../types";

const config: CharacterConfig = {
  headShape: "round",
  skinColor: "#FADBD8",
  outfitColor: "#2980B9",
  hairColor: "#E67E22",
  hairStyle: "short",
  accessories: ["scarf"],
  eyeColor: "#2C3E50",
};

interface ExplorerCharacterProps {
  expression?: Expression;
  action?: Action;
  size?: number;
}

export function ExplorerCharacter({ expression, action, size }: ExplorerCharacterProps) {
  return <CharacterBase config={config} expression={expression} action={action} size={size} />;
}
