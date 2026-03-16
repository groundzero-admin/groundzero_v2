import type { CSSProperties, DragEvent } from "react";
import { useState } from "react";
import type { QuestionProps } from "./shared";
import { CARD, HEADING, TAG, TAG_USED, ZONE, ZONE_HOVER, BTN, BTN_SECONDARY, FEEDBACK_OK, FEEDBACK_ERR, str, arr } from "./shared";

interface ClassifierItem { label: string; correct_category: string }

function parseClassifierItems(raw: unknown): ClassifierItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((v) => {
    if (typeof v === "object" && v && "label" in v) return v as ClassifierItem;
    return { label: typeof v === "string" ? v : String(v), correct_category: "" };
  });
}

const CAT_COLORS = ["#805AD5", "#D69E2E", "#3182CE", "#DD6B20"];
const CAT_BGS = ["#FAF5FF", "#FFFFF0", "#EBF8FF", "#FFFAF0"];

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
    setChecked(false);
  };

  const removeItem = (catIdx: number, item: string) => {
    if (checked) return;
    setBuckets((prev) => ({ ...prev, [catIdx]: (prev[catIdx] || []).filter((x) => x !== item) }));
  };

  const isItemCorrect = (item: string, catIdx: number) => correctMap.get(item) === cats[catIdx];
  const allCorrect = checked && Object.entries(buckets).every(([catIdxStr, items]) =>
    items.every((item) => isItemCorrect(item, Number(catIdxStr))),
  );

  const itemStyle = (item: string, catIdx: number): CSSProperties => {
    const base: CSSProperties = { ...TAG, borderStyle: "solid" };
    if (!checked) return { ...base, cursor: "pointer", borderColor: CAT_COLORS[catIdx % 4], background: "#fff" };
    const correct = isItemCorrect(item, catIdx);
    return {
      ...base, cursor: "default",
      borderColor: correct ? "#38A169" : "#E53E3E",
      background: correct ? "#F0FFF4" : "#FFF5F5",
      color: correct ? "#276749" : "#C53030",
    };
  };

  const handleCheck = () => {
    setChecked(true);
    onAnswer?.({ buckets, correct: allCorrect });
  };

  return (
    <div style={CARD}>
      <div style={HEADING}>{instruction}</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {itemLabels.map((w, i) => (
          <span key={i} draggable={!placedItems.has(w) && !checked} onDragStart={(e) => { e.dataTransfer.setData("text/plain", w); }} style={placedItems.has(w) ? TAG_USED : TAG}>{w}</span>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cats.length}, 1fr)`, gap: 10 }}>
        {cats.map((cat, i) => (
          <div key={i}>
            <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 6, color: CAT_COLORS[i % 4] }}>{cat}</div>
            <div
              onDragOver={(e) => { if (!checked) { e.preventDefault(); setDragOver(i); } }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => { if (!checked) onDrop(e, i); }}
              style={{
                ...(dragOver === i ? ZONE_HOVER : ZONE),
                flexDirection: "column", gap: 4, minHeight: 60,
                ...(buckets[i]?.length && !checked ? { border: `2px solid ${CAT_COLORS[i % 4]}`, background: CAT_BGS[i % 4] } : {}),
              }}
            >
              {(buckets[i] || []).length > 0 ? (buckets[i] || []).map((item) => (
                <span key={item} onClick={() => removeItem(i, item)} style={itemStyle(item, i)}>{item}</span>
              )) : "Drop here"}
            </div>
          </div>
        ))}
      </div>
      {allPlaced && !checked && (
        <div style={{ marginTop: 12, textAlign: "center" }}>
          <button style={BTN} onClick={handleCheck}>Check Answer</button>
        </div>
      )}
      {checked && (
        <div style={allCorrect ? FEEDBACK_OK : FEEDBACK_ERR}>
          {allCorrect ? "Correct! All items are in the right category." : "Some items are in the wrong category. Click Reset to try again."}
        </div>
      )}
      {checked && !allCorrect && (
        <div style={{ marginTop: 8, textAlign: "center" }}>
          <button style={BTN_SECONDARY} onClick={() => { setBuckets({}); setChecked(false); }}>Reset</button>
        </div>
      )}
    </div>
  );
}
