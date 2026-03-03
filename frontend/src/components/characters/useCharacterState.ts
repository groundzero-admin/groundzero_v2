import { useState, useCallback, useRef } from "react";
import type { Expression, Action } from "./types";

type Reaction = "correct" | "wrong" | "hint" | "complete" | "reset";

interface CharacterState {
  expression: Expression;
  action: Action;
  setExpression: (e: Expression) => void;
  setAction: (a: Action) => void;
  react: (reaction: Reaction) => void;
  startTalking: () => void;
  stopTalking: () => void;
}

export function useCharacterState(): CharacterState {
  const [expression, setExpression] = useState<Expression>("idle");
  const [action, setAction] = useState<Action>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const react = useCallback((reaction: Reaction) => {
    clearTimer();

    switch (reaction) {
      case "correct":
        setExpression("happy");
        setAction("celebrating");
        timerRef.current = setTimeout(() => {
          setExpression("celebrating");
          timerRef.current = setTimeout(() => {
            setExpression("idle");
            setAction("idle");
          }, 2000);
        }, 500);
        break;

      case "wrong":
        setExpression("sad");
        setAction("idle");
        timerRef.current = setTimeout(() => {
          setExpression("thinking");
          timerRef.current = setTimeout(() => {
            setExpression("idle");
          }, 2000);
        }, 1500);
        break;

      case "hint":
        setExpression("thinking");
        setAction("pointing");
        timerRef.current = setTimeout(() => {
          setAction("idle");
        }, 3000);
        break;

      case "complete":
        setExpression("celebrating");
        setAction("celebrating");
        // stays celebrating — no auto-reset
        break;

      case "reset":
        setExpression("idle");
        setAction("idle");
        break;
    }
  }, []);

  const startTalking = useCallback(() => {
    setAction("talking");
  }, []);

  const stopTalking = useCallback(() => {
    setAction("idle");
  }, []);

  return { expression, action, setExpression, setAction, react, startTalking, stopTalking };
}
