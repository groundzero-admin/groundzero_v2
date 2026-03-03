import { CheckCircle2, XCircle, Lightbulb } from "lucide-react";
import type { Question } from "@/api/types";
import * as s from "./MCQQuestion.css";

interface MCQQuestionProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  selectedOption: string | null;
  onSelectOption: (label: string) => void;
  submitted: boolean;
}

export function MCQQuestion({
  question,
  questionIndex,
  totalQuestions,
  selectedOption,
  onSelectOption,
  submitted,
}: MCQQuestionProps) {
  const options = question.options ?? [];
  const correctLabel = options.find((o) => o.is_correct)?.label ?? null;
  const isCorrect = submitted && selectedOption === correctLabel;

  return (
    <div className={s.root}>
      <span className={s.questionNumber}>
        Question {questionIndex + 1} of {totalQuestions}
      </span>

      <div className={s.questionText}>{question.text}</div>

      <div className={s.options}>
        {options.map((opt) => {
          const isThisSelected = selectedOption === opt.label;
          const isThisCorrect = submitted && opt.is_correct;
          const isThisWrong = submitted && isThisSelected && !opt.is_correct;

          const optionCls = [
            s.option,
            !submitted && isThisSelected && s.optionSelected,
            isThisCorrect && s.optionCorrect,
            isThisWrong && s.optionWrong,
            submitted && s.optionDisabled,
          ]
            .filter(Boolean)
            .join(" ");

          const labelCls = [
            s.optionLabel,
            !submitted && isThisSelected && s.optionLabelSelected,
            isThisCorrect && s.optionLabelCorrect,
            isThisWrong && s.optionLabelWrong,
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <div
              key={opt.label}
              className={optionCls}
              onClick={() => !submitted && onSelectOption(opt.label)}
            >
              <span className={labelCls}>{opt.label}</span>
              <span className={s.optionText}>{opt.text}</span>
              {isThisCorrect && <CheckCircle2 size={18} style={{ marginLeft: "auto", flexShrink: 0 }} />}
              {isThisWrong && <XCircle size={18} style={{ marginLeft: "auto", flexShrink: 0 }} />}
            </div>
          );
        })}
      </div>

      {submitted && (
        <>
          <div className={`${s.feedbackRow} ${isCorrect ? s.feedbackCorrect : s.feedbackWrong}`}>
            {isCorrect ? (
              <>
                <CheckCircle2 size={18} /> Correct! Great job!
              </>
            ) : (
              <>
                <XCircle size={18} /> Not quite — the answer is {correctLabel}.
              </>
            )}
          </div>

          {question.explanation && (
            <div className={s.explanation}>
              <Lightbulb size={14} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
              {question.explanation}
            </div>
          )}
        </>
      )}
    </div>
  );
}
