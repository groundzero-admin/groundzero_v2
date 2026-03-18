import type { CSSProperties } from "react";

const P: CSSProperties = {
  borderRadius: 12,
  padding: 20,
  fontFamily: "inherit",
  fontSize: 13,
  lineHeight: 1.6,
  background: "linear-gradient(135deg, #fafbfc 0%, #f0f2f5 100%)",
  border: "1px solid #e2e8f0",
  position: "relative",
  overflow: "hidden",
};
const Q: CSSProperties = { fontWeight: 600, fontSize: 14, marginBottom: 12, color: "#1a202c" };
const OPT: CSSProperties = {
  padding: "8px 14px", borderRadius: 8, border: "1px solid #e2e8f0",
  background: "#fff", marginBottom: 6, display: "flex", alignItems: "center", gap: 8,
};
const OPT_CORRECT: CSSProperties = { ...OPT, border: "2px solid #38A169", background: "#F0FFF4" };
const RADIO: CSSProperties = {
  width: 16, height: 16, borderRadius: "50%", border: "2px solid #CBD5E0",
  flexShrink: 0,
};
const RADIO_FILL: CSSProperties = { ...RADIO, border: "2px solid #38A169", background: "#38A169" };
const BLANK: CSSProperties = {
  display: "inline-block", borderBottom: "2px dashed #805AD5", minWidth: 80,
  padding: "2px 6px", margin: "0 4px", color: "#805AD5", fontWeight: 600,
};
const TAG: CSSProperties = {
  display: "inline-block", padding: "5px 12px", borderRadius: 20, fontSize: 12,
  fontWeight: 600, cursor: "grab", border: "1px dashed #a0aec0", background: "#fff",
};
const ZONE: CSSProperties = {
  border: "2px dashed #CBD5E0", borderRadius: 8, padding: "10px 14px",
  minHeight: 40, display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: 12, color: "#a0aec0",
};
const ZONE_FILLED: CSSProperties = {
  ...ZONE, border: "2px solid #38A169", background: "#F0FFF4", color: "#276749",
};
const BTN: CSSProperties = {
  padding: "8px 20px", borderRadius: 8, fontWeight: 600, fontSize: 13,
  background: "#805AD5", color: "#fff", border: "none", cursor: "default",
};
const SLIDER_TRACK: CSSProperties = {
  height: 6, borderRadius: 3, background: "#E2E8F0", position: "relative",
};
const SLIDER_FILL: CSSProperties = {
  position: "absolute", left: 0, top: 0, height: 6, borderRadius: 3,
  background: "linear-gradient(90deg, #805AD5, #B794F4)", width: "60%",
};
const SLIDER_THUMB: CSSProperties = {
  position: "absolute", top: -5, left: "58%", width: 16, height: 16,
  borderRadius: "50%", background: "#805AD5", border: "2px solid #fff",
  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
};
const BUBBLE: CSSProperties = {
  padding: "8px 14px", borderRadius: "12px 12px 12px 4px", background: "#EDF2F7",
  maxWidth: "80%", fontSize: 12,
};
const BUBBLE_USER: CSSProperties = {
  ...BUBBLE, background: "#805AD5", color: "#fff", borderRadius: "12px 12px 4px 12px",
  marginLeft: "auto",
};
const LIKERT: CSSProperties = {
  width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center",
  justifyContent: "center", fontSize: 18, cursor: "default", border: "2px solid #E2E8F0",
  background: "#fff", transition: "all 0.15s",
};
const LIKERT_ACTIVE: CSSProperties = {
  ...LIKERT, border: "2px solid #ECC94B", background: "#FEFCBF", transform: "scale(1.15)",
};

export default function TemplatePreview({ slug }: { slug: string }) {
  switch (slug) {
    case "fill_blanks":
      return (
        <div style={P}>
          <div style={Q}>Fill in the missing words:</div>
          <p>
            If it rains, <span style={BLANK}>then</span> the ground gets
            <span style={BLANK}>wet</span> and plants will
            <span style={BLANK}>grow</span>.
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {["then", "grow", "wet", "run", "cold"].map((w, i) => (
              <span key={i} style={{ ...TAG, background: i < 3 ? "#F0FFF4" : "#fff", borderColor: i < 3 ? "#38A169" : "#a0aec0" }}>{w}</span>
            ))}
          </div>
        </div>
      );

    case "drag_drop_placement":
      return (
        <div style={P}>
          <div style={Q}>Drag each step into the correct position:</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            {["Start", "Check condition", "Yes branch", "No branch", "End"].map((w, i) => (
              <span key={i} style={TAG}>{w}</span>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={ZONE_FILLED}>1. Start</div>
            <div style={{ textAlign: "center", color: "#a0aec0", fontSize: 18 }}>{"\u2193"}</div>
            <div style={ZONE_FILLED}>2. Check condition</div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ ...ZONE, flex: 1 }}>{"Yes \u2192 ?"}</div>
              <div style={{ ...ZONE, flex: 1 }}>{"No \u2192 ?"}</div>
            </div>
          </div>
        </div>
      );

    case "drag_drop_classifier":
      return (
        <div style={P}>
          <div style={Q}>Sort these into the correct categories:</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            {["Square", "Haiku", "Triangle", "Sonnet", "Circle"].map((w, i) => (
              <span key={i} style={TAG}>{w}</span>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 6, color: "#805AD5" }}>Shapes</div>
              <div style={ZONE_FILLED}>Square</div>
              <div style={{ ...ZONE, marginTop: 6 }}>Drop here</div>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 6, color: "#E53E3E" }}>Poetry</div>
              <div style={ZONE_FILLED}>Haiku</div>
              <div style={{ ...ZONE, marginTop: 6 }}>Drop here</div>
            </div>
          </div>
        </div>
      );

    case "label_elements":
      return (
        <div style={P}>
          <div style={Q}>Label the parts of this flowchart:</div>
          <div style={{ position: "relative", background: "#fff", borderRadius: 8, padding: 16, border: "1px solid #e2e8f0", minHeight: 120 }}>
            <div style={{ display: "flex", justifyContent: "center", gap: 20, alignItems: "center" }}>
              <div style={{ width: 70, height: 50, borderRadius: 8, border: "2px solid #805AD5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>
                <span style={{ background: "#FAF5FF", padding: "2px 8px", borderRadius: 4, fontWeight: 600, color: "#805AD5", fontSize: 10 }}>Start</span>
              </div>
              <span style={{ color: "#a0aec0" }}>{"\u2192"}</span>
              <div style={{ width: 70, height: 50, transform: "rotate(45deg)", border: "2px solid #DD6B20", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ transform: "rotate(-45deg)", background: "#FFFAF0", padding: "2px 6px", borderRadius: 4, fontWeight: 600, color: "#DD6B20", fontSize: 10 }}>?</span>
              </div>
              <span style={{ color: "#a0aec0" }}>{"\u2192"}</span>
              <div style={{ width: 70, height: 50, borderRadius: 8, border: "2px dashed #a0aec0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#a0aec0" }}>?</div>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 14, justifyContent: "center" }}>
              {["Decision", "Process", "End"].map((l, i) => (
                <span key={i} style={{ ...TAG, fontSize: 11 }}>{l}</span>
              ))}
            </div>
          </div>
        </div>
      );

    case "mcq_single":
      return (
        <div style={P}>
          <div style={Q}>What does AI stand for?</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={OPT}><span style={RADIO} /> Automated Internet</div>
            <div style={OPT_CORRECT}><span style={RADIO_FILL} /> Artificial Intelligence</div>
            <div style={OPT}><span style={RADIO} /> Advanced Integration</div>
            <div style={OPT}><span style={RADIO} /> Analog Input</div>
          </div>
          <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, background: "#F0FFF4", fontSize: 12, color: "#276749", border: "1px solid #C6F6D5" }}>
            Correct! AI stands for Artificial Intelligence.
          </div>
        </div>
      );

    case "mcq_timed":
      return (
        <div style={P}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={Q}>What is 15 x 12?</div>
            <div style={{ background: "#FED7D7", color: "#C53030", padding: "4px 12px", borderRadius: 20, fontWeight: 700, fontSize: 13 }}>
              0:08
            </div>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: "#FED7D7", marginBottom: 14 }}>
            <div style={{ height: 4, borderRadius: 2, background: "#E53E3E", width: "35%", transition: "width 1s" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <div style={OPT}>150</div>
            <div style={OPT_CORRECT}>180</div>
            <div style={OPT}>170</div>
            <div style={OPT}>200</div>
          </div>
        </div>
      );

    case "short_answer":
      return (
        <div style={P}>
          <div style={Q}>Describe what happens when ice melts. Use at least 2 sentences.</div>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 12, minHeight: 70, color: "#718096", fontSize: 12 }}>
            <span style={{ color: "#2D3748" }}>When ice melts, it changes from a solid to a liquid state. The molecules gain energy and move apart...</span>
            <span style={{ borderLeft: "2px solid #805AD5", marginLeft: 2 }}>&nbsp;</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "#a0aec0" }}>
            <span>18 / 50 words</span>
            <button style={BTN}>Submit</button>
          </div>
        </div>
      );

    case "image_response":
      return (
        <div style={P}>
          <div style={Q}>What do you see in this image? Describe the pattern.</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ background: "linear-gradient(135deg, #EBF4FF, #C3DAFE, #A3BFFA)", borderRadius: 8, height: 100, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, border: "1px solid #e2e8f0" }}>
              {"\uD83D\uDD37\uD83D\uDD36\uD83D\uDD37\uD83D\uDD36"}
            </div>
            <div>
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 10, minHeight: 80, color: "#718096", fontSize: 12 }}>
                I see an alternating pattern of blue and orange diamonds...
              </div>
              <button style={{ ...BTN, marginTop: 8, width: "100%" }}>Submit</button>
            </div>
          </div>
        </div>
      );

    case "audio_response":
      return (
        <div style={P}>
          <div style={Q}>Listen carefully, then answer from memory:</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: "#fff", borderRadius: 8, border: "1px solid #e2e8f0", marginBottom: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#805AD5", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16 }}>{"\u25B6"}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 2 }}>
                {Array.from({ length: 30 }).map((_, i) => (
                  <div key={i} style={{ width: 3, height: 6 + Math.sin(i * 0.5) * 10, background: i < 18 ? "#805AD5" : "#CBD5E0", borderRadius: 2 }} />
                ))}
              </div>
              <div style={{ fontSize: 11, color: "#a0aec0", marginTop: 4 }}>0:18 / 0:32</div>
            </div>
            <div style={{ fontSize: 11, color: "#E53E3E", fontWeight: 600 }}>1 play left</div>
          </div>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 10, color: "#718096", fontSize: 12, minHeight: 50 }}>Type what you remember...</div>
        </div>
      );

    case "multi_step":
      return (
        <div style={P}>
          <div style={Q}>Multi-step: Critique & Feedback</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {["Step 1", "Step 2", "Step 3"].map((label, i) => (
              <div key={i} style={{ flex: 1, padding: "6px 0", textAlign: "center", fontSize: 11, fontWeight: 600, borderRadius: 6, background: i === 0 ? "#805AD5" : "#E2E8F0", color: i === 0 ? "#fff" : "#718096" }}>
                {label}: {i === 0 ? "MCQ" : i === 1 ? "Classify" : "Explain"}
              </div>
            ))}
          </div>
          <div style={{ border: "2px solid #805AD5", borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#805AD5", marginBottom: 8 }}>Step 1: Choose the best feedback</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={OPT_CORRECT}><span style={RADIO_FILL} /> "Great start, try adding more detail"</div>
              <div style={OPT}><span style={RADIO} /> "This is wrong"</div>
            </div>
          </div>
        </div>
      );

    case "slider_input":
      return (
        <div style={P}>
          <div style={Q}>What angle does this shape make? Move the slider.</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 0" }}>
            <span style={{ fontSize: 12, color: "#718096", minWidth: 24 }}>{`0\u00B0`}</span>
            <div style={{ flex: 1, ...SLIDER_TRACK }}>
              <div style={SLIDER_FILL} />
              <div style={SLIDER_THUMB} />
            </div>
            <span style={{ fontSize: 12, color: "#718096", minWidth: 30 }}>{`180\u00B0`}</span>
          </div>
          <div style={{ textAlign: "center", fontSize: 28, fontWeight: 700, color: "#805AD5" }}>{`108\u00B0`}</div>
          <div style={{ textAlign: "center" }}>
            <button style={BTN}>Check Answer</button>
          </div>
        </div>
      );

    case "debate_opinion":
      return (
        <div style={P}>
          <div style={Q}>Should AI be allowed to grade student work?</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {[{ label: "For", color: "#38A169", bg: "#F0FFF4" }, { label: "Against", color: "#E53E3E", bg: "#FFF5F5" }, { label: "Neutral", color: "#718096", bg: "#F7FAFC" }].map((stance) => (
              <div key={stance.label} style={{ flex: 1, padding: "10px 0", textAlign: "center", borderRadius: 8, border: `2px solid ${stance.color}`, background: stance.bg, fontWeight: 600, fontSize: 12, color: stance.color, cursor: "default" }}>
                {stance.label}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={BUBBLE}>{"\uD83E\uDD16"} Spark: Interesting! But what about bias in AI grading?</div>
            <div style={BUBBLE_USER}>I think AI can be fair if trained on diverse examples...</div>
            <div style={BUBBLE}>{"\uD83E\uDD16"} Spark: Good point! How would you verify fairness?</div>
          </div>
        </div>
      );

    case "ai_conversation":
      return (
        <div style={P}>
          <div style={Q}>Talk to Spark about your project idea</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
            <div style={BUBBLE}>{"\uD83E\uDD16"} Hi! I'm Spark. Tell me about your project idea and I'll help you refine it!</div>
            <div style={BUBBLE_USER}>I want to build an app that helps kids learn math through games</div>
            <div style={BUBBLE}>{"\uD83E\uDD16"} That's exciting! What age group are you targeting? And what kind of math concepts?</div>
            <div style={BUBBLE_USER}>Ages 8-10, focusing on fractions and decimals</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ flex: 1, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: "8px 14px", fontSize: 12, color: "#a0aec0" }}>Type your message...</div>
            <div style={{ ...BTN, borderRadius: 20, padding: "8px 16px" }}>Send</div>
          </div>
        </div>
      );

    case "draw_scribble":
      return (
        <div style={P}>
          <div style={Q}>Draw a flowchart for making a sandwich:</div>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 8, position: "relative", height: 120 }}>
            <svg width="100%" height="100%" viewBox="0 0 300 100" style={{ opacity: 0.7 }}>
              <rect x="10" y="35" width="60" height="30" rx="4" fill="none" stroke="#805AD5" strokeWidth="2" />
              <text x="40" y="55" textAnchor="middle" fontSize="9" fill="#805AD5">Start</text>
              <line x1="70" y1="50" x2="100" y2="50" stroke="#805AD5" strokeWidth="2" />
              <rect x="100" y="35" width="70" height="30" rx="4" fill="none" stroke="#3182CE" strokeWidth="2" />
              <text x="135" y="55" textAnchor="middle" fontSize="9" fill="#3182CE">Get bread</text>
              <line x1="170" y1="50" x2="200" y2="50" stroke="#3182CE" strokeWidth="2" />
              <rect x="200" y="35" width="80" height="30" rx="4" fill="none" stroke="#38A169" strokeWidth="2" strokeDasharray="4" />
              <text x="240" y="55" textAnchor="middle" fontSize="9" fill="#a0aec0">Next step?</text>
            </svg>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8, justifyContent: "center" }}>
            {["Pen", "Eraser", "Undo", "Color"].map((tool) => (
              <div key={tool} style={{ padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: tool === "Pen" ? "#805AD5" : "#EDF2F7", color: tool === "Pen" ? "#fff" : "#4A5568", cursor: "default" }}>{tool}</div>
            ))}
          </div>
        </div>
      );

    case "reflection_rating":
      return (
        <div style={P}>
          <div style={Q}>How confident do you feel about today's lesson?</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 12, margin: "16px 0" }}>
            {["\uD83D\uDE1F", "\uD83D\uDE10", "\uD83D\uDE42", "\uD83D\uDE0A", "\uD83E\uDD29"].map((emoji, i) => (
              <div key={i} style={i === 3 ? LIKERT_ACTIVE : LIKERT}>{emoji}</div>
            ))}
          </div>
          <div style={{ textAlign: "center", fontSize: 12, color: "#38A169", fontWeight: 600, marginBottom: 12 }}>Pretty confident!</div>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 10, color: "#718096", fontSize: 12 }}>
            What helped you learn today? (optional)
          </div>
        </div>
      );

    case "geometry_animated":
      return (
        <div style={P}>
          <style>{`
            @keyframes gz-sweep {
              from { stroke-dashoffset: 100; }
              to   { stroke-dashoffset: 0; }
            }
            @keyframes gz-pulse-angle {
              0%, 100% { opacity: 1; transform: scale(1); }
              50%       { opacity: 0.6; transform: scale(1.08); }
            }
            @keyframes gz-draw-side {
              from { stroke-dashoffset: 200; }
              to   { stroke-dashoffset: 0; }
            }
            .gz-angle-arc { animation: gz-sweep 1.6s ease-out forwards; stroke-dasharray: 100; }
            .gz-label     { animation: gz-pulse-angle 1.8s ease-in-out infinite; transform-origin: center; }
            .gz-side      { stroke-dasharray: 200; animation: gz-draw-side 1.2s ease-out forwards; }
            .gz-side-2    { animation-delay: 0.4s; }
            .gz-side-3    { animation-delay: 0.8s; }
          `}</style>
          <div style={Q}>What type of angle is marked x?</div>
          <div style={{ display: "flex", justifyContent: "center", margin: "8px 0 14px" }}>
            <svg width="200" height="160" viewBox="0 0 200 160">
              {/* Triangle sides drawn in sequence */}
              <line className="gz-side" x1="20" y1="130" x2="180" y2="130" stroke="#3182CE" strokeWidth="2.5" strokeLinecap="round" />
              <line className="gz-side gz-side-2" x1="20" y1="130" x2="100" y2="30" stroke="#3182CE" strokeWidth="2.5" strokeLinecap="round" />
              <line className="gz-side gz-side-3" x1="100" y1="30" x2="180" y2="130" stroke="#3182CE" strokeWidth="2.5" strokeLinecap="round" />
              {/* Animated angle arc at bottom-left vertex */}
              <path
                className="gz-angle-arc"
                d="M 50,130 A 30,30 0 0,1 29,107"
                fill="none" stroke="#805AD5" strokeWidth="2.5" strokeLinecap="round"
              />
              {/* Angle label */}
              <text className="gz-label" x="46" y="118" fontSize="13" fontWeight="700" fill="#805AD5">x</text>
              {/* Vertex dots */}
              {[[20,130],[180,130],[100,30]].map(([cx,cy],i) => (
                <circle key={i} cx={cx} cy={cy} r="3.5" fill="#3182CE" />
              ))}
              {/* Right-angle box at bottom-right */}
              <polyline points="168,130 168,118 180,118" fill="none" stroke="#718096" strokeWidth="1.5" />
            </svg>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <div style={OPT}><span style={RADIO} /> Acute</div>
            <div style={OPT_CORRECT}><span style={RADIO_FILL} /> Obtuse</div>
            <div style={OPT}><span style={RADIO} /> Right</div>
            <div style={OPT}><span style={RADIO} /> Reflex</div>
          </div>
          <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, background: "#F0FFF4", fontSize: 12, color: "#276749", border: "1px solid #C6F6D5" }}>
            Correct! x is an obtuse angle (greater than 90°).
          </div>
        </div>
      );

    default:
      return (
        <div style={{ ...P, textAlign: "center" as const, color: "#a0aec0" }}>
          Preview not available for this template type.
        </div>
      );
  }
}
