import { useState, useRef } from "react";
import type { QuestionProps } from "./shared";
import { CARD, HEADING, str } from "./shared";

export default function DrawScribble({ data, onAnswer }: QuestionProps) {
  const prompt = str(data.prompt);
  if (!prompt) return null;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [tool, setTool] = useState<"Pen" | "Eraser">("Pen");
  const [color, setColor] = useState("#805AD5");
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setDrawing(true);
    lastPos.current = getPos(e);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d")!;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current!.x, lastPos.current!.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = tool === "Eraser" ? "#ffffff" : color;
    ctx.lineWidth = tool === "Eraser" ? 12 : 2;
    ctx.lineCap = "round";
    ctx.stroke();
    lastPos.current = pos;
  };

  const stopDraw = () => { setDrawing(false); lastPos.current = null; };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  return (
    <div style={CARD}>
      <div style={HEADING}>{prompt}</div>
      <canvas
        ref={canvasRef} width={400} height={150}
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
        style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "crosshair", width: "100%", height: 150 }}
      />
      <div style={{ display: "flex", gap: 6, marginTop: 8, justifyContent: "center", alignItems: "center" }}>
        {(["Pen", "Eraser"] as const).map((t) => (
          <div key={t} onClick={() => setTool(t)} style={{ padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: tool === t ? "#805AD5" : "#EDF2F7", color: tool === t ? "#fff" : "#4A5568", cursor: "pointer" }}>{t}</div>
        ))}
        <div onClick={clearCanvas} style={{ padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: "#EDF2F7", color: "#4A5568", cursor: "pointer" }}>Clear</div>
        {["#805AD5", "#E53E3E", "#3182CE", "#38A169", "#1a202c"].map((c) => (
          <div key={c} onClick={() => { setColor(c); setTool("Pen"); }} style={{ width: 18, height: 18, borderRadius: "50%", background: c, border: color === c ? "2px solid #1a202c" : "2px solid transparent", cursor: "pointer" }} />
        ))}
      </div>
    </div>
  );
}
