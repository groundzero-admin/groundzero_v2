import { useState } from "react";
import { useNavigate } from "react-router";
import { useBenchmarkSession } from "../context/BenchmarkSessionContext";
import { CHARACTERS } from "../constants/characters";
import benchmarkApi from "../api";

export default function CharacterSelectPage() {
  const navigate = useNavigate();
  const { setCharacter, setSessionId } = useBenchmarkSession();
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      setTimeout(() => navigate("/benchmark/conversation"), 300);
    } catch {
      alert("Failed to create session. Please try again.");
      setSelected(null);
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        flex: 1,
        minHeight: "100vh",
        backgroundColor: "#FAF7F4",
      }}
    >
      <h1
        style={{
          fontSize: "1.5rem",
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 800,
          color: "#26221D",
          marginBottom: 8,
        }}
      >
        Choose Your Guide
      </h1>
      <p style={{ color: "#7A7168", fontSize: 14, marginBottom: 40 }}>
        Pick a character to guide you through the assessment
      </p>

      <div
        style={{
          display: "flex",
          gap: 28,
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: 740,
        }}
      >
        {CHARACTERS.map((char) => {
          const isSelected = selected === char.id;
          return (
            <button
              key={char.id}
              onClick={() => handleSelect(char)}
              disabled={loading}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
                padding: 0,
                border: "none",
                backgroundColor: "transparent",
                cursor: loading ? "default" : "pointer",
                opacity: loading && !isSelected ? 0.4 : 1,
                transition: "all 300ms ease",
                transform: isSelected ? "scale(1.1)" : "scale(1)",
              }}
            >
              <div
                style={{
                  width: 110,
                  height: 110,
                  borderRadius: "50%",
                  border: isSelected ? `4px solid ${char.color}` : "4px solid transparent",
                  boxShadow: isSelected
                    ? `0 8px 30px ${char.color}40`
                    : "0 4px 12px rgba(0,0,0,0.08)",
                  overflow: "hidden",
                  transition: "all 300ms ease",
                  backgroundColor: "#fff",
                }}
              >
                <img
                  src={char.image}
                  alt={char.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: isSelected ? char.color : "#3D3730",
                  fontFamily: "'Nunito', sans-serif",
                  transition: "color 200ms",
                }}
              >
                {char.name}
              </span>
            </button>
          );
        })}
      </div>

      {loading && (
        <p
          style={{
            marginTop: 32,
            color: "#A89E94",
            fontSize: 14,
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        >
          Starting session...
        </p>
      )}

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  );
}
