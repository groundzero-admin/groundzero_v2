import { useState, useRef, useEffect, useCallback } from "react";
import type { QuestionProps } from "./shared";
import { CARD, HEADING, BTN, str } from "./shared";
import { type Shape, type ToolType, TOOLS, COLORS, genId, getCanvasPos, hitTest, shapeCenter, renderCanvas, drawPenSegment } from "./drawUtils";

export default function DrawScribble({ data, onAnswer, resetKey }: QuestionProps) {
  const prompt = str(data.prompt);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [history, setHistory] = useState<Shape[][]>([]);
  const [tool, setTool] = useState<ToolType>("pen");
  const [color, setColor] = useState("#1a202c");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  // Inline text editing: which shape + position on screen
  const [editing, setEditing] = useState<{ id: string; pctX: number; pctY: number } | null>(null);
  const editRef = useRef<HTMLInputElement>(null);
  const drag = useRef<{ mode: "none" | "draw" | "move"; sx: number; sy: number; id?: string; ox?: number; oy?: number; pts?: { x: number; y: number }[] }>({ mode: "none", sx: 0, sy: 0 });

  useEffect(() => { if (resetKey === undefined) return; setShapes([]); setHistory([]); setTool("pen"); setColor("#1a202c"); setSelectedId(null); setSubmitted(false); setEditing(null); }, [resetKey]);

  const render = useCallback(() => { if (canvasRef.current) renderCanvas(canvasRef.current, shapes, selectedId); }, [shapes, selectedId]);
  useEffect(() => { render(); }, [render]);
  useEffect(() => { if (editing) setTimeout(() => editRef.current?.focus(), 0); }, [editing]);

  if (!prompt) return null;

  const pushHistory = () => setHistory(h => [...h.slice(-19), shapes]);
  const undo = () => { if (!history.length) return; setShapes(history[history.length - 1]); setHistory(h => h.slice(0, -1)); setSelectedId(null); };

  const startEditing = (shapeId: string) => {
    const s = shapes.find(x => x.id === shapeId);
    if (!s || s.type === "pen") return;
    const canvas = canvasRef.current!;
    const c = shapeCenter(s);
    setEditing({ id: shapeId, pctX: (c.x / canvas.width) * 100, pctY: (c.y / canvas.height) * 100 });
  };

  const commitEdit = (value: string) => {
    if (editing) {
      pushHistory();
      setShapes(p => p.map(s => s.id === editing.id ? { ...s, text: value || undefined } : s));
    }
    setEditing(null);
  };

  const handleDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (submitted || editing) return;
    e.preventDefault();
    const pos = getCanvasPos(canvasRef.current!, e);

    if (tool === "select") {
      for (let i = shapes.length - 1; i >= 0; i--) {
        if (hitTest(shapes[i], pos.x, pos.y)) {
          setSelectedId(shapes[i].id);
          drag.current = { mode: "move", sx: pos.x, sy: pos.y, id: shapes[i].id, ox: pos.x - shapes[i].x, oy: pos.y - shapes[i].y };
          pushHistory();
          return;
        }
      }
      setSelectedId(null);
      return;
    }
    if (tool === "eraser") {
      for (let i = shapes.length - 1; i >= 0; i--) {
        if (hitTest(shapes[i], pos.x, pos.y)) { pushHistory(); setShapes(p => p.filter(s => s.id !== shapes[i].id)); setSelectedId(null); return; }
      }
      return;
    }
    if (tool === "pen") {
      drag.current = { mode: "draw", sx: pos.x, sy: pos.y, pts: [{ x: pos.x, y: pos.y }] };
      return;
    }
    pushHistory();
    const id = genId();
    drag.current = { mode: "draw", sx: pos.x, sy: pos.y, id };
    setShapes(p => [...p, { id, type: tool as Shape["type"], x: pos.x, y: pos.y, w: 0, h: 0, color }]);
    setSelectedId(id);
  };

  const handleMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (submitted || editing || drag.current.mode === "none") return;
    e.preventDefault();
    const pos = getCanvasPos(canvasRef.current!, e);
    const d = drag.current;
    if (d.mode === "move" && d.id) {
      setShapes(p => p.map(s => s.id === d.id ? { ...s, x: pos.x - (d.ox ?? 0), y: pos.y - (d.oy ?? 0) } : s));
    } else if (d.mode === "draw") {
      if (tool === "pen" && d.pts) { d.pts.push(pos); drawPenSegment(canvasRef.current!, d.pts, color); }
      else if (d.id) { setShapes(p => p.map(s => s.id === d.id ? { ...s, w: pos.x - d.sx, h: pos.y - d.sy } : s)); }
    }
  };

  const handleUp = () => {
    if (submitted || editing) return;
    const d = drag.current;
    if (d.mode === "draw" && tool === "pen" && d.pts && d.pts.length >= 2) {
      pushHistory();
      setShapes(p => [...p, { id: genId(), type: "pen", x: 0, y: 0, w: 0, h: 0, color, points: d.pts }]);
    }
    if (d.mode === "draw" && d.id) {
      const tooSmall = shapes.find(s => s.id === d.id && Math.abs(s.w) <= 4 && Math.abs(s.h) <= 4);
      if (tooSmall) {
        setShapes(p => p.filter(s => s.id !== d.id));
      } else {
        // Auto-open text input on the newly drawn shape
        setTimeout(() => startEditing(d.id!), 50);
      }
    }
    drag.current = { mode: "none", sx: 0, sy: 0 };
  };

  // Double-click to edit text on an existing shape
  const handleDblClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (submitted) return;
    const pos = getCanvasPos(canvasRef.current!, e);
    for (let i = shapes.length - 1; i >= 0; i--) {
      if (hitTest(shapes[i], pos.x, pos.y)) { startEditing(shapes[i].id); return; }
    }
  };

  const handleSubmit = () => {
    if (!canvasRef.current) return;
    setSubmitted(true);
    onAnswer?.({ drawing: canvasRef.current.toDataURL("image/png"), shapes: shapes.map(({ id: _, ...r }) => r) });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (submitted || editing) return;
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        pushHistory(); setShapes(p => p.filter(s => s.id !== selectedId)); setSelectedId(null);
      }
      if (e.key === "z" && (e.metaKey || e.ctrlKey)) undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const active = (id: ToolType) => tool === id;
  const tbtn = (id: ToolType) => ({
    padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600 as const, border: "none",
    background: active(id) ? "#7C3AED" : "#F1F5F9", color: active(id) ? "#fff" : "#475569",
    cursor: submitted ? "default" as const : "pointer" as const, display: "flex" as const, alignItems: "center" as const, gap: 3, transition: "all 0.15s",
  });

  const editingShape = editing ? shapes.find(s => s.id === editing.id) : null;

  return (
    <div style={CARD}>
      <div style={HEADING}>{prompt}</div>
      <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
        {TOOLS.map(t => <button key={t.id} onClick={() => !submitted && setTool(t.id)} style={tbtn(t.id)}><span style={{ fontSize: 13 }}>{t.icon}</span> {t.label}</button>)}
        <div style={{ width: 1, height: 20, background: "#E2E8F0", margin: "0 4px" }} />
        {COLORS.map(c => <div key={c} onClick={() => !submitted && setColor(c)} style={{ width: 20, height: 20, borderRadius: "50%", background: c, border: color === c ? "3px solid #7C3AED" : "2px solid #E2E8F0", cursor: submitted ? "default" : "pointer", transition: "all 0.15s" }} />)}
        <div style={{ width: 1, height: 20, background: "#E2E8F0", margin: "0 4px" }} />
        <button onClick={undo} disabled={!history.length || submitted} style={{ ...tbtn("select"), background: "#F1F5F9", color: history.length ? "#475569" : "#CBD5E1", opacity: history.length ? 1 : 0.5 }}>↩ Undo</button>
      </div>
      <div style={{ position: "relative" }}>
        <canvas ref={canvasRef} width={600} height={360}
          onMouseDown={handleDown} onMouseMove={handleMove} onMouseUp={handleUp} onMouseLeave={handleUp}
          onTouchStart={handleDown} onTouchMove={handleMove} onTouchEnd={handleUp}
          onDoubleClick={handleDblClick}
          style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, cursor: submitted ? "default" : tool === "select" ? "default" : tool === "eraser" ? "not-allowed" : "crosshair", width: "100%", height: "auto", aspectRatio: "5/3", touchAction: "none", pointerEvents: (submitted || editing) ? "none" : "auto" }} />
        {editing && (
          <input ref={editRef} autoFocus key={editing.id} defaultValue={editingShape?.text ?? ""}
            onKeyDown={e => { if (e.key === "Enter") commitEdit((e.target as HTMLInputElement).value); if (e.key === "Escape") setEditing(null); }}
            onBlur={e => commitEdit(e.target.value)}
            placeholder="Type label..."
            style={{ position: "absolute", left: `${editing.pctX}%`, top: `${editing.pctY}%`, transform: "translate(-50%, -50%)", fontSize: 13, fontWeight: 600, fontFamily: "system-ui, -apple-system, sans-serif", color: editingShape?.color ?? "#1a202c", background: "#fff", border: "2px solid #7C3AED", borderRadius: 8, padding: "6px 12px", outline: "none", minWidth: 80, textAlign: "center" as const, zIndex: 10, boxShadow: "0 2px 12px rgba(124,58,237,0.2)" }} />
        )}
      </div>
      <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 4, textAlign: "center" }}>Double-click any shape to add a label</div>
      <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "center" }}>
        {selectedId && !submitted && <button onClick={() => { pushHistory(); setShapes(p => p.filter(s => s.id !== selectedId)); setSelectedId(null); }} style={{ padding: "5px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", cursor: "pointer" }}>Delete</button>}
        {shapes.length > 0 && !submitted && <button onClick={() => { pushHistory(); setShapes([]); setSelectedId(null); }} style={{ padding: "5px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "#F1F5F9", color: "#475569", border: "1px solid #E2E8F0", cursor: "pointer" }}>Clear all</button>}
      </div>
      {!submitted ? (
        <div style={{ marginTop: 10, textAlign: "center" }}><button style={BTN} onClick={handleSubmit}>Submit</button></div>
      ) : (
        <div style={{ marginTop: 10, padding: "10px 14px", background: "#F0FFF4", border: "1px solid #9AE6B4", borderRadius: 8, fontSize: 13, color: "#276749" }}>Drawing submitted.</div>
      )}
    </div>
  );
}
