import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import BenchmarkRadar from "../components/BenchmarkRadar";
import { CHARACTERS } from "../constants/characters";
import { benchmarkApi } from "../api";
import { ArrowLeft, Printer, Plus, History } from "lucide-react";

const METRICS = [
  { key: "critical_thinking", label: "Critical Thinking", color: "#3182CE" },
  { key: "mathematical_thinking", label: "Math & Logic", color: "#805AD5" },
  { key: "leadership", label: "Leadership", color: "#38B2AC" },
  { key: "creativity", label: "Creativity", color: "#ED64A6" },
  { key: "curiosity", label: "Curiosity", color: "#805AD5" },
  { key: "communication", label: "Communication", color: "#ED8936" },
  { key: "emotional_intelligence", label: "Emotional IQ", color: "#E53E3E" },
  { key: "knowledge_depth", label: "Knowledge", color: "#38A169" },
];

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

  const scores = benchmark.scores || {};
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
          <span style={{ fontSize: 14, fontWeight: 700, color: "#26221D", fontFamily: "'Nunito', sans-serif" }}>Assessment Report</span>
          <button onClick={() => window.print()} style={{ display: "flex", alignItems: "center", gap: 6, backgroundColor: "transparent", border: "1px solid #E8E0D8", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: "#7A7168", fontSize: 12 }}>
            <Printer size={14} /> Export
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 24px 48px" }}>
        {/* Student info card */}
        <div style={{ backgroundColor: "#fff", border: "1px solid #E8E0D8", borderRadius: 16, padding: 24, marginBottom: 20, display: "flex", alignItems: "center", gap: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, backgroundColor: char.color + "15", color: char.color }}>
            {char.initial}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#26221D", fontFamily: "'Nunito', sans-serif" }}>{benchmark.student_name}</div>
            <div style={{ fontSize: 13, color: "#A89E94" }}>
              Age {benchmark.student_age} &middot; {benchmark.student_grade} &middot; {char.name} &middot; {benchmark.total_turns} turns
            </div>
          </div>
        </div>

        {/* Score grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
          {METRICS.map((m) => (
            <div key={m.key} style={{ backgroundColor: "#fff", border: "1px solid #E8E0D8", borderRadius: 14, padding: 20, textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div style={{ position: "relative", width: 72, height: 72, margin: "0 auto 12px" }}>
                <svg viewBox="0 0 72 72" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="36" cy="36" r="30" fill="none" stroke="#E8E0D8" strokeWidth="5" />
                  <circle cx="36" cy="36" r="30" fill="none" stroke={m.color} strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={`${(scores[m.key] || 0) * 1.885} 188.5`}
                  />
                </svg>
                <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#26221D" }}>
                  {scores[m.key] || 0}
                </span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#5A524A" }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Radar */}
        <div style={{ backgroundColor: "#fff", border: "1px solid #E8E0D8", borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#26221D", marginBottom: 16, fontFamily: "'Nunito', sans-serif" }}>Score Distribution</div>
          <BenchmarkRadar scores={scores} characterColor={char.color} />
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

        {/* Learning style + Engagement */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          <div style={{ backgroundColor: "#fff", border: "1px solid #E8E0D8", borderRadius: 14, padding: 20, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#A89E94", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px", marginBottom: 8 }}>Learning Style</div>
            <span style={{ display: "inline-block", padding: "4px 16px", borderRadius: 8, backgroundColor: char.color, color: "#fff", fontSize: 13, fontWeight: 600, textTransform: "capitalize" }}>
              {insights.learning_style || "N/A"}
            </span>
          </div>
          <div style={{ backgroundColor: "#fff", border: "1px solid #E8E0D8", borderRadius: 14, padding: 20, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#A89E94", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px", marginBottom: 8 }}>Engagement</div>
            <span style={{ display: "inline-block", padding: "4px 16px", borderRadius: 8, backgroundColor: insights.engagement_level === "high" ? "#38A169" : insights.engagement_level === "medium" ? "#ED8936" : "#E53E3E", color: "#fff", fontSize: 13, fontWeight: 600, textTransform: "capitalize" }}>
              {insights.engagement_level || "N/A"}
            </span>
          </div>
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
          <div style={{ fontSize: 11, color: "#A89E94", marginBottom: 16 }}>Benchmark assessment - not a curriculum recommendation</div>
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
