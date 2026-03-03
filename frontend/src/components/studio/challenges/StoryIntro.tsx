import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Expression } from "@/components/characters/types";
import * as s from "./StoryIntro.css";

interface StoryIntroProps {
  text: string;
  celebration?: boolean;
  accentColor?: string;
  onComplete: () => void;
  onTalkingChange?: (talking: boolean) => void;
  onExpressionChange?: (expr: Expression) => void;
}

export function StoryIntro({
  text,
  celebration,
  accentColor,
  onComplete,
  onTalkingChange,
  onExpressionChange,
}: StoryIntroProps) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    doneRef.current = false;
    onTalkingChange?.(true);
  }, [text]);

  useEffect(() => {
    if (displayed.length >= text.length) {
      if (!doneRef.current) {
        doneRef.current = true;
        setDone(true);
        onTalkingChange?.(false);
        if (celebration) {
          onExpressionChange?.("celebrating");
        }
      }
      return;
    }
    const t = setTimeout(
      () => setDisplayed(text.slice(0, displayed.length + 1)),
      22
    );
    return () => clearTimeout(t);
  }, [displayed, text, celebration, onTalkingChange, onExpressionChange]);

  const isTyping = displayed.length < text.length;

  return (
    <div className={s.root}>
      <div className={s.storyText}>
        {displayed}
        {isTyping && <span className={s.cursor} />}
      </div>

      <AnimatePresence>
        {done && (
          <motion.button
            className={s.continueBtn}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={onComplete}
            style={accentColor ? { backgroundColor: accentColor } : undefined}
          >
            {celebration ? "Finish! 🎉" : "Continue →"}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
