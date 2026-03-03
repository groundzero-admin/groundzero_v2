import { motion } from "framer-motion";
import type { StudioProject } from "@/data/studio-projects";
import * as s from "./ProjectCard.css";

interface ProjectCardProps {
  project: StudioProject;
  themed?: boolean;
  onClick: () => void;
}

export function ProjectCard({ project, themed, onClick }: ProjectCardProps) {
  const stepCount = project.steps.length;

  return (
    <motion.div
      className={`${s.card} ${project.locked ? s.cardLocked : ""}`}
      onClick={project.locked ? undefined : onClick}
      whileHover={project.locked ? undefined : { y: -4 }}
      whileTap={project.locked ? undefined : { scale: 0.97 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={
        themed
          ? {
              backgroundColor: "var(--studio-card-bg)",
              borderColor: "var(--studio-card-border)",
            }
          : undefined
      }
    >
      {/* Color bar at top */}
      <div
        className={s.colorBar}
        style={{ backgroundColor: project.color }}
      />

      {/* Lock badge */}
      {project.locked && (
        <span className={s.lockBadge}>🔒 Soon</span>
      )}

      <span className={s.icon}>{project.icon}</span>
      <div
        className={s.name}
        style={themed ? { color: "rgba(255,255,255,0.95)" } : undefined}
      >
        {project.name}
      </div>
      <div
        className={s.tagline}
        style={themed ? { color: "rgba(255,255,255,0.55)" } : undefined}
      >
        {project.tagline}
      </div>
      <div className={s.chapter}>Ch {project.chapter}</div>

      {/* Step dots (only for unlocked) */}
      {!project.locked && stepCount > 0 && (
        <div className={s.stepDots}>
          {Array.from({ length: stepCount }, (_, i) => (
            <div key={i} className={s.dot} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
