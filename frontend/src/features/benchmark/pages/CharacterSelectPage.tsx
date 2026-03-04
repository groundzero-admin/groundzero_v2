import { useState } from "react";
import { useNavigate } from "react-router";
import { useBenchmarkSession } from "../context/BenchmarkSessionContext";
import { CHARACTERS } from "../constants/characters";
import CharacterCard from "../components/CharacterCard";
import { benchmarkApi } from "../api";

export default function CharacterSelectPage() {
  const navigate = useNavigate();
  const { voiceProvider, setCharacter, setSession } = useBenchmarkSession();
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
        voice_provider: voiceProvider,
      });
      setSession(session.id);
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
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h1
          style={{
            fontSize: "1.5rem",
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 800,
            color: "#26221D",
            marginBottom: 8,
          }}
        >
          Select a Conversation Guide
        </h1>
        <p style={{ color: "#7A7168", fontSize: 14 }}>
          Choose a character for the assessment session
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 12,
          maxWidth: 640,
          width: "100%",
        }}
      >
        {CHARACTERS.map((char) => (
          <CharacterCard
            key={char.id}
            character={char}
            selected={selected === char.id}
            onClick={() => handleSelect(char)}
            disabled={loading}
          />
        ))}
      </div>

      {loading && (
        <p
          style={{
            marginTop: 24,
            color: "#A89E94",
            fontSize: 14,
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        >
          Creating session...
        </p>
      )}
    </div>
  );
}
