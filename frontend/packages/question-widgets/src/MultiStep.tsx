import { useState, useEffect } from "react";
import type { QuestionProps } from "./shared";
import { CARD, HEADING, BTN, BTN_SECONDARY, FEEDBACK_ERR, FEEDBACK_OK, str } from "./shared";
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
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [isCorrect, setIsCorrect] = useState<Record<number, boolean | null>>({});
  const [stepResetKeys, setStepResetKeys] = useState<Record<number, number>>({});

  useEffect(() => {
    if (resetKey === undefined) return;
    setCurrent(0);
    setAnswers({});
    setChecked({});
    setIsCorrect({});
    setStepResetKeys({});
  }, [resetKey]);

  if (steps.length === 0) {
    return (
      <div style={{ ...CARD, color: "#a0aec0", textAlign: "center" as const }}>
        Add steps to preview this question.
      </div>
    );
  }

  const canAccessStep = (idx: number): boolean => {
    if (idx === 0) return true;
    for (let i = 0; i < idx; i += 1) {
      if (!checked[i]) return false;
      if (isCorrect[i] === false) return false;
      if (answers[i] === undefined) return false;
    }
    return true;
  };

  const optionsFromStep = (idx: number): Array<{ text: string; is_correct: boolean }> => {
    const raw = steps[idx]?.data?.options;
    if (!Array.isArray(raw)) return [];
    return raw.map((opt) => {
      if (typeof opt === "string") {
        const t = opt.trim();
        if (t.startsWith("{") || t.startsWith("[")) {
          try {
            const p = JSON.parse(t) as { text?: string; is_correct?: boolean };
            return { text: p.text ?? t, is_correct: !!p.is_correct };
          } catch {
            return { text: opt, is_correct: false };
          }
        }
        return { text: opt, is_correct: false };
      }
      if (typeof opt === "object" && opt) {
        const o = opt as { text?: unknown; is_correct?: unknown };
        return {
          text: typeof o.text === "string" ? o.text : JSON.stringify(opt),
          is_correct: !!o.is_correct,
        };
      }
      return { text: String(opt), is_correct: false };
    });
  };

  const evaluateStep = (idx: number, ans: unknown): boolean | null => {
    const stepType = steps[idx]?.type;
    if (!ans || typeof ans !== "object" || Array.isArray(ans)) return null;
    const a = ans as Record<string, unknown>;

    // Explicit correctness from widget payload (if present)
    if (typeof a.correct === "boolean") return a.correct;
    if (typeof a.isCorrect === "boolean") return a.isCorrect;

    // MCQ fallback: infer from option metadata
    if (stepType === "mcq_single" || stepType === "mcq_timed") {
      const selected = a.selected;
      if (typeof selected !== "number") return false;
      const opts = optionsFromStep(idx);
      const correctIdx = opts.findIndex((o) => o.is_correct);
      if (correctIdx === -1) return null; // No key in data; cannot auto-judge.
      return selected === correctIdx;
    }

    // For free-text / subjective steps, allow progression once checked.
    return null;
  };

  const handleStepAnswer = (idx: number, ans: unknown) => {
    setAnswers((prev) => ({ ...prev, [idx]: ans }));
    // New answer invalidates prior check state for this step.
    setChecked((prev) => ({ ...prev, [idx]: false }));
    setIsCorrect((prev) => ({ ...prev, [idx]: null }));
  };

  const handleCheckCurrent = () => {
    const ans = answers[current];
    const verdict = evaluateStep(current, ans);
    setChecked((prev) => ({ ...prev, [current]: true }));
    setIsCorrect((prev) => ({ ...prev, [current]: verdict }));
  };

  const handleTryAgain = () => {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[current];
      return next;
    });
    setChecked((prev) => ({ ...prev, [current]: false }));
    setIsCorrect((prev) => ({ ...prev, [current]: null }));
    setStepResetKeys((prev) => ({ ...prev, [current]: (prev[current] ?? 0) + 1 }));
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
            onClick={() => {
              if (canAccessStep(i)) setCurrent(i);
            }}
            style={{
              flex: 1, padding: "6px 0", textAlign: "center" as const,
              fontSize: 11, fontWeight: 600, borderRadius: 6,
              background: i === current
                ? "#805AD5"
                : checked[i] && isCorrect[i] !== false
                  ? "#38A169"
                  : checked[i] && isCorrect[i] === false
                    ? "#DC2626"
                    : "#E2E8F0",
              color: i === current || checked[i] ? "#fff" : "#718096",
              cursor: canAccessStep(i) ? "pointer" : "not-allowed",
              opacity: canAccessStep(i) ? 1 : 0.55,
              transition: "all 0.2s",
            }}
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* Current step content */}
      <QuestionRenderer
        key={`${current}-${stepResetKeys[current] ?? 0}`}
        slug={step.type}
        data={{ ...step.data, __multi_step_mode: true }}
        onAnswer={(ans) => handleStepAnswer(current, ans)}
        resetKey={stepResetKeys[current] ?? 0}
      />

      {/* Step feedback */}
      {checked[current] && isCorrect[current] === true && (
        <div style={FEEDBACK_OK}>Correct. You can continue.</div>
      )}
      {checked[current] && isCorrect[current] === false && (
        <div style={FEEDBACK_ERR}>Not correct yet. Try again for this step.</div>
      )}

      {/* Navigation / actions */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        {current > 0 && (
          <button style={BTN_SECONDARY} onClick={() => setCurrent(current - 1)}>Back</button>
        )}

        {!checked[current] && (
          <button
            style={BTN}
            onClick={handleCheckCurrent}
            disabled={answers[current] === undefined}
          >
            Check
          </button>
        )}

        {checked[current] && isCorrect[current] === false && (
          <button
            style={BTN_SECONDARY}
            onClick={handleTryAgain}
          >
            Try again
          </button>
        )}

        {checked[current] && isCorrect[current] !== false && !isLast && (
          <button style={BTN} onClick={() => setCurrent(current + 1)}>Next step</button>
        )}

        {isLast && checked[current] && isCorrect[current] !== false && (
          <button style={BTN} onClick={handleFinish}>Go to next question</button>
        )}
      </div>
    </div>
  );
}
