import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as s from "./ThermometerSlider.css";

interface ThermometerSliderProps {
  startTemp: number;
  targetTemp: number;
  min: number;
  max: number;
  label: string;
  explanationText: string;
  onCorrect: () => void;
  onWrong: () => void;
}

export function ThermometerSlider({
  startTemp,
  targetTemp,
  min,
  max,
  label,
  explanationText,
  onCorrect,
  onWrong,
}: ThermometerSliderProps) {
  const [value, setValue] = useState(startTemp);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const range = max - min;
  const ticks = Array.from({ length: range + 1 }, (_, i) => max - i);

  // Mercury height as percentage (0 = min, 100 = max)
  const mercuryPct = ((value - min) / range) * 100;

  // Color: blue for cold, red for hot
  const getColor = (temp: number) => {
    if (temp <= 0) return `hsl(210, 80%, ${50 + Math.abs(temp) * 3}%)`;
    return `hsl(${Math.max(0, 30 - temp * 3)}, 80%, 50%)`;
  };

  const handleSubmit = () => {
    if (submitted) return;
    setSubmitted(true);
    const correct = value === targetTemp;
    setIsCorrect(correct);
    if (correct) onCorrect();
    else onWrong();
  };

  const handleDrag = useCallback(
    (_: unknown, info: { offset: { y: number } }) => {
      if (submitted) return;
      // Invert: drag up = increase temp
      const step = Math.round(-info.offset.y / 13);
      const newVal = Math.max(min, Math.min(max, startTemp + step));
      setValue(newVal);
    },
    [submitted, startTemp, min, max]
  );

  return (
    <div className={s.root}>
      <div className={s.label}>{label}</div>

      <div className={s.thermoWrap}>
        {/* Number line */}
        <div className={s.numberLine}>
          {ticks.map((t) => (
            <span
              key={t}
              className={`${s.numberTick} ${t === 0 ? s.numberTickZero : ""}`}
            >
              {t}°
            </span>
          ))}
        </div>

        {/* Thermometer SVG */}
        <div className={s.thermoColumn}>
          <svg width="60" height="260" viewBox="0 0 60 260">
            {/* Tube background */}
            <rect
              x="22"
              y="10"
              width="16"
              height="210"
              rx="8"
              fill="rgba(200,200,200,0.3)"
              stroke="rgba(150,150,150,0.5)"
              strokeWidth="1.5"
            />

            {/* Mercury fill */}
            <motion.rect
              x="24"
              y={12 + 206 * (1 - mercuryPct / 100)}
              width="12"
              rx="6"
              fill={getColor(value)}
              animate={{
                y: 12 + 206 * (1 - mercuryPct / 100),
                height: Math.max(4, 206 * (mercuryPct / 100)),
              }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            />

            {/* Bulb */}
            <circle cx="30" cy="235" r="18" fill={getColor(value)} />
            <circle cx="30" cy="235" r="14" fill={getColor(value)} opacity="0.7" />

            {/* Zero line marker */}
            <line
              x1="18"
              y1={12 + 206 * (1 - ((0 - min) / range))}
              x2="42"
              y2={12 + 206 * (1 - ((0 - min) / range))}
              stroke="rgba(100,100,100,0.5)"
              strokeWidth="1"
              strokeDasharray="3,3"
            />

            {/* Target indicator */}
            {!submitted && (
              <motion.g
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <line
                  x1="42"
                  y1={12 + 206 * (1 - ((targetTemp - min) / range))}
                  x2="56"
                  y2={12 + 206 * (1 - ((targetTemp - min) / range))}
                  stroke="#E53E3E"
                  strokeWidth="2"
                />
                <text
                  x="50"
                  y={8 + 206 * (1 - ((targetTemp - min) / range))}
                  fill="#E53E3E"
                  fontSize="9"
                  fontWeight="bold"
                >
                  ?
                </text>
              </motion.g>
            )}

            {/* Drag handle */}
            {!submitted && (
              <motion.g
                drag="y"
                dragConstraints={{ top: -130, bottom: 130 }}
                dragElastic={0}
                onDrag={handleDrag}
                style={{ cursor: "grab" }}
              >
                <circle
                  cx="30"
                  cy={12 + 206 * (1 - mercuryPct / 100)}
                  r="10"
                  fill="white"
                  stroke={getColor(value)}
                  strokeWidth="3"
                />
                <line
                  x1="26"
                  y1={12 + 206 * (1 - mercuryPct / 100)}
                  x2="34"
                  y2={12 + 206 * (1 - mercuryPct / 100)}
                  stroke={getColor(value)}
                  strokeWidth="2"
                />
              </motion.g>
            )}
          </svg>
        </div>

        {/* Current value display */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <motion.div
            className={s.currentTemp}
            key={value}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.2 }}
            style={{ color: getColor(value) }}
          >
            {value}°C
          </motion.div>
          {!submitted && (
            <div className={s.targetHint}>
              Target: {targetTemp}°C
            </div>
          )}
        </div>
      </div>

      {/* +/- buttons as fallback for tap interaction */}
      {!submitted && (
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <motion.button
            className={s.submitBtn}
            style={{ padding: "8px 16px", fontSize: 18 }}
            onClick={() => setValue((v) => Math.max(min, v - 1))}
            whileTap={{ scale: 0.9 }}
          >
            −
          </motion.button>
          <motion.button
            className={s.submitBtn}
            onClick={handleSubmit}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Check
          </motion.button>
          <motion.button
            className={s.submitBtn}
            style={{ padding: "8px 16px", fontSize: 18 }}
            onClick={() => setValue((v) => Math.min(max, v + 1))}
            whileTap={{ scale: 0.9 }}
          >
            +
          </motion.button>
        </div>
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
              {isCorrect ? "Temperature set! 🌡️" : `Not quite — it should be ${targetTemp}°C`}
            </div>
            <div className={s.explanation}>{explanationText}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
