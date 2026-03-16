import { useState } from "react";
import type { QuestionProps } from "./shared";
import { CARD, HEADING, BTN, FEEDBACK_OK, FEEDBACK_ERR, str, num } from "./shared";

export default function SliderInput({ data, onAnswer }: QuestionProps) {
  const prompt = str(data.prompt);
  const min = num(data.min_value, 0);
  const max = num(data.max_value, 100);
  const correct = num(data.correct_value, (min + max) / 2);
  const tolerance = num(data.tolerance, 0);
  const unit = str(data.unit);
  if (!prompt) return null;

  const [val, setVal] = useState(Math.round((min + max) / 2));
  const [checked, setChecked] = useState(false);
  const isCorrect = Math.abs(val - correct) <= tolerance;

  const handleCheck = () => {
    setChecked(true);
    onAnswer?.({ value: val, correct: isCorrect });
  };

  return (
    <div style={CARD}>
      <div style={HEADING}>{prompt}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 0" }}>
        <span style={{ fontSize: 12, color: "#718096" }}>{min}{unit}</span>
        <input
          type="range" min={min} max={max} value={val}
          onChange={(e) => { setVal(Number(e.target.value)); setChecked(false); }}
          style={{ flex: 1, accentColor: "#805AD5", cursor: "pointer" }}
        />
        <span style={{ fontSize: 12, color: "#718096" }}>{max}{unit}</span>
      </div>
      <div style={{ textAlign: "center", fontSize: 28, fontWeight: 700, color: checked ? (isCorrect ? "#38A169" : "#E53E3E") : "#805AD5", transition: "color 0.2s" }}>{val}{unit}</div>
      <div style={{ textAlign: "center", marginTop: 8 }}>
        <button style={BTN} onClick={handleCheck}>Check Answer</button>
      </div>
      {checked && (
        <div style={isCorrect ? FEEDBACK_OK : FEEDBACK_ERR}>
          {isCorrect ? "Correct!" : `Not quite. The answer is ${correct}${unit}.`}
        </div>
      )}
    </div>
  );
}
