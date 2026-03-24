import { useNavigate } from "react-router";
import { useStudent } from "@/context/StudentContext";
import { useStudentById } from "@/api/hooks/useStudents";
import { CHARACTERS } from "../constants/characters";

const PILLARS = [
  { icon: "\u{1F4AC}", name: "Communication", desc: "How you explain ideas", bg: "#FEE2E2", color: "#DC2626" },
  { icon: "\u{1F3A8}", name: "Creativity", desc: "How you think differently", bg: "#DBEAFE", color: "#2563EB" },
  { icon: "\u{1F916}", name: "AI & Systems", desc: "How you solve puzzles", bg: "#D1FAE5", color: "#059669" },
  { icon: "\u{1F9E0}", name: "Math & Logic", desc: "How you crack problems", bg: "#EDE9FE", color: "#7C3AED" },
];

export default function BenchmarkLandingPage() {
  const navigate = useNavigate();
  const { studentId } = useStudent();
  const { data: student } = useStudentById(studentId);

  return (
    <div className="bl-root">
      <button
        type="button"
        onClick={() => navigate("/dashboard")}
        className="bl-back-btn"
      >
        ← Back to Dashboard
      </button>
      {/* Floating avatars */}
      <div className="bl-avatars">
        {CHARACTERS.map((c, i) => (
          <img
            key={c.id}
            src={c.image}
            alt={c.name}
            className="bl-avatar-img"
            style={{
              border: `2px solid ${c.color}40`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      <h1 className="bl-title">
        Ready to discover your superpowers? {"\u{1F680}"}
      </h1>
      <p className="bl-subtitle">
        Answer 20 fun questions with a character guide and find out what you're amazing at!
      </p>

      {/* Pillar cards */}
      <div className="bl-pillars">
        {PILLARS.map((p) => (
          <div key={p.name} className="bl-pillar-card">
            <div className="bl-pillar-icon" style={{ backgroundColor: p.bg }}>
              {p.icon}
            </div>
            <div>
              <div className="bl-pillar-name" style={{ color: p.color }}>{p.name}</div>
              <div className="bl-pillar-desc">{p.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Student card + CTA */}
      <div className="bl-student-card">
        <div className="bl-student-row">
          <div className="bl-student-icon">{"\u{1F393}"}</div>
          <div>
            <div className="bl-student-name">{student?.name || "Loading..."}</div>
            <div className="bl-student-grade">{student?.grade ? `Grade ${student.grade}` : "Loading..."}</div>
          </div>
        </div>

        <button
          onClick={() => navigate("/benchmark/select")}
          disabled={!student}
          className="bl-cta-btn"
          style={{ opacity: student ? 1 : 0.5, cursor: student ? "pointer" : "not-allowed" }}
        >
          Let's Go! {"\u{1F31F}"}
        </button>

        <div className="bl-duration">Takes about 20 minutes</div>
      </div>

      <button onClick={() => navigate("/benchmark/history")} className="bl-history-btn">
        View past assessments
      </button>

      <style>{cssStyles}</style>
    </div>
  );
}

const cssStyles = `
  @keyframes blFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }

  .bl-root {
    position: relative;
    display: flex; flex-direction: column; align-items: center;
    padding: 24px 16px 32px; min-height: 100vh; min-height: 100dvh;
    background: linear-gradient(135deg, #e0e7ff 0%, #fce7f3 50%, #fef3c7 100%);
    overflow-y: auto;
  }

  .bl-back-btn {
    position: absolute;
    top: 14px;
    left: 14px;
    border: 1px solid rgba(15, 23, 42, 0.14);
    background: rgba(255,255,255,0.82);
    color: #334155;
    border-radius: 999px;
    padding: 7px 12px;
    font-size: 12px;
    font-weight: 800;
    font-family: 'Nunito', sans-serif;
    cursor: pointer;
    backdrop-filter: blur(6px);
    box-shadow: 0 2px 10px rgba(15,23,42,0.08);
  }
  .bl-back-btn:hover { background: #fff; }

  .bl-avatars { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; justify-content: center; }
  .bl-avatar-img {
    width: 34px; height: 34px; border-radius: 50%;
    animation: blFloat 3s ease-in-out infinite;
  }

  .bl-title {
    font-size: 1.5rem; font-family: 'Nunito', sans-serif; font-weight: 900;
    color: #26221D; margin: 0 0 6px; letter-spacing: -0.02em; text-align: center;
    line-height: 1.3;
  }

  .bl-subtitle {
    color: #5A524A; font-size: 14px; margin: 0 0 20px; text-align: center;
    max-width: 360px; line-height: 1.5; font-family: 'Nunito', sans-serif; font-weight: 500;
  }

  .bl-pillars {
    display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
    max-width: 400px; width: 100%; margin-bottom: 20px;
  }

  .bl-pillar-card {
    padding: 10px 12px; border-radius: 14px; background: #ffffffcc;
    backdrop-filter: blur(8px); border: 1px solid #ffffff60;
    display: flex; align-items: center; gap: 10px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.04);
  }

  .bl-pillar-icon {
    width: 34px; height: 34px; min-width: 34px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center; font-size: 16px;
  }

  .bl-pillar-name { font-size: 12px; font-weight: 800; font-family: 'Nunito', sans-serif; }
  .bl-pillar-desc { font-size: 10px; color: #7A7168; font-weight: 500; line-height: 1.3; }

  .bl-student-card {
    background: #ffffffcc; border: 1px solid #ffffff60;
    border-radius: 20px; padding: 18px 20px; max-width: 400px; width: 100%;
    box-shadow: 0 6px 24px rgba(0,0,0,0.08); backdrop-filter: blur(10px);
  }

  .bl-student-row { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }

  .bl-student-icon {
    width: 40px; height: 40px; border-radius: 12px; background: #EDE9FE;
    display: flex; align-items: center; justify-content: center; font-size: 18px;
    flex-shrink: 0;
  }

  .bl-student-name { font-size: 16px; font-weight: 800; color: #26221D; font-family: 'Nunito', sans-serif; }
  .bl-student-grade { font-size: 12px; color: #7A7168; font-weight: 500; }

  .bl-cta-btn {
    width: 100%; padding: 12px 20px; border-radius: 14px; border: none;
    background: linear-gradient(135deg, #7C3AED, #A78BFA);
    color: #fff; font-size: 16px; font-weight: 800;
    font-family: 'Nunito', sans-serif;
    box-shadow: 0 4px 14px rgba(124,58,237,0.35);
    transition: transform 150ms;
  }
  .bl-cta-btn:hover:not(:disabled) { transform: scale(1.02); }

  .bl-duration { margin-top: 8px; font-size: 11px; color: #A89E94; text-align: center; }

  .bl-history-btn {
    margin-top: 18px; background: transparent; border: none;
    color: #7C3AED; font-size: 13px; font-weight: 700;
    cursor: pointer; font-family: 'Nunito', sans-serif;
  }

  /* ─── Desktop ─── */
  @media (min-width: 640px) {
    .bl-root { padding: 40px 24px 48px; justify-content: center; }
    .bl-back-btn { top: 18px; left: 18px; font-size: 13px; padding: 8px 14px; }
    .bl-avatars { gap: 12px; margin-bottom: 24px; }
    .bl-avatar-img { width: 44px; height: 44px; }
    .bl-title { font-size: 2.25rem; margin-bottom: 8px; }
    .bl-subtitle { font-size: 16px; margin-bottom: 36px; max-width: 440px; line-height: 1.6; }
    .bl-pillars { gap: 12px; max-width: 420px; margin-bottom: 36px; }
    .bl-pillar-card { padding: 14px 16px; border-radius: 18px; gap: 12px; }
    .bl-pillar-icon { width: 40px; height: 40px; min-width: 40px; border-radius: 12px; font-size: 20px; }
    .bl-pillar-name { font-size: 14px; }
    .bl-pillar-desc { font-size: 11px; }
    .bl-student-card { border-radius: 24px; padding: 28px; }
    .bl-student-row { gap: 12px; margin-bottom: 16px; }
    .bl-student-icon { width: 48px; height: 48px; border-radius: 14px; font-size: 22px; }
    .bl-student-name { font-size: 18px; }
    .bl-student-grade { font-size: 13px; }
    .bl-cta-btn { padding: 14px 24px; border-radius: 16px; font-size: 18px; }
    .bl-duration { font-size: 12px; margin-top: 10px; }
    .bl-history-btn { margin-top: 24px; font-size: 14px; }
  }
`;
