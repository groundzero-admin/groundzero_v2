import { useState } from "react";
import type { QuestionProps } from "./shared";
import { CARD, HEADING, BTN, BUBBLE, BUBBLE_USER, str, arr } from "./shared";

export default function DebateOpinion({ data, onAnswer }: QuestionProps) {
  const topic = str(data.topic);
  const stances = arr(data.stances);
  if (!topic) return null;

  const stanceList = stances.length > 0 ? stances : ["For", "Against", "Neutral"];
  const colors = ["#38A169", "#E53E3E", "#718096", "#3182CE"];
  const bgs = ["#F0FFF4", "#FFF5F5", "#F7FAFC", "#EBF8FF"];

  const [picked, setPicked] = useState<number | null>(null);
  const [msgs, setMsgs] = useState<string[]>([]);
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;
    const next = [...msgs, input.trim()];
    setMsgs(next);
    setInput("");
    onAnswer?.({ stance: picked !== null ? stanceList[picked] : null, messages: next });
  };

  return (
    <div style={CARD}>
      <div style={HEADING}>{topic}</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {stanceList.map((s, i) => (
          <div key={i} onClick={() => setPicked(i)} style={{ flex: 1, padding: "10px 0", textAlign: "center", borderRadius: 8, border: `2px solid ${colors[i % 4]}`, background: picked === i ? colors[i % 4] : bgs[i % 4], fontWeight: 600, fontSize: 12, color: picked === i ? "#fff" : colors[i % 4], cursor: "pointer", transition: "all 0.2s" }}>
            {s}
          </div>
        ))}
      </div>
      {picked !== null && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
            <div style={BUBBLE}>{"\uD83E\uDD16"} Interesting stance! Can you explain why?</div>
            {msgs.map((m, i) => (
              <div key={i} style={i % 2 === 0 ? BUBBLE_USER : BUBBLE}>
                {i % 2 === 0 ? m : `\uD83E\uDD16 ${m}`}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Argue your position..." style={{ flex: 1, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: "8px 14px", fontSize: 12, outline: "none" }} />
            <button style={{ ...BTN, borderRadius: 20, padding: "8px 16px" }} onClick={send}>Send</button>
          </div>
        </>
      )}
    </div>
  );
}
