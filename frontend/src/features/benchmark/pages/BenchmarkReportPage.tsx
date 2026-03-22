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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function StageBar({ stage, color }: { stage: number; color: string }) {
  return (
    <div className="rp-stage-bar">
      {[1, 2, 3, 4, 5].map((s) => (
        <div key={s} className="rp-stage-pip" style={{ backgroundColor: s <= stage ? color : "#E8E0D8" }} />
      ))}
    </div>
  );
}

export default function BenchmarkReportPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      <div className="rp-center">
        <p className="rp-error">{error}</p>
        <button onClick={() => navigate("/benchmark")} className="rp-retry-btn">New Session</button>
        <style>{rpStyles}</style>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rp-center">
        <div className="rp-spinner" />
        <p className="rp-loading-text">Analyzing assessment data...</p>
        <style>{rpStyles}</style>
      </div>
    );
  }

  const pillarStages = benchmark.pillar_stages || {};
  const capStages = benchmark.capability_stages || {};
  const capEvidence = benchmark.capability_evidence || {};
  const insights = benchmark.insights || {};
  const char = CHARACTERS.find((c) => c.id === benchmark.character) || CHARACTERS[0];

  return (
    <div className="rp-root">
      {/* Header */}
      <div className="rp-header">
        <button onClick={() => navigate("/dashboard")} className="rp-back-btn">
          <ArrowLeft size={16} /> <span className="rp-back-label">Back</span>
        </button>
        <div className="rp-header-center">
          <span className="rp-header-title">Report</span>
          {benchmark.bkt_seeded === "done" && (
            <span className="rp-bkt-badge"><CheckCircle2 size={10} /> BKT</span>
          )}
        </div>
        <button onClick={() => window.print()} className="rp-export-btn">
          <Printer size={14} />
        </button>
      </div>

      <div className="rp-content">
        {/* Student card */}
        <div className="rp-card rp-student-card">
          <img src={char.image} alt={char.name} className="rp-student-avatar" />
          <div>
            <div className="rp-student-name">{benchmark.student_name}</div>
            <div className="rp-student-meta">
              Grade {benchmark.student_grade} &middot; {char.name} &middot; {benchmark.total_turns} answers
            </div>
          </div>
        </div>

        {/* Pillar stages */}
        <div className="rp-pillar-grid">
          {Object.entries(PILLAR_LABELS).map(([key, label]) => {
            const stage = pillarStages[key] || 1;
            const color = PILLAR_COLORS[key];
            return (
              <div key={key} className="rp-card rp-pillar-card">
                <div className="rp-pillar-stage" style={{ color }}>{stage}</div>
                <div className="rp-pillar-level" style={{ color: STAGE_COLORS[stage] }}>
                  {STAGE_LABELS[stage]}
                </div>
                <div className="rp-pillar-label">{label}</div>
                <StageBar stage={stage} color={color} />
              </div>
            );
          })}
        </div>

        {/* Radar */}
        <div className="rp-card rp-radar-card">
          <div className="rp-section-title">Pillar Overview</div>
          <BenchmarkRadar pillarStages={pillarStages} characterColor={char.color} />
        </div>

        {/* Capability breakdown */}
        <div className="rp-section">
          <div className="rp-section-title">Capability Breakdown</div>
          {Object.entries(PILLAR_LABELS).map(([pillarKey, pillarLabel]) => {
            const caps = Object.entries(CAPABILITY_TO_PILLAR).filter(([, p]) => p === pillarKey).map(([c]) => c);
            const color = PILLAR_COLORS[pillarKey];
            return (
              <div key={pillarKey} className="rp-card rp-cap-card">
                <div className="rp-cap-header" style={{ color }}>
                  <div className="rp-cap-dot" style={{ backgroundColor: color }} />
                  {pillarLabel}
                </div>
                <div className="rp-cap-list">
                  {caps.map((capId) => {
                    const stage = capStages[capId];
                    const evidence = capEvidence[capId];
                    if (stage == null) return (
                      <div key={capId} className="rp-cap-row rp-cap-na">
                        <span className="rp-cap-id">{capId}</span>
                        <span className="rp-cap-name">{CAPABILITY_NAMES[capId]}</span>
                        <span className="rp-cap-na-label">N/A</span>
                      </div>
                    );
                    return (
                      <div key={capId} className="rp-cap-item">
                        <div className="rp-cap-row">
                          <span className="rp-cap-id" style={{ color }}>{capId}</span>
                          <span className="rp-cap-name rp-cap-name-active">{CAPABILITY_NAMES[capId]}</span>
                          <span className="rp-cap-level" style={{ color: STAGE_COLORS[stage], backgroundColor: STAGE_COLORS[stage] + "15" }}>
                            {STAGE_LABELS[stage]}
                          </span>
                        </div>
                        <div className="rp-cap-bar-row">
                          <StageBar stage={stage} color={color} />
                        </div>
                        {evidence && <div className="rp-cap-evidence">{evidence}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Insights */}
        <div className="rp-insights-grid">
          {[
            { title: "Strengths", items: insights.strongest_areas, bg: "#C6F6D5", color: "#38A169", icon: "\u{1F4AA}" },
            { title: "Growth Areas", items: insights.growth_areas, bg: "#FEEBC8", color: "#ED8936", icon: "\u{1F331}" },
            { title: "Interests", items: insights.dominant_interests, bg: "#BEE3F8", color: "#3182CE", icon: "\u{2B50}" },
          ].map((section) => (
            <div key={section.title} className="rp-card rp-insight-card">
              <div className="rp-insight-title">{section.icon} {section.title}</div>
              <div className="rp-insight-tags">
                {(section.items || []).map((item: string, i: number) => (
                  <span key={i} className="rp-insight-tag" style={{ backgroundColor: section.bg, color: section.color }}>
                    {item}
                  </span>
                ))}
                {(!section.items || section.items.length === 0) && (
                  <span className="rp-insight-empty">Not enough data</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Observations */}
        {insights.notable_observations?.length > 0 && (
          <div className="rp-card rp-obs-card">
            <div className="rp-section-title">{"\u{1F4DD}"} Notable Observations</div>
            <ul className="rp-obs-list">
              {insights.notable_observations.map((obs: string, i: number) => (
                <li key={i} className="rp-obs-item">{obs}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Summary */}
        <div className="rp-card rp-summary-card" style={{ borderColor: char.color + "20", backgroundColor: char.color + "08" }}>
          <div className="rp-summary-title">Assessment Summary</div>
          <div className="rp-summary-sub">AI-powered diagnostic across 4 pillars</div>
          {benchmark.summary?.split("\n").map((p: string, i: number) => (
            <p key={i} className="rp-summary-text">{p}</p>
          ))}
        </div>

        {/* Actions */}
        <div className="rp-actions">
          <button onClick={() => window.print()} className="rp-action-btn rp-action-secondary">
            <Printer size={14} /> Export
          </button>
          <button onClick={() => navigate("/benchmark")} className="rp-action-btn rp-action-primary" style={{ backgroundColor: char.color }}>
            <Plus size={14} /> New
          </button>
          <button onClick={() => navigate("/benchmark/history")} className="rp-action-btn rp-action-secondary">
            <History size={14} /> History
          </button>
        </div>
      </div>

      <style>{rpStyles}</style>
    </div>
  );
}

const rpStyles = `
  @keyframes rpSpin { to { transform: rotate(360deg); } }

  .rp-center {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    min-height: 100vh; padding: 32px;
  }
  .rp-error { color: #E53E3E; font-weight: 600; margin-bottom: 8px; font-size: 14px; }
  .rp-retry-btn {
    padding: 8px 20px; border-radius: 10px; border: none; background: #805AD5;
    color: #fff; cursor: pointer; font-weight: 600; font-size: 14px;
  }
  .rp-spinner {
    width: 28px; height: 28px; border: 3px solid #E8E0D8; border-top-color: #805AD5;
    border-radius: 50%; animation: rpSpin 1s linear infinite;
  }
  .rp-loading-text { color: #7A7168; margin-top: 14px; font-size: 13px; }

  .rp-root { min-height: 100vh; background: #FAF7F4; }

  /* ─── Header ─── */
  .rp-header {
    background: #fff; border-bottom: 1px solid #E8E0D8; padding: 8px 12px;
    position: sticky; top: 0; z-index: 10;
    display: flex; align-items: center; justify-content: space-between;
  }
  .rp-back-btn {
    display: flex; align-items: center; gap: 4px; background: none; border: none;
    cursor: pointer; color: #7A7168; font-size: 13px; padding: 4px;
  }
  .rp-back-label { display: none; }
  .rp-header-center { display: flex; align-items: center; gap: 6px; }
  .rp-header-title { font-size: 14px; font-weight: 700; color: #26221D; font-family: 'Nunito', sans-serif; }
  .rp-bkt-badge {
    display: inline-flex; align-items: center; gap: 3px; font-size: 9px;
    font-weight: 600; color: #38A169; background: #C6F6D520; padding: 2px 6px; border-radius: 5px;
  }
  .rp-export-btn {
    display: flex; align-items: center; justify-content: center;
    background: none; border: 1px solid #E8E0D8; border-radius: 8px;
    padding: 6px 8px; cursor: pointer; color: #7A7168;
  }

  /* ─── Content ─── */
  .rp-content { padding: 14px 12px 32px; max-width: 960px; margin: 0 auto; }

  .rp-card {
    background: #fff; border: 1px solid #E8E0D8; border-radius: 14px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }

  .rp-section-title {
    font-size: 13px; font-weight: 700; color: #26221D; margin-bottom: 10px;
    font-family: 'Nunito', sans-serif;
  }

  /* ─── Student ─── */
  .rp-student-card {
    padding: 14px 16px; margin-bottom: 14px;
    display: flex; align-items: center; gap: 12px;
  }
  .rp-student-avatar { width: 40px; height: 40px; border-radius: 10px; object-fit: cover; }
  .rp-student-name { font-size: 16px; font-weight: 800; color: #26221D; font-family: 'Nunito', sans-serif; }
  .rp-student-meta { font-size: 11px; color: #A89E94; }

  /* ─── Pillar grid ─── */
  .rp-pillar-grid {
    display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 14px;
  }
  .rp-pillar-card { padding: 14px; text-align: center; }
  .rp-pillar-stage { font-size: 24px; font-weight: 800; margin-bottom: 2px; }
  .rp-pillar-level { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .rp-pillar-label { font-size: 11px; font-weight: 600; color: #5A524A; margin-bottom: 8px; }
  .rp-stage-bar { display: flex; gap: 2px; justify-content: center; }
  .rp-stage-pip { width: 14px; height: 3px; border-radius: 1.5px; }

  /* ─── Radar ─── */
  .rp-radar-card { padding: 16px; margin-bottom: 14px; overflow: hidden; }

  /* ─── Capabilities ─── */
  .rp-section { margin-bottom: 14px; }
  .rp-cap-card { padding: 14px; margin-bottom: 8px; }
  .rp-cap-header {
    font-size: 12px; font-weight: 700; margin-bottom: 10px;
    display: flex; align-items: center; gap: 6px;
  }
  .rp-cap-dot { width: 6px; height: 6px; border-radius: 50%; }
  .rp-cap-list { display: flex; flex-direction: column; gap: 8px; }
  .rp-cap-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .rp-cap-id { width: 20px; font-size: 10px; font-weight: 700; flex-shrink: 0; }
  .rp-cap-name { flex: 1; font-size: 11px; color: #A89E94; min-width: 0; }
  .rp-cap-name-active { color: #3D3730; font-weight: 500; }
  .rp-cap-na { opacity: 0.4; }
  .rp-cap-na-label { font-size: 9px; color: #D4C9BD; }
  .rp-cap-level { font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 5px; flex-shrink: 0; }
  .rp-cap-bar-row { margin-left: 28px; margin-top: 4px; }
  .rp-cap-evidence { margin-left: 28px; margin-top: 4px; font-size: 10px; color: #7A7168; font-style: italic; line-height: 1.5; }
  .rp-cap-item { padding-bottom: 6px; border-bottom: 1px solid #F5F0EB; }
  .rp-cap-item:last-child { border-bottom: none; padding-bottom: 0; }

  /* ─── Insights ─── */
  .rp-insights-grid {
    display: grid; grid-template-columns: 1fr; gap: 8px; margin-bottom: 14px;
  }
  .rp-insight-card { padding: 14px; }
  .rp-insight-title { font-size: 13px; font-weight: 700; color: #26221D; margin-bottom: 8px; font-family: 'Nunito', sans-serif; }
  .rp-insight-tags { display: flex; flex-wrap: wrap; gap: 5px; }
  .rp-insight-tag { font-size: 10px; padding: 3px 8px; border-radius: 999px; font-weight: 500; }
  .rp-insight-empty { font-size: 11px; color: #D4C9BD; }

  /* ─── Observations ─── */
  .rp-obs-card { padding: 14px; margin-bottom: 14px; }
  .rp-obs-list { margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 6px; }
  .rp-obs-item { font-size: 12px; color: #5A524A; line-height: 1.5; }

  /* ─── Summary ─── */
  .rp-summary-card { padding: 16px; margin-bottom: 18px; }
  .rp-summary-title { font-size: 15px; font-weight: 700; color: #26221D; margin-bottom: 2px; font-family: 'Nunito', sans-serif; }
  .rp-summary-sub { font-size: 10px; color: #A89E94; margin-bottom: 12px; }
  .rp-summary-text { font-size: 13px; color: #5A524A; line-height: 1.6; margin: 0 0 6px; }

  /* ─── Actions ─── */
  .rp-actions { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
  .rp-action-btn {
    display: flex; align-items: center; gap: 5px; padding: 8px 14px;
    border-radius: 10px; cursor: pointer; font-size: 12px; font-weight: 600;
  }
  .rp-action-secondary { border: 1px solid #E8E0D8; background: #fff; color: #5A524A; }
  .rp-action-primary { border: none; color: #fff; }

  /* ─── Desktop ─── */
  @media (min-width: 640px) {
    .rp-header { padding: 10px 24px; }
    .rp-back-label { display: inline; }
    .rp-header-title { font-size: 15px; }
    .rp-export-btn { padding: 6px 12px; gap: 6px; }
    .rp-content { padding: 24px 24px 48px; }
    .rp-student-card { padding: 20px 24px; gap: 16px; margin-bottom: 20px; }
    .rp-student-avatar { width: 48px; height: 48px; border-radius: 12px; }
    .rp-student-name { font-size: 18px; }
    .rp-student-meta { font-size: 13px; }
    .rp-pillar-grid { grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
    .rp-pillar-card { padding: 20px; }
    .rp-pillar-stage { font-size: 28px; }
    .rp-pillar-level { font-size: 10px; margin-bottom: 6px; }
    .rp-pillar-label { font-size: 12px; margin-bottom: 10px; }
    .rp-stage-pip { width: 16px; height: 4px; }
    .rp-radar-card { padding: 24px; margin-bottom: 20px; }
    .rp-section { margin-bottom: 20px; }
    .rp-section-title { font-size: 14px; margin-bottom: 12px; }
    .rp-cap-card { padding: 20px; margin-bottom: 12px; }
    .rp-cap-header { font-size: 13px; }
    .rp-cap-id { width: 28px; font-size: 11px; }
    .rp-cap-name { font-size: 12px; }
    .rp-cap-level { font-size: 11px; padding: 2px 8px; }
    .rp-cap-evidence { font-size: 11px; margin-left: 40px; }
    .rp-cap-bar-row { margin-left: 40px; }
    .rp-insights-grid { grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
    .rp-insight-card { padding: 20px; }
    .rp-insight-tag { font-size: 11px; padding: 4px 10px; }
    .rp-obs-card { padding: 20px; margin-bottom: 20px; }
    .rp-obs-item { font-size: 13px; line-height: 1.6; }
    .rp-summary-card { padding: 24px; margin-bottom: 24px; border-radius: 14px; }
    .rp-summary-title { font-size: 16px; }
    .rp-summary-text { font-size: 14px; line-height: 1.7; margin-bottom: 8px; }
    .rp-actions { gap: 12px; }
    .rp-action-btn { padding: 8px 20px; font-size: 13px; }
  }
`;
