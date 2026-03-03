import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as s from "./StudioMCQ.css";

interface StudioMCQProps {
  options: { text: string; isCorrect: boolean }[];
  explanationText: string;
  onCorrect: () => void;
  onWrong: () => void;
}

export function StudioMCQ({
  options,
  explanationText,
  onCorrect,
  onWrong,
}: StudioMCQProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const isCorrect = selected !== null && options[selected].isCorrect;

  const handleSelect = (idx: number) => {
    if (showResult) return;
    setSelected(idx);
    setShowResult(true);
    if (options[idx].isCorrect) {
      onCorrect();
    } else {
      onWrong();
    }
  };

  return (
    <div className={s.root}>
      <motion.div
        className={s.options}
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.08 } },
        }}
      >
        {options.map((opt, idx) => {
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
              whileHover={!showResult ? { scale: 1.04, y: -2 } : undefined}
              whileTap={!showResult ? { scale: 0.96 } : undefined}
              animate={
                showResult && idx === selected && !opt.isCorrect
                  ? { x: [0, -6, 6, -4, 4, 0] }
                  : showResult && opt.isCorrect
                    ? { scale: [1, 1.1, 1] }
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
            className={s.feedback}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div
              className={s.feedbackText}
              style={{ color: isCorrect ? "#38A169" : "#E53E3E" }}
            >
              {isCorrect ? "Awesome! 🎉" : "Not quite!"}
            </div>
            <div className={s.explanation}>{explanationText}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
