import { useState, useEffect } from "react";
import type { QuestionProps } from "./shared";
import { CARD, HEADING, TAG, TAG_USED, BTN, BTN_SECONDARY, FEEDBACK_OK, FEEDBACK_ERR, str, arr } from "./shared";

export default function FillBlanks({ data, onAnswer, resetKey, hideInlineSubmit }: QuestionProps) {
  const sentence = str(data.sentence);
  const answers = arr(data.answers);
  const distractors = arr(data.distractors);
  const mode = str(data.mode) || (distractors.length > 0 ? "word_bank" : "text_input");
  const multiStepMode = data.__multi_step_mode === true;
  const allWords = [...answers, ...distractors];
  const parts = sentence.split(/\{\{blank\}\}/gi);
  const blankCount = parts.length - 1;

  const [filled, setFilled] = useState<(string | null)[]>(Array(blankCount).fill(null));
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (resetKey === undefined) return;
    setFilled(Array(blankCount).fill(null));
    setChecked(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  if (!sentence) return null;

  const usedWords = new Set(filled.filter(Boolean));
  const emitProgress = (nextFilled: (string | null)[]) => {
    if (!multiStepMode) return;
    const stepCorrect = nextFilled.every(
      (f, i) => f?.trim().toLowerCase() === answers[i]?.trim().toLowerCase(),
    );
    onAnswer?.({ filled: nextFilled, correct: stepCorrect });
  };

  const placeWord = (word: string) => {
    const idx = filled.indexOf(null);
    if (idx === -1) return;
    const next = [...filled];
    next[idx] = word;
    setFilled(next);
    setChecked(false);
    emitProgress(next);
  };

  const removeWord = (idx: number) => {
    const next = [...filled];
    next[idx] = null;
    setFilled(next);
    setChecked(false);
    emitProgress(next);
  };

  const setTyped = (idx: number, value: string) => {
    const next = [...filled];
    next[idx] = value || null;
    setFilled(next);
    setChecked(false);
    emitProgress(next);
  };

  const allFilled = filled.every((f) => f !== null && f !== "");
  const checkAnswer = (f: string | null, i: number) =>
    f?.trim().toLowerCase() === answers[i]?.trim().toLowerCase();
  const allCorrect = filled.every((f, i) => checkAnswer(f, i));

  const handleCheck = () => {
    setChecked(true);
    onAnswer?.({ filled, correct: allCorrect });
  };

  const handleReset = () => {
    setFilled(Array(blankCount).fill(null));
    setChecked(false);
  };

  // ── Inline blank rendering ──
  const renderBlank = (idx: number) => {
    const value = filled[idx];
    const isCorrect = checked && checkAnswer(value, idx);
    const isWrong = checked && !checkAnswer(value, idx);

    if (mode === "text_input") {
      return (
        <input
          key={`blank-${idx}`}
          type="text"
          value={value ?? ""}
          onChange={(e) => setTyped(idx, e.target.value)}
          disabled={checked}
          placeholder="..."
          style={{
            display: "inline-block",
            width: Math.max(80, (answers[idx]?.length ?? 6) * 10),
            padding: "3px 8px",
            margin: "0 4px",
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "inherit",
            border: "none",
            borderBottom: `2px ${checked ? "solid" : "dashed"}`,
            borderColor: isCorrect ? "#22C55E" : isWrong ? "#EF4444" : "#7C3AED",
            background: isCorrect ? "#F0FDF4" : isWrong ? "#FEF2F2" : "#FAFAFA",
            color: isCorrect ? "#166534" : isWrong ? "#DC2626" : "#1a202c",
            borderRadius: 4,
            outline: "none",
            transition: "all 0.2s",
            textAlign: "center" as const,
          }}
        />
      );
    }

    // Word bank mode
    return (
      <span
        key={`blank-${idx}`}
        onClick={() => value && !checked && removeWord(idx)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          borderBottom: value ? "2px solid" : "2px dashed",
          borderColor: isCorrect ? "#22C55E" : isWrong ? "#EF4444" : "#7C3AED",
          minWidth: 60,
          padding: "2px 8px",
          margin: "0 4px",
          fontWeight: 600,
          color: isCorrect ? "#22C55E" : isWrong ? "#EF4444" : "#7C3AED",
          cursor: value && !checked ? "pointer" : "default",
          background: isCorrect ? "#F0FDF4" : isWrong ? "#FEF2F2" : "transparent",
          borderRadius: 4,
          transition: "all 0.2s",
        }}
      >
        <span>{value || "\u00A0\u00A0\u00A0\u00A0\u00A0"}</span>
        {value && !checked && (
          <button
            type="button"
            aria-label="Remove filled word"
            onClick={(e) => {
              e.stopPropagation();
              removeWord(idx);
            }}
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              border: "none",
              background: "rgba(124,58,237,0.14)",
              color: "#6d28d9",
              fontSize: 12,
              fontWeight: 800,
              lineHeight: "16px",
              textAlign: "center",
              padding: 0,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        )}
      </span>
    );
  };

  return (
    <div style={CARD}>
      <div style={HEADING}>Fill in the missing words:</div>
      <p style={{ fontSize: 14, lineHeight: 2.2 }}>
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < blankCount && renderBlank(i)}
          </span>
        ))}
      </p>

      {/* Word bank (only in word_bank mode) */}
      {mode === "word_bank" && !checked && (
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          {allWords.map((w, i) => (
            <span
              key={i}
              onClick={() => !usedWords.has(w) && placeWord(w)}
              style={usedWords.has(w) ? TAG_USED : { ...TAG, cursor: "pointer" }}
            >
              {w}
            </span>
          ))}
        </div>
      )}

      {allFilled && !checked && !multiStepMode && !hideInlineSubmit && (
        <div style={{ marginTop: 12, textAlign: "center" }}>
          <button type="button" style={BTN} onClick={handleCheck}>Submit</button>
        </div>
      )}
      {checked && (
        <>
          <div style={allCorrect ? FEEDBACK_OK : FEEDBACK_ERR}>
            {allCorrect
              ? "Correct!"
              : mode === "text_input"
                ? "Not quite — check the red blanks and try again."
                : "Not quite — click a word to remove it and try again."}
          </div>
          {!allCorrect && (
            <div style={{ marginTop: 8, textAlign: "center" }}>
              <button style={BTN_SECONDARY} onClick={handleReset}>Reset</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
