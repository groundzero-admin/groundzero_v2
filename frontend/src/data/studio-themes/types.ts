import type { AccessoryType } from "@/components/characters/types";

export type StudioThemeId = "wizardry" | "space" | "jungle" | "ocean";

export interface ThemeLabels {
  xpName: string;
  xpIcon: string;
  stepNoun: string;
  projectNoun: string;
  completionTitle: string;
  galleryTitle: string;
  gallerySubtitle: string;
}

export interface ThemeVisuals {
  pageBackground: string;
  cardBackground: string;
  cardBorderColor: string;
  accentColor: string;
  accentHoverColor: string;
  surfaceTint: string;
  xpToastColor: string;
}

export interface ThemeCharacterOverrides {
  addAccessories: AccessoryType[];
  removeAccessories: AccessoryType[];
  outfitColor?: string;
}

export interface ThemedProjectOverride {
  projectId: string;
  name: string;
  tagline: string;
  icon: string;
  color: string;
  stepOverrides: Record<string, { storyText: string }>;
}

export interface StudioTheme {
  id: StudioThemeId;
  name: string;
  description: string;
  icon: string;
  previewGradient: string;
  labels: ThemeLabels;
  visuals: ThemeVisuals;
  characterOverrides: ThemeCharacterOverrides;
  presetOverrides?: Partial<
    Record<"chef" | "detective" | "spy" | "explorer", ThemeCharacterOverrides>
  >;
  projectOverrides: ThemedProjectOverride[];
}
