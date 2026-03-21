import { useState, useEffect, useRef } from "react";
import type { QuestionProps } from "./shared";
import { CARD, HEADING, OPT, OPT_SEL, OPT_CORRECT, OPT_WRONG, RADIO, RADIO_SEL, RADIO_OK, RADIO_BAD, BTN, FEEDBACK_ERR, str, arr, num } from "./shared";

interface McqProps extends QuestionProps {
  timed?: boolean;
  resetKey?: number;
}

export default function McqSingle({ data, onAnswer, timed = false, resetKey }: McqProps) {
  const question = str(data.question);
  const options = arr(data.options);
  const timeLimit = num(data.time_limit_seconds, 0);

  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (resetKey === undefined) return;
    setSelected(null);
    setSubmitted(false);
    setTimeLeft(timeLimit);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  useEffect(() => {
    if (!timed || timeLimit <= 0 || submitted) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setSubmitted(true);
          onAnswer?.({ selected, timedOut: true });
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timed, timeLimit]);

  if (!question) return null;

  const getOptionInfo = (opt: string) => {
    try { const p = JSON.parse(opt); return { label: p.text || opt, correct: !!p.is_correct }; } catch { return { label: opt, correct: false }; }
  };

  const optStyle = (i: number, correct: boolean) => {
    if (!submitted) return selected === i ? OPT_SEL : OPT;
    if (selected === i) return correct ? OPT_CORRECT : OPT_WRONG;
    return OPT;
  };
  const radioStyle = (i: number, correct: boolean) => {
    if (!submitted) return selected === i ? RADIO_SEL : RADIO;
    if (selected === i) return correct ? RADIO_OK : RADIO_BAD;
    return RADIO;
  };

  const handleCheck = () => {
    clearInterval(timerRef.current!);
    setSubmitted(true);
    onAnswer?.({ selected });
  };

  return (
    <div style={CARD}>
      {timed && timeLimit > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <div style={{ background: timeLeft <= 5 ? "#FED7D7" : "#EDF2F7", color: timeLeft <= 5 ? "#C53030" : "#4A5568", padding: "4px 12px", borderRadius: 20, fontWeight: 700, fontSize: 13, transition: "all 0.3s" }}>
            ⏱ {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
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
          <button style={BTN} onClick={handleCheck}>Submit</button>
        </div>
      )}
      {submitted && timed && timeLeft === 0 && !selected && (
        <div style={FEEDBACK_ERR}>Time's up!</div>
      )}
    </div>
  );
}
