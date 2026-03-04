import { useState } from "react";
import { useNavigate } from "react-router";
import { useStudent } from "@/context/StudentContext";
import { useStudentById } from "@/api/hooks/useStudents";
import { useBenchmarkSession } from "../context/BenchmarkSessionContext";

export default function BenchmarkLandingPage() {
  const navigate = useNavigate();
  const { studentId } = useStudent();
  const { data: student } = useStudentById(studentId);
  const { setStudentInfo } = useBenchmarkSession();
  const [age, setAge] = useState(10);

  const handleStart = () => {
    const name = student?.name || "Student";
    const grade = student?.grade || "Grade 6";
    setStudentInfo(name, age, grade);
    navigate("/benchmark/select");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "64px 24px",
        flex: 1,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#805AD515",
          marginBottom: 24,
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
            fill="#805AD5"
          />
        </svg>
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
        AI Benchmark
      </h1>
      <p style={{ color: "#7A7168", fontSize: 14, marginBottom: 40, textAlign: "center", maxWidth: 400 }}>
        Have a fun conversation with a character and discover your strengths across 8 skill dimensions.
      </p>

      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E8E0D8",
          borderRadius: 20,
          padding: 32,
          maxWidth: 400,
          width: "100%",
          boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#7A7168", display: "block", marginBottom: 6 }}>
            Student Name
          </label>
          <div
            style={{
              padding: "10px 16px",
              borderRadius: 10,
              border: "1px solid #E8E0D8",
              backgroundColor: "#FAF7F4",
              fontSize: 14,
              color: "#26221D",
              fontWeight: 500,
            }}
          >
            {student?.name || "Loading..."}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#7A7168", display: "block", marginBottom: 6 }}>
            Age
          </label>
          <select
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
            style={{
              width: "100%",
              padding: "10px 16px",
              borderRadius: 10,
              border: "1px solid #E8E0D8",
              backgroundColor: "#fff",
              fontSize: 14,
              color: "#26221D",
              outline: "none",
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {Array.from({ length: 12 }, (_, i) => i + 5).map((a) => (
              <option key={a} value={a}>{a} years</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#7A7168", display: "block", marginBottom: 6 }}>
            Grade
          </label>
          <div
            style={{
              padding: "10px 16px",
              borderRadius: 10,
              border: "1px solid #E8E0D8",
              backgroundColor: "#FAF7F4",
              fontSize: 14,
              color: "#26221D",
              fontWeight: 500,
            }}
          >
            {student?.grade || "Grade 6"}
          </div>
        </div>

        <button
          onClick={handleStart}
          disabled={!student}
          style={{
            width: "100%",
            padding: "12px 20px",
            borderRadius: 12,
            border: "none",
            backgroundColor: "#805AD5",
            color: "#fff",
            fontSize: 15,
            fontWeight: 700,
            cursor: student ? "pointer" : "not-allowed",
            opacity: student ? 1 : 0.5,
            fontFamily: "'Nunito', sans-serif",
            transition: "background-color 150ms",
          }}
        >
          Start Assessment
        </button>
      </div>

      <div style={{ marginTop: 20 }}>
        <button
          onClick={() => navigate("/benchmark/history")}
          style={{
            backgroundColor: "transparent",
            border: "none",
            color: "#805AD5",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          View Assessment History
        </button>
      </div>
    </div>
  );
}
