import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as s from "./PatternSequence.css";

interface PatternSequenceProps {
  sequence: (string | number)[];
  type: "number" | "shape";
  options: { text: string; isCorrect: boolean }[];
  explanationText: string;
  onCorrect: () => void;
  onWrong: () => void;
}

const SHAPES: Record<string, React.ReactNode> = {
  circle: (
    <svg width="28" height="28" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="12" fill="#3182CE" />
    </svg>
  ),
  triangle: (
    <svg width="28" height="28" viewBox="0 0 28 28">
      <polygon points="14,2 26,26 2,26" fill="#E53E3E" />
    </svg>
  ),
  square: (
    <svg width="28" height="28" viewBox="0 0 28 28">
      <rect x="2" y="2" width="24" height="24" rx="2" fill="#38A169" />
    </svg>
  ),
  star: (
    <svg width="28" height="28" viewBox="0 0 28 28">
      <polygon
        points="14,2 17.5,10.5 26,11 19.5,17 21.5,26 14,21 6.5,26 8.5,17 2,11 10.5,10.5"
        fill="#D69E2E"
      />
    </svg>
  ),
};

function renderItem(item: string | number, type: "number" | "shape") {
  if (type === "shape" && typeof item === "string" && SHAPES[item]) {
    return SHAPES[item];
  }
  return <span>{item}</span>;
}

function renderOptionItem(text: string, type: "number" | "shape") {
  if (type === "shape" && SHAPES[text]) {
    return SHAPES[text];
  }
  return <span>{text}</span>;
}

export function PatternSequence({
  sequence,
  type,
  options,
  explanationText,
  onCorrect,
  onWrong,
}: PatternSequenceProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [filledAnswer, setFilledAnswer] = useState<string | null>(null);

  const isCorrect = selected !== null && options[selected].isCorrect;

  const handleSelect = (idx: number) => {
    if (showResult) return;
    setSelected(idx);
    setShowResult(true);
    if (options[idx].isCorrect) {
      setFilledAnswer(options[idx].text);
      onCorrect();
    } else {
      onWrong();
    }
  };

  return (
    <div className={s.root}>
      {/* Sequence train */}
      <div className={s.train}>
        {sequence.map((item, idx) => (
          <motion.div
            key={idx}
            className={s.trainItem}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.12, type: "spring", stiffness: 300 }}
          >
            {renderItem(item, type)}
          </motion.div>
        ))}

        <span className={s.arrow}>→</span>

        {/* Missing slot */}
        <motion.div
          className={filledAnswer ? s.trainFilled : s.trainMissing}
          animate={
            filledAnswer
              ? { scale: [1, 1.2, 1] }
              : {}
          }
          transition={{ duration: 0.4, type: "spring" }}
        >
          {filledAnswer ? renderOptionItem(filledAnswer, type) : "?"}
        </motion.div>
      </div>

      {/* Divider + Label + Options */}
      {!showResult && (
        <>
        <div className={s.divider} />
        <div className={s.pickLabel}>
          👆 Tap the correct answer
        </div>
        <motion.div
          className={s.options}
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.06 } },
          }}
        >
          {options.map((opt, idx) => (
            <motion.button
              key={idx}
              className={s.optionBtn}
              onClick={() => handleSelect(idx)}
              variants={{
                hidden: { opacity: 0, y: 12 },
                visible: { opacity: 1, y: 0 },
              }}
              whileHover={{ scale: 1.08, y: -3 }}
              whileTap={{ scale: 0.92 }}
            >
              {renderOptionItem(opt.text, type)}
            </motion.button>
          ))}
        </motion.div>
        </>
      )}

      {/* Feedback */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            className={s.feedback}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div
              className={s.feedbackText}
              style={{ color: isCorrect ? "#38A169" : "#E53E3E" }}
            >
              {isCorrect ? "Pattern cracked! 🔍" : "Not this time!"}
            </div>
            <div className={s.explanation}>{explanationText}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
