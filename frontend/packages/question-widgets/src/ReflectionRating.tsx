import { useState } from "react";
import type { QuestionProps } from "./shared";
import { CARD, HEADING, TEXT_INPUT, BTN, str, arr } from "./shared";

export default function ReflectionRating({ data, onAnswer }: QuestionProps) {
  const prompt = str(data.prompt);
  const scaleType = str(data.scale_type) || "emoji";
  const followUpPrompt = str(data.follow_up_prompt);
  if (!prompt) return null;

  const emojis = scaleType === "emoji" ? ["😟", "😐", "🙂", "😊", "🤩"]
    : scaleType === "stars" ? ["⭐", "⭐", "⭐", "⭐", "⭐"]
    : scaleType === "thumbs" ? ["👎", "👍"] : ["1", "2", "3", "4", "5"];
  const labelArr = arr(data.labels);

  const [selected, setSelected] = useState<number | null>(null);
  const [followUp, setFollowUp] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    onAnswer?.({ rating: selected, followUp });
  };

  return (
    <div style={CARD}>
      <div style={HEADING}>{prompt}</div>
      <div style={{ display: "flex", justifyContent: "center", gap: 12, margin: "16px 0" }}>
        {emojis.map((e, i) => (
          <div
            key={i}
            onClick={() => !submitted && setSelected(i)}
            style={{
              width: 40, height: 40, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, cursor: submitted ? "default" : "pointer",
              transition: "all 0.15s",
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
      {followUpPrompt && (
        <textarea
          value={followUp}
          onChange={(e) => setFollowUp(e.target.value)}
          placeholder={followUpPrompt}
          disabled={submitted}
          style={{ ...TEXT_INPUT, resize: "vertical" as const, minHeight: 50, marginTop: 12 }}
        />
      )}
      {!submitted && selected !== null && (
        <div style={{ marginTop: 12, textAlign: "center" }}>
          <button style={BTN} onClick={handleSubmit}>Submit</button>
        </div>
      )}
      {submitted && (
        <div style={{ marginTop: 10, padding: "10px 14px", background: "#F0FFF4", border: "1px solid #9AE6B4", borderRadius: 8, fontSize: 13, color: "#276749" }}>
          Response recorded. Thank you!
        </div>
      )}
    </div>
  );
}
