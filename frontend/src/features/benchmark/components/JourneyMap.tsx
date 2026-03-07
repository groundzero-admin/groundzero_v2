interface JourneyMapProps {
  total: number;
  completed: number;
  current: number;
  color: string;
  accent: string;
  avatarImage: string;
}

export default function JourneyMap({ total, completed, current, color, accent, avatarImage }: JourneyMapProps) {
  // On mobile, show a compact progress bar with milestone markers instead of 20 individual dots
  return (
    <div className="jm-root">
      {/* Compact: fraction + progress bar (always visible, primary on mobile) */}
      <div className="jm-compact">
        <img src={avatarImage} alt="" className="jm-avatar-mini" />
        <div className="jm-bar-wrap">
          <div className="jm-bar-bg" style={{ backgroundColor: "rgba(255,255,255,0.3)" }}>
            <div
              className="jm-bar-fill"
              style={{
                backgroundColor: color,
                width: `${(completed / total) * 100}%`,
              }}
            />
            {/* Milestone markers at 25%, 50%, 75% */}
            {[0.25, 0.5, 0.75].map((pct) => (
              <div
                key={pct}
                className="jm-milestone-tick"
                style={{
                  left: `${pct * 100}%`,
                  backgroundColor: completed / total >= pct ? color : "rgba(255,255,255,0.5)",
                }}
              />
            ))}
          </div>
        </div>
        <span className="jm-fraction" style={{ color }}>
          {completed}/{total}
        </span>
      </div>

      {/* Full dots: only on wider screens */}
      <div className="jm-dots-row">
        {Array.from({ length: total }, (_, i) => {
          const isDone = i < completed;
          const isCurrent = i === current;
          const isMilestone = i === 4 || i === 9 || i === 14 || i === 19;
          const dotSz = isMilestone ? 12 : 8;

          return (
            <div key={i} className="jm-dot-cell">
              {isCurrent && (
                <img src={avatarImage} alt="" className="jm-dot-avatar" style={{ borderColor: color }} />
              )}
              <div
                style={{
                  width: dotSz, height: dotSz, borderRadius: "50%",
                  backgroundColor: isDone ? color : isCurrent ? accent : "rgba(255,255,255,0.4)",
                  border: isCurrent ? `2px solid ${color}` : isDone ? "none" : "1px solid rgba(255,255,255,0.6)",
                  boxShadow: isCurrent ? `0 0 8px ${color}50` : "none",
                  animation: isCurrent ? "jmPulse 1.5s ease-in-out infinite" : "none",
                  transition: "all 300ms ease",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {isDone && isMilestone && <span style={{ fontSize: 6, lineHeight: 1 }}>{"\u2B50"}</span>}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .jm-root { width: 100%; padding: 6px 12px; }
        .jm-compact { display: flex; align-items: center; gap: 8px; }
        .jm-avatar-mini { width: 24px; height: 24px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
        .jm-bar-wrap { flex: 1; position: relative; }
        .jm-bar-bg { height: 6px; border-radius: 3px; position: relative; overflow: visible; }
        .jm-bar-fill { height: 100%; border-radius: 3px; transition: width 600ms ease; }
        .jm-milestone-tick {
          position: absolute; top: -2px; width: 4px; height: 10px; border-radius: 2px;
          transform: translateX(-50%); transition: background-color 400ms;
        }
        .jm-fraction { font-size: 12px; font-weight: 800; font-family: 'Nunito', sans-serif; flex-shrink: 0; min-width: 36px; text-align: right; }
        .jm-dots-row {
          display: none;
          justify-content: space-between; align-items: center;
          margin-top: 4px; height: 32px; position: relative;
        }
        .jm-dot-cell { position: relative; display: flex; align-items: center; justify-content: center; }
        .jm-dot-avatar {
          width: 20px; height: 20px; border-radius: 50%;
          position: absolute; top: -14px;
          border: 2px solid; background: #fff;
          animation: jmBounce 2s ease-in-out infinite; z-index: 2;
        }
        @keyframes jmPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.4); } }
        @keyframes jmBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }

        @media (min-width: 640px) {
          .jm-compact { display: none; }
          .jm-dots-row { display: flex; }
          .jm-root { padding: 6px 16px; }
        }
      `}</style>
    </div>
  );
}
