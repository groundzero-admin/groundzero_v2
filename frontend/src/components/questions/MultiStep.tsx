import { useState } from "react";
import type { QuestionProps } from "./shared";
import { CARD, HEADING, BTN, BTN_SECONDARY, str, arr } from "./shared";

export default function MultiStep({ data, onAnswer }: QuestionProps) {
  const instruction = str(data.overall_instruction);
  const steps = arr(data.steps);
  const stepList = steps.length > 0 ? steps : ["Step 1", "Step 2", "Step 3"];
  const [current, setCurrent] = useState(0);

  return (
    <div style={CARD}>
      <div style={HEADING}>{instruction || "Multi-step question"}</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {stepList.map((label, i) => (
          <div key={i} onClick={() => setCurrent(i)} style={{ flex: 1, padding: "6px 0", textAlign: "center", fontSize: 11, fontWeight: 600, borderRadius: 6, background: i === current ? "#805AD5" : i < current ? "#38A169" : "#E2E8F0", color: i <= current ? "#fff" : "#718096", cursor: "pointer", transition: "all 0.2s" }}>
            {typeof label === "string" ? label : `Step ${i + 1}`}
          </div>
        ))}
      </div>
      <div style={{ border: "2px solid #805AD5", borderRadius: 8, padding: 16, fontSize: 12, color: "#4A5568", minHeight: 60 }}>
        <div style={{ fontWeight: 600, color: "#805AD5", marginBottom: 8 }}>Step {current + 1}</div>
        <div>Content for this step will appear here.</div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
          {current > 0 && <button style={BTN_SECONDARY} onClick={() => setCurrent(current - 1)}>Back</button>}
          {current < stepList.length - 1 && <button style={BTN} onClick={() => setCurrent(current + 1)}>Next</button>}
        </div>
      </div>
    </div>
  );
}
