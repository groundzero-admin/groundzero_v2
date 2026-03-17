import { useState, useEffect } from "react";
import type { DragEvent } from "react";
import type { QuestionProps } from "./shared";
import { CARD, HEADING, TAG, TAG_USED, ZONE, ZONE_HOVER, ZONE_FILLED, ZONE_CORRECT, ZONE_WRONG, BTN, BTN_SECONDARY, FEEDBACK_OK, FEEDBACK_ERR, str, arr } from "./shared";

export default function DragDropPlacement({ data, onAnswer, resetKey }: QuestionProps) {
  const instruction = str(data.instruction);
  const items = arr(data.items);
  const zones = arr(data.zones);
  if (!instruction) return null;

  const zoneList = zones.length > 0 ? zones : items.map((_, i) => `Zone ${i + 1}`);
  const [placed, setPlaced] = useState<Record<number, string>>({});
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (resetKey === undefined) return;
    setPlaced({});
    setDragOver(null);
    setChecked(false);
  }, [resetKey]);

  const usedItems = new Set(Object.values(placed));

  const onDragStart = (e: DragEvent, item: string) => {
    e.dataTransfer.setData("text/plain", item);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDrop = (e: DragEvent, zoneIdx: number) => {
    e.preventDefault();
    const item = e.dataTransfer.getData("text/plain");
    if (item) setPlaced((prev) => ({ ...prev, [zoneIdx]: item }));
    setDragOver(null);
    setChecked(false);
  };

  const removeFromZone = (zoneIdx: number) => {
    if (checked) return;
    setPlaced((prev) => { const n = { ...prev }; delete n[zoneIdx]; return n; });
  };

  const allPlaced = Object.keys(placed).length === zoneList.length;
  const allCorrect = zoneList.every((z, i) => placed[i] === z);

  const zoneStyle = (i: number) => {
    if (!placed[i]) return dragOver === i ? ZONE_HOVER : ZONE;
    if (!checked) return ZONE_FILLED;
    return placed[i] === zoneList[i] ? ZONE_CORRECT : ZONE_WRONG;
  };

  const handleCheck = () => {
    setChecked(true);
    onAnswer?.({ placed, correct: allCorrect });
  };

  return (
    <div style={CARD}>
      <div style={HEADING}>{instruction}</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {items.map((w, i) => (
          <span key={i} draggable={!usedItems.has(w) && !checked} onDragStart={(e) => onDragStart(e, w)} style={usedItems.has(w) ? TAG_USED : TAG}>{w}</span>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {zoneList.map((z, i) => (
          <div
            key={i}
            onDragOver={(e) => { if (!checked) { e.preventDefault(); setDragOver(i); } }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => { if (!checked) onDrop(e, i); }}
            onClick={() => placed[i] && removeFromZone(i)}
            style={zoneStyle(i)}
          >
            {placed[i] || z}
          </div>
        ))}
      </div>
      {allPlaced && !checked && (
        <div style={{ marginTop: 12, textAlign: "center" }}>
          <button style={BTN} onClick={handleCheck}>Submit</button>
        </div>
      )}
      {checked && (
        <div style={allCorrect ? FEEDBACK_OK : FEEDBACK_ERR}>
          {allCorrect ? "Correct!" : "Not quite right. Click Reset to try again."}
        </div>
      )}
      {checked && !allCorrect && (
        <div style={{ marginTop: 8, textAlign: "center" }}>
          <button style={BTN_SECONDARY} onClick={() => { setPlaced({}); setChecked(false); }}>Reset</button>
        </div>
      )}
    </div>
  );
}
