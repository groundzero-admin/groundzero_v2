import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { StudioTheme, StudioThemeId } from "@/data/studio-themes";
import { getStudioTheme, STUDIO_THEMES } from "@/data/studio-themes";

interface StudioThemeContextValue {
  activeTheme: StudioTheme | null;
  themeId: StudioThemeId | null;
  setThemeId: (id: StudioThemeId | null) => void;
  themes: StudioTheme[];
}

const STORAGE_KEY = "gz_studio_theme";
const StudioThemeCtx = createContext<StudioThemeContextValue | null>(null);

export function StudioThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<StudioThemeId | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) as StudioThemeId | null;
    } catch {
      return null;
    }
  });

  const setThemeId = useCallback((id: StudioThemeId | null) => {
    try {
      if (id) localStorage.setItem(STORAGE_KEY, id);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setThemeIdState(id);
  }, []);

  const activeTheme = themeId ? (getStudioTheme(themeId) ?? null) : null;

  return (
    <StudioThemeCtx.Provider
      value={{ activeTheme, themeId, setThemeId, themes: STUDIO_THEMES }}
    >
      {children}
    </StudioThemeCtx.Provider>
  );
}

export function useStudioTheme() {
  const ctx = useContext(StudioThemeCtx);
  if (!ctx)
    throw new Error("useStudioTheme must be used within StudioThemeProvider");
  return ctx;
}
