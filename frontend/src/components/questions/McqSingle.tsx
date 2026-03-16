import { useState } from "react";
import type { QuestionProps } from "./shared";
import { CARD, HEADING, OPT, OPT_SEL, OPT_CORRECT, OPT_WRONG, RADIO, RADIO_SEL, RADIO_OK, RADIO_BAD, BTN, FEEDBACK_OK, str, arr, num } from "./shared";

interface McqProps extends QuestionProps {
  timed?: boolean;
}

export default function McqSingle({ data, onAnswer, timed = false }: McqProps) {
  const question = str(data.question);
  const options = arr(data.options);
  const timeLimit = num(data.time_limit_seconds, 0);
  if (!question) return null;

  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const getOptionInfo = (opt: string) => {
    try { const p = JSON.parse(opt); return { label: p.text || opt, correct: !!p.is_correct }; } catch { return { label: opt, correct: false }; }
  };

  const optStyle = (i: number, correct: boolean) => {
    if (!submitted) return selected === i ? OPT_SEL : OPT;
    if (selected === i) return correct ? OPT_CORRECT : OPT_WRONG;
    if (correct) return OPT_CORRECT;
    return OPT;
  };
  const radioStyle = (i: number, correct: boolean) => {
    if (!submitted) return selected === i ? RADIO_SEL : RADIO;
    if (selected === i) return correct ? RADIO_OK : RADIO_BAD;
    if (correct) return RADIO_OK;
    return RADIO;
  };

  const handleCheck = () => {
    setSubmitted(true);
    onAnswer?.({ selected });
  };

  return (
    <div style={CARD}>
      {timed && timeLimit > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <div style={{ background: "#FED7D7", color: "#C53030", padding: "4px 12px", borderRadius: 20, fontWeight: 700, fontSize: 13 }}>
            0:{String(timeLimit).padStart(2, "0")}
          </div>
        </div>
      )}
      <div style={HEADING}>{question}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {(options.length > 0 ? options : ["Option A", "Option B", "Option C", "Option D"]).map((opt, i) => {
          const { label, correct } = getOptionInfo(opt);
          return (
            <div key={i} style={optStyle(i, correct)} onClick={() => { if (!submitted) setSelected(i); }}>
              <span style={radioStyle(i, correct)} />
              {label}
            </div>
          );
        })}
      </div>
      {selected !== null && !submitted && (
        <div style={{ marginTop: 10, textAlign: "center" }}>
          <button style={BTN} onClick={handleCheck}>Check Answer</button>
        </div>
      )}
      {submitted && str(data.explanation) && (
        <div style={FEEDBACK_OK}>
          {str(data.explanation)}
        </div>
      )}
    </div>
  );
}
