import type { StudioTheme, StudioThemeId } from "./types";
import { wizardryTheme } from "./themes/wizardry";
import { spaceTheme } from "./themes/space";
import { jungleTheme } from "./themes/jungle";
import { oceanTheme } from "./themes/ocean";

export const STUDIO_THEMES: StudioTheme[] = [
  wizardryTheme,
  spaceTheme,
  jungleTheme,
  oceanTheme,
];

export function getStudioTheme(id: StudioThemeId): StudioTheme | undefined {
  return STUDIO_THEMES.find((t) => t.id === id);
}

export type { StudioTheme, StudioThemeId } from "./types";
export {
  resolveThemedProject,
  resolveAllThemedProjects,
  applyThemeToCharacter,
} from "./resolve";
