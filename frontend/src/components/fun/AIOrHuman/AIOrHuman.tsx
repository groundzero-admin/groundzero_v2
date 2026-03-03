import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as s from "./AIOrHuman.css";

interface AIHumanQuestion {
  prompt: string;
  speakers: { id: string; text: string; isAI: boolean }[];
}

const QUESTIONS: AIHumanQuestion[] = [
  {
    prompt: "Write a short poem about rain",
    speakers: [
      {
        id: "A",
        text: "Rain taps my window like a friend\nwho visits but won't come in.\nI watch it paint the street\nwhile my tea goes cold again.",
        isAI: false,
      },
      {
        id: "B",
        text: "Raindrops cascade in silver streams,\nNature's symphony of liquid dreams.\nEach drop a crystal melody,\nDancing with ethereal harmony.",
        isAI: true,
      },
    ],
  },
  {
    prompt: "Describe what makes a good friend",
    speakers: [
      {
        id: "A",
        text: "A good friend is someone who listens with empathy, supports you through challenges, celebrates your successes, and maintains honest communication while respecting boundaries.",
        isAI: true,
      },
      {
        id: "B",
        text: "A good friend is like... you know when you're having a terrible day and they just show up with snacks? They don't even ask what's wrong. They just sit there with you. That's it really.",
        isAI: false,
      },
    ],
  },
  {
    prompt: "What is the most interesting fact about space?",
    speakers: [
      {
        id: "A",
        text: "ok so there's this thing called the boötes void — it's basically a GIANT empty bubble in space, 330 million light-years across, with almost nothing in it. like imagine the loneliest place ever, but cosmic. gives me chills ngl",
        isAI: false,
      },
      {
        id: "B",
        text: "One of the most fascinating facts about space is that a teaspoon of neutron star material would weigh approximately 6 billion tons on Earth. This incredible density occurs when massive stars collapse.",
        isAI: true,
      },
    ],
  },
];

/* ─── Animated Robot Character ─── */
function RobotCharacter({ talking, mood }: { talking: boolean; mood: "neutral" | "revealed" }) {
  return (
    <svg width="120" height="140" viewBox="0 0 120 140">
      {/* Antenna */}
      <motion.line
        x1="60" y1="12" x2="60" y2="28"
        stroke="#805AD5" strokeWidth="3" strokeLinecap="round"
        animate={talking ? { x1: [58, 62, 58], x2: [60, 60, 60] } : {}}
        transition={{ repeat: Infinity, duration: 0.4 }}
      />
      <motion.circle
        cx="60" cy="8" r="6" fill="#805AD5"
        animate={talking ? { scale: [1, 1.3, 1], fill: ["#805AD5", "#B794F4", "#805AD5"] } : {}}
        transition={{ repeat: Infinity, duration: 0.6 }}
      />
      {/* Antenna glow when talking */}
      {talking && (
        <motion.circle
          cx="60" cy="8" r="10" fill="none" stroke="#B794F4" strokeWidth="2"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: [0, 0.6, 0], scale: [0.8, 1.5, 0.8] }}
          transition={{ repeat: Infinity, duration: 1 }}
        />
      )}

      {/* Head */}
      <motion.rect
        x="22" y="28" width="76" height="60" rx="14"
        fill="#E9D8FD" stroke="#805AD5" strokeWidth="2.5"
        animate={talking ? { y: [28, 26, 28] } : {}}
        transition={{ repeat: Infinity, duration: 0.5 }}
      />

      {/* Screen / face area */}
      <rect x="30" y="36" width="60" height="36" rx="8" fill="#805AD520" />

      {/* Eyes */}
      <motion.rect
        x="40" y="44" width="14" height="16" rx="4" fill="#805AD5"
        animate={
          mood === "revealed"
            ? { scaleY: [1, 0.1, 1], y: [44, 52, 44] }
            : talking
              ? { height: [16, 16, 4, 16], y: [44, 44, 50, 44] }
              : { height: [16, 16, 4, 16], y: [44, 44, 50, 44] }
        }
        transition={
          mood === "revealed"
            ? { repeat: 2, duration: 0.3 }
            : { repeat: Infinity, duration: 3, times: [0, 0.85, 0.9, 0.95] }
        }
      />
      <motion.rect
        x="66" y="44" width="14" height="16" rx="4" fill="#805AD5"
        animate={
          mood === "revealed"
            ? { scaleY: [1, 0.1, 1], y: [44, 52, 44] }
            : talking
              ? { height: [16, 16, 4, 16], y: [44, 44, 50, 44] }
              : { height: [16, 16, 4, 16], y: [44, 44, 50, 44] }
        }
        transition={
          mood === "revealed"
            ? { repeat: 2, duration: 0.3, delay: 0.1 }
            : { repeat: Infinity, duration: 3, times: [0, 0.85, 0.9, 0.95] }
        }
      />

      {/* Pupil dots */}
      <motion.circle cx="47" cy="50" r="2.5" fill="white"
        animate={talking ? { cx: [47, 49, 45, 47] } : {}}
        transition={{ repeat: Infinity, duration: 1.5 }}
      />
      <motion.circle cx="73" cy="50" r="2.5" fill="white"
        animate={talking ? { cx: [73, 75, 71, 73] } : {}}
        transition={{ repeat: Infinity, duration: 1.5 }}
      />

      {/* Mouth */}
      <motion.rect
        x="45" y="64" width="30" height="4" rx="2" fill="#805AD5"
        animate={
          talking
            ? { height: [4, 8, 4, 10, 4], y: [64, 62, 64, 61, 64], rx: [2, 4, 2, 5, 2] }
            : mood === "revealed"
              ? { width: [30, 20, 30], x: [45, 50, 45] }
              : {}
        }
        transition={{ repeat: Infinity, duration: 0.4 }}
      />

      {/* Body */}
      <rect x="34" y="92" width="52" height="32" rx="8" fill="#E9D8FD" stroke="#805AD5" strokeWidth="2" />

      {/* Chest lights */}
      <motion.circle cx="48" cy="106" r="4" fill="#805AD5"
        animate={talking ? { fill: ["#805AD5", "#B794F4", "#805AD5"], scale: [1, 1.2, 1] } : {}}
        transition={{ repeat: Infinity, duration: 0.8 }}
      />
      <motion.circle cx="60" cy="106" r="4" fill="#805AD5"
        animate={talking ? { fill: ["#B794F4", "#805AD5", "#B794F4"], scale: [1, 1.2, 1] } : {}}
        transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
      />
      <motion.circle cx="72" cy="106" r="4" fill="#805AD5"
        animate={talking ? { fill: ["#805AD5", "#B794F4", "#805AD5"], scale: [1, 1.2, 1] } : {}}
        transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }}
      />

      {/* Arms */}
      <motion.rect x="10" y="96" width="20" height="8" rx="4" fill="#B794F4"
        animate={talking ? { rotate: [0, -8, 0, 8, 0], y: [96, 93, 96, 99, 96] } : {}}
        transition={{ repeat: Infinity, duration: 1 }}
        style={{ transformOrigin: "22px 100px" }}
      />
      <motion.rect x="90" y="96" width="20" height="8" rx="4" fill="#B794F4"
        animate={talking ? { rotate: [0, 8, 0, -8, 0], y: [96, 99, 96, 93, 96] } : {}}
        transition={{ repeat: Infinity, duration: 1 }}
        style={{ transformOrigin: "98px 100px" }}
      />
    </svg>
  );
}

/* ─── Animated Human Character ─── */
function HumanCharacter({ talking, mood }: { talking: boolean; mood: "neutral" | "revealed" }) {
  return (
    <svg width="120" height="140" viewBox="0 0 120 140">
      {/* Hair */}
      <ellipse cx="60" cy="28" rx="32" ry="18" fill="#4A3728" />
      <ellipse cx="42" cy="22" rx="10" ry="6" fill="#4A3728" />
      <ellipse cx="78" cy="24" rx="8" ry="5" fill="#4A3728" />

      {/* Head */}
      <motion.ellipse
        cx="60" cy="48" rx="28" ry="30"
        fill="#FFD8B1" stroke="#E8A87C" strokeWidth="2"
        animate={talking ? { cy: [48, 46, 48] } : {}}
        transition={{ repeat: Infinity, duration: 0.6 }}
      />

      {/* Cheeks (blush) */}
      <circle cx="38" cy="55" r="6" fill="#FFBCBC" opacity="0.4" />
      <circle cx="82" cy="55" r="6" fill="#FFBCBC" opacity="0.4" />

      {/* Eyes */}
      <motion.ellipse
        cx="48" cy="46" rx="5" ry="6" fill="#3D3730"
        animate={
          mood === "revealed"
            ? { ry: [6, 7, 6], rx: [5, 5.5, 5] }
            : { ry: [6, 6, 1, 6], rx: [5, 5, 5, 5] }
        }
        transition={
          mood === "revealed"
            ? { repeat: 3, duration: 0.3 }
            : { repeat: Infinity, duration: 3.5, times: [0, 0.87, 0.92, 0.97] }
        }
      />
      <motion.ellipse
        cx="72" cy="46" rx="5" ry="6" fill="#3D3730"
        animate={
          mood === "revealed"
            ? { ry: [6, 7, 6], rx: [5, 5.5, 5] }
            : { ry: [6, 6, 1, 6], rx: [5, 5, 5, 5] }
        }
        transition={
          mood === "revealed"
            ? { repeat: 3, duration: 0.3, delay: 0.05 }
            : { repeat: Infinity, duration: 3.5, times: [0, 0.87, 0.92, 0.97] }
        }
      />

      {/* Eye shine */}
      <circle cx="50" cy="44" r="2" fill="white" />
      <circle cx="74" cy="44" r="2" fill="white" />

      {/* Eyebrows */}
      <motion.line x1="42" y1="36" x2="54" y2="37" stroke="#4A3728" strokeWidth="2.5" strokeLinecap="round"
        animate={talking ? { y1: [36, 34, 36] } : {}}
        transition={{ repeat: Infinity, duration: 0.8 }}
      />
      <motion.line x1="66" y1="37" x2="78" y2="36" stroke="#4A3728" strokeWidth="2.5" strokeLinecap="round"
        animate={talking ? { y2: [36, 34, 36] } : {}}
        transition={{ repeat: Infinity, duration: 0.8 }}
      />

      {/* Mouth */}
      <motion.path
        d={talking ? "M50,62 Q60,72 70,62" : "M50,62 Q60,68 70,62"}
        fill="none" stroke="#C0392B" strokeWidth="2.5" strokeLinecap="round"
        animate={
          talking
            ? { d: ["M50,62 Q60,68 70,62", "M50,62 Q60,74 70,62", "M50,62 Q60,68 70,62"] }
            : mood === "revealed"
              ? { d: ["M50,62 Q60,68 70,62", "M50,60 Q60,72 70,60", "M50,60 Q60,72 70,60"] }
              : {}
        }
        transition={{ repeat: Infinity, duration: 0.5 }}
      />

      {/* Neck */}
      <rect x="54" y="76" width="12" height="10" fill="#FFD8B1" />

      {/* Body / shirt */}
      <motion.path
        d="M30,90 Q30,86 40,86 L80,86 Q90,86 90,90 L90,128 Q90,132 86,132 L34,132 Q30,132 30,128 Z"
        fill="#3182CE" stroke="#2B6CB0" strokeWidth="2"
      />

      {/* Shirt collar */}
      <path d="M48,86 L60,96 L72,86" fill="none" stroke="#2B6CB0" strokeWidth="2" />

      {/* Arms */}
      <motion.path
        d="M30,92 Q18,96 14,108" fill="none" stroke="#3182CE" strokeWidth="10" strokeLinecap="round"
        animate={talking ? { d: ["M30,92 Q18,96 14,108", "M30,92 Q16,92 12,104", "M30,92 Q18,96 14,108"] } : {}}
        transition={{ repeat: Infinity, duration: 0.8 }}
      />
      <motion.path
        d="M90,92 Q102,96 106,108" fill="none" stroke="#3182CE" strokeWidth="10" strokeLinecap="round"
        animate={
          talking
            ? { d: ["M90,92 Q102,96 106,108", "M90,92 Q104,92 108,104", "M90,92 Q102,96 106,108"] }
            : mood === "revealed"
              ? { d: ["M90,92 Q102,96 106,108", "M90,90 Q108,80 112,90", "M90,90 Q108,80 112,90"] }
              : {}
        }
        transition={mood === "revealed" ? { duration: 0.5 } : { repeat: Infinity, duration: 0.8 }}
      />

      {/* Hands */}
      <motion.circle cx="14" cy="110" r="6" fill="#FFD8B1"
        animate={talking ? { cy: [110, 106, 110] } : {}}
        transition={{ repeat: Infinity, duration: 0.8 }}
      />
      <motion.circle cx="106" cy="110" r="6" fill="#FFD8B1"
        animate={
          mood === "revealed"
            ? { cx: [106, 114, 114], cy: [110, 92, 92] }
            : talking
              ? { cy: [110, 106, 110] }
              : {}
        }
        transition={mood === "revealed" ? { duration: 0.5 } : { repeat: Infinity, duration: 0.8 }}
      />
    </svg>
  );
}

/* ─── Typewriter ─── */
function TypewriterText({ text, speed = 25, delay = 0, onDone }: {
  text: string; speed?: number; delay?: number; onDone?: () => void;
}) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    setDisplayed("");
    setStarted(false);
    doneRef.current = false;
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [text, delay]);

  useEffect(() => {
    if (!started) return;
    if (displayed.length >= text.length) {
      if (!doneRef.current) { doneRef.current = true; onDone?.(); }
      return;
    }
    const t = setTimeout(() => setDisplayed(text.slice(0, displayed.length + 1)), speed);
    return () => clearTimeout(t);
  }, [started, displayed, text, speed, onDone]);

  const isTyping = started && displayed.length < text.length;

  return (
    <span>
      {displayed}
      {isTyping && (
        <span style={{
          display: "inline-block", width: 2, height: "1em",
          backgroundColor: "currentColor", marginLeft: 2,
          verticalAlign: "text-bottom", animation: "blink 1s step-end infinite",
        }} />
      )}
    </span>
  );
}

/* ─── Main Component ─── */
export function AIOrHuman() {
  const [qIndex, setQIndex] = useState(0);
  const [typingDone, setTypingDone] = useState<Record<string, boolean>>({});
  const [typingActive, setTypingActive] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);

  const q = QUESTIONS[qIndex];
  const allDone = q.speakers.every((sp) => typingDone[sp.id]);
  const aiSpeaker = q.speakers.find((sp) => sp.isAI)!;
  const isCorrect = selected === aiSpeaker.id;

  // Track which speaker is currently typing
  useEffect(() => {
    // Speaker A starts typing after 500ms
    const t1 = setTimeout(() => setTypingActive((p) => ({ ...p, [q.speakers[0].id]: true })), 500);
    // Speaker B starts typing after 800ms + A's delay
    const t2 = setTimeout(() => setTypingActive((p) => ({ ...p, [q.speakers[1].id]: true })), 1300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [qIndex, q.speakers]);

  const handleSelect = (speakerId: string) => {
    if (revealed || !allDone) return;
    setSelected(speakerId);
    setRevealed(true);
    if (q.speakers.find((sp) => sp.id === speakerId)?.isAI) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    setSelected(null);
    setRevealed(false);
    setTypingDone({});
    setTypingActive({});
    setQIndex((i) => (i + 1) % QUESTIONS.length);
  };

  return (
    <div className={s.root}>
      <div className={s.score}>Score: {score} / {QUESTIONS.length}</div>

      <AnimatePresence mode="wait">
        <motion.div
          key={qIndex}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.4 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, width: "100%" }}
        >
          <div className={s.header}>
            <div className={s.title}>AI or Human?</div>
            <div className={s.subtitle}>Both answered the same prompt. One is AI — can you tell?</div>
          </div>

          <div className={s.promptBox}>
            <div className={s.promptLabel}>The Prompt</div>
            <div className={s.promptText}>"{q.prompt}"</div>
          </div>

          <div className={s.speakers}>
            {q.speakers.map((speaker, idx) => {
              const isTalking = !!typingActive[speaker.id] && !typingDone[speaker.id];
              const mood = revealed ? "revealed" : "neutral";

              let cardCls = s.speakerCard;
              if (revealed) {
                cardCls += speaker.isAI ? ` ${s.cardAI}` : ` ${s.cardHuman}`;
              }

              return (
                <motion.div
                  key={speaker.id}
                  className={cardCls}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.2, duration: 0.5, type: "spring" }}
                >
                  {/* Character */}
                  <div className={s.characterArea}>
                    <motion.div
                      animate={isTalking ? { y: [0, -3, 0] } : {}}
                      transition={{ repeat: Infinity, duration: 0.6 }}
                    >
                      {idx === 0
                        ? <HumanCharacter talking={isTalking} mood={mood} />
                        : <RobotCharacter talking={isTalking} mood={mood} />
                      }
                    </motion.div>
                    <div className={s.speakerLabel}>
                      Speaker {speaker.id}
                      {revealed && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 12 }}
                          className={s.revealBadge}
                          style={{
                            backgroundColor: speaker.isAI ? "#805AD530" : "#38A16930",
                            color: speaker.isAI ? "#805AD5" : "#38A169",
                          }}
                        >
                          {speaker.isAI ? "AI" : "HUMAN"}
                        </motion.span>
                      )}
                    </div>
                  </div>

                  {/* Speech bubble */}
                  <div className={s.speechBubble}>
                    <div className={s.speechTail} />
                    <div className={s.messageText}>
                      <TypewriterText
                        text={speaker.text}
                        speed={20}
                        delay={idx * 800 + 500}
                        onDone={() => setTypingDone((p) => ({ ...p, [speaker.id]: true }))}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Choice buttons */}
          <AnimatePresence>
            {allDone && !revealed && (
              <motion.div
                className={s.choices}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className={s.choiceLabel}>Who is the AI?</div>
                <div className={s.choiceBtns}>
                  {q.speakers.map((speaker, idx) => (
                    <motion.button
                      key={speaker.id}
                      className={s.choiceBtn}
                      onClick={() => handleSelect(speaker.id)}
                      whileHover={{ scale: 1.06, y: -4 }}
                      whileTap={{ scale: 0.94 }}
                      style={{
                        borderColor: idx === 0 ? "#3182CE" : "#805AD5",
                        color: idx === 0 ? "#3182CE" : "#805AD5",
                      }}
                    >
                      Speaker {speaker.id}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Result */}
          <AnimatePresence>
            {revealed && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}
              >
                <motion.div
                  className={s.feedbackText}
                  style={{ color: isCorrect ? "#38A169" : "#E53E3E" }}
                  animate={isCorrect ? { scale: [1, 1.15, 1] } : { x: [0, -8, 8, -5, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  {isCorrect ? "Nice catch! You spotted the AI!" : `Tricky! Speaker ${aiSpeaker.id} was the AI.`}
                </motion.div>
                <div style={{ fontSize: 13, color: "#7A7168", textAlign: "center", maxWidth: 420, lineHeight: 1.6 }}>
                  {isCorrect
                    ? "AI text often sounds polished but generic — perfect grammar, fancy words, balanced structure. Humans write messier, more personal stuff."
                    : "Tip: AI loves symmetry and big vocabulary. Humans use slang, fragments, and specific details from real life."}
                </div>
                <button className={s.nextBtn} onClick={handleNext}>Next Round</button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
