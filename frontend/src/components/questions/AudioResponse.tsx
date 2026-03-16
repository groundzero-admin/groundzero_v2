import { useState } from "react";
import type { QuestionProps } from "./shared";
import { CARD, HEADING, TEXT_INPUT, str } from "./shared";

export default function AudioResponse({ data, onAnswer }: QuestionProps) {
  const prompt = str(data.prompt);
  if (!prompt) return null;
  const [playing, setPlaying] = useState(false);
  const [text, setText] = useState("");
  return (
    <div style={CARD}>
      <div style={HEADING}>{prompt}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: "#fff", borderRadius: 8, border: "1px solid #e2e8f0", marginBottom: 12 }}>
        <div onClick={() => setPlaying(!playing)} style={{ width: 40, height: 40, borderRadius: "50%", background: playing ? "#E53E3E" : "#805AD5", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16, cursor: "pointer", transition: "background 0.2s" }}>{playing ? "\u23F8" : "\u25B6"}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 2 }}>
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} style={{ width: 3, height: 6 + Math.sin(i * 0.5) * 10, background: playing && i < 18 ? "#805AD5" : "#CBD5E0", borderRadius: 2, transition: "background 0.3s" }} />
            ))}
          </div>
          <div style={{ fontSize: 11, color: "#a0aec0", marginTop: 4 }}>{str(data.audio_url) || "audio_clip.mp3"}</div>
        </div>
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Type what you remember..." style={{ ...TEXT_INPUT, resize: "vertical" as const, minHeight: 50 }} />
    </div>
  );
}
