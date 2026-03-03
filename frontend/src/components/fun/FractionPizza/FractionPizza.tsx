import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as s from "./FractionPizza.css";

export interface PizzaVariant {
  title: string;
  objectName: string;
  colors: string[];
  crustColor: string;
  dotColor: string;
  plateColor: string;
}

const DEFAULT_VARIANT: PizzaVariant = {
  title: "Fraction Pizza!",
  objectName: "pizza",
  colors: ["#FF6B35", "#E85D26", "#FF7F50", "#FF9966", "#FFB088", "#FFCC99", "#FFD9B3", "#FFE6CC"],
  crustColor: "#D4A34A",
  dotColor: "#C0392B",
  plateColor: "#F5F0EB",
};

interface PizzaQuestion {
  eaten: string;
  left: string;
  howMuch: string;
  totalSlices: number;
  eatenSlices: number;
  options: { text: string; isCorrect: boolean }[];
}

function makeQuestions(name: string): PizzaQuestion[] {
  return [
    {
      eaten: `What fraction of the ${name} has been used?`,
      left: `What fraction of the ${name} is LEFT?`,
      howMuch: `How much ${name} did we use?`,
      totalSlices: 8,
      eatenSlices: 3,
      options: [
        { text: "3/8", isCorrect: true },
        { text: "5/8", isCorrect: false },
        { text: "3/5", isCorrect: false },
        { text: "1/3", isCorrect: false },
      ],
    },
    {
      eaten: `What fraction of the ${name} has been used?`,
      left: `What fraction of the ${name} is LEFT?`,
      howMuch: `How much ${name} did we use?`,
      totalSlices: 6,
      eatenSlices: 2,
      options: [
        { text: "2/6", isCorrect: false },
        { text: "4/6", isCorrect: true },
        { text: "2/3", isCorrect: false },
        { text: "1/2", isCorrect: false },
      ],
    },
    {
      eaten: `What fraction of the ${name} has been used?`,
      left: `What fraction of the ${name} is LEFT?`,
      howMuch: `How much ${name} did we use?`,
      totalSlices: 4,
      eatenSlices: 1,
      options: [
        { text: "3/4", isCorrect: false },
        { text: "1/2", isCorrect: false },
        { text: "1/4", isCorrect: true },
        { text: "2/4", isCorrect: false },
      ],
    },
  ];
}

const QUESTION_TYPES = ["eaten", "left", "howMuch"] as const;

const CONFETTI_COLORS = ["#FF6B35", "#38A169", "#3182CE", "#805AD5", "#ECC94B", "#ED64A6"];

function CircleSVG({
  totalSlices,
  eatenSlices,
  chomping,
  variant,
}: {
  totalSlices: number;
  eatenSlices: number;
  chomping: boolean;
  variant: PizzaVariant;
}) {
  const cx = 130;
  const cy = 130;
  const r = 110;
  const crustR = 120;

  const slices = useMemo(() => {
    const items = [];
    const anglePerSlice = 360 / totalSlices;
    for (let i = 0; i < totalSlices; i++) {
      const startAngle = i * anglePerSlice - 90;
      const endAngle = startAngle + anglePerSlice;
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = cx + r * Math.cos(startRad);
      const y1 = cy + r * Math.sin(startRad);
      const x2 = cx + r * Math.cos(endRad);
      const y2 = cy + r * Math.sin(endRad);

      const largeArc = anglePerSlice > 180 ? 1 : 0;
      const d = `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`;

      const isEaten = i < eatenSlices;
      items.push({ d, isEaten, index: i });
    }
    return items;
  }, [totalSlices, eatenSlices]);

  // Base fill: lighter version of crust color
  const baseColor = variant.colors[variant.colors.length - 1] ?? "#FFD93D";

  return (
    <svg width={260} height={260} viewBox="0 0 260 260">
      {/* Plate shadow */}
      <circle cx={cx} cy={cy + 4} r={crustR + 5} fill="rgba(0,0,0,0.08)" />
      {/* Plate */}
      <circle cx={cx} cy={cy} r={crustR + 5} fill={variant.plateColor} />
      {/* Crust/rim circle */}
      <circle cx={cx} cy={cy} r={crustR} fill={variant.crustColor} />
      {/* Base fill */}
      <circle cx={cx} cy={cy} r={r} fill={baseColor} />

      {/* Slices */}
      {slices.map((slice) => (
        <motion.path
          key={slice.index}
          d={slice.d}
          fill={variant.colors[slice.index % variant.colors.length]}
          stroke={variant.crustColor}
          strokeWidth={2}
          initial={false}
          animate={
            slice.isEaten
              ? {
                  opacity: chomping ? [1, 0.5, 0] : 0,
                  scale: chomping ? [1, 1.1, 0] : 0,
                }
              : { opacity: 1, scale: 1 }
          }
          transition={
            slice.isEaten
              ? { duration: 0.6, delay: slice.index * 0.15, ease: "easeOut" }
              : { duration: 0.3 }
          }
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />
      ))}

      {/* Dots on remaining slices */}
      {slices
        .filter((sl) => !sl.isEaten)
        .map((slice) => {
          const anglePerSlice = 360 / totalSlices;
          const midAngle = (slice.index * anglePerSlice - 90 + anglePerSlice / 2) * (Math.PI / 180);
          const pepR = r * 0.55;
          const px = cx + pepR * Math.cos(midAngle);
          const py = cy + pepR * Math.sin(midAngle);
          return (
            <motion.circle
              key={`pep-${slice.index}`}
              cx={px}
              cy={py}
              r={8}
              fill={variant.dotColor}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8 + slice.index * 0.05, type: "spring", stiffness: 300 }}
            />
          );
        })}
    </svg>
  );
}

function ConfettiBurst() {
  const particles = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        x: Math.random() * 300 - 150,
        delay: Math.random() * 0.3,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 6 + Math.random() * 6,
      })),
    []
  );

  return (
    <div style={{ position: "absolute", top: "50%", left: "50%", pointerEvents: "none" }}>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
          animate={{
            x: p.x,
            y: -80 - Math.random() * 120,
            opacity: 0,
            scale: 1,
            rotate: Math.random() * 720,
          }}
          transition={{ duration: 1 + Math.random() * 0.5, delay: p.delay, ease: "easeOut" }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            backgroundColor: p.color,
          }}
        />
      ))}
    </div>
  );
}

interface FractionPizzaProps {
  variant?: PizzaVariant;
}

export function FractionPizza({ variant }: FractionPizzaProps) {
  const v = variant ?? DEFAULT_VARIANT;
  const questions = useMemo(() => makeQuestions(v.objectName), [v.objectName]);

  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [chomping, setChomping] = useState(false);
  const [score, setScore] = useState(0);

  const q = questions[qIndex];
  const questionText = q[QUESTION_TYPES[qIndex % QUESTION_TYPES.length]];
  const isCorrect = selected !== null && q.options[selected].isCorrect;

  const handleSelect = (idx: number) => {
    if (showResult) return;
    setSelected(idx);
    setShowResult(true);
    if (q.options[idx].isCorrect) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    setSelected(null);
    setShowResult(false);
    setChomping(true);
    setQIndex((i) => (i + 1) % questions.length);
    setTimeout(() => setChomping(true), 50);
  };

  useState(() => {
    setChomping(true);
  });

  return (
    <div className={s.root}>
      <div className={s.score}>
        Score: {score} / {questions.length}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={qIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}
        >
          <div className={s.title}>{v.title}</div>
          <div className={s.questionText}>{questionText}</div>

          <div className={s.pizzaContainer}>
            <CircleSVG
              totalSlices={q.totalSlices}
              eatenSlices={q.eatenSlices}
              chomping={chomping}
              variant={v}
            />
            {showResult && isCorrect && <ConfettiBurst />}
          </div>

          <motion.div
            className={s.options}
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.08 } },
            }}
          >
            {q.options.map((opt, idx) => {
              let cls = s.optionBtn;
              if (showResult) {
                if (opt.isCorrect) cls += ` ${s.optionCorrect}`;
                else if (idx === selected) cls += ` ${s.optionWrong}`;
                else cls += ` ${s.optionDisabled}`;
              }
              return (
                <motion.button
                  key={idx}
                  className={cls}
                  onClick={() => handleSelect(idx)}
                  variants={{
                    hidden: { opacity: 0, y: 16 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  whileHover={!showResult ? { scale: 1.06 } : undefined}
                  whileTap={!showResult ? { scale: 0.95 } : undefined}
                  animate={
                    showResult && idx === selected && !opt.isCorrect
                      ? { x: [0, -8, 8, -5, 5, 0] }
                      : showResult && opt.isCorrect
                        ? { scale: [1, 1.12, 1] }
                        : undefined
                  }
                  transition={{ duration: 0.4 }}
                >
                  {opt.text}
                </motion.button>
              );
            })}
          </motion.div>

          <AnimatePresence>
            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.3 }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}
              >
                <div
                  className={s.feedbackText}
                  style={{ color: isCorrect ? "#38A169" : "#E53E3E" }}
                >
                  {isCorrect
                    ? "Awesome! You got it!"
                    : `Not quite — the answer is ${q.options.find((o) => o.isCorrect)?.text}`}
                </div>
                <button className={s.nextBtn} onClick={handleNext}>
                  Next Question
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
