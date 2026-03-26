import { useState, useEffect } from "react";
import type { DragEvent } from "react";
import type { QuestionProps } from "./shared";
import { CARD, HEADING, TAG, TAG_USED, ZONE, ZONE_HOVER, ZONE_FILLED, ZONE_CORRECT, ZONE_WRONG, BTN, BTN_SECONDARY, FEEDBACK_OK, FEEDBACK_ERR, str, arr } from "./shared";

export default function DragDropPlacement({ data, onAnswer, resetKey, hideInlineSubmit }: QuestionProps) {
  const instruction = str(data.instruction);
  const items = arr(data.items);
  const zones = arr(data.zones);
  const zoneList = zones.length > 0 ? zones : items.map((_, i) => `Zone ${i + 1}`);
  const multiStepMode = data.__multi_step_mode === true;

  const [placed, setPlaced] = useState<Record<number, string>>({});
  const [dragOver, setDragOver] = useState<number | null>(null);
  /** Tap-to-place: select item in bank, then tap a zone. */
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (resetKey === undefined) return;
    setPlaced({});
    setDragOver(null);
    setSelected(null);
    setChecked(false);
  }, [resetKey]);

  if (!instruction) return null;

  const usedItems = new Set(Object.values(placed));

  const onDragStart = (e: DragEvent, item: string) => {
    e.dataTransfer.setData("text/plain", item);
    e.dataTransfer.effectAllowed = "move";
    setSelected(null);
  };

  const placeInZone = (zoneIdx: number, item: string) => {
    if (checked || !item) return;
    setPlaced((prev) => {
      const next: Record<number, string> = { ...prev };
      for (const k of Object.keys(next)) {
        const ki = Number(k);
        if (next[ki] === item) delete next[ki];
      }
      next[zoneIdx] = item;
      if (multiStepMode) {
        const stepCorrect = zoneList.every((z, i) => next[i] === z);
        onAnswer?.({ placed: next, correct: stepCorrect });
      }
      return next;
    });
    setSelected(null);
    setDragOver(null);
    setChecked(false);
  };

  const onDrop = (e: DragEvent, zoneIdx: number) => {
    e.preventDefault();
    const item = e.dataTransfer.getData("text/plain");
    if (item) placeInZone(zoneIdx, item);
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
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10, fontWeight: 600 }}>
        Drag to a zone or tap an item, then tap the matching zone.
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {items.map((w, i) => (
          <span
            key={i}
            role="button"
            tabIndex={0}
            draggable={!usedItems.has(w) && !checked}
            onDragStart={(e) => onDragStart(e, w)}
            onClick={() => {
              if (checked || usedItems.has(w)) return;
              setSelected((s) => (s === w ? null : w));
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (!checked && !usedItems.has(w)) setSelected((s) => (s === w ? null : w));
              }
            }}
            style={{
              ...(usedItems.has(w) ? TAG_USED : TAG),
              ...(selected === w && !usedItems.has(w)
                ? { boxShadow: "0 0 0 3px rgba(124,58,237,0.35)", borderColor: "#7C3AED" }
                : {}),
              touchAction: "manipulation",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {w}
          </span>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {zoneList.map((z, i) => (
          <div
            key={i}
            role={selected && !checked ? "button" : undefined}
            tabIndex={selected && !checked ? 0 : undefined}
            onDragOver={(e) => { if (!checked) { e.preventDefault(); setDragOver(i); } }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => { if (!checked) onDrop(e, i); }}
            onClick={() => {
              if (checked) return;
              if (selected && !usedItems.has(selected)) {
                placeInZone(i, selected);
                return;
              }
              if (placed[i]) removeFromZone(i);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (checked) return;
                if (selected && !usedItems.has(selected)) placeInZone(i, selected);
                else if (placed[i]) removeFromZone(i);
              }
            }}
            style={{
              ...zoneStyle(i),
              cursor: selected && !checked ? "pointer" : placed[i] && !checked ? "pointer" : undefined,
              touchAction: "manipulation",
            }}
          >
            {placed[i] || (selected && !checked ? `Tap to place — ${z}` : z)}
          </div>
        ))}
      </div>
      {allPlaced && !checked && !multiStepMode && !hideInlineSubmit && (
        <div style={{ marginTop: 12, textAlign: "center" }}>
          <button type="button" style={BTN} onClick={handleCheck}>Submit</button>
        </div>
      )}
      {checked && !multiStepMode && (
        <div style={allCorrect ? FEEDBACK_OK : FEEDBACK_ERR}>
          {allCorrect ? "Correct!" : "Not quite right. Click Reset to try again."}
        </div>
      )}
      {checked && !allCorrect && !multiStepMode && (
        <div style={{ marginTop: 8, textAlign: "center" }}>
          <button style={BTN_SECONDARY} onClick={() => { setPlaced({}); setChecked(false); }}>Reset</button>
        </div>
      )}
    </div>
  );
}
