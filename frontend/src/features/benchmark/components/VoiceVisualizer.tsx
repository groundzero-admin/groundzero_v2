interface Props {
  isActive: boolean;
  color?: string;
}

export default function VoiceVisualizer({ isActive, color = "#805AD5" }: Props) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3, height: 32 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 4,
            borderRadius: 999,
            backgroundColor: isActive ? color : "#E8E0D8",
            height: isActive ? undefined : 4,
            minHeight: 4,
            maxHeight: 24,
            transition: "all 300ms ease",
            animation: isActive ? `bmWave 0.8s ease-in-out ${i * 0.1}s infinite` : "none",
          }}
        />
      ))}
    </div>
  );
}
