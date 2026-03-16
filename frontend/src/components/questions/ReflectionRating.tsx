import { useState } from "react";
import type { QuestionProps } from "./shared";
import { CARD, HEADING, TEXT_INPUT, str, arr } from "./shared";

export default function ReflectionRating({ data, onAnswer }: QuestionProps) {
  const prompt = str(data.prompt);
  const scaleType = str(data.scale_type) || "emoji";
  if (!prompt) return null;

  const emojis = scaleType === "emoji" ? ["\uD83D\uDE1F", "\uD83D\uDE10", "\uD83D\uDE42", "\uD83D\uDE0A", "\uD83E\uDD29"]
    : scaleType === "stars" ? ["\u2B50", "\u2B50", "\u2B50", "\u2B50", "\u2B50"]
    : scaleType === "thumbs" ? ["\uD83D\uDC4E", "\uD83D\uDC4D"] : ["1", "2", "3", "4", "5"];
  const labelArr = arr(data.labels);

  const [selected, setSelected] = useState<number | null>(null);
  const [followUp, setFollowUp] = useState("");

  const handleSelect = (i: number) => {
    setSelected(i);
    onAnswer?.({ rating: i, followUp });
  };

  return (
    <div style={CARD}>
      <div style={HEADING}>{prompt}</div>
      <div style={{ display: "flex", justifyContent: "center", gap: 12, margin: "16px 0" }}>
        {emojis.map((e, i) => (
          <div key={i} onClick={() => handleSelect(i)}
            style={{
              width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 20, cursor: "pointer", transition: "all 0.15s",
              border: selected !== null && (scaleType === "stars" ? i <= selected : i === selected) ? "2px solid #ECC94B" : "2px solid #E2E8F0",
              background: selected !== null && (scaleType === "stars" ? i <= selected : i === selected) ? "#FEFCBF" : "#fff",
              transform: selected === i ? "scale(1.2)" : "scale(1)",
            }}
          >{e}</div>
        ))}
      </div>
      {labelArr.length > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#a0aec0" }}>
          <span>{labelArr[0]}</span><span>{labelArr[labelArr.length - 1]}</span>
        </div>
      )}
      {str(data.follow_up_prompt) && (
        <textarea value={followUp} onChange={(e) => setFollowUp(e.target.value)} placeholder={str(data.follow_up_prompt)} style={{ ...TEXT_INPUT, resize: "vertical" as const, minHeight: 50, marginTop: 12 }} />
      )}
    </div>
  );
}
