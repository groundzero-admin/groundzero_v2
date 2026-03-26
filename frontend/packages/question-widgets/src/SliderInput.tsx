import { useState, useEffect } from "react";
import type { QuestionProps } from "./shared";
import { CARD, HEADING, BTN, FEEDBACK_OK, FEEDBACK_ERR, str, num } from "./shared";

export default function SliderInput({ data, onAnswer, resetKey, hideInlineSubmit }: QuestionProps) {
  const prompt = str(data.prompt);
  const min = num(data.min_value, 0);
  const max = num(data.max_value, 100);
  const correct = num(data.correct_value, (min + max) / 2);
  const tolerance = num(data.tolerance, 0);
  const unit = str(data.unit);
  const imageUrl = str(data.image_url);
  const multiStepMode = data.__multi_step_mode === true;
  const fmt = (v: number) => unit ? `${v} ${unit}` : `${v}`;

  const [val, setVal] = useState(Math.round((min + max) / 2));
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (resetKey === undefined) return;
    setVal(Math.round((min + max) / 2));
    setChecked(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  if (!prompt) return null;
  const isCorrect = Math.abs(val - correct) <= tolerance;

  return (
    <div style={CARD}>
      <div style={HEADING}>{prompt}</div>

      {imageUrl && (
        <div style={{ marginBottom: 16, borderRadius: 12, overflow: "hidden", border: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", justifyContent: "center" }}>
          <img src={imageUrl} alt="diagram" style={{ maxWidth: "100%", maxHeight: 200, objectFit: "contain" }} />
        </div>
      )}

      <div style={{ margin: "20px 0 8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#a0aec0", marginBottom: 6, fontWeight: 600 }}>
          <span>{fmt(min)}</span>
          <span>{fmt(max)}</span>
        </div>
        <div style={{ position: "relative" }}>
          <input
            type="range" min={min} max={max} value={val}
            onChange={(e) => {
              const nextVal = Number(e.target.value);
              const nextCorrect = Math.abs(nextVal - correct) <= tolerance;
              setVal(nextVal);
              setChecked(false);
              if (multiStepMode) onAnswer?.({ value: nextVal, correct: nextCorrect });
            }}
            disabled={!multiStepMode && checked}
            style={{ width: "100%", accentColor: "#7C3AED", cursor: checked ? "default" : "pointer", height: 6 }}
          />
          {/* Tick at correct value (shown after check) */}
          {checked && (
            <div style={{ position: "absolute", left: `${((correct - min) / (max - min)) * 100}%`, top: -8, transform: "translateX(-50%)", fontSize: 10, color: "#059669", fontWeight: 700, whiteSpace: "nowrap" }}>
              ▼ {fmt(correct)}
            </div>
          )}
        </div>
      </div>

      <div style={{ textAlign: "center", margin: "12px 0 16px" }}>
        <span style={{
          fontSize: 36, fontWeight: 800,
          color: checked ? (isCorrect ? "#059669" : "#DC2626") : "#7C3AED",
          transition: "color 0.3s",
          background: checked ? (isCorrect ? "#ECFDF5" : "#FEF2F2") : "#F5F3FF",
          padding: "4px 20px", borderRadius: 12,
        }}>
          {fmt(val)}
        </span>
      </div>

      {/* Accuracy bar */}
      {tolerance > 0 && (
        <div style={{ fontSize: 11, color: "#a0aec0", textAlign: "center", marginBottom: 10 }}>
          Acceptable range: {fmt(correct - tolerance)} – {fmt(correct + tolerance)}
        </div>
      )}

      {!checked && !multiStepMode && !hideInlineSubmit && (
        <div style={{ textAlign: "center" }}>
          <button type="button" style={BTN} onClick={() => { setChecked(true); onAnswer?.({ value: val, correct: isCorrect }); }}>
            Submit
          </button>
        </div>
      )}

      {checked && !multiStepMode && (
        <div style={isCorrect ? FEEDBACK_OK : FEEDBACK_ERR}>
          {isCorrect
            ? `✓ Correct! The answer is ${fmt(correct)}.`
            : `✗ Not quite — the answer is ${fmt(correct)}. You selected ${fmt(val)}.`}
        </div>
      )}
    </div>
  );
}
