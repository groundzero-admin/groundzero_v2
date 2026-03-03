import type { CharacterConfig } from "../types";

export const PRESET_CONFIGS: Record<string, CharacterConfig> = {
  chef: {
    headShape: "round",
    skinColor: "#FFD8B1",
    outfitColor: "#FFFFFF",
    hairColor: "#4A3728",
    hairStyle: "short",
    accessories: ["chef-hat"],
    eyeColor: "#3D3730",
  },
  detective: {
    headShape: "oval",
    skinColor: "#F5CBA7",
    outfitColor: "#8B6914",
    hairColor: "#2C1810",
    hairStyle: "short",
    accessories: ["magnifying-glass"],
    eyeColor: "#2C3E50",
  },
  spy: {
    headShape: "square",
    skinColor: "#D4EFDF",
    outfitColor: "#2C3E50",
    accessories: ["sunglasses", "antenna"],
    eyeColor: "#1A1A2E",
  },
  explorer: {
    headShape: "round",
    skinColor: "#FADBD8",
    outfitColor: "#2980B9",
    hairColor: "#E67E22",
    hairStyle: "short",
    accessories: ["scarf"],
    eyeColor: "#2C3E50",
  },
};
