import type { CSSProperties, DragEvent } from "react";
import { useState, useRef } from "react";

interface Props {
  slug: string;
  data: Record<string, unknown>;
}

const P: CSSProperties = {
  borderRadius: 12, padding: 20, fontFamily: "inherit", fontSize: 13,
  lineHeight: 1.6, background: "linear-gradient(135deg, #fafbfc 0%, #f0f2f5 100%)",
  border: "1px solid #e2e8f0", overflow: "hidden", userSelect: "none",
};
const Q: CSSProperties = { fontWeight: 600, fontSize: 14, marginBottom: 12, color: "#1a202c" };
const OPT: CSSProperties = {
  padding: "8px 14px", borderRadius: 8, border: "1px solid #e2e8f0",
  background: "#fff", marginBottom: 6, display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
  transition: "all 0.15s",
};
const OPT_SEL: CSSProperties = { ...OPT, border: "2px solid #805AD5", background: "#FAF5FF" };
const OPT_CORRECT: CSSProperties = { ...OPT, border: "2px solid #38A169", background: "#F0FFF4" };
const OPT_WRONG: CSSProperties = { ...OPT, border: "2px solid #E53E3E", background: "#FFF5F5" };
const RADIO: CSSProperties = { width: 16, height: 16, borderRadius: "50%", border: "2px solid #CBD5E0", flexShrink: 0, transition: "all 0.15s" };
const RADIO_SEL: CSSProperties = { ...RADIO, border: "2px solid #805AD5", background: "#805AD5" };
const RADIO_OK: CSSProperties = { ...RADIO, border: "2px solid #38A169", background: "#38A169" };
const RADIO_BAD: CSSProperties = { ...RADIO, border: "2px solid #E53E3E", background: "#E53E3E" };
const TAG: CSSProperties = {
  display: "inline-flex", padding: "5px 12px", borderRadius: 20, fontSize: 12,
  fontWeight: 600, border: "1px dashed #a0aec0", background: "#fff", cursor: "grab",
  transition: "all 0.15s",
};
const TAG_USED: CSSProperties = { ...TAG, opacity: 0.35, cursor: "default" };
const ZONE: CSSProperties = {
  border: "2px dashed #CBD5E0", borderRadius: 8, padding: "10px 14px", minHeight: 40,
  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#a0aec0",
  transition: "all 0.15s",
};
const ZONE_HOVER: CSSProperties = { ...ZONE, border: "2px dashed #805AD5", background: "#FAF5FF" };
const ZONE_FILLED: CSSProperties = { ...ZONE, border: "2px solid #38A169", background: "#F0FFF4", color: "#276749", cursor: "pointer" };
const BTN: CSSProperties = {
  padding: "8px 20px", borderRadius: 8, fontWeight: 600, fontSize: 13,
  background: "#805AD5", color: "#fff", border: "none", cursor: "pointer",
  transition: "opacity 0.15s",
};
const BUBBLE: CSSProperties = {
  padding: "8px 14px", borderRadius: "12px 12px 12px 4px", background: "#EDF2F7",
  maxWidth: "80%", fontSize: 12,
};
const BUBBLE_U: CSSProperties = {
  ...BUBBLE, background: "#805AD5", color: "#fff", borderRadius: "12px 12px 4px 12px",
  marginLeft: "auto",
};

function str(v: unknown): string { return typeof v === "string" ? v : ""; }
function arr(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => (typeof x === "string" ? x : typeof x === "object" && x ? JSON.stringify(x) : String(x)));
  if (typeof v === "string" && v.trim()) return v.split(",").map((s) => s.trim());
  return [];
}
function num(v: unknown, fb: number): number { return typeof v === "number" ? v : fb; }

const EMPTY = <div style={{ ...P, textAlign: "center" as const, color: "#a0aec0", padding: 40 }}>Fill in the fields to see a live preview</div>;

export default function LivePreview({ slug, data }: Props) {
  const hasData = Object.values(data).some((v) => v !== "" && v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0));
  if (!hasData) return EMPTY;

  switch (slug) {
    case "fill_blanks": return <FillBlanksPreview data={data} />;
    case "mcq_single": return <McqPreview data={data} timed={false} />;
    case "mcq_timed": return <McqPreview data={data} timed />;
    case "short_answer": return <ShortAnswerPreview data={data} />;
    case "drag_drop_placement": return <DragDropPlacementPreview data={data} />;
    case "drag_drop_classifier": return <DragDropClassifierPreview data={data} />;
    case "label_elements": return <LabelElementsPreview data={data} />;
    case "image_response": return <ImageResponsePreview data={data} />;
    case "audio_response": return <AudioResponsePreview data={data} />;
    case "slider_input": return <SliderPreview data={data} />;
    case "multi_step": return <MultiStepPreview data={data} />;
    case "debate_opinion": return <DebatePreview data={data} />;
    case "ai_conversation": return <AiConversationPreview data={data} />;
    case "draw_scribble": return <DrawPreview data={data} />;
    case "reflection_rating": return <ReflectionPreview data={data} />;
    default: return <div style={{ ...P, textAlign: "center" as const, color: "#a0aec0" }}>Preview not available</div>;
  }
}

/* ─── Fill in the Blanks ─── */
function FillBlanksPreview({ data }: { data: Record<string, unknown> }) {
  const sentence = str(data.sentence);
  const answers = arr(data.answers);
  const distractors = arr(data.distractors);
  if (!sentence) return EMPTY;

  const allWords = [...answers, ...distractors];
  const parts = sentence.split(/\{\{blank\}\}/gi);
  const blankCount = parts.length - 1;

  const [filled, setFilled] = useState<(string | null)[]>(Array(blankCount).fill(null));
  const [checked, setChecked] = useState(false);

  const usedWords = new Set(filled.filter(Boolean));

  const placeWord = (word: string) => {
    const idx = filled.indexOf(null);
    if (idx === -1) return;
    const next = [...filled];
    next[idx] = word;
    setFilled(next);
    setChecked(false);
  };

  const removeWord = (idx: number) => {
    const next = [...filled];
    next[idx] = null;
    setFilled(next);
    setChecked(false);
  };

  const allFilled = filled.every((f) => f !== null);

  return (
    <div style={P}>
      <div style={Q}>Fill in the missing words:</div>
      <p style={{ fontSize: 14, lineHeight: 2 }}>
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < blankCount && (
              <span
                onClick={() => filled[i] && removeWord(i)}
                style={{
                  display: "inline-block", borderBottom: filled[i] ? "2px solid" : "2px dashed",
                  borderColor: checked ? (filled[i] === answers[i] ? "#38A169" : "#E53E3E") : "#805AD5",
                  minWidth: 60, padding: "2px 8px", margin: "0 4px", fontWeight: 600,
                  color: checked ? (filled[i] === answers[i] ? "#38A169" : "#E53E3E") : "#805AD5",
                  cursor: filled[i] ? "pointer" : "default",
                  background: checked ? (filled[i] === answers[i] ? "#F0FFF4" : "#FFF5F5") : "transparent",
                  borderRadius: 4, transition: "all 0.2s",
                }}
              >
                {filled[i] || "\u00A0\u00A0\u00A0\u00A0\u00A0"}
              </span>
            )}
          </span>
        ))}
      </p>
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        {allWords.map((w, i) => (
          <span
            key={i}
            onClick={() => !usedWords.has(w) && placeWord(w)}
            style={usedWords.has(w) ? TAG_USED : { ...TAG, cursor: "pointer" }}
          >
            {w}
          </span>
        ))}
      </div>
      {allFilled && !checked && (
        <div style={{ marginTop: 12, textAlign: "center" }}>
          <button style={BTN} onClick={() => setChecked(true)}>Check Answer</button>
        </div>
      )}
      {checked && (
        <div style={{
          marginTop: 10, padding: "8px 12px", borderRadius: 8, fontSize: 12,
          background: filled.every((f, i) => f === answers[i]) ? "#F0FFF4" : "#FFF5F5",
          color: filled.every((f, i) => f === answers[i]) ? "#276749" : "#C53030",
          border: `1px solid ${filled.every((f, i) => f === answers[i]) ? "#C6F6D5" : "#FED7D7"}`,
        }}>
          {filled.every((f, i) => f === answers[i]) ? "Correct!" : "Not quite - click a word to remove it and try again."}
        </div>
      )}
    </div>
  );
}

/* ─── MCQ ─── */
function McqPreview({ data, timed }: { data: Record<string, unknown>; timed: boolean }) {
  const question = str(data.question);
  const options = arr(data.options);
  const timeLimit = num(data.time_limit_seconds, 0);
  if (!question) return EMPTY;

  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const getOptionInfo = (opt: string) => {
    try { const p = JSON.parse(opt); return { label: p.text || opt, correct: !!p.is_correct }; } catch { return { label: opt, correct: false }; }
  };

  const optStyle = (i: number, correct: boolean) => {
    if (!submitted) return selected === i ? OPT_SEL : OPT;
    if (selected === i) return correct ? OPT_CORRECT : OPT_WRONG;
    if (correct) return OPT_CORRECT;
    return OPT;
  };
  const radioStyle = (i: number, correct: boolean) => {
    if (!submitted) return selected === i ? RADIO_SEL : RADIO;
    if (selected === i) return correct ? RADIO_OK : RADIO_BAD;
    if (correct) return RADIO_OK;
    return RADIO;
  };

  return (
    <div style={P}>
      {timed && timeLimit > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <div style={{ background: "#FED7D7", color: "#C53030", padding: "4px 12px", borderRadius: 20, fontWeight: 700, fontSize: 13 }}>
            0:{String(timeLimit).padStart(2, "0")}
          </div>
        </div>
      )}
      <div style={Q}>{question}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {(options.length > 0 ? options : ["Option A", "Option B", "Option C", "Option D"]).map((opt, i) => {
          const { label, correct } = getOptionInfo(opt);
          return (
            <div key={i} style={optStyle(i, correct)} onClick={() => { if (!submitted) setSelected(i); }}>
              <span style={radioStyle(i, correct)} />
              {label}
            </div>
          );
        })}
      </div>
      {selected !== null && !submitted && (
        <div style={{ marginTop: 10, textAlign: "center" }}>
          <button style={BTN} onClick={() => setSubmitted(true)}>Submit</button>
        </div>
      )}
      {submitted && str(data.explanation) && (
        <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, background: "#F0FFF4", fontSize: 12, color: "#276749", border: "1px solid #C6F6D5" }}>
          {str(data.explanation)}
        </div>
      )}
    </div>
  );
}

/* ─── Short Answer ─── */
function ShortAnswerPreview({ data }: { data: Record<string, unknown> }) {
  const prompt = str(data.prompt);
  const maxWords = num(data.max_words, 50);
  if (!prompt) return EMPTY;

  const [text, setText] = useState("");
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div style={P}>
      <div style={Q}>{prompt}</div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type your answer here..."
        style={{ width: "100%", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 12, minHeight: 70, fontSize: 12, fontFamily: "inherit", resize: "vertical", outline: "none" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: wordCount > maxWords ? "#E53E3E" : "#a0aec0" }}>
        <span>{wordCount} / {maxWords} words</span>
        <button style={{ ...BTN, opacity: wordCount === 0 ? 0.5 : 1 }}>Submit</button>
      </div>
    </div>
  );
}

/* ─── Drag & Drop Placement ─── */
function DragDropPlacementPreview({ data }: { data: Record<string, unknown> }) {
  const instruction = str(data.instruction);
  const items = arr(data.items);
  const zones = arr(data.zones);
  if (!instruction) return EMPTY;

  const zoneList = zones.length > 0 ? zones : items.map((_, i) => `Zone ${i + 1}`);
  const [placed, setPlaced] = useState<Record<number, string>>({});
  const [dragOver, setDragOver] = useState<number | null>(null);

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
  };

  const removeFromZone = (zoneIdx: number) => {
    setPlaced((prev) => { const n = { ...prev }; delete n[zoneIdx]; return n; });
  };

  return (
    <div style={P}>
      <div style={Q}>{instruction}</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {items.map((w, i) => (
          <span
            key={i}
            draggable={!usedItems.has(w)}
            onDragStart={(e) => onDragStart(e, w)}
            style={usedItems.has(w) ? TAG_USED : TAG}
          >
            {w}
          </span>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {zoneList.map((z, i) => (
          <div
            key={i}
            onDragOver={(e) => { e.preventDefault(); setDragOver(i); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => onDrop(e, i)}
            onClick={() => placed[i] && removeFromZone(i)}
            style={placed[i] ? ZONE_FILLED : dragOver === i ? ZONE_HOVER : ZONE}
          >
            {placed[i] || z}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Drag & Drop Classifier ─── */
function DragDropClassifierPreview({ data }: { data: Record<string, unknown> }) {
  const instruction = str(data.instruction);
  const categories = arr(data.categories);
  const items = arr(data.items);
  if (!instruction) return EMPTY;

  const cats = categories.length > 0 ? categories : ["Category A", "Category B"];
  const colors = ["#805AD5", "#E53E3E", "#3182CE", "#38A169"];
  const [buckets, setBuckets] = useState<Record<number, string[]>>({});
  const [dragOver, setDragOver] = useState<number | null>(null);

  const placedItems = new Set(Object.values(buckets).flat());

  const onDrop = (e: DragEvent, catIdx: number) => {
    e.preventDefault();
    const item = e.dataTransfer.getData("text/plain");
    if (item && !placedItems.has(item)) {
      setBuckets((prev) => ({ ...prev, [catIdx]: [...(prev[catIdx] || []), item] }));
    }
    setDragOver(null);
  };

  const removeItem = (catIdx: number, item: string) => {
    setBuckets((prev) => ({ ...prev, [catIdx]: (prev[catIdx] || []).filter((x) => x !== item) }));
  };

  return (
    <div style={P}>
      <div style={Q}>{instruction}</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {items.map((w, i) => (
          <span
            key={i}
            draggable={!placedItems.has(w)}
            onDragStart={(e) => { e.dataTransfer.setData("text/plain", w); }}
            style={placedItems.has(w) ? TAG_USED : TAG}
          >
            {w}
          </span>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cats.length}, 1fr)`, gap: 10 }}>
        {cats.map((cat, i) => (
          <div key={i}>
            <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 6, color: colors[i % 4] }}>{cat}</div>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(i); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => onDrop(e, i)}
              style={{
                ...(dragOver === i ? ZONE_HOVER : ZONE),
                flexDirection: "column", gap: 4, minHeight: 60,
              }}
            >
              {(buckets[i] || []).length > 0 ? (buckets[i] || []).map((item) => (
                <span key={item} onClick={() => removeItem(i, item)} style={{ ...TAG, cursor: "pointer", borderColor: colors[i % 4], background: "#fff" }}>{item}</span>
              )) : "Drop here"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Label Elements ─── */
function LabelElementsPreview({ data }: { data: Record<string, unknown> }) {
  const instruction = str(data.instruction);
  const labels = arr(data.label_options);
  if (!instruction) return EMPTY;
  const [placed, setPlaced] = useState<string[]>([]);
  const usedLabels = new Set(placed);

  return (
    <div style={P}>
      <div style={Q}>{instruction}</div>
      <div style={{ background: "#fff", borderRadius: 8, padding: 16, border: "1px solid #e2e8f0", minHeight: 100, display: "flex", alignItems: "center", justifyContent: "center", color: "#a0aec0", fontSize: 12 }}>
        {str(data.image_url) ? <img src={str(data.image_url)} style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8 }} alt="" /> : "[Image area]"}
      </div>
      {labels.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginTop: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {labels.map((l, i) => (
            <span key={i} onClick={() => !usedLabels.has(l) ? setPlaced([...placed, l]) : setPlaced(placed.filter((p) => p !== l))} style={{ ...TAG, fontSize: 11, cursor: "pointer", borderColor: usedLabels.has(l) ? "#38A169" : "#a0aec0", background: usedLabels.has(l) ? "#F0FFF4" : "#fff" }}>{l}</span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Image Response ─── */
function ImageResponsePreview({ data }: { data: Record<string, unknown> }) {
  const prompt = str(data.prompt);
  if (!prompt) return EMPTY;
  const [text, setText] = useState("");
  return (
    <div style={P}>
      <div style={Q}>{prompt}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: "#EDF2F7", borderRadius: 8, height: 100, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e2e8f0" }}>
          {str(data.image_url) ? <img src={str(data.image_url)} style={{ maxWidth: "100%", maxHeight: 96, borderRadius: 6 }} alt="" /> : <span style={{ color: "#a0aec0", fontSize: 12 }}>[Image]</span>}
        </div>
        <div>
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Type your response..." style={{ width: "100%", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 10, minHeight: 80, fontSize: 12, fontFamily: "inherit", resize: "none", outline: "none" }} />
          <button style={{ ...BTN, marginTop: 8, width: "100%" }}>Submit</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Audio Response ─── */
function AudioResponsePreview({ data }: { data: Record<string, unknown> }) {
  const prompt = str(data.prompt);
  if (!prompt) return EMPTY;
  const [playing, setPlaying] = useState(false);
  const [text, setText] = useState("");
  return (
    <div style={P}>
      <div style={Q}>{prompt}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: "#fff", borderRadius: 8, border: "1px solid #e2e8f0", marginBottom: 12 }}>
        <div onClick={() => setPlaying(!playing)} style={{ width: 40, height: 40, borderRadius: "50%", background: playing ? "#E53E3E" : "#805AD5", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16, cursor: "pointer", transition: "background 0.2s" }}>{playing ? "\u23F8" : "\u25B6"}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 2 }}>
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} style={{ width: 3, height: 6 + Math.sin(i * 0.5) * 10, background: playing && i < 18 ? "#805AD5" : "#CBD5E0", borderRadius: 2, transition: "background 0.3s" }} />
            ))}
          </div>
          <div style={{ fontSize: 11, color: "#a0aec0", marginTop: 4 }}>{str(data.audio_url) || "audio_clip.mp3"}</div>
        </div>
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Type what you remember..." style={{ width: "100%", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 10, fontSize: 12, fontFamily: "inherit", resize: "vertical", minHeight: 50, outline: "none" }} />
    </div>
  );
}

/* ─── Slider ─── */
function SliderPreview({ data }: { data: Record<string, unknown> }) {
  const prompt = str(data.prompt);
  const min = num(data.min_value, 0);
  const max = num(data.max_value, 100);
  const correct = num(data.correct_value, (min + max) / 2);
  const tolerance = num(data.tolerance, 0);
  const unit = str(data.unit);
  if (!prompt) return EMPTY;

  const [val, setVal] = useState(Math.round((min + max) / 2));
  const [checked, setChecked] = useState(false);
  const isCorrect = Math.abs(val - correct) <= tolerance;

  return (
    <div style={P}>
      <div style={Q}>{prompt}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 0" }}>
        <span style={{ fontSize: 12, color: "#718096" }}>{min}{unit}</span>
        <input
          type="range" min={min} max={max} value={val}
          onChange={(e) => { setVal(Number(e.target.value)); setChecked(false); }}
          style={{ flex: 1, accentColor: "#805AD5", cursor: "pointer" }}
        />
        <span style={{ fontSize: 12, color: "#718096" }}>{max}{unit}</span>
      </div>
      <div style={{ textAlign: "center", fontSize: 28, fontWeight: 700, color: checked ? (isCorrect ? "#38A169" : "#E53E3E") : "#805AD5", transition: "color 0.2s" }}>{val}{unit}</div>
      <div style={{ textAlign: "center", marginTop: 8 }}>
        <button style={BTN} onClick={() => setChecked(true)}>Check Answer</button>
      </div>
      {checked && (
        <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, fontSize: 12, background: isCorrect ? "#F0FFF4" : "#FFF5F5", color: isCorrect ? "#276749" : "#C53030", border: `1px solid ${isCorrect ? "#C6F6D5" : "#FED7D7"}` }}>
          {isCorrect ? "Correct!" : `Not quite. The answer is ${correct}${unit}.`}
        </div>
      )}
    </div>
  );
}

/* ─── Multi-Step ─── */
function MultiStepPreview({ data }: { data: Record<string, unknown> }) {
  const instruction = str(data.overall_instruction);
  const steps = arr(data.steps);
  const stepList = steps.length > 0 ? steps : ["Step 1", "Step 2", "Step 3"];
  const [current, setCurrent] = useState(0);

  return (
    <div style={P}>
      <div style={Q}>{instruction || "Multi-step question"}</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {stepList.map((label, i) => (
          <div key={i} onClick={() => setCurrent(i)} style={{ flex: 1, padding: "6px 0", textAlign: "center", fontSize: 11, fontWeight: 600, borderRadius: 6, background: i === current ? "#805AD5" : i < current ? "#38A169" : "#E2E8F0", color: i <= current ? "#fff" : "#718096", cursor: "pointer", transition: "all 0.2s" }}>
            {typeof label === "string" ? label : `Step ${i + 1}`}
          </div>
        ))}
      </div>
      <div style={{ border: "2px solid #805AD5", borderRadius: 8, padding: 16, fontSize: 12, color: "#4A5568", minHeight: 60 }}>
        <div style={{ fontWeight: 600, color: "#805AD5", marginBottom: 8 }}>Step {current + 1}</div>
        <div>Content for this step will appear here.</div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
          {current > 0 && <button style={{ ...BTN, background: "#E2E8F0", color: "#4A5568" }} onClick={() => setCurrent(current - 1)}>Back</button>}
          {current < stepList.length - 1 && <button style={BTN} onClick={() => setCurrent(current + 1)}>Next</button>}
        </div>
      </div>
    </div>
  );
}

/* ─── Debate / Opinion ─── */
function DebatePreview({ data }: { data: Record<string, unknown> }) {
  const topic = str(data.topic);
  const stances = arr(data.stances);
  if (!topic) return EMPTY;

  const stanceList = stances.length > 0 ? stances : ["For", "Against", "Neutral"];
  const colors = ["#38A169", "#E53E3E", "#718096", "#3182CE"];
  const bgs = ["#F0FFF4", "#FFF5F5", "#F7FAFC", "#EBF8FF"];

  const [picked, setPicked] = useState<number | null>(null);
  const [msgs, setMsgs] = useState<string[]>([]);
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;
    setMsgs([...msgs, input.trim()]);
    setInput("");
  };

  return (
    <div style={P}>
      <div style={Q}>{topic}</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {stanceList.map((s, i) => (
          <div key={i} onClick={() => setPicked(i)} style={{ flex: 1, padding: "10px 0", textAlign: "center", borderRadius: 8, border: `2px solid ${colors[i % 4]}`, background: picked === i ? colors[i % 4] : bgs[i % 4], fontWeight: 600, fontSize: 12, color: picked === i ? "#fff" : colors[i % 4], cursor: "pointer", transition: "all 0.2s" }}>
            {s}
          </div>
        ))}
      </div>
      {picked !== null && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
            <div style={BUBBLE}>{"\uD83E\uDD16"} Interesting stance! Can you explain why?</div>
            {msgs.map((m, i) => (
              <div key={i} style={i % 2 === 0 ? BUBBLE_U : BUBBLE}>
                {i % 2 === 0 ? m : `\uD83E\uDD16 ${m}`}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Argue your position..." style={{ flex: 1, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: "8px 14px", fontSize: 12, outline: "none" }} />
            <button style={{ ...BTN, borderRadius: 20, padding: "8px 16px" }} onClick={send}>Send</button>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── AI Conversation ─── */
function AiConversationPreview({ data }: { data: Record<string, unknown> }) {
  const opening = str(data.opening_message);
  if (!opening && !str(data.system_prompt)) return EMPTY;

  const [msgs, setMsgs] = useState<{ role: "ai" | "user"; text: string }[]>([
    { role: "ai", text: opening || "Hi! Let's explore this topic together." },
  ]);
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;
    setMsgs([...msgs, { role: "user", text: input.trim() }, { role: "ai", text: "That's a great point! Tell me more..." }]);
    setInput("");
  };

  return (
    <div style={P}>
      <div style={Q}>{str(data.goal) || "AI Conversation"}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12, maxHeight: 200, overflowY: "auto" }}>
        {msgs.map((m, i) => (
          <div key={i} style={m.role === "ai" ? BUBBLE : BUBBLE_U}>
            {m.role === "ai" ? `\uD83E\uDD16 ${m.text}` : m.text}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Type your message..." style={{ flex: 1, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: "8px 14px", fontSize: 12, outline: "none" }} />
        <button style={{ ...BTN, borderRadius: 20, padding: "8px 16px" }} onClick={send}>Send</button>
      </div>
    </div>
  );
}

/* ─── Draw / Scribble ─── */
function DrawPreview({ data }: { data: Record<string, unknown> }) {
  const prompt = str(data.prompt);
  if (!prompt) return EMPTY;

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
    <div style={P}>
      <div style={Q}>{prompt}</div>
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

/* ─── Reflection / Rating ─── */
function ReflectionPreview({ data }: { data: Record<string, unknown> }) {
  const prompt = str(data.prompt);
  const scaleType = str(data.scale_type) || "emoji";
  if (!prompt) return EMPTY;

  const emojis = scaleType === "emoji" ? ["\uD83D\uDE1F", "\uD83D\uDE10", "\uD83D\uDE42", "\uD83D\uDE0A", "\uD83E\uDD29"]
    : scaleType === "stars" ? ["\u2B50", "\u2B50", "\u2B50", "\u2B50", "\u2B50"]
    : scaleType === "thumbs" ? ["\uD83D\uDC4E", "\uD83D\uDC4D"] : ["1", "2", "3", "4", "5"];
  const labelArr = arr(data.labels);

  const [selected, setSelected] = useState<number | null>(null);
  const [followUp, setFollowUp] = useState("");

  return (
    <div style={P}>
      <div style={Q}>{prompt}</div>
      <div style={{ display: "flex", justifyContent: "center", gap: 12, margin: "16px 0" }}>
        {emojis.map((e, i) => (
          <div key={i} onClick={() => setSelected(i)}
            style={{
              width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 20, cursor: "pointer", transition: "all 0.15s",
              border: selected !== null && (scaleType === "stars" ? i <= selected : i === selected) ? "2px solid #ECC94B" : "2px solid #E2E8F0",
              background: selected !== null && (scaleType === "stars" ? i <= selected : i === selected) ? "#FEFCBF" : "#fff",
              transform: selected === i ? "scale(1.2)" : "scale(1)",
            }}
          >{e}</div>
        ))}
      </div>
      {labelArr.length > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#a0aec0" }}>
          <span>{labelArr[0]}</span><span>{labelArr[labelArr.length - 1]}</span>
        </div>
      )}
      {str(data.follow_up_prompt) && (
        <textarea value={followUp} onChange={(e) => setFollowUp(e.target.value)} placeholder={str(data.follow_up_prompt)} style={{ width: "100%", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 10, fontSize: 12, fontFamily: "inherit", resize: "vertical", minHeight: 50, outline: "none", marginTop: 12 }} />
      )}
    </div>
  );
}
