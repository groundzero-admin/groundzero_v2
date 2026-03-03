import { CharacterBase } from "../CharacterBase";
import type { CharacterConfig, Expression, Action } from "../types";

const config: CharacterConfig = {
  headShape: "round",
  skinColor: "#FFD8B1",
  outfitColor: "#FFFFFF",
  hairColor: "#4A3728",
  hairStyle: "short",
  accessories: ["chef-hat"],
  eyeColor: "#3D3730",
};

interface ChefCharacterProps {
  expression?: Expression;
  action?: Action;
  size?: number;
}

export function ChefCharacter({ expression, action, size }: ChefCharacterProps) {
  return <CharacterBase config={config} expression={expression} action={action} size={size} />;
}
