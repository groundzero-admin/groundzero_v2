import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import BenchmarkRadar, { PILLAR_LABELS, PILLAR_COLORS } from "../components/BenchmarkRadar";
import { CHARACTERS } from "../constants/characters";
import benchmarkApi from "../api";
import { ArrowLeft, Printer, Plus, History, CheckCircle2 } from "lucide-react";

const CAPABILITY_NAMES: Record<string, string> = {
  A: "Listening & Comprehension", B: "Constructing Arguments",
  C: "Adaptive Communication", D: "Dialogue & Debate",
  E: "Idea Generation", F: "Creative Depth",
  G: "Curiosity Drive", H: "Creative Application",
  I: "AI Understanding", J: "AI Fluency",
  K: "Systems Thinking", L: "Builder Mindset",
  M: "Logical Reasoning", N: "Probabilistic Reasoning",
  O: "Abstract & Strategic Reasoning", P: "Math Foundations",
};

const CAPABILITY_TO_PILLAR: Record<string, string> = {
  A: "communication", B: "communication", C: "communication", D: "communication",
  E: "creativity", F: "creativity", G: "creativity", H: "creativity",
  I: "ai_systems", J: "ai_systems", K: "ai_systems", L: "ai_systems",
  M: "math_logic", N: "math_logic", O: "math_logic", P: "math_logic",
};

const STAGE_LABELS = ["", "Novice", "Emerging", "Developing", "Proficient", "Mastered"];
const STAGE_COLORS = ["", "#E53E3E", "#ED8936", "#ECC94B", "#38A169", "#3182CE"];

export default function BenchmarkReportPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [benchmark, setBenchmark] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBenchmark = useCallback(async () => {
    try {
      const { data, status } = await benchmarkApi.getResult(sessionId!);
      if (status === 202 || data.status === "pending") return "pending";
      if (status >= 400) { setError("Benchmark generation failed."); setLoading(false); return "failed"; }
      setBenchmark(data);
      setLoading(false);
      return "done";
    } catch {
      return "pending";
    }
  }, [sessionId]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    let attempts = 0;
    const start = async () => {
      const result = await fetchBenchmark();
      if (result === "pending") {
        interval = setInterval(async () => {
          attempts++;
          if (attempts >= 60) { clearInterval(interval); setError("Taking too long. Try again later."); setLoading(false); return; }
          const res = await fetchBenchmark();
          if (res !== "pending") clearInterval(interval);
        }, 2000);
      }
    };
    start();
    return () => clearInterval(interval);
  }, [fetchBenchmark]);

  if (error) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, padding: 48 }}>
        <p style={{ color: "#E53E3E", fontWeight: 600, marginBottom: 8 }}>{error}</p>
        <button onClick={() => navigate("/benchmark")} style={{ padding: "8px 20px", borderRadius: 8, border: "none", backgroundColor: "#805AD5", color: "#fff", cursor: "pointer", fontWeight: 600 }}>
          New Session
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, padding: 48 }}>
        <div style={{ width: 32, height: 32, border: "3px solid #E8E0D8", borderTopColor: "#805AD5", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <p style={{ color: "#7A7168", marginTop: 16, fontSize: 14 }}>Analyzing assessment data...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const pillarStages = benchmark.pillar_stages || {};
  const capStages = benchmark.capability_stages || {};
  const capEvidence = benchmark.capability_evidence || {};
  const insights = benchmark.insights || {};
  const char = CHARACTERS.find((c) => c.id === benchmark.character) || CHARACTERS[0];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FAF7F4" }}>
      {/* Header */}
      <div style={{ backgroundColor: "#fff", borderBottom: "1px solid #E8E0D8", padding: "12px 24px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => navigate("/home")} style={{ display: "flex", alignItems: "center", gap: 6, backgroundColor: "transparent", border: "none", cursor: "pointer", color: "#7A7168", fontSize: 13 }}>
            <ArrowLeft size={16} /> Back
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#26221D", fontFamily: "'Nunito', sans-serif" }}>Assessment Report</span>
            {benchmark.bkt_seeded === "done" && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, color: "#38A169", backgroundColor: "#C6F6D520", padding: "2px 8px", borderRadius: 6 }}>
                <CheckCircle2 size={10} /> BKT Updated
              </span>
            )}
          </div>
          <button onClick={() => window.print()} style={{ display: "flex", alignItems: "center", gap: 6, backgroundColor: "transparent", border: "1px solid #E8E0D8", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: "#7A7168", fontSize: 12 }}>
            <Printer size={14} /> Export
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 24px 48px" }}>
        {/* Student info card */}
        <div style={{ backgroundColor: "#fff", border: "1px solid #E8E0D8", borderRadius: 16, padding: 24, marginBottom: 20, display: "flex", alignItems: "center", gap: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <img src={char.image} alt={char.name} style={{ width: 48, height: 48, borderRadius: 12, objectFit: "cover" }} />
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#26221D", fontFamily: "'Nunito', sans-serif" }}>{benchmark.student_name}</div>
            <div style={{ fontSize: 13, color: "#A89E94" }}>
              Grade {benchmark.student_grade} &middot; {char.name} &middot; {benchmark.total_turns} turns
            </div>
          </div>
        </div>

        {/* Pillar stages - 4 cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
          {Object.entries(PILLAR_LABELS).map(([key, label]) => {
            const stage = pillarStages[key] || 1;
            const color = PILLAR_COLORS[key];
            return (
              <div key={key} style={{ backgroundColor: "#fff", border: "1px solid #E8E0D8", borderRadius: 14, padding: 20, textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <div style={{ fontSize: 28, fontWeight: 800, color, marginBottom: 4 }}>{stage}</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: STAGE_COLORS[stage], textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                  {STAGE_LABELS[stage]}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#5A524A" }}>{label}</div>
                {/* Stage bar */}
                <div style={{ display: "flex", gap: 3, marginTop: 10, justifyContent: "center" }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <div key={s} style={{ width: 16, height: 4, borderRadius: 2, backgroundColor: s <= stage ? color : "#E8E0D8" }} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Radar */}
        <div style={{ backgroundColor: "#fff", border: "1px solid #E8E0D8", borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#26221D", marginBottom: 16, fontFamily: "'Nunito', sans-serif" }}>Pillar Overview</div>
          <BenchmarkRadar pillarStages={pillarStages} characterColor={char.color} />
        </div>

        {/* Capability breakdown by pillar */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#26221D", marginBottom: 12, fontFamily: "'Nunito', sans-serif" }}>Capability Breakdown</div>
          {Object.entries(PILLAR_LABELS).map(([pillarKey, pillarLabel]) => {
            const caps = Object.entries(CAPABILITY_TO_PILLAR).filter(([, p]) => p === pillarKey).map(([c]) => c);
            const color = PILLAR_COLORS[pillarKey];
            return (
              <div key={pillarKey} style={{ backgroundColor: "#fff", border: "1px solid #E8E0D8", borderRadius: 14, padding: 20, marginBottom: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: color }} />
                  {pillarLabel}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {caps.map((capId) => {
                    const stage = capStages[capId];
                    const evidence = capEvidence[capId];
                    if (stage == null) return (
                      <div key={capId} style={{ display: "flex", alignItems: "center", gap: 12, opacity: 0.4 }}>
                        <div style={{ width: 28, fontSize: 11, fontWeight: 600, color: "#A89E94" }}>{capId}</div>
                        <div style={{ flex: 1, fontSize: 12, color: "#A89E94" }}>{CAPABILITY_NAMES[capId]}</div>
                        <span style={{ fontSize: 10, color: "#D4C9BD" }}>Not observed</span>
                      </div>
                    );
                    return (
                      <div key={capId}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 28, fontSize: 11, fontWeight: 700, color }}>{capId}</div>
                          <div style={{ flex: 1, fontSize: 12, fontWeight: 500, color: "#3D3730" }}>{CAPABILITY_NAMES[capId]}</div>
                          <span style={{ fontSize: 11, fontWeight: 600, color: STAGE_COLORS[stage], padding: "2px 8px", borderRadius: 6, backgroundColor: STAGE_COLORS[stage] + "15" }}>
                            {STAGE_LABELS[stage]}
                          </span>
                          <div style={{ display: "flex", gap: 2 }}>
                            {[1, 2, 3, 4, 5].map((s) => (
                              <div key={s} style={{ width: 10, height: 4, borderRadius: 2, backgroundColor: s <= stage ? color : "#E8E0D8" }} />
                            ))}
                          </div>
                        </div>
                        {evidence && (
                          <div style={{ marginLeft: 40, marginTop: 4, fontSize: 11, color: "#7A7168", fontStyle: "italic", lineHeight: 1.5 }}>
                            {evidence}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Insights */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { title: "Strengths", items: insights.strongest_areas, bg: "#C6F6D5", color: "#38A169" },
            { title: "Growth Areas", items: insights.growth_areas, bg: "#FEEBC8", color: "#ED8936" },
            { title: "Interests", items: insights.dominant_interests, bg: "#BEE3F8", color: "#3182CE" },
          ].map((section) => (
            <div key={section.title} style={{ backgroundColor: "#fff", border: "1px solid #E8E0D8", borderRadius: 14, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#26221D", marginBottom: 12, fontFamily: "'Nunito', sans-serif" }}>{section.title}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {(section.items || []).map((item: string, i: number) => (
                  <span key={i} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 999, backgroundColor: section.bg, color: section.color, fontWeight: 500 }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Observations */}
        {insights.notable_observations?.length > 0 && (
          <div style={{ backgroundColor: "#fff", border: "1px solid #E8E0D8", borderRadius: 14, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#26221D", marginBottom: 12, fontFamily: "'Nunito', sans-serif" }}>Notable Observations</div>
            <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              {insights.notable_observations.map((obs: string, i: number) => (
                <li key={i} style={{ fontSize: 13, color: "#5A524A", lineHeight: 1.6 }}>{obs}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Summary */}
        <div style={{ backgroundColor: "#805AD508", border: "1px solid #805AD520", borderRadius: 14, padding: 24, marginBottom: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#26221D", marginBottom: 4, fontFamily: "'Nunito', sans-serif" }}>Assessment Summary</div>
          <div style={{ fontSize: 11, color: "#A89E94", marginBottom: 16 }}>AI-powered diagnostic assessment across 4 pillars</div>
          {benchmark.summary?.split("\n").map((p: string, i: number) => (
            <p key={i} style={{ fontSize: 14, color: "#5A524A", lineHeight: 1.7, marginBottom: 8 }}>{p}</p>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button onClick={() => window.print()} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 20px", borderRadius: 10, border: "1px solid #E8E0D8", backgroundColor: "#fff", cursor: "pointer", color: "#5A524A", fontSize: 13, fontWeight: 500 }}>
            <Printer size={14} /> Export PDF
          </button>
          <button onClick={() => navigate("/benchmark")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 20px", borderRadius: 10, border: "none", backgroundColor: char.color, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
            <Plus size={14} /> New Session
          </button>
          <button onClick={() => navigate("/benchmark/history")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 20px", borderRadius: 10, border: "1px solid #E8E0D8", backgroundColor: "#fff", cursor: "pointer", color: "#5A524A", fontSize: 13, fontWeight: 500 }}>
            <History size={14} /> All Reports
          </button>
        </div>
      </div>
    </div>
  );
}
