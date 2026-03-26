import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useBenchmarkSession } from "../context/BenchmarkSessionContext";
import { CHARACTERS } from "../constants/characters";
import benchmarkApi from "../api";

export default function CharacterSelectPage() {
  const navigate = useNavigate();
  const { setCharacter, setSessionId } = useBenchmarkSession();
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Check for an active session and resume it
  useEffect(() => {
    benchmarkApi.listSessions().then(({ data }) => {
      const active = (data as { id: string; character: string; status: string }[])
        .find(s => s.status === "active" || s.status === "benchmark_ready");
      if (active) {
        const char = CHARACTERS.find(c => c.id === active.character);
        if (char) {
          setCharacter(char);
          setSessionId(active.id);
          navigate("/benchmark/conversation", { replace: true });
        }
      }
    }).catch(() => { /* no active session, continue with selection */ });
  }, [navigate, setCharacter, setSessionId]);

  const handleSelect = async (character: (typeof CHARACTERS)[number]) => {
    if (loading) return;
    setSelected(character.id);
    setCharacter(character);
    setLoading(true);

    try {
      const { data: session } = await benchmarkApi.createSession({
        character: character.id,
      });
      setSessionId(session.id);
      setTimeout(() => navigate("/benchmark/conversation"), 400);
    } catch {
      alert("Failed to create session. Please try again.");
      setSelected(null);
      setLoading(false);
    }
  };

  return (
    <div className="cs-root">
      <h1 className="cs-title">Who will be your guide? {"\u{1F31F}"}</h1>
      <p className="cs-subtitle">Pick a character to explore questions with you!</p>

      <div className="cs-grid">
        {CHARACTERS.map((char) => {
          const isSelected = selected === char.id;
          const isHovered = hoveredId === char.id;

          return (
            <button
              key={char.id}
              onClick={() => handleSelect(char)}
              onMouseEnter={() => setHoveredId(char.id)}
              onMouseLeave={() => setHoveredId(null)}
              disabled={loading}
              className={`cs-card ${isSelected ? "cs-card-selected" : ""}`}
              style={{
                background: isSelected
                  ? `linear-gradient(135deg, ${char.color}20, ${char.accent}20)`
                  : isHovered ? "#ffffff" : "#ffffffcc",
                opacity: loading && !isSelected ? 0.4 : 1,
                transform: isSelected ? "scale(1.08)" : isHovered ? "scale(1.04) rotate(-2deg)" : "scale(1)",
                boxShadow: isSelected
                  ? `0 8px 30px ${char.color}40`
                  : isHovered ? "0 6px 20px rgba(0,0,0,0.1)" : "0 3px 10px rgba(0,0,0,0.05)",
              }}
            >
              <div
                className="cs-avatar-ring"
                style={{
                  border: isSelected ? `3px solid ${char.color}` : "3px solid transparent",
                  background: `linear-gradient(135deg, ${char.color}15, ${char.accent}15)`,
                  boxShadow: isSelected ? `0 4px 16px ${char.color}30` : "none",
                }}
              >
                <img
                  src={char.poses?.idle || char.image}
                  alt={char.name}
                  className={`cs-avatar-img ${isSelected ? "cs-bounce" : isHovered ? "cs-wobble" : ""}`}
                />
              </div>
              <span
                className="cs-name"
                style={{ color: isSelected ? char.color : "#3D3730" }}
              >
                {char.name}
              </span>
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="cs-loading">
          <div
            className="cs-spinner"
            style={{ borderTopColor: selected ? CHARACTERS.find(c => c.id === selected)?.color || "#805AD5" : "#805AD5" }}
          />
          <p className="cs-loading-text">Starting your adventure...</p>
        </div>
      )}

      <style>{cssStyles}</style>
    </div>
  );
}

const cssStyles = `
  @keyframes csWobble { 0% { transform: rotate(0); } 25% { transform: rotate(-5deg); } 50% { transform: rotate(5deg); } 75% { transform: rotate(-2deg); } 100% { transform: rotate(0); } }
  @keyframes csBounce { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }
  @keyframes csSpin { to { transform: rotate(360deg); } }
  @keyframes csFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

  .cs-wobble { animation: csWobble 0.5s ease-in-out; }
  .cs-bounce { animation: csBounce 1s ease-in-out infinite; }

  .cs-root {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 28px 16px; min-height: 100vh; min-height: 100dvh;
    background: linear-gradient(135deg, #fef3c7 0%, #fce7f3 50%, #e0e7ff 100%);
  }

  .cs-title {
    font-size: 1.4rem; font-family: 'Nunito', sans-serif; font-weight: 900;
    color: #26221D; margin: 0 0 4px; text-align: center;
  }

  .cs-subtitle {
    color: #7A7168; font-size: 14px; margin: 0 0 28px;
    font-weight: 500; font-family: 'Nunito', sans-serif;
  }

  .cs-grid {
    display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;
    max-width: 700px;
  }

  .cs-card {
    display: flex; flex-direction: column; align-items: center;
    gap: 8px; padding: 12px; border: none; border-radius: 20px;
    cursor: pointer; transition: all 300ms ease;
    width: calc(33.33% - 8px); min-width: 90px; max-width: 120px;
  }

  .cs-avatar-ring {
    width: 70px; height: 70px; border-radius: 50%;
    overflow: hidden; transition: all 300ms ease;
  }

  .cs-avatar-img { width: 100%; height: 100%; object-fit: cover; }

  .cs-name {
    font-size: 12px; font-weight: 800; font-family: 'Nunito', sans-serif;
    transition: color 200ms; text-align: center;
  }

  .cs-loading { margin-top: 28px; text-align: center; animation: csFadeIn 0.3s ease; }
  .cs-spinner {
    width: 32px; height: 32px; border: 3px solid #E8E0D8;
    border-radius: 50%; animation: csSpin 1s linear infinite;
    margin: 0 auto 10px;
  }
  .cs-loading-text { color: #7A7168; font-size: 14px; font-weight: 600; font-family: 'Nunito', sans-serif; }

  /* ─── Desktop ─── */
  @media (min-width: 640px) {
    .cs-root { padding: 40px 24px; }
    .cs-title { font-size: 2rem; margin-bottom: 6px; }
    .cs-subtitle { font-size: 16px; margin-bottom: 44px; }
    .cs-grid { gap: 24px; }
    .cs-card { width: 140px; max-width: 140px; padding: 16px; border-radius: 24px; gap: 12px; }
    .cs-avatar-ring { width: 100px; height: 100px; }
    .cs-name { font-size: 15px; }
    .cs-loading { margin-top: 36px; }
    .cs-spinner { width: 40px; height: 40px; }
    .cs-loading-text { font-size: 15px; }
  }
`;
