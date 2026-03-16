import { useState, useRef } from "react";
import type { QuestionProps } from "./shared";
import { CARD, HEADING, TEXT_INPUT, BTN, str } from "./shared";

export default function AudioResponse({ data, onAnswer }: QuestionProps) {
  const prompt = str(data.prompt);
  const audioUrl = str(data.audio_url);
  const allowReplay = data.allow_replay !== false;
  if (!prompt) return null;

  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [played, setPlayed] = useState(false);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
      setPlayed(true);
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
    onAnswer?.({ text });
  };

  return (
    <div style={CARD}>
      <div style={HEADING}>{prompt}</div>

      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setPlaying(false)}
          onPause={() => setPlaying(false)}
        />
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: "#fff", borderRadius: 8, border: "1px solid #e2e8f0", marginBottom: 12 }}>
        <div
          onClick={(!played || allowReplay) && !playing ? togglePlay : playing ? togglePlay : undefined}
          style={{
            width: 40, height: 40, borderRadius: "50%",
            background: playing ? "#E53E3E" : (!played || allowReplay) ? "#805AD5" : "#CBD5E0",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 16,
            cursor: playing || (!played || allowReplay) ? "pointer" : "not-allowed",
            transition: "background 0.2s",
          }}
        >
          {playing ? "⏸" : "▶"}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 2 }}>
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} style={{ width: 3, height: 6 + Math.sin(i * 0.5) * 10, background: playing && i < 18 ? "#805AD5" : "#CBD5E0", borderRadius: 2, transition: "background 0.3s" }} />
            ))}
          </div>
          <div style={{ fontSize: 11, color: "#a0aec0", marginTop: 4 }}>
            {audioUrl || "audio_clip.mp3"}
            {!allowReplay && played && !playing && <span style={{ marginLeft: 8, color: "#E53E3E" }}>• played once</span>}
          </div>
        </div>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type what you remember..."
        disabled={submitted}
        style={{ ...TEXT_INPUT, resize: "vertical" as const, minHeight: 50 }}
      />

      {!submitted && (
        <div style={{ marginTop: 10, textAlign: "center" }}>
          <button style={BTN} onClick={handleSubmit} disabled={!text.trim()}>
            Submit Answer
          </button>
        </div>
      )}
      {submitted && (
        <div style={{ marginTop: 10, padding: "10px 14px", background: "#F0FFF4", border: "1px solid #9AE6B4", borderRadius: 8, fontSize: 13, color: "#276749" }}>
          Answer submitted.
        </div>
      )}
    </div>
  );
}
