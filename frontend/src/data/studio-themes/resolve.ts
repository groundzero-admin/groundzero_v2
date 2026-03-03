import type { StudioProject } from "../studio-projects";
import type { CharacterConfig, AccessoryType } from "@/components/characters/types";
import type { StudioTheme, ThemeCharacterOverrides } from "./types";

export function resolveThemedProject(
  project: StudioProject,
  theme: StudioTheme | null,
): StudioProject {
  if (!theme) return project;

  const override = theme.projectOverrides.find(
    (o) => o.projectId === project.id,
  );
  if (!override) return project;

  const themedSteps = project.steps.map((step) => {
    const stepOverride = override.stepOverrides[step.id];
    if (!stepOverride) return step;
    return { ...step, storyText: stepOverride.storyText };
  });

  return {
    ...project,
    name: override.name,
    tagline: override.tagline,
    icon: override.icon,
    color: override.color,
    steps: themedSteps,
  };
}

export function resolveAllThemedProjects(
  projects: StudioProject[],
  theme: StudioTheme | null,
): StudioProject[] {
  return projects.map((p) => resolveThemedProject(p, theme));
}

export function applyThemeToCharacter(
  baseConfig: CharacterConfig,
  theme: StudioTheme,
  presetName: string,
): CharacterConfig {
  const presetOverrides =
    theme.presetOverrides?.[
      presetName as keyof NonNullable<StudioTheme["presetOverrides"]>
    ];
  const overrides: ThemeCharacterOverrides =
    presetOverrides ?? theme.characterOverrides;

  let accessories: AccessoryType[] = baseConfig.accessories.filter(
    (acc) => !overrides.removeAccessories.includes(acc),
  );

  for (const acc of overrides.addAccessories) {
    if (!accessories.includes(acc)) {
      accessories.push(acc);
    }
  }

  return {
    ...baseConfig,
    accessories,
    ...(overrides.outfitColor ? { outfitColor: overrides.outfitColor } : {}),
  };
}
