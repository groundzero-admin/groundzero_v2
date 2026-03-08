import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { CHARACTERS } from "../constants/characters";
import benchmarkApi from "../api";
import { Eye, Search, Plus } from "lucide-react";

const PILLAR_COLS = [
  { key: "communication", label: "Comms", color: "#E53E3E" },
  { key: "creativity", label: "Creative", color: "#3182CE" },
  { key: "ai_systems", label: "AI/Sys", color: "#38A169" },
  { key: "math_logic", label: "Math", color: "#805AD5" },
];

export default function BenchmarkHistoryPage() {
  const navigate = useNavigate();
  const [benchmarks, setBenchmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchBenchmarks = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await benchmarkApi.listResults();
      setBenchmarks(data);
    } catch { /* empty */ }
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchBenchmarks(); }, [fetchBenchmarks]);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.25rem", fontFamily: "'Nunito', sans-serif", fontWeight: 800, color: "#26221D" }}>
          Assessment History
        </h1>
        <button
          onClick={() => navigate("/benchmark")}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
            borderRadius: 10, border: "none", backgroundColor: "#805AD5",
            color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}
        >
          <Plus size={14} /> New
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#A89E94" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            style={{
              width: "100%", padding: "10px 16px 10px 32px", borderRadius: 10,
              border: "1px solid #E8E0D8",
              fontSize: 13, outline: "none", backgroundColor: "#fff", color: "#26221D",
            }}
          />
        </div>
      </div>

      <div style={{ backgroundColor: "#fff", border: "1px solid #E8E0D8", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ backgroundColor: "#FAF7F4", borderBottom: "1px solid #E8E0D8" }}>
              <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "#7A7168" }}>Student</th>
              <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#7A7168" }}>Character</th>
              <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#7A7168" }}>Date</th>
              <th style={{ padding: "10px 12px", textAlign: "center", fontWeight: 600, color: "#7A7168" }}>Turns</th>
              {PILLAR_COLS.map((s) => (
                <th key={s.key} style={{ padding: "10px 8px", textAlign: "center", fontWeight: 600, color: "#7A7168" }}>{s.label}</th>
              ))}
              <th style={{ padding: "10px 12px", width: 50 }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5 + PILLAR_COLS.length} style={{ padding: 40, textAlign: "center", color: "#A89E94" }}>Loading...</td></tr>
            ) : benchmarks.length === 0 ? (
              <tr><td colSpan={5 + PILLAR_COLS.length} style={{ padding: 40, textAlign: "center", color: "#A89E94" }}>No assessments yet</td></tr>
            ) : (
              benchmarks.map((b) => {
                const char = CHARACTERS.find((c) => c.id === b.character);
                const ps = b.pillar_stages || {};
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
                        Grade {b.student_grade}
                      </div>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {char && (
                          <img src={char.image} alt={char.name} style={{ width: 22, height: 22, borderRadius: 4, objectFit: "cover" }} />
                        )}
                        <span style={{ color: "#5A524A" }}>{char?.name || b.character}</span>
                      </div>
                    </td>
                    <td style={{ padding: "10px 12px", color: "#7A7168" }}>
                      {new Date(b.generated_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "center", color: "#5A524A" }}>{b.total_turns}</td>
                    {PILLAR_COLS.map((s) => (
                      <td key={s.key} style={{ padding: "10px 8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                          <div style={{ display: "flex", gap: 2 }}>
                            {[1, 2, 3, 4, 5].map((st) => (
                              <div key={st} style={{ width: 8, height: 4, borderRadius: 2, backgroundColor: st <= (ps[s.key] || 1) ? s.color : "#E8E0D8" }} />
                            ))}
                          </div>
                          <span style={{ fontSize: 11, color: "#7A7168", fontWeight: 600, minWidth: 12, textAlign: "center" }}>{ps[s.key] || 1}</span>
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
