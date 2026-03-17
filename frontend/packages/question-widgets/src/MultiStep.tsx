import { useState, useEffect } from "react";
import type { QuestionProps } from "./shared";
import { CARD, HEADING, BTN, BTN_SECONDARY, str } from "./shared";
import QuestionRenderer from "./QuestionRenderer";

interface StepDef {
  step_number?: number;
  type: string;
  data: Record<string, unknown>;
}

function parseSteps(raw: unknown): StepDef[] {
  try {
    const arr = Array.isArray(raw) ? raw : [];
    return arr.map((s, i) => ({
      step_number: (s as StepDef).step_number ?? i + 1,
      type: String((s as StepDef).type ?? "short_answer"),
      data: (typeof (s as StepDef).data === "object" && (s as StepDef).data) ? (s as StepDef).data : {},
    }));
  } catch { return []; }
}

export default function MultiStep({ data, onAnswer, resetKey }: QuestionProps) {
  const instruction = str(data.overall_instruction);
  const steps = parseSteps(data.steps);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, unknown>>({});

  useEffect(() => {
    if (resetKey === undefined) return;
    setCurrent(0);
    setAnswers({});
  }, [resetKey]);

  if (steps.length === 0) {
    return (
      <div style={{ ...CARD, color: "#a0aec0", textAlign: "center" as const }}>
        Add steps to preview this question.
      </div>
    );
  }

  const handleStepAnswer = (idx: number, ans: unknown) => {
    setAnswers((prev) => ({ ...prev, [idx]: ans }));
  };

  const handleFinish = () => {
    onAnswer?.({ answers });
  };

  const isLast = current === steps.length - 1;
  const step = steps[current];

  return (
    <div style={CARD}>
      {instruction && <div style={HEADING}>{instruction}</div>}

      {/* Step tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {steps.map((_, i) => (
          <div
            key={i}
            onClick={() => setCurrent(i)}
            style={{
              flex: 1, padding: "6px 0", textAlign: "center" as const,
              fontSize: 11, fontWeight: 600, borderRadius: 6,
              background: i === current ? "#805AD5" : answers[i] !== undefined ? "#38A169" : "#E2E8F0",
              color: i === current || answers[i] !== undefined ? "#fff" : "#718096",
              cursor: "pointer", transition: "all 0.2s",
            }}
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* Current step content */}
      <QuestionRenderer
        slug={step.type}
        data={step.data}
        onAnswer={(ans) => handleStepAnswer(current, ans)}
      />

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
        {current > 0 && (
          <button style={BTN_SECONDARY} onClick={() => setCurrent(current - 1)}>Back</button>
        )}
        {!isLast && (
          <button
            style={BTN}
            onClick={() => setCurrent(current + 1)}
            disabled={answers[current] === undefined}
          >
            Next
          </button>
        )}
        {isLast && answers[current] !== undefined && (
          <button style={BTN} onClick={handleFinish}>Finish</button>
        )}
      </div>
    </div>
  );
}
