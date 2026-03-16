import { useState } from "react";
import type { QuestionProps } from "./shared";
import { CARD, HEADING, TAG, TAG_USED, BTN, FEEDBACK_OK, FEEDBACK_ERR, str, arr } from "./shared";

export default function FillBlanks({ data, onAnswer }: QuestionProps) {
  const sentence = str(data.sentence);
  const answers = arr(data.answers);
  const distractors = arr(data.distractors);
  if (!sentence) return null;

  const allWords = [...answers, ...distractors];
  const parts = sentence.split(/\{\{blank\}\}/gi);
  const blankCount = parts.length - 1;

  const [filled, setFilled] = useState<(string | null)[]>(Array(blankCount).fill(null));
  const [checked, setChecked] = useState(false);

  const usedWords = new Set(filled.filter(Boolean));

  const placeWord = (word: string) => {
    const idx = filled.indexOf(null);
    if (idx === -1) return;
    const next = [...filled];
    next[idx] = word;
    setFilled(next);
    setChecked(false);
  };

  const removeWord = (idx: number) => {
    const next = [...filled];
    next[idx] = null;
    setFilled(next);
    setChecked(false);
  };

  const allFilled = filled.every((f) => f !== null);
  const allCorrect = filled.every((f, i) => f === answers[i]);

  const handleCheck = () => {
    setChecked(true);
    onAnswer?.({ filled, correct: allCorrect });
  };

  return (
    <div style={CARD}>
      <div style={HEADING}>Fill in the missing words:</div>
      <p style={{ fontSize: 14, lineHeight: 2 }}>
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < blankCount && (
              <span
                onClick={() => filled[i] && removeWord(i)}
                style={{
                  display: "inline-block", borderBottom: filled[i] ? "2px solid" : "2px dashed",
                  borderColor: checked ? (filled[i] === answers[i] ? "#38A169" : "#E53E3E") : "#805AD5",
                  minWidth: 60, padding: "2px 8px", margin: "0 4px", fontWeight: 600,
                  color: checked ? (filled[i] === answers[i] ? "#38A169" : "#E53E3E") : "#805AD5",
                  cursor: filled[i] ? "pointer" : "default",
                  background: checked ? (filled[i] === answers[i] ? "#F0FFF4" : "#FFF5F5") : "transparent",
                  borderRadius: 4, transition: "all 0.2s",
                }}
              >
                {filled[i] || "\u00A0\u00A0\u00A0\u00A0\u00A0"}
              </span>
            )}
          </span>
        ))}
      </p>
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
      {allFilled && !checked && (
        <div style={{ marginTop: 12, textAlign: "center" }}>
          <button style={BTN} onClick={handleCheck}>Check Answer</button>
        </div>
      )}
      {checked && (
        <div style={allCorrect ? FEEDBACK_OK : FEEDBACK_ERR}>
          {allCorrect ? "Correct!" : "Not quite - click a word to remove it and try again."}
        </div>
      )}
    </div>
  );
}
