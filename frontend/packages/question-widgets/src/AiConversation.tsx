import { useState, useEffect } from "react";
import type { QuestionProps } from "./shared";
import { CARD, HEADING, BTN, BUBBLE, BUBBLE_USER, str } from "./shared";

export default function AiConversation({ data, onAnswer, resetKey }: QuestionProps) {
  const opening = str(data.opening_message);

  const [msgs, setMsgs] = useState<{ role: "ai" | "user"; text: string }[]>([
    { role: "ai", text: opening || "Hi! Let's explore this topic together." },
  ]);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (resetKey === undefined) return;
    setMsgs([{ role: "ai", text: opening || "Hi! Let's explore this topic together." }]);
    setInput("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  if (!opening && !str(data.system_prompt)) return null;

  const send = () => {
    if (!input.trim()) return;
    const next = [...msgs, { role: "user" as const, text: input.trim() }, { role: "ai" as const, text: "That's a great point! Tell me more..." }];
    setMsgs(next);
    setInput("");
    onAnswer?.({ messages: next });
  };

  return (
    <div style={CARD}>
      <div style={HEADING}>{str(data.goal) || "AI Conversation"}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12, maxHeight: 200, overflowY: "auto" }}>
        {msgs.map((m, i) => (
          <div key={i} style={m.role === "ai" ? BUBBLE : BUBBLE_USER}>
            {m.role === "ai" ? `\uD83E\uDD16 ${m.text}` : m.text}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Type your message..." style={{ flex: 1, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: "8px 14px", fontSize: 12, outline: "none" }} />
        <button style={{ ...BTN, borderRadius: 20, padding: "8px 16px" }} onClick={send}>Send</button>
      </div>
    </div>
  );
}
