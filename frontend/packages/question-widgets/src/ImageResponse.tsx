import { useState, useEffect } from "react";
import type { QuestionProps } from "./shared";
import { CARD, HEADING, BTN, TEXT_INPUT, str } from "./shared";

export default function ImageResponse({ data, onAnswer, resetKey }: QuestionProps) {
  const prompt = str(data.prompt);
  const [text, setText] = useState("");

  useEffect(() => {
    if (resetKey === undefined) return;
    setText("");
  }, [resetKey]);
  if (!prompt) return null;
  return (
    <div style={CARD}>
      <div style={HEADING}>{prompt}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: "#EDF2F7", borderRadius: 8, height: 100, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e2e8f0" }}>
          {str(data.image_url) ? <img src={str(data.image_url)} style={{ maxWidth: "100%", maxHeight: 96, borderRadius: 6 }} alt="" /> : <span style={{ color: "#a0aec0", fontSize: 12 }}>[Image]</span>}
        </div>
        <div>
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Type your response..." style={{ ...TEXT_INPUT, minHeight: 80, resize: "none" as const }} />
          <button style={{ ...BTN, marginTop: 8, width: "100%" }} onClick={() => onAnswer?.({ text })}>Submit</button>
        </div>
      </div>
    </div>
  );
}
