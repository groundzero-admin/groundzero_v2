import { useNavigate } from "react-router";
import { useStudent } from "@/context/StudentContext";
import { useStudentById } from "@/api/hooks/useStudents";

const PILLAR_PREVIEWS = [
  { emoji: "🔴", name: "Communication", desc: "How you explain, argue, and adapt" },
  { emoji: "🔵", name: "Creativity", desc: "How you generate ideas and explore" },
  { emoji: "🟢", name: "AI & Systems", desc: "How you think about systems and tech" },
  { emoji: "🟣", name: "Math & Logic", desc: "How you reason and solve problems" },
];

export default function BenchmarkLandingPage() {
  const navigate = useNavigate();
  const { studentId } = useStudent();
  const { data: student } = useStudentById(studentId);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        flex: 1,
      }}
    >
      <div
        style={{
          width: 56, height: 56, borderRadius: 16,
          display: "flex", alignItems: "center", justifyContent: "center",
          backgroundColor: "#805AD515", marginBottom: 24,
          fontSize: 28,
        }}
      >
        🎯
      </div>

      <h1
        style={{
          fontSize: "1.875rem",
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 800,
          color: "#26221D",
          marginBottom: 8,
          letterSpacing: "-0.02em",
        }}
      >
        Diagnostic Assessment
      </h1>
      <p style={{ color: "#7A7168", fontSize: 14, marginBottom: 32, textAlign: "center", maxWidth: 440 }}>
        Answer 20 questions guided by a fun character to discover your strengths across 4 skill pillars.
        Takes about 20 minutes.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 10,
          maxWidth: 400,
          width: "100%",
          marginBottom: 32,
        }}
      >
        {PILLAR_PREVIEWS.map((p) => (
          <div
            key={p.name}
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid #E8E0D8",
              backgroundColor: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 18 }}>{p.emoji}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#26221D" }}>{p.name}</div>
              <div style={{ fontSize: 11, color: "#A89E94" }}>{p.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E8E0D8",
          borderRadius: 20,
          padding: 28,
          maxWidth: 400,
          width: "100%",
          boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#7A7168", display: "block", marginBottom: 6 }}>
            Student
          </label>
          <div
            style={{
              padding: "10px 16px", borderRadius: 10,
              border: "1px solid #E8E0D8", backgroundColor: "#FAF7F4",
              fontSize: 14, color: "#26221D", fontWeight: 500,
            }}
          >
            {student?.name || "Loading..."}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#7A7168", display: "block", marginBottom: 6 }}>
            Grade
          </label>
          <div
            style={{
              padding: "10px 16px", borderRadius: 10,
              border: "1px solid #E8E0D8", backgroundColor: "#FAF7F4",
              fontSize: 14, color: "#26221D", fontWeight: 500,
            }}
          >
            {student?.grade ? `Grade ${student.grade}` : "Loading..."}
          </div>
        </div>

        <button
          onClick={() => navigate("/benchmark/select")}
          disabled={!student}
          style={{
            width: "100%", padding: "12px 20px", borderRadius: 12,
            border: "none", backgroundColor: "#805AD5", color: "#fff",
            fontSize: 15, fontWeight: 700,
            cursor: student ? "pointer" : "not-allowed",
            opacity: student ? 1 : 0.5,
            fontFamily: "'Nunito', sans-serif",
            transition: "background-color 150ms",
          }}
        >
          Choose Your Guide
        </button>
      </div>

      <div style={{ marginTop: 20 }}>
        <button
          onClick={() => navigate("/benchmark/history")}
          style={{
            backgroundColor: "transparent", border: "none",
            color: "#805AD5", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}
        >
          View Assessment History
        </button>
      </div>
    </div>
  );
}
