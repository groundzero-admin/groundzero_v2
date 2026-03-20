import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { Palette, BookOpen, Star } from "lucide-react";
import * as homeStyles from "@/pages/HomePage.css";

const MODES = [
  {
    id: "studio",
    name: "Studio",
    desc: "Build fun projects with math",
    icon: <Palette size={24} />,
    color: "#805AD5",
    gradient: "linear-gradient(135deg, #805AD5, #B794F4)",
    route: "/studio",
    stats: "4 projects ready",
    enabled: true,
  },
  {
    id: "exam",
    name: "Exam Prep",
    desc: "Practice for exams chapter-wise",
    icon: <BookOpen size={24} />,
    color: "#3182CE",
    gradient: "linear-gradient(135deg, #3182CE, #63B3ED)",
    route: "/practice",
    stats: "10 chapters",
    enabled: false,
  },
  {
    id: "benchmark",
    name: "AI Benchmark",
    desc: "Discover your strengths with AI",
    icon: <Star size={24} />,
    color: "#38A169",
    gradient: "linear-gradient(135deg, #38A169, #68D391)",
    route: "/benchmark",
    stats: "8 dimensions",
    enabled: true,
  },
] as const;

export function QuickModeCards() {
  const navigate = useNavigate();

  return (
    <div style={{ width: "100%" }}>
      <div className={homeStyles.modeCards} style={{ maxWidth: "none" }}>
        {MODES.map((mode, idx) => (
          <motion.div
            key={mode.id}
            className={`${homeStyles.modeCard} ${!mode.enabled ? homeStyles.modeCardDisabled : ""}`}
            onClick={mode.enabled ? () => navigate(mode.route) : undefined}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.33, type: "spring" }}
            whileHover={mode.enabled ? { y: -5 } : undefined}
            whileTap={mode.enabled ? { scale: 0.97 } : undefined}
            style={{
              padding: "14px 12px",
              borderRadius: 18,
              gap: 10,
            }}
          >
            <div className={homeStyles.modeGradient} style={{ background: mode.gradient, height: 4 }} />

            <div
              className={homeStyles.modeIcon}
              style={{
                backgroundColor: `${mode.color}15`,
                color: mode.color,
                width: 48,
                height: 48,
                borderRadius: 18,
                fontSize: "1.25rem",
              }}
            >
              {mode.icon}
            </div>

            <div
              className={homeStyles.modeName}
              style={{
                fontSize: "1.05rem",
              }}
            >
              {mode.name}
            </div>
            <div className={homeStyles.modeDesc} style={{ fontSize: "0.78rem" }}>
              {mode.desc}
            </div>

            {!mode.enabled && <span className={homeStyles.comingSoon}>Coming Soon</span>}
            {mode.stats && <div className={homeStyles.modeStats} style={{ fontSize: "0.72rem" }}>{mode.stats}</div>}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

