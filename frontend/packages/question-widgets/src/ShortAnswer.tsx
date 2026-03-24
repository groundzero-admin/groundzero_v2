import { useState, useEffect } from "react";
import type { QuestionProps } from "./shared";
import { CARD, HEADING, BTN, TEXT_INPUT, str, num } from "./shared";

export default function ShortAnswer({ data, onAnswer, resetKey }: QuestionProps) {
  const prompt = str(data.prompt);
  const maxWords = num(data.max_words, 50);
  const multiStepMode = data.__multi_step_mode === true;

  const [text, setText] = useState("");

  useEffect(() => {
    if (resetKey === undefined) return;
    setText("");
  }, [resetKey]);

  if (!prompt) return null;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div style={CARD}>
      <div style={HEADING}>{prompt}</div>
      <textarea
        value={text}
        onChange={(e) => {
          const next = e.target.value;
          setText(next);
          if (multiStepMode) onAnswer?.({ text: next });
        }}
        placeholder="Type your answer here..."
        style={{ ...TEXT_INPUT, minHeight: 96, resize: "vertical" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: wordCount > maxWords ? "#E53E3E" : "#a0aec0" }}>
        <span>{wordCount} / {maxWords} words</span>
        {!multiStepMode && <button style={{ ...BTN, opacity: wordCount === 0 ? 0.5 : 1 }} onClick={() => onAnswer?.({ text })}>Submit</button>}
      </div>
    </div>
  );
}
