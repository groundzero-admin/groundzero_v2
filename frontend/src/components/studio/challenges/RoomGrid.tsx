import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as s from "./RoomGrid.css";

interface RoomGridProps {
  gridWidth: number;
  gridHeight: number;
  correctArea: number;
  label: string;
  explanationText: string;
  onCorrect: () => void;
  onWrong: () => void;
}

export function RoomGrid({
  gridWidth,
  gridHeight,
  correctArea,
  label,
  explanationText,
  onCorrect,
  onWrong,
}: RoomGridProps) {
  const [filled, setFilled] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const toggleCell = (row: number, col: number) => {
    if (submitted) return;
    const key = `${row}-${col}`;
    setFilled((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSubmit = () => {
    if (submitted) return;
    setSubmitted(true);
    const correct = filled.size === correctArea;
    setIsCorrect(correct);
    if (correct) onCorrect();
    else onWrong();
  };

  return (
    <div className={s.root}>
      <div className={s.label}>{label}</div>

      <div className={s.dimensions}>
        {gridWidth}m × {gridHeight}m
      </div>

      <div className={s.gridWrap}>
        {Array.from({ length: gridHeight }, (_, row) => (
          <div key={row} className={s.gridRow}>
            {Array.from({ length: gridWidth }, (_, col) => {
              const key = `${row}-${col}`;
              const isFilled = filled.has(key);
              return (
                <motion.div
                  key={key}
                  className={`${s.cell} ${isFilled ? s.cellFilled : ""} ${submitted ? s.cellLocked : ""}`}
                  onClick={() => toggleCell(row, col)}
                  animate={
                    isFilled && !submitted
                      ? { scale: [1, 1.1, 1] }
                      : {}
                  }
                  transition={{ duration: 0.2 }}
                  whileHover={!submitted ? { scale: 1.05 } : undefined}
                  whileTap={!submitted ? { scale: 0.95 } : undefined}
                />
              );
            })}
          </div>
        ))}
      </div>

      <motion.div
        className={s.counter}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 0.3 }}
        key={filled.size}
      >
        Area: {filled.size} m²
      </motion.div>

      {!submitted && (
        <motion.button
          className={s.submitBtn}
          onClick={handleSubmit}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: filled.size > 0 ? 1 : 0.4 }}
        >
          Check Answer
        </motion.button>
      )}

      <AnimatePresence>
        {submitted && (
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
              {isCorrect
                ? "Perfect tiling! 🏠"
                : `Not quite — the area is ${correctArea} m²`}
            </div>
            <div className={s.explanation}>{explanationText}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
