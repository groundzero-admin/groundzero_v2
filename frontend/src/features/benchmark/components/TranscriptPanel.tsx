import { useEffect, useRef } from "react";

interface Props {
  history: { speaker: string; text: string }[];
  characterInitial: string;
  characterColor: string;
}

export default function TranscriptPanel({ history, characterInitial, characterColor }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
      {history.map((msg, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            justifyContent: msg.speaker === "student" ? "flex-end" : "flex-start",
            alignItems: "flex-start",
            gap: 10,
          }}
        >
          {msg.speaker === "ai" && (
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontSize: 10,
                fontWeight: 700,
                backgroundColor: characterColor + "20",
                color: characterColor,
                marginTop: 2,
              }}
            >
              {characterInitial}
            </div>
          )}
          <div
            style={{
              maxWidth: "70%",
              borderRadius: 12,
              padding: "10px 16px",
              fontSize: 13,
              lineHeight: 1.6,
              ...(msg.speaker === "student"
                ? {
                    backgroundColor: "#805AD5",
                    color: "#FFFFFF",
                    borderBottomRightRadius: 4,
                  }
                : {
                    backgroundColor: "#F5F0EB",
                    color: "#3D3730",
                    borderBottomLeftRadius: 4,
                    border: "1px solid #E8E0D8",
                  }),
            }}
          >
            {msg.text || (
              <span style={{ opacity: 0.4, fontSize: 12 }}>Thinking...</span>
            )}
          </div>
          {msg.speaker === "student" && (
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontSize: 10,
                fontWeight: 700,
                backgroundColor: "#805AD520",
                color: "#805AD5",
                marginTop: 2,
              }}
            >
              ME
            </div>
          )}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
