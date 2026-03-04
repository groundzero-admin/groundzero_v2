import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { CHARACTERS } from "../constants/characters";
import { benchmarkApi } from "../api";
import { Eye, Search, Plus } from "lucide-react";

const SCORE_COLS = [
  { key: "critical_thinking", label: "Critical", color: "#3182CE" },
  { key: "mathematical_thinking", label: "Math", color: "#805AD5" },
  { key: "creativity", label: "Creative", color: "#ED64A6" },
  { key: "curiosity", label: "Curious", color: "#805AD5" },
  { key: "communication", label: "Comms", color: "#ED8936" },
];

export default function BenchmarkHistoryPage() {
  const navigate = useNavigate();
  const [benchmarks, setBenchmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchBenchmarks = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await benchmarkApi.listResults({ limit: 50, search: search || undefined });
      setBenchmarks(data);
    } catch { /* silent */ }
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchBenchmarks(); }, [fetchBenchmarks]);

  return (
    <div style={{ padding: "32px 24px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#26221D", fontFamily: "'Nunito', sans-serif" }}>Assessment History</h1>
        <button
          onClick={() => navigate("/benchmark")}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10,
            border: "none", backgroundColor: "#805AD5", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}
        >
          <Plus size={14} /> New Session
        </button>
      </div>

      <div style={{ position: "relative", marginBottom: 20, maxWidth: 320 }}>
        <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#A89E94" }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by student name..."
          style={{
            width: "100%", padding: "8px 12px 8px 36px", borderRadius: 10, border: "1px solid #E8E0D8",
            fontSize: 13, outline: "none", backgroundColor: "#fff", color: "#26221D",
          }}
        />
      </div>

      <div style={{ backgroundColor: "#fff", border: "1px solid #E8E0D8", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ backgroundColor: "#FAF7F4", borderBottom: "1px solid #E8E0D8" }}>
              <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "#7A7168" }}>Student</th>
              <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#7A7168" }}>Character</th>
              <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#7A7168" }}>Date</th>
              <th style={{ padding: "10px 12px", textAlign: "center", fontWeight: 600, color: "#7A7168" }}>Turns</th>
              {SCORE_COLS.map((s) => (
                <th key={s.key} style={{ padding: "10px 8px", textAlign: "center", fontWeight: 600, color: "#7A7168" }}>{s.label}</th>
              ))}
              <th style={{ padding: "10px 12px", width: 50 }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8 + SCORE_COLS.length} style={{ padding: 40, textAlign: "center", color: "#A89E94" }}>Loading...</td></tr>
            ) : benchmarks.length === 0 ? (
              <tr><td colSpan={8 + SCORE_COLS.length} style={{ padding: 40, textAlign: "center", color: "#A89E94" }}>No assessments yet</td></tr>
            ) : (
              benchmarks.map((b) => {
                const char = CHARACTERS.find((c) => c.id === b.character);
                return (
                  <tr
                    key={b.id}
                    onClick={() => navigate(`/benchmark/report/${b.session_id}`)}
                    style={{ borderBottom: "1px solid #F5F0EB", cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FAF7F4")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <td style={{ padding: "10px 16px", fontWeight: 600, color: "#26221D" }}>
                      {b.student_name}
                      <div style={{ fontSize: 11, color: "#A89E94", fontWeight: 400 }}>
                        Age {b.student_age} &middot; {b.student_grade}
                      </div>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {char && (
                          <span style={{ width: 22, height: 22, borderRadius: 4, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, backgroundColor: char.color + "15", color: char.color }}>
                            {char.initial}
                          </span>
                        )}
                        <span style={{ color: "#5A524A" }}>{char?.name || b.character}</span>
                      </div>
                    </td>
                    <td style={{ padding: "10px 12px", color: "#7A7168" }}>
                      {new Date(b.generated_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "center", color: "#5A524A" }}>{b.total_turns}</td>
                    {SCORE_COLS.map((s) => (
                      <td key={s.key} style={{ padding: "10px 8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
                          <div style={{ width: 40, height: 4, backgroundColor: "#E8E0D8", borderRadius: 999, overflow: "hidden" }}>
                            <div style={{ height: "100%", borderRadius: 999, width: `${b.scores?.[s.key] || 0}%`, backgroundColor: s.color }} />
                          </div>
                          <span style={{ fontSize: 11, color: "#7A7168", fontWeight: 500 }}>{b.scores?.[s.key] || 0}</span>
                        </div>
                      </td>
                    ))}
                    <td style={{ padding: "10px 12px" }}>
                      <button style={{ backgroundColor: "transparent", border: "none", cursor: "pointer", color: "#A89E94", padding: 4 }}>
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
