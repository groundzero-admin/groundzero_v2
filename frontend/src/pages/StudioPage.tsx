import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { STUDIO_PROJECTS } from "@/data/studio-projects";
import { resolveAllThemedProjects } from "@/data/studio-themes";
import { useStudioTheme } from "@/context/StudioThemeContext";
import { ProjectCard } from "@/components/studio/ProjectCard/ProjectCard";
import { ThemeSelector } from "@/components/studio/ThemeSelector/ThemeSelector";
import * as s from "./StudioPage.css";

export default function StudioPage() {
  const navigate = useNavigate();
  const { activeTheme } = useStudioTheme();

  const projects = resolveAllThemedProjects(STUDIO_PROJECTS, activeTheme);
  const labels = activeTheme?.labels;

  return (
    <div
      className={s.root}
      style={
        activeTheme
          ? ({
              background: activeTheme.visuals.pageBackground,
              "--studio-accent": activeTheme.visuals.accentColor,
              "--studio-accent-hover": activeTheme.visuals.accentHoverColor,
              "--studio-card-bg": activeTheme.visuals.cardBackground,
              "--studio-card-border": activeTheme.visuals.cardBorderColor,
              "--studio-surface-tint": activeTheme.visuals.surfaceTint,
            } as React.CSSProperties)
          : undefined
      }
    >
      <div
        className={s.backLink}
        onClick={() => navigate("/dashboard")}
        style={activeTheme ? { color: "rgba(255,255,255,0.5)" } : undefined}
      >
        <ArrowLeft size={14} /> Back
      </div>

      <div className={s.header}>
        <div
          className={s.title}
          style={activeTheme ? { color: "rgba(255,255,255,0.95)" } : undefined}
        >
          {labels?.galleryTitle ?? "Class 6 Math Projects"}
        </div>
        <div
          className={s.subtitle}
          style={activeTheme ? { color: "rgba(255,255,255,0.6)" } : undefined}
        >
          {labels?.gallerySubtitle ??
            "Each project is a mini-adventure with math challenges inside"}
        </div>
      </div>

      <ThemeSelector />

      <div className={s.grid}>
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            themed={!!activeTheme}
            onClick={() => navigate(`/studio/${project.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
