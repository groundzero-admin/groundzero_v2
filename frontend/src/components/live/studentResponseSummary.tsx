/**
 * Maps saved evidence `response` JSON + question `data` into teacher-readable summaries.
 * Shapes follow packages/question-widgets onAnswer payloads and question_evaluator.py.
 */
import type { ReactNode } from "react";

function safeStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v);
}

/** MCQ options may be: JSON string, plain string, or object { text, is_correct } from API/DB. */
function optionToDisplayText(opt: unknown): string {
  if (opt === null || opt === undefined) return "";
  if (typeof opt === "string") {
    const t = opt.trim();
    if (t.startsWith("{") || t.startsWith("[")) {
      try {
        const p = JSON.parse(t) as { text?: string };
        if (p && typeof p === "object" && typeof p.text === "string") return p.text;
      } catch {
        return opt;
      }
    }
    return opt;
  }
  if (typeof opt === "object") {
    const o = opt as { text?: unknown; label?: unknown };
    if (typeof o.text === "string" && o.text) return o.text;
    if (typeof o.label === "string" && o.label) return o.label;
    try {
      return JSON.stringify(opt);
    } catch {
      return "";
    }
  }
  return String(opt);
}

function mcqResolvedLabel(questionData: Record<string, unknown> | undefined, selectedIdx: number): string {
  const raw = questionData?.options;
  if (!Array.isArray(raw)) return "";
  const opt = raw[selectedIdx];
  if (opt === undefined) return "";
  const text = optionToDisplayText(opt);
  return text || "";
}

/** Reflection widget stores 0-based index in `rating`; scale length depends on scale_type. */
function reflectionScaleLength(questionData: Record<string, unknown> | undefined): number {
  if (!questionData) return 5;
  const st = String(questionData.scale_type ?? "emoji");
  if (st === "thumbs") return 2;
  return 5;
}

function line(key: string, label: string, value: ReactNode): ReactNode {
  return (
    <div key={key} style={{ fontSize: 11, lineHeight: 1.45, marginBottom: 4 }}>
      <span style={{ fontWeight: 700, color: "#64748b" }}>{label}: </span>
      <span style={{ color: "#0f172a" }}>{value}</span>
    </div>
  );
}

/** One block per template slug + saved response object. */
export function renderStudentAnswerSummary(
  templateSlug: string | null | undefined,
  response: Record<string, unknown> | null | undefined,
  questionData: Record<string, unknown> | undefined,
): ReactNode {
  if (!response || typeof response !== "object") return null;

  const slug = templateSlug || "";
  const nOpts = Array.isArray(questionData?.options) ? (questionData!.options as unknown[]).length : 0;

  // ── MCQ (index into options) — 1-based index + option text; no separate “position” line ──
  if (slug === "mcq_single" || slug === "mcq_timed") {
    const sel = response.selected;
    const timedOut = response.timedOut === true;
    if (timedOut && (sel === null || sel === undefined)) {
      return line("mcq-timeout", "Result", "Time ran out before submitting");
    }
    if (typeof sel === "number") {
      const marked = mcqResolvedLabel(questionData, sel);
      const idxOneBased = sel + 1;
      const idxPart = nOpts > 0 ? `${idxOneBased} of ${nOpts}` : String(idxOneBased);
      const textPart = marked || `(option text unavailable)`;
      return line("mcq-choice", "Option chosen", `${idxPart} — ${textPart}`);
    }
  }

  // ── Fill blanks ──
  if (slug === "fill_blanks") {
    const filled = response.filled;
    if (Array.isArray(filled)) {
      return (
        <>
          {filled.map((word, i) =>
            line(`fb-${i}`, `Word in blank ${i + 1}`, safeStr(word) || "—"),
          )}
          {response.correct !== undefined && line("fb-corr", "All blanks correct", response.correct ? "Yes" : "No")}
        </>
      );
    }
  }

  // ── Slider ──
  if (slug === "slider_input") {
    return (
      <>
        {line("sl-val", "Value chosen", safeStr(response.value))}
        {response.correct !== undefined && line("sl-ok", "Matches target", response.correct ? "Yes" : "No")}
      </>
    );
  }

  // ── Drag-drop classifier: buckets[catIdx] = item[] ──
  if (slug === "drag_drop_classifier") {
    const buckets = response.buckets as Record<string, unknown> | undefined;
    const categories = Array.isArray(questionData?.categories) ? (questionData!.categories as string[]) : [];
    if (buckets && typeof buckets === "object") {
      const parts: ReactNode[] = [];
      for (const [k, items] of Object.entries(buckets)) {
        const idx = Number(k);
        const catName = categories[idx] ?? `Category ${idx + 1}`;
        const list = Array.isArray(items) ? items.map((x) => optionToDisplayText(x)).join(", ") : safeStr(items);
        parts.push(line(`ddc-${k}`, `Items in “${catName}”`, list || "—"));
      }
      return (
        <>
          {parts}
          {response.correct !== undefined && line("ddc-ok", "All classifications correct", response.correct ? "Yes" : "No")}
        </>
      );
    }
  }

  // ── Drag-drop placement: placed[zoneIdx] = item ──
  if (slug === "drag_drop_placement") {
    const placed = response.placed as Record<string, string> | undefined;
    const zones = Array.isArray(questionData?.zones) ? (questionData!.zones as string[]) : [];
    if (placed && typeof placed === "object") {
      const keys = Object.keys(placed).sort((a, b) => Number(a) - Number(b));
      return (
        <>
          {keys.map((k) => {
            const zi = Number(k);
            const zoneLabel = zones[zi] ?? `Zone ${zi + 1}`;
            return line(`ddp-${k}`, `Placed in “${zoneLabel}”`, optionToDisplayText(placed[k]));
          })}
          {response.correct !== undefined && line("ddp-ok", "All placements correct", response.correct ? "Yes" : "No")}
        </>
      );
    }
  }

  // ── Flowchart: placed[nodeId] = item text ──
  if (slug === "flowchart") {
    const placed = response.placed as Record<string, string> | undefined;
    if (placed && typeof placed === "object") {
      const nodeLabel = (nodeId: string): string => {
        try {
          const raw = questionData?.nodes;
          const nodes = typeof raw === "string" ? JSON.parse(raw) : raw;
          if (!Array.isArray(nodes)) return nodeId;
          const n = nodes.find((x: { id?: string }) => x.id === nodeId) as
            | { id?: string; label?: string; type?: string }
            | undefined;
          if (n?.label) return `${n.label}`;
          if (n?.type) return `${n.type} (${nodeId})`;
        } catch {
          /* ignore */
        }
        return nodeId;
      };
      return (
        <>
          {Object.entries(placed).map(([nodeId, text]) =>
            line(`fc-${nodeId}`, `Filled “${nodeLabel(nodeId)}” with`, optionToDisplayText(text)),
          )}
          {response.correct !== undefined && line("fc-ok", "Flowchart correct", response.correct ? "Yes" : "No")}
        </>
      );
    }
  }

  // ── Label elements ──
  if (slug === "label_elements") {
    const placed = response.placed;
    if (Array.isArray(placed)) {
      return line("le", "Labels selected", placed.length ? placed.map((x) => optionToDisplayText(x)).join(", ") : "—");
    }
  }

  // ── Short answer / image / audio ──
  if (slug === "short_answer" || slug === "image_response" || slug === "audio_response") {
    const t = response.text;
    if (typeof t === "string" && t.trim()) {
      return line("sa", "Typed answer", <span style={{ whiteSpace: "pre-wrap" }}>{t}</span>);
    }
    return line("sa-empty", "Typed answer", "(empty)");
  }

  // ── Reflection (stored slug may be reflection_rating or reflection) — show numeric 1-based step, not end labels like “Agree” ──
  if (slug === "reflection_rating" || slug === "reflection") {
    const rating = response.rating;
    const rIdx = typeof rating === "number" ? rating : null;
    const n = reflectionScaleLength(questionData);
    const display = rIdx !== null && rIdx >= 0 ? `${rIdx + 1} of ${n}` : "—";
    return (
      <>
        {line("rr-num", "Rating", display)}
        {typeof response.followUp === "string" && response.followUp.trim()
          ? line("rr-fu", "Follow-up note", <span style={{ whiteSpace: "pre-wrap" }}>{response.followUp}</span>)
          : null}
      </>
    );
  }

  // ── Debate ──
  if (slug === "debate_opinion") {
    const msgs = response.messages;
    const stance = response.stance;
    return (
      <>
        {line("db-stance", "Stance chosen", stance !== null && stance !== undefined ? safeStr(stance) : "—")}
        {Array.isArray(msgs) && msgs.length > 0 ? (
          line(
            "db-msg",
            "Argument lines",
            <span style={{ whiteSpace: "pre-wrap" }}>{msgs.map((m) => `• ${safeStr(m)}`).join("\n")}</span>,
          )
        ) : null}
      </>
    );
  }

  // ── AI conversation ──
  if (slug === "ai_conversation") {
    const messages = response.messages as Array<{ role?: string; text?: string }> | undefined;
    if (Array.isArray(messages) && messages.length > 0) {
      return (
        <div style={{ fontSize: 11, lineHeight: 1.5 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <span style={{ fontWeight: 700, color: m.role === "user" ? "#4f46e5" : "#64748b" }}>
                {m.role === "user" ? "Student" : "AI"}:{" "}
              </span>
              <span style={{ whiteSpace: "pre-wrap" }}>{m.text ?? ""}</span>
            </div>
          ))}
        </div>
      );
    }
  }

  // ── Draw / scribble ──
  if (slug === "draw_scribble") {
    const drawing = response.drawing;
    if (typeof drawing === "string" && drawing.startsWith("data:")) {
      return (
        <div>
          {line("dr", "Drawing submitted", "Yes (see preview below)")}
          <div
            style={{
              marginTop: 6,
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              background: "#fff",
              overflowY: "auto",
              maxHeight: 260,
            }}
          >
            <img
              src={drawing}
              alt="Student drawing"
              style={{
                width: "100%",
                height: "auto",
                display: "block",
              }}
            />
          </div>
        </div>
      );
    }
  }

  // ── Geometry / animated: MCQ part sends selected = option string OR index ──
  if (slug === "geometry_explorer" || slug === "geometry_animated") {
    const sel = response.selected;
    if (typeof sel === "string") {
      return (
        <>
          {line("geo-str", "Option marked", sel)}
          {response.correct !== undefined && line("geo-ok", "Correct", response.correct ? "Yes" : "No")}
        </>
      );
    }
    if (typeof sel === "number") {
      const marked = mcqResolvedLabel(questionData, sel);
      const idxOneBased = sel + 1;
      const idxPart = nOpts > 0 ? `${idxOneBased} of ${nOpts}` : String(idxOneBased);
      const textPart = marked || `(option text unavailable)`;
      return (
        <>
          {line("geo-num", "Option chosen", `${idxPart} — ${textPart}`)}
          {response.correct !== undefined && line("geo-ok2", "Correct", response.correct ? "Yes" : "No")}
        </>
      );
    }
  }

  // ── Multi-step: answers[0], nested payloads ──
  if (slug === "multi_step") {
    const answers = response.answers as Record<string, unknown> | undefined;
    const steps = Array.isArray(questionData?.steps) ? questionData!.steps : [];
    if (answers && typeof answers === "object") {
      const keys = Object.keys(answers).sort((a, b) => Number(a) - Number(b));
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {keys.map((k) => {
            const i = Number(k);
            const step = steps[i] as { type?: string; data?: Record<string, unknown> } | undefined;
            const stepSlug = step?.type ?? "short_answer";
            const stepData = step?.data ?? {};
            const inner = answers[k];
            const innerObj =
              inner && typeof inner === "object" && !Array.isArray(inner)
                ? (inner as Record<string, unknown>)
                : { value: inner };
            return (
              <div
                key={k}
                style={{
                  borderLeft: "3px solid #6366f1",
                  paddingLeft: 10,
                  marginLeft: 2,
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 800, color: "#6366f1", marginBottom: 4 }}>
                  Step {i + 1} — {stepSlug}
                </div>
                {renderStudentAnswerSummary(stepSlug, innerObj, stepData)}
              </div>
            );
          })}
        </div>
      );
    }
  }

  return null;
}
