import type { Character } from "../constants/characters";

interface Props {
  character: Character;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export default function CharacterCard({ character, selected, onClick, disabled }: Props) {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      style={{
        position: "relative",
        cursor: disabled ? "wait" : "pointer",
        borderRadius: 16,
        padding: 20,
        transition: "all 200ms ease",
        border: selected ? "2px solid " + character.color : "1px solid #E8E0D8",
        backgroundColor: selected ? character.color + "08" : "#FFFFFF",
        boxShadow: selected
          ? `0 4px 12px ${character.color}20`
          : "0 1px 3px rgba(0,0,0,0.06)",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontSize: 13,
            fontWeight: 700,
            backgroundColor: character.color + "15",
            color: character.accent,
          }}
        >
          {character.initial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              fontWeight: 700,
              fontSize: 15,
              color: "#26221D",
              marginBottom: 2,
              fontFamily: "'Nunito', sans-serif",
            }}
          >
            {character.name}
          </h3>
          <p style={{ color: "#A89E94", fontSize: 12, fontWeight: 500, marginBottom: 6 }}>
            {character.tagline}
          </p>
          <p style={{ color: "#7A7168", fontSize: 12, lineHeight: 1.5 }}>
            {character.description}
          </p>
        </div>
      </div>
      {selected && (
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: character.color,
          }}
        />
      )}
    </div>
  );
}
