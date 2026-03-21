import { Fragment, useEffect, useRef, useState, memo } from "react";
import { ArrowRight } from "lucide-react";
import type { Character } from "../constants/characters";
import type { BenchmarkQuestion } from "../api";

const ZOOM_FACTOR = 1.4;

const ChromaVideo = memo(function ChromaVideo({ src, size = 90 }: { src: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const renderSize = Math.ceil(size * dpr * ZOOM_FACTOR);
    canvas.width = renderSize;
    canvas.height = renderSize;

    const draw = () => {
      if (video.paused || video.ended) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const vw = video.videoWidth || renderSize;
      const vh = video.videoHeight || renderSize;
      const scale = Math.min(renderSize / vw, renderSize / vh);
      const dw = vw * scale;
      const dh = vh * scale;
      const dx = (renderSize - dw) / 2;
      const dy = (renderSize - dh) / 2;

      ctx.clearRect(0, 0, renderSize, renderSize);
      ctx.drawImage(video, dx, dy, dw, dh);

      const imageData = ctx.getImageData(0, 0, renderSize, renderSize);
      const d = imageData.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        const brightness = (r + g + b) / 3;
        if (brightness > 220) {
          const fade = Math.max(0, (brightness - 220) / 35);
          d[i + 3] = Math.round(d[i + 3] * (1 - fade));
        }
      }
      ctx.putImageData(imageData, 0, 0);

      rafRef.current = requestAnimationFrame(draw);
    };

    const onPlay = () => { rafRef.current = requestAnimationFrame(draw); };
    video.addEventListener("playing", onPlay);
    if (!video.paused) onPlay();

    return () => {
      video.removeEventListener("playing", onPlay);
      cancelAnimationFrame(rafRef.current);
    };
  }, [size]);

  return (
    <>
      <video
        ref={videoRef}
        src={src}
        autoPlay
        muted
        playsInline
        loop
        style={{ position: "absolute", width: 0, height: 0, opacity: 0, pointerEvents: "none" }}
      />
      <canvas
        ref={canvasRef}
        className="adv-run-canvas"
        style={{ width: size, height: size }}
      />
    </>
  );
});

const PILLAR_EMOJI: Record<string, string> = {
  math_logic: "\u{1F9EE}",
  communication: "\u{1F4AC}",
  creativity: "\u{1F3A8}",
  ai_systems: "\u{1F916}",
};

const PILLAR_NAME: Record<string, string> = {
  math_logic: "Math & Logic",
  communication: "Communication",
  creativity: "Creativity",
  ai_systems: "AI & Systems",
};

const X_POSITIONS = [50, 65, 35, 63, 37, 65, 35, 50];
const Y_START = 110;
const Y_SPACING = 110;
const NODE_SIZE = 52;
const ACTIVE_SIZE = 64;
const CHAR_SIZE = 56;

interface AdventureMapProps {
  questions: BenchmarkQuestion[];
  completed: number;
  current: number;
  character: Character;
  avatarImage: string;
  onOpenQuestion: () => void;
  studentName: string;
  autoRun?: boolean;
}

export default function AdventureMap({
  questions,
  completed,
  current,
  character,
  avatarImage,
  onOpenQuestion,
  studentName,
  autoRun = false,
}: AdventureMapProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const charRef = useRef<HTMLDivElement>(null);
  const [mapWidth, setMapWidth] = useState(375);
  const [isJumping, setIsJumping] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const prevRef = useRef(current);
  const runAnimRef = useRef<number>(0);
  const runDelayRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const hasRunVideo = !!character.runVideo;

  const total = questions.length || 8;
  const totalH = Y_START + (total - 1) * Y_SPACING + 180;
  const { color, accent } = character;

  const nodes = Array.from({ length: total }, (_, i) => {
    const xPct = X_POSITIONS[i % X_POSITIONS.length];
    return {
      xPct,
      y: Y_START + i * Y_SPACING,
      xPx: (mapWidth * xPct) / 100,
      labelSide: (xPct > 50 ? "left" : "right") as "left" | "right",
    };
  });

  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      setMapWidth(entries[0].contentRect.width);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (current !== prevRef.current && !autoRun) {
      setIsJumping(true);
      prevRef.current = current;
      const t = setTimeout(() => setIsJumping(false), 700);
      return () => clearTimeout(t);
    }
    prevRef.current = current;
  }, [current, autoRun]);

  useEffect(() => {
    if (isRunning) return;
    const el = scrollRef.current;
    if (!el || !nodes[current]) return;
    const delay = autoRun && current > 0 ? 100 : 0;
    const t = setTimeout(() => {
      el.scrollTo({
        top: Math.max(0, nodes[current].y - el.clientHeight / 2),
        behavior: "smooth",
      });
    }, delay);
    return () => clearTimeout(t);
  }, [current, isRunning]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!autoRun || !hasRunVideo || current <= 0) return;

    const startAnim = () => {
      const scrollEl = scrollRef.current;
      const mapEl = mapRef.current;
      if (!scrollEl || !mapEl) return;

      const w = mapEl.clientWidth || mapWidth;
      const viewW = scrollEl.clientWidth;
      const viewH = scrollEl.clientHeight;
      const fromIdx = current - 1;
      const toIdx = current;

      const fromXPct = X_POSITIONS[fromIdx % X_POSITIONS.length];
      const toXPct = X_POSITIONS[toIdx % X_POSITIONS.length];
      const fromX = (w * fromXPct) / 100;
      const fromY = Y_START + fromIdx * Y_SPACING;
      const toX = (w * toXPct) / 100;
      const toY = Y_START + toIdx * Y_SPACING;
      const my = (fromY + toY) / 2;
      const charTopOffset = ACTIVE_SIZE / 2 + 10 + CHAR_SIZE;

      const clampTranslate = (tx: number, ty: number) => {
        const maxTx = 0;
        const minTx = viewW - w * ZOOM_FACTOR;
        const maxTy = 0;
        const minTy = viewH - totalH * ZOOM_FACTOR;
        return {
          tx: Math.min(maxTx, Math.max(minTx, tx)),
          ty: Math.min(maxTy, Math.max(minTy, ty)),
        };
      };

      if (charRef.current) {
        charRef.current.style.left = `${fromX}px`;
        charRef.current.style.top = `${fromY - charTopOffset}px`;
        charRef.current.style.transition = "none";
      }

      scrollEl.scrollTop = 0;
      scrollEl.style.overflow = "hidden";
      mapEl.style.transformOrigin = "0 0";
      const charCY = fromY - charTopOffset + CHAR_SIZE / 2;
      const initT = clampTranslate(viewW / 2 - fromX * ZOOM_FACTOR, viewH / 2 - charCY * ZOOM_FACTOR);
      mapEl.style.transform = `translate(${initT.tx}px, ${initT.ty}px) scale(${ZOOM_FACTOR})`;

      setIsRunning(true);

      const duration = 3000;
      runDelayRef.current = setTimeout(() => {
        const startTime = performance.now();

        const animate = (now: number) => {
          const t = Math.min((now - startTime) / duration, 1);
          const eased =
            t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          const u = 1 - eased;

          const x =
            u * u * u * fromX +
            3 * u * u * eased * fromX +
            3 * u * eased * eased * toX +
            eased * eased * eased * toX;
          const y =
            u * u * u * fromY +
            3 * u * u * eased * my +
            3 * u * eased * eased * my +
            eased * eased * eased * toY;

          if (charRef.current) {
            charRef.current.style.left = `${x}px`;
            charRef.current.style.top = `${y - charTopOffset}px`;
          }

          const ccy = y - charTopOffset + CHAR_SIZE / 2;
          const ct = clampTranslate(viewW / 2 - x * ZOOM_FACTOR, viewH / 2 - ccy * ZOOM_FACTOR);
          mapEl.style.transform = `translate(${ct.tx}px, ${ct.ty}px) scale(${ZOOM_FACTOR})`;

          if (t < 1) {
            runAnimRef.current = requestAnimationFrame(animate);
          } else {
            const scrollTarget = Math.max(0, toY - viewH / 2);
            mapEl.style.transition = "transform 0.5s ease-out";
            mapEl.style.transform = `translate(0px, ${-scrollTarget}px) scale(1)`;

            const onZoomOut = () => {
              mapEl.removeEventListener("transitionend", onZoomOut);
              mapEl.style.transition = "";
              mapEl.style.transform = "";
              mapEl.style.transformOrigin = "";
              scrollEl.style.overflow = "";
              scrollEl.scrollTop = scrollTarget;
              setIsRunning(false);
              runDelayRef.current = setTimeout(() => onOpenQuestion(), 300);
            };
            mapEl.addEventListener("transitionend", onZoomOut, { once: true });
          }
        };

        runAnimRef.current = requestAnimationFrame(animate);
      }, 250);
    };

    const rAF = requestAnimationFrame(() =>
      requestAnimationFrame(() => startAnim())
    );

    return () => {
      cancelAnimationFrame(rAF);
      cancelAnimationFrame(runAnimRef.current);
      clearTimeout(runDelayRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (total === 0) return null;

  const curNode = nodes[current];
  const labelGap = ACTIVE_SIZE / 2 + 16;

  return (
    <div className="adv-root">
      <div className="adv-header" style={{ background: character.background }}>
        <img
          src={character.poses?.idle || character.image}
          alt=""
          className="adv-hdr-avi"
          style={{ borderColor: "#ffffff60" }}
        />
        <div className="adv-hdr-info">
          <div className="adv-hdr-title">{character.name}'s Quest</div>
          <div className="adv-hdr-sub">with {studentName}</div>
        </div>
        <div
          className="adv-hdr-badge"
          style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}
        >
          {"\u{2B50}"} {completed}/{total}
        </div>
      </div>

      <div className="adv-scroll" ref={scrollRef}>
        <div className="adv-map" ref={mapRef} style={{ height: totalH }}>
          <div
            className="adv-map-glow"
            style={{
              background: `radial-gradient(ellipse at 50% 0%, ${color}12 0%, transparent 60%)`,
            }}
          />

          {[12, 82, 25, 70, 55].map((left, i) => (
            <div
              key={`sp-${i}`}
              className="adv-sparkle"
              style={{
                left: `${left}%`,
                top: 60 + i * Y_SPACING * 1.4,
                animationDelay: `${i * 1.1}s`,
                width: 3 + (i % 3),
                height: 3 + (i % 3),
                background: color,
              }}
            />
          ))}

          <svg className="adv-svg" width={mapWidth} height={totalH}>
            {nodes.slice(0, -1).map((node, i) => {
              const next = nodes[i + 1];
              const done = i < completed;
              const my = (node.y + next.y) / 2;
              const d = `M${node.xPx},${node.y} C${node.xPx},${my} ${next.xPx},${my} ${next.xPx},${next.y}`;

              return (
                <g key={i}>
                  {done && (
                    <path
                      d={d}
                      fill="none"
                      stroke={color}
                      strokeWidth={14}
                      strokeLinecap="round"
                      opacity={0.08}
                    />
                  )}
                  <path
                    d={d}
                    fill="none"
                    stroke={done ? color : "#D4C9BD"}
                    strokeWidth={done ? 4 : 3}
                    strokeLinecap="round"
                    strokeDasharray={done ? "none" : "10 8"}
                    opacity={done ? 0.55 : 0.6}
                    className="adv-path-seg"
                  />
                </g>
              );
            })}
          </svg>

          <div
            className="adv-marker"
            style={{
              left: `${nodes[0]?.xPct ?? 50}%`,
              top: (nodes[0]?.y ?? Y_START) - 56,
            }}
          >
            START
          </div>

          {nodes.map((node, i) => {
            const isDone = i < completed;
            const isCurr = i === current;
            const isLast = i === total - 1;
            const q = questions[i];
            const pillar = q?.pillars?.[0];
            const emoji = pillar ? PILLAR_EMOJI[pillar] : null;
            const pillarName = pillar ? PILLAR_NAME[pillar] : null;
            const sz = isCurr ? ACTIVE_SIZE : NODE_SIZE;

            return (
              <Fragment key={i}>
                <div
                  className="adv-node-pos"
                  style={{
                    left: `${node.xPct}%`,
                    top: node.y,
                    zIndex: isCurr ? 4 : 3,
                  }}
                >
                  <div
                    className={`adv-node ${isCurr && !isRunning ? "adv-node-active" : ""}`}
                    style={{
                      width: sz,
                      height: sz,
                      background: isDone
                        ? `linear-gradient(135deg, ${color}, ${accent})`
                        : isCurr
                          ? "#fff"
                          : "#EDE8E2",
                      borderColor: isDone
                        ? color
                        : isCurr
                          ? color
                          : "#D4C9BD",
                      boxShadow: isCurr
                        ? `0 0 24px ${color}50, 0 0 48px ${color}15`
                        : isDone
                          ? `0 4px 14px ${color}25`
                          : "0 2px 8px rgba(0,0,0,0.06)",
                    }}
                    onClick={isCurr && !isRunning ? onOpenQuestion : undefined}
                  >
                    {isDone ? (
                      <span className="adv-nicon adv-nicon-done">{"\u{2B50}"}</span>
                    ) : isCurr ? (
                      <span className="adv-nicon adv-nicon-curr">
                        {emoji || "\u{2753}"}
                      </span>
                    ) : (
                      <span className="adv-nicon adv-nicon-lock">
                        {emoji || "\u{1F512}"}
                      </span>
                    )}
                  </div>

                  {isCurr && !isRunning && (
                    <div className="adv-tap" style={{ color }}>
                      tap to answer
                    </div>
                  )}
                </div>

                <div
                  className={`adv-label adv-label-${node.labelSide}`}
                  style={{
                    ...(node.labelSide === "right"
                      ? { left: `calc(${node.xPct}% + ${labelGap}px)` }
                      : { right: `calc(${100 - node.xPct}% + ${labelGap}px)` }),
                    top: node.y,
                  }}
                >
                  <div
                    className="adv-label-num"
                    style={{
                      color: isCurr
                        ? "#26221D"
                        : isDone
                          ? "#5A534D"
                          : "#B5ADA5",
                    }}
                  >
                    {isDone ? `Question ${i + 1} \u{2713}` : `Question ${i + 1}`}
                  </div>
                  {pillarName && (
                    <div
                      className="adv-label-pill"
                      style={{
                        color: isCurr
                          ? color
                          : isDone
                            ? "#7A7168"
                            : "#C8C0B8",
                      }}
                    >
                      {emoji} {pillarName}
                    </div>
                  )}
                </div>

                {isLast && (
                  <div
                    className="adv-marker"
                    style={{
                      left: `${node.xPct}%`,
                      top: node.y + ACTIVE_SIZE / 2 + 20,
                    }}
                  >
                    {"\u{1F3C6}"} FINISH
                  </div>
                )}
              </Fragment>
            );
          })}

          {/* Character */}
          {curNode && (
            <div
              className="adv-char"
              ref={charRef}
              style={
                isRunning
                  ? { transition: "none" }
                  : {
                      left: `${curNode.xPct}%`,
                      top:
                        curNode.y -
                        ACTIVE_SIZE / 2 -
                        10 -
                        CHAR_SIZE,
                      transition:
                        "left 600ms cubic-bezier(0.34,1.56,0.64,1), top 600ms cubic-bezier(0.34,1.56,0.64,1)",
                    }
              }
            >
              {isRunning && character.runVideo ? (
                <ChromaVideo src={character.runVideo} size={90} />
              ) : (
                <div className={isJumping ? "adv-hop" : "adv-float"}>
                  <img
                    src={avatarImage}
                    alt={character.name}
                    className="adv-char-img"
                    style={{
                      borderColor: color,
                      boxShadow: `0 4px 20px ${color}35`,
                    }}
                  />
                </div>
              )}
              {!isRunning && (
                <div
                  className={`adv-shadow ${isJumping ? "adv-shadow-sm" : ""}`}
                  style={{
                    background: `radial-gradient(ellipse, ${color}25 0%, transparent 70%)`,
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="adv-bottom">
        {isRunning ? (
          <div className="adv-run-label" style={{ color }}>
            <span className="adv-run-dot" style={{ background: color }} />
            Running to Question {current + 1}...
          </div>
        ) : (
          <button
            className="adv-cta"
            onClick={onOpenQuestion}
            style={{
              background: `linear-gradient(135deg, ${color}, ${accent})`,
              boxShadow: `0 6px 28px ${color}40`,
            }}
          >
            {completed === 0 && current === 0
              ? "Start First Question"
              : `Answer Question ${current + 1}`}
            <ArrowRight size={18} />
          </button>
        )}
      </div>

      <style>{advCSS}</style>
    </div>
  );
}

const advCSS = `
/* ── Root ── */
.adv-root {
  height: 100vh; height: 100dvh;
  display: flex; flex-direction: column;
  font-family: 'Nunito', sans-serif;
  background: #FBF8F4;
  animation: advIn 0.45s ease-out;
}

/* ── Header (keeps character gradient) ── */
.adv-header {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #E8E0D8;
  flex-shrink: 0; z-index: 10;
}
.adv-hdr-avi {
  width: 36px; height: 36px;
  border-radius: 12px; border: 2px solid;
  object-fit: cover; flex-shrink: 0;
}
.adv-hdr-info { flex: 1; min-width: 0; }
.adv-hdr-title {
  font-size: 15px; font-weight: 800; color: #fff;
  text-shadow: 0 1px 4px rgba(0,0,0,0.15);
}
.adv-hdr-sub { font-size: 11px; color: rgba(255,255,255,0.65); font-weight: 500; }
.adv-hdr-badge {
  padding: 4px 12px; border-radius: 12px;
  font-size: 13px; font-weight: 800; flex-shrink: 0;
}

/* ── Scroll area ── */
.adv-scroll {
  flex: 1; overflow-y: auto; overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  background: #FBF8F4;
}
.adv-scroll::-webkit-scrollbar { display: none; }

/* ── Map canvas ── */
.adv-map { position: relative; width: 100%; min-height: 100%; will-change: transform; }

.adv-map-glow {
  position: absolute; top: 0; left: 0; right: 0;
  height: 300px; pointer-events: none;
}

.adv-svg {
  position: absolute; top: 0; left: 0;
  width: 100%; pointer-events: none;
}
.adv-path-seg { transition: stroke 400ms, stroke-width 400ms; }

/* ── Sparkles ── */
.adv-sparkle {
  position: absolute; border-radius: 50%;
  opacity: 0.12; pointer-events: none;
  animation: advSparkle 4s ease-in-out infinite;
}

/* ── Start / Finish markers ── */
.adv-marker {
  position: absolute; transform: translateX(-50%);
  font-size: 10px; font-weight: 900; letter-spacing: 3px;
  color: #C8C0B8; text-transform: uppercase;
  pointer-events: none; white-space: nowrap;
}

/* ── Node positioning wrapper ── */
.adv-node-pos {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex; flex-direction: column;
  align-items: center;
}

/* ── Node circle ── */
.adv-node {
  border-radius: 50%; border: 3px solid;
  display: flex; align-items: center; justify-content: center;
  transition: all 300ms ease; flex-shrink: 0;
  will-change: transform;
}
.adv-node-active {
  cursor: pointer;
  animation: advPulse 2s ease-in-out infinite;
}
.adv-node-active:active { transform: scale(0.94); }

/* ── Node icons ── */
.adv-nicon { line-height: 1; }
.adv-nicon-done { font-size: 20px; }
.adv-nicon-curr { font-size: 24px; }
.adv-nicon-lock { font-size: 18px; opacity: 0.4; }

/* ── Tap hint ── */
.adv-tap {
  margin-top: 6px; font-size: 10px; font-weight: 700;
  white-space: nowrap; letter-spacing: 0.5px;
  animation: advBlink 2s ease-in-out infinite;
}

/* ── Labels ── */
.adv-label {
  position: absolute; transform: translateY(-50%);
  pointer-events: none; transition: opacity 300ms;
}
.adv-label-right { text-align: left; }
.adv-label-left { text-align: right; }

.adv-label-num {
  font-size: 13px; font-weight: 800; white-space: nowrap;
  font-family: 'Nunito', sans-serif;
}
.adv-label-pill {
  font-size: 11px; font-weight: 600; white-space: nowrap;
  margin-top: 2px; font-family: 'Nunito', sans-serif;
}

/* ── Character ── */
.adv-char {
  position: absolute; transform: translateX(-50%);
  z-index: 5; pointer-events: none;
  display: flex; flex-direction: column; align-items: center;
}
.adv-char-img {
  width: 56px; height: 56px;
  border-radius: 50%; border: 3px solid;
  background: #fff; object-fit: cover; display: block;
  will-change: transform;
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}
.adv-run-canvas {
  display: block;
  pointer-events: none;
  filter: drop-shadow(0 4px 10px rgba(0,0,0,0.18));
}
.adv-shadow {
  width: 34px; height: 10px;
  border-radius: 50%; margin: 4px auto 0;
  transition: all 300ms;
}
.adv-shadow-sm { width: 18px; height: 6px; opacity: 0.4; }

.adv-float { animation: advFloat 2.5s ease-in-out infinite; }
.adv-hop { animation: advJump 600ms cubic-bezier(0.22, 0.68, 0.31, 1.2); }

/* ── Bottom CTA ── */
.adv-bottom {
  flex-shrink: 0; z-index: 10;
  padding: 12px 20px;
  padding-bottom: max(24px, env(safe-area-inset-bottom, 24px));
  background: rgba(251,248,244,0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid #E8E0D8;
  display: flex; justify-content: center;
  min-height: 60px; align-items: center;
}
.adv-cta {
  display: flex; align-items: center; gap: 8px;
  padding: 14px 32px; border-radius: 28px; border: none;
  color: #fff; font-size: 16px; font-weight: 800;
  cursor: pointer; font-family: 'Nunito', sans-serif;
  transition: transform 150ms, box-shadow 150ms;
}
.adv-cta:hover { transform: scale(1.03); }
.adv-cta:active { transform: scale(0.97); }

/* ── Running label ── */
.adv-run-label {
  font-size: 15px; font-weight: 800;
  font-family: 'Nunito', sans-serif;
  display: flex; align-items: center; gap: 10px;
  animation: advRunPulse 1.2s ease-in-out infinite;
}
.adv-run-dot {
  width: 8px; height: 8px; border-radius: 50%;
  animation: advRunDot 0.6s ease-in-out infinite alternate;
}

/* ── Animations ── */
@keyframes advIn {
  from { opacity: 0; transform: scale(0.97); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes advFloat {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-8px); }
}
@keyframes advJump {
  0%   { transform: translateY(0) scale(1); }
  20%  { transform: translateY(-24px) scale(1.1); }
  40%  { transform: translateY(-36px) scale(1.15) rotate(8deg); }
  60%  { transform: translateY(-16px) scale(1.08) rotate(-4deg); }
  85%  { transform: translateY(5px) scaleY(0.88) scaleX(1.12); }
  100% { transform: translateY(0) scale(1); }
}
@keyframes advPulse {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.07); }
}
@keyframes advSparkle {
  0%, 100% { opacity: 0; transform: scale(0.5); }
  50%      { opacity: 1; transform: scale(1.3); }
}
@keyframes advBlink {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.3; }
}
@keyframes advRunPulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.5; }
}
@keyframes advRunDot {
  from { transform: scale(1); }
  to   { transform: scale(1.5); }
}

/* ── Desktop ── */
@media (min-width: 640px) {
  .adv-header { padding: 14px 24px; gap: 14px; }
  .adv-hdr-avi { width: 44px; height: 44px; border-radius: 14px; }
  .adv-hdr-title { font-size: 18px; }
  .adv-hdr-sub { font-size: 12px; }
  .adv-hdr-badge { font-size: 14px; padding: 5px 14px; }
  .adv-bottom { padding: 16px 24px; padding-bottom: max(28px, env(safe-area-inset-bottom, 28px)); }
  .adv-cta { padding: 16px 40px; font-size: 18px; border-radius: 32px; }
  .adv-char-img { width: 64px; height: 64px; }
  .adv-run-canvas { filter: drop-shadow(0 6px 14px rgba(0,0,0,0.2)); }
  .adv-label-num { font-size: 15px; }
  .adv-label-pill { font-size: 12px; }
  .adv-nicon-curr { font-size: 28px; }
  .adv-nicon-done { font-size: 22px; }
}
`;
