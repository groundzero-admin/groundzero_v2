export type Expression = "idle" | "happy" | "thinking" | "sad" | "surprised" | "celebrating";
export type Action = "idle" | "talking" | "waving" | "pointing" | "celebrating";
export type HeadShape = "round" | "square" | "oval";
export type HairStyle = "short" | "long" | "none";
export type AccessoryType =
  | "chef-hat"
  | "magnifying-glass"
  | "sunglasses"
  | "hard-hat"
  | "scarf"
  | "antenna"
  | "wizard-hat"
  | "wand"
  | "space-helmet"
  | "jetpack"
  | "leaf-crown"
  | "binoculars"
  | "diving-mask"
  | "trident";

export interface CharacterConfig {
  headShape: HeadShape;
  skinColor: string;
  outfitColor: string;
  hairColor?: string;
  hairStyle?: HairStyle;
  accessories: AccessoryType[];
  eyeColor: string;
}

export interface PartProps {
  expression: Expression;
  action: Action;
}
