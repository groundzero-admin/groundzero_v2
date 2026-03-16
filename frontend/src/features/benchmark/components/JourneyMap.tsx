import { useEffect, useRef, useState } from "react";

const PILLAR_EMOJI: Record<string, string> = {
  math_logic: "🧮",
  communication: "💬",
  creativity: "🎨",
  ai_systems: "🤖",
};

interface JourneyMapProps {
  total: number;
  completed: number;
  current: number;
  color: string;
  accent: string;
  avatarImage: string;
  questionPillars?: string[];
}

export default function JourneyMap({
  total,
  completed,
  current,
  color,
  accent,
  avatarImage,
  questionPillars,
}: JourneyMapProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isJumping, setIsJumping] = useState(false);
  const prevRef = useRef(current);

  const SPACING = total <= 8 ? 80 : total <= 14 ? 60 : 48;
  const PAD = 50;
  const MAP_H = 150;
  const HIGH_Y = 48;
  const LOW_Y = 110;
  const NODE_R = 18;
  const ACTIVE_R = 22;
  const CHAR_SIZE = 40;
  const CHAR_GAP = 28;

  const mapWidth = PAD * 2 + Math.max(0, total - 1) * SPACING;

  const nodes = Array.from({ length: total }, (_, i) => ({
    x: PAD + i * SPACING,
    y: i % 2 === 0 ? LOW_Y : HIGH_Y,
  }));

  useEffect(() => {
    if (current !== prevRef.current) {
      setIsJumping(true);
      prevRef.current = current;
      const t = setTimeout(() => setIsJumping(false), 600);
      return () => clearTimeout(t);
    }
  }, [current]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !nodes[current]) return;
    el.scrollTo({
      left: Math.max(0, nodes[current].x - el.clientWidth / 2),
      behavior: "smooth",
    });
  }, [current]); // eslint-disable-line react-hooks/exhaustive-deps

  const cur = nodes[current];

  return (
    <div className="am-root" ref={scrollRef}>
      <div
        className="am-track"
        style={{ width: Math.max(mapWidth, 320), height: MAP_H }}
      >
        {/* SVG path connections */}
        <svg
          className="am-svg"
          width={Math.max(mapWidth, 320)}
          height={MAP_H}
        >
          {nodes.slice(0, -1).map((node, i) => {
            const next = nodes[i + 1];
            const done = i < completed;
            const mx = (node.x + next.x) / 2;
            const d = `M${node.x},${node.y} C${mx},${node.y} ${mx},${next.y} ${next.x},${next.y}`;

            return (
              <g key={i}>
                {done && (
                  <path
                    d={d}
                    fill="none"
                    stroke={color}
                    strokeWidth={10}
                    strokeLinecap="round"
                    opacity={0.1}
                  />
                )}
                <path
                  d={d}
                  fill="none"
                  stroke={done ? color : "rgba(255,255,255,0.22)"}
                  strokeWidth={done ? 4 : 3}
                  strokeLinecap="round"
                  strokeDasharray={done ? "none" : "8 6"}
                  opacity={done ? 0.65 : 1}
                  className="am-path-seg"
                />
              </g>
            );
          })}
        </svg>

        {/* Question nodes */}
        {nodes.map((node, i) => {
          const isDone = i < completed;
          const isCurr = i === current;
          const isLast = i === total - 1;
          const pillar = questionPillars?.[i];
          const emoji = pillar ? PILLAR_EMOJI[pillar] : null;
          const r = isCurr ? ACTIVE_R : NODE_R;
          const sz = r * 2;
          const opacity = isCurr ? 1 : 0.45;

          return (
            <div
              key={i}
              className={`am-node ${isCurr ? "am-pulse" : ""}`}
              style={{
                left: node.x - r,
                top: node.y - r,
                width: sz,
                height: sz,
                background: isDone
                  ? `linear-gradient(135deg, ${color}, ${accent})`
                  : isCurr
                    ? "#ffffffee"
                    : "rgba(255,255,255,0.15)",
                borderColor: isDone || isCurr ? color : "rgba(255,255,255,0.3)",
                boxShadow: isCurr
                  ? `0 0 20px ${color}60, 0 0 40px ${color}15`
                  : isDone
                    ? `0 3px 10px ${color}30`
                    : "0 2px 6px rgba(0,0,0,0.06)",
              }}
            >
              {isDone ? (
                <span className="am-star">⭐</span>
              ) : emoji ? (
                <span className="am-icon" style={{ opacity }}>{emoji}</span>
              ) : i === 0 ? (
                <span className="am-icon" style={{ opacity }}>🚀</span>
              ) : isLast ? (
                <span className="am-icon" style={{ opacity }}>🏆</span>
              ) : (
                <span
                  className="am-num"
                  style={{ color: isCurr ? color : "rgba(255,255,255,0.7)" }}
                >
                  {i + 1}
                </span>
              )}
            </div>
          );
        })}

        {/* Character avatar hopping on the current node */}
        {cur && (
          <div
            className="am-char"
            style={{
              left: cur.x - CHAR_SIZE / 2,
              top: cur.y - CHAR_GAP - CHAR_SIZE / 2,
              width: CHAR_SIZE,
              height: CHAR_SIZE + 14,
              transition:
                "left 500ms cubic-bezier(0.34,1.56,0.64,1), top 500ms cubic-bezier(0.34,1.56,0.64,1)",
            }}
          >
            <div className={isJumping ? "am-hop" : "am-float"}>
              <img
                src={avatarImage}
                alt=""
                className="am-avatar"
                style={{ borderColor: color }}
              />
            </div>
            <div
              className={`am-shadow ${isJumping ? "am-shadow-sm" : ""}`}
              style={{
                background: `radial-gradient(ellipse, ${color}22 0%, transparent 70%)`,
              }}
            />
          </div>
        )}
      </div>

      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
/* ── Container ── */
.am-root {
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.am-root::-webkit-scrollbar { display: none; }

.am-track {
  position: relative;
  min-width: 100%;
}

.am-svg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.am-path-seg {
  transition: stroke 400ms, stroke-width 400ms;
}

/* ── Nodes ── */
.am-node {
  position: absolute;
  border-radius: 50%;
  border: 3px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 300ms ease;
  z-index: 2;
}

.am-pulse {
  animation: amPulse 2s ease-in-out infinite;
}

.am-star {
  font-size: 14px;
  line-height: 1;
}

.am-icon {
  font-size: 15px;
  line-height: 1;
}

.am-num {
  font-size: 12px;
  font-weight: 800;
  font-family: 'Nunito', sans-serif;
}

/* ── Character ── */
.am-char {
  position: absolute;
  z-index: 5;
  pointer-events: none;
}

.am-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2.5px solid;
  background: #fff;
  object-fit: cover;
  display: block;
}

.am-shadow {
  width: 28px;
  height: 8px;
  border-radius: 50%;
  margin: 2px auto 0;
  transition: all 300ms;
}

.am-shadow-sm {
  width: 16px;
  height: 5px;
  opacity: 0.4;
}

.am-float {
  animation: amFloat 2.5s ease-in-out infinite;
}

.am-hop {
  animation: amJump 500ms cubic-bezier(0.22, 0.68, 0.31, 1.2);
}

/* ── Animations ── */
@keyframes amFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

@keyframes amJump {
  0%   { transform: translateY(0) scale(1); }
  20%  { transform: translateY(-20px) scale(1.1); }
  40%  { transform: translateY(-30px) scale(1.15) rotate(8deg); }
  60%  { transform: translateY(-14px) scale(1.08) rotate(-4deg); }
  85%  { transform: translateY(4px) scaleY(0.88) scaleX(1.12); }
  100% { transform: translateY(0) scale(1); }
}

@keyframes amPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}
`;
