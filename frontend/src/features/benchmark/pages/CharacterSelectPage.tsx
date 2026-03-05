import { useState } from "react";
import { useNavigate } from "react-router";
import { useBenchmarkSession } from "../context/BenchmarkSessionContext";
import { CHARACTERS } from "../constants/characters";
import CharacterCard from "../components/CharacterCard";
import { benchmarkApi } from "../api";

const VOICE_PROVIDERS = [
  { id: "sarvam_realtime", label: "Sarvam Conversational AI", tag: "Realtime" },
  { id: "sarvam", label: "Sarvam Turn-based", tag: "Turn-based" },
  { id: "elevenlabs_realtime", label: "ElevenLabs Conversational AI", tag: "Realtime" },
  { id: "elevenlabs", label: "ElevenLabs Turn-based", tag: "Turn-based" },
];

export default function CharacterSelectPage() {
  const navigate = useNavigate();
  const { voiceProvider, setProvider, setCharacter, setSession } = useBenchmarkSession();
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

      {/* Voice provider selector */}
      <div style={{ marginTop: 32, maxWidth: 640, width: "100%" }}>
        <div style={{ fontSize: 12, color: "#A89E94", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>
          Voice Provider
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          {VOICE_PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => setProvider(p.id)}
              disabled={loading}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: voiceProvider === p.id ? "2px solid #805AD5" : "1px solid #E8E0D8",
                backgroundColor: voiceProvider === p.id ? "#805AD515" : "#FFFFFF",
                cursor: loading ? "default" : "pointer",
                textAlign: "left",
                opacity: loading ? 0.5 : 1,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: voiceProvider === p.id ? "#805AD5" : "#3D3730" }}>
                {p.label}
              </div>
              <div style={{
                display: "inline-block", marginTop: 4, padding: "2px 6px", borderRadius: 4,
                fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.3px",
                backgroundColor: p.tag === "Realtime" ? "#38A16915" : "#ED893615",
                color: p.tag === "Realtime" ? "#38A169" : "#ED8936",
              }}>
                {p.tag}
              </div>
            </button>
          ))}
        </div>
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
