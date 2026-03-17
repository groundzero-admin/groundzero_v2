import { useState, useRef } from "react";
import type { QuestionProps } from "./shared";
import { CARD, HEADING, BTN, str } from "./shared";

export default function DrawScribble({ data, onAnswer, resetKey }: QuestionProps) {
  const prompt = str(data.prompt);
  if (!prompt) return null;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [tool, setTool] = useState<"Pen" | "Eraser">("Pen");
  const [color, setColor] = useState("#805AD5");
  const [submitted, setSubmitted] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (resetKey === undefined) return;
    setSubmitted(false);
    setTool("Pen");
    setColor("#805AD5");
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, [resetKey]);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const r = canvasRef.current!.getBoundingClientRect();
    const scaleX = canvasRef.current!.width / r.width;
    const scaleY = canvasRef.current!.height / r.height;
    if ("touches" in e) {
      const t = e.touches[0];
      return { x: (t.clientX - r.left) * scaleX, y: (t.clientY - r.top) * scaleY };
    }
    return { x: (e.clientX - r.left) * scaleX, y: (e.clientY - r.top) * scaleY };
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setDrawing(true);
    lastPos.current = getPos(e);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!drawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d")!;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current!.x, lastPos.current!.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = tool === "Eraser" ? "#ffffff" : color;
    ctx.lineWidth = tool === "Eraser" ? 16 : 3;
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

  const handleSubmit = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    setSubmitted(true);
    onAnswer?.({ drawing: dataUrl });
  };

  return (
    <div style={CARD}>
      <div style={HEADING}>{prompt}</div>
      <canvas
        ref={canvasRef}
        width={400} height={200}
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
        style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, cursor: submitted ? "default" : "crosshair", width: "100%", height: 200, touchAction: "none", pointerEvents: submitted ? "none" : "auto" }}
      />
      <div style={{ display: "flex", gap: 6, marginTop: 8, justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
        {(["Pen", "Eraser"] as const).map((t) => (
          <div key={t} onClick={() => !submitted && setTool(t)} style={{ padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: tool === t ? "#805AD5" : "#EDF2F7", color: tool === t ? "#fff" : "#4A5568", cursor: submitted ? "default" : "pointer" }}>{t}</div>
        ))}
        <div onClick={() => !submitted && clearCanvas()} style={{ padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: "#EDF2F7", color: "#4A5568", cursor: submitted ? "default" : "pointer" }}>Clear</div>
        {["#805AD5", "#E53E3E", "#3182CE", "#38A169", "#1a202c"].map((c) => (
          <div key={c} onClick={() => { if (!submitted) { setColor(c); setTool("Pen"); } }} style={{ width: 18, height: 18, borderRadius: "50%", background: c, border: color === c ? "2px solid #1a202c" : "2px solid transparent", cursor: submitted ? "default" : "pointer" }} />
        ))}
      </div>
      {!submitted ? (
        <div style={{ marginTop: 10, textAlign: "center" }}>
          <button style={BTN} onClick={handleSubmit}>Submit</button>
        </div>
      ) : (
        <div style={{ marginTop: 10, padding: "10px 14px", background: "#F0FFF4", border: "1px solid #9AE6B4", borderRadius: 8, fontSize: 13, color: "#276749" }}>
          Drawing submitted.
        </div>
      )}
    </div>
  );
}
