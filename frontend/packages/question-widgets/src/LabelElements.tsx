import { useState } from "react";
import type { QuestionProps } from "./shared";
import { CARD, HEADING, TAG, BTN, FEEDBACK_OK, str, arr } from "./shared";

export default function LabelElements({ data, onAnswer }: QuestionProps) {
  const instruction = str(data.instruction);
  const labels = arr(data.label_options);
  if (!instruction) return null;

  const [placed, setPlaced] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const usedLabels = new Set(placed);

  const toggle = (l: string) => {
    if (submitted) return;
    setPlaced((prev) => prev.includes(l) ? prev.filter((p) => p !== l) : [...prev, l]);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    onAnswer?.({ placed });
  };

  return (
    <div style={CARD}>
      <div style={HEADING}>{instruction}</div>
      <div style={{ background: "#fff", borderRadius: 8, padding: 16, border: "1px solid #e2e8f0", minHeight: 100, display: "flex", alignItems: "center", justifyContent: "center", color: "#a0aec0", fontSize: 12 }}>
        {str(data.image_url) ? <img src={str(data.image_url)} style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8 }} alt="" /> : "[Image area]"}
      </div>
      {labels.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginTop: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {labels.map((l, i) => (
            <span
              key={i}
              onClick={() => toggle(l)}
              style={{
                ...TAG,
                fontSize: 11,
                cursor: submitted ? "default" : "pointer",
                borderColor: usedLabels.has(l) ? "#805AD5" : "#a0aec0",
                borderStyle: usedLabels.has(l) ? "solid" : "dashed",
                background: usedLabels.has(l) ? "#FAF5FF" : "#fff",
                color: usedLabels.has(l) ? "#553C9A" : undefined,
              }}
            >
              {l}
            </span>
          ))}
        </div>
      )}
      {!submitted && placed.length > 0 && (
        <div style={{ marginTop: 12, textAlign: "center" }}>
          <button style={BTN} onClick={handleSubmit}>Submit Labels</button>
        </div>
      )}
      {submitted && (
        <div style={FEEDBACK_OK}>Labels submitted.</div>
      )}
    </div>
  );
}
