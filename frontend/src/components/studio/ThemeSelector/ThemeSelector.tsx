import { useStudioTheme } from "@/context/StudioThemeContext";
import type { StudioThemeId } from "@/data/studio-themes";
import * as s from "./ThemeSelector.css";

export function ThemeSelector() {
  const { themeId, setThemeId, themes } = useStudioTheme();

  return (
    <div className={s.strip}>
      {/* Classic (no theme) */}
      <div
        className={`${s.chip} ${themeId === null ? s.chipActive : ""}`}
        onClick={() => setThemeId(null)}
        style={
          themeId === null
            ? ({
                "--chip-accent": "#805AD5",
                "--chip-bg": "rgba(128,90,213,0.08)",
                "--chip-glow": "rgba(128,90,213,0.2)",
              } as React.CSSProperties)
            : undefined
        }
      >
        <span className={s.chipIcon}>✨</span>
        Classic
      </div>

      {/* Theme options */}
      {themes.map((theme) => (
        <div
          key={theme.id}
          className={`${s.chip} ${themeId === theme.id ? s.chipActive : ""}`}
          onClick={() => setThemeId(theme.id as StudioThemeId)}
          style={
            themeId === theme.id
              ? ({
                  "--chip-accent": theme.visuals.accentColor,
                  "--chip-bg": `${theme.visuals.accentColor}12`,
                  "--chip-glow": `${theme.visuals.accentColor}33`,
                } as React.CSSProperties)
              : undefined
          }
        >
          <span className={s.chipIcon}>{theme.icon}</span>
          {theme.name}
        </div>
      ))}
    </div>
  );
}
