import type { CSSProperties, DragEvent } from "react";
import { useState } from "react";
import type { QuestionProps } from "./shared";
import { CARD, HEADING, BTN, BTN_SECONDARY, FEEDBACK_OK, FEEDBACK_ERR, str, arr } from "./shared";

interface ClassifierItem { label: string; correct_category: string }

function parseClassifierItems(raw: unknown): ClassifierItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((v) => {
    if (typeof v === "object" && v && "label" in v) return v as ClassifierItem;
    return { label: typeof v === "string" ? v : String(v), correct_category: "" };
  });
}

const PALETTES = [
  { bg: "#EDE9FE", border: "#7C3AED", text: "#5B21B6", light: "#F5F3FF", tag: "#7C3AED" },
  { bg: "#FEF3C7", border: "#D97706", text: "#92400E", light: "#FFFBEB", tag: "#D97706" },
  { bg: "#DBEAFE", border: "#2563EB", text: "#1E40AF", light: "#EFF6FF", tag: "#2563EB" },
  { bg: "#D1FAE5", border: "#059669", text: "#065F46", light: "#ECFDF5", tag: "#059669" },
];

export default function DragDropClassifier({ data, onAnswer }: QuestionProps) {
  const instruction = str(data.instruction);
  const categories = arr(data.categories);
  const classifierItems = parseClassifierItems(data.items);
  if (!instruction) return null;

  const itemLabels = classifierItems.map((it) => it.label).filter(Boolean);
  const correctMap = new Map(classifierItems.map((it) => [it.label, it.correct_category]));
  const cats = categories.length > 0 ? categories : ["Category A", "Category B"];

  const [buckets, setBuckets] = useState<Record<number, string[]>>({});
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  const placedItems = new Set(Object.values(buckets).flat());
  const allPlaced = itemLabels.length > 0 && placedItems.size === itemLabels.length;

  const onDrop = (e: DragEvent, catIdx: number) => {
    e.preventDefault();
    const item = e.dataTransfer.getData("text/plain");
    if (item && !placedItems.has(item)) {
      setBuckets((prev) => ({ ...prev, [catIdx]: [...(prev[catIdx] || []), item] }));
    }
    setDragOver(null);
    setDragging(null);
    setChecked(false);
  };

  const removeItem = (catIdx: number, item: string) => {
    if (checked) return;
    setBuckets((prev) => ({ ...prev, [catIdx]: (prev[catIdx] || []).filter((x) => x !== item) }));
  };

  const isCorrect = (item: string, catIdx: number) => correctMap.get(item) === cats[catIdx];
  const allCorrect = checked && Object.entries(buckets).every(([i, items]) =>
    items.every((item) => isCorrect(item, Number(i))),
  );

  const tagStyle = (item: string, catIdx: number): CSSProperties => {
    const p = PALETTES[catIdx % 4];
    if (!checked) return {
      display: "inline-flex", alignItems: "center", padding: "5px 12px",
      borderRadius: 20, fontSize: 12, fontWeight: 700,
      background: p.bg, color: p.text, border: `1.5px solid ${p.border}`,
      cursor: "pointer", transition: "all 0.15s",
      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    };
    const ok = isCorrect(item, catIdx);
    return {
      display: "inline-flex", alignItems: "center", padding: "5px 12px",
      borderRadius: 20, fontSize: 12, fontWeight: 700,
      background: ok ? "#ECFDF5" : "#FEF2F2",
      color: ok ? "#065F46" : "#991B1B",
      border: `1.5px solid ${ok ? "#059669" : "#DC2626"}`,
      cursor: "default",
    };
  };

  return (
    <div style={CARD}>
      <div style={HEADING}>{instruction}</div>

      {/* Item bank */}
      <div style={{
        display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap",
        padding: "14px 16px", background: "#F8FAFC", borderRadius: 14,
        border: "2px dashed #E2E8F0", minHeight: 52,
      }}>
        {itemLabels.length === 0 && (
          <span style={{ color: "#a0aec0", fontSize: 12 }}>Items will appear here</span>
        )}
        {itemLabels.map((w, i) => (
          placedItems.has(w) ? null : (
            <span
              key={i}
              draggable
              onDragStart={(e) => { e.dataTransfer.setData("text/plain", w); setDragging(w); }}
              onDragEnd={() => setDragging(null)}
              style={{
                display: "inline-flex", alignItems: "center",
                padding: "6px 14px", borderRadius: 24, fontSize: 13, fontWeight: 600,
                background: dragging === w ? "#E9D5FF" : "#fff",
                border: "2px solid #CBD5E0", cursor: "grab",
                boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                transition: "all 0.15s",
                transform: dragging === w ? "scale(0.95) rotate(-1deg)" : "scale(1)",
              }}
            >
              {w}
            </span>
          )
        ))}
      </div>

      {/* Category buckets */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(cats.length, 3)}, 1fr)`, gap: 12 }}>
        {cats.map((cat, i) => {
          const p = PALETTES[i % 4];
          const isOver = dragOver === i;
          const items = buckets[i] || [];
          return (
            <div key={i}>
              {/* Category header */}
              <div style={{
                padding: "6px 12px", borderRadius: "10px 10px 0 0",
                background: p.bg, color: p.text,
                fontWeight: 700, fontSize: 13, textAlign: "center" as const,
                border: `2px solid ${p.border}`, borderBottom: "none",
              }}>
                {cat}
              </div>
              {/* Drop zone */}
              <div
                onDragOver={(e) => { if (!checked) { e.preventDefault(); setDragOver(i); } }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => { if (!checked) onDrop(e, i); }}
                style={{
                  borderRadius: "0 0 12px 12px",
                  border: `2px solid ${isOver ? p.border : p.border}`,
                  borderTop: "none",
                  background: isOver ? p.bg : items.length ? p.light : "#FAFAFA",
                  minHeight: 80, padding: 10,
                  display: "flex", flexWrap: "wrap" as const, gap: 6,
                  alignContent: "flex-start",
                  transition: "all 0.15s",
                  transform: isOver ? "scale(1.01)" : "scale(1)",
                }}
              >
                {items.length === 0 && (
                  <div style={{ width: "100%", textAlign: "center" as const, color: "#CBD5E0", fontSize: 12, fontWeight: 600, paddingTop: 8 }}>
                    drop here
                  </div>
                )}
                {items.map((item) => (
                  <span key={item} onClick={() => removeItem(i, item)} style={tagStyle(item, i)}>
                    {item}
                    {!checked && <span style={{ marginLeft: 4, opacity: 0.5, fontSize: 10 }}>✕</span>}
                    {checked && (isCorrect(item, i) ? " ✓" : " ✗")}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {allPlaced && !checked && (
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <button style={BTN} onClick={() => { setChecked(true); onAnswer?.({ buckets, correct: allCorrect }); }}>
            Check Answer
          </button>
        </div>
      )}
      {checked && (
        <div style={allCorrect ? FEEDBACK_OK : FEEDBACK_ERR}>
          {allCorrect ? "🎉 Perfect! All items sorted correctly." : "Almost! Some items are wrong — tap them to remove and try again."}
        </div>
      )}
      {checked && !allCorrect && (
        <div style={{ marginTop: 8, textAlign: "center" }}>
          <button style={BTN_SECONDARY} onClick={() => { setBuckets({}); setChecked(false); }}>Try Again</button>
        </div>
      )}
    </div>
  );
}
