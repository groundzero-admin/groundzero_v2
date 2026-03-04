import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { Palette, BookOpen, Radio, Star } from "lucide-react";
import { useStudent } from "@/context/StudentContext";
import { useStudentById } from "@/api/hooks/useStudents";
import { useActiveSession } from "@/api/hooks/useActiveSession";
import * as s from "./HomePage.css";

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
    id: "live",
    name: "Live Session",
    desc: "Join your class live",
    icon: <Radio size={24} />,
    color: "#E53E3E",
    gradient: "linear-gradient(135deg, #E53E3E, #FC8181)",
    route: "/live",
    stats: "",
    enabled: true,
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

export default function HomePage() {
  const navigate = useNavigate();
  const { studentId } = useStudent();
  const { data: student } = useStudentById(studentId);

  return (
    <div className={s.root}>
      <div className={s.greeting}>
        <div className={s.greetingTitle}>
          {student ? `Hi ${student.name}!` : "What do you want to do today?"}
        </div>
        <div className={s.greetingSubtitle}>Pick a mode and start learning</div>
      </div>

      <div className={s.modeCards}>
        {MODES.map((mode, idx) => (
          <motion.div
            key={mode.id}
            className={`${s.modeCard} ${!mode.enabled ? s.modeCardDisabled : ""}`}
            onClick={mode.enabled ? () => navigate(mode.route) : undefined}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.4, type: "spring" }}
            whileHover={mode.enabled ? { y: -6 } : undefined}
            whileTap={mode.enabled ? { scale: 0.97 } : undefined}
          >
            <div className={s.modeGradient} style={{ background: mode.gradient }} />

            <div
              className={s.modeIcon}
              style={{ backgroundColor: `${mode.color}15`, color: mode.color }}
            >
              {mode.icon}
            </div>

            <div className={s.modeName}>{mode.name}</div>
            <div className={s.modeDesc}>{mode.desc}</div>

            {!mode.enabled && <span className={s.comingSoon}>Coming Soon</span>}
            {mode.stats && <div className={s.modeStats}>{mode.stats}</div>}
          </motion.div>
        ))}
      </div>

      <div className={s.footer}>
        <span>Ground Zero</span>
        <span>Class 6 Mathematics</span>
      </div>
    </div>
  );
}
