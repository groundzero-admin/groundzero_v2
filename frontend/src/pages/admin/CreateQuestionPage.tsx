import { useState, useCallback } from "react";
import {
  useQuestionTemplates,
  useCreateActivityQuestion,
  useUpdateActivityQuestion,
  useActivityQuestions,
  useDeleteActivityQuestion,
  useGenerateQuestion,
} from "@/api/hooks/useAdmin";
import type { QuestionTemplate, InputField, ActivityQuestion } from "@/api/types/admin";
import {
  ArrowLeft, ChevronRight, Eye, Trash2, Plus, Pencil,
} from "lucide-react";
import LivePreview from "./LivePreview";
import * as s from "./admin.css";

type Step = "pick" | "fill";

export default function CreateQuestionPage() {
  const { data: templates, isLoading: loadingT } = useQuestionTemplates();
  const { data: questions, isLoading: loadingQ } = useActivityQuestions();
  const createMut = useCreateActivityQuestion();
  const updateMut = useUpdateActivityQuestion();
  const deleteMut = useDeleteActivityQuestion();
  const generateMut = useGenerateQuestion();

  const [step, setStep] = useState<Step>("pick");
  const [selected, setSelected] = useState<QuestionTemplate | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [title, setTitle] = useState("");
  const [gradeBand, setGradeBand] = useState("");
  const [showPreview, setShowPreview] = useState(true);

  const pickTemplate = useCallback((t: QuestionTemplate) => {
    setSelected(t);
    setEditingId(null);
    setStep("fill");
    setFormData({});
    setTitle("");
    setGradeBand("");
  }, []);

  const openQuestion = useCallback((q: ActivityQuestion) => {
    const tmpl = templates?.find((t) => t.id === q.template_id);
    if (!tmpl) return;
    setSelected(tmpl);
    setEditingId(q.id);
    setTitle(q.title);
    setGradeBand(q.grade_band);
    setFormData(q.data as Record<string, unknown>);
    setStep("fill");
  }, [templates]);

  const goBack = useCallback(() => {
    setStep("pick");
    setSelected(null);
    setEditingId(null);
    setFormData({});
  }, []);

  const setField = useCallback((key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const isSaving = createMut.isPending || updateMut.isPending;

  const handleSave = useCallback(
    (publish: boolean) => {
      if (!selected || !title.trim()) return;
      if (editingId) {
        updateMut.mutate(
          { id: editingId, title: title.trim(), data: formData, grade_band: gradeBand, is_published: publish },
          { onSuccess: () => goBack() },
        );
      } else {
        createMut.mutate(
          { template_id: selected.id, title: title.trim(), data: formData, grade_band: gradeBand, is_published: publish },
          { onSuccess: () => goBack() },
        );
      }
    },
    [selected, editingId, title, formData, gradeBand, createMut, updateMut, goBack],
  );

  if (loadingT || loadingQ) {
    return <div className={s.page}><div className={s.emptyState}>Loading...</div></div>;
  }

  if (step === "fill" && selected) {
    return (
      <div className={s.page}>
        <div style={{ cursor: "pointer", marginBottom: 16 }} className={s.backLink} onClick={goBack}>
          <ArrowLeft size={14} /> Back to questions
        </div>

        <div className={s.header}>
          <div>
            <h1 className={s.title}>
              <span style={{ marginRight: 8 }}>{selected.icon}</span>
              {editingId ? "Edit" : "New"}: {selected.name}
            </h1>
            <p className={s.subtitle}>{selected.description}</p>
          </div>
          <button
            className={s.editBtn}
            onClick={() => setShowPreview((p) => !p)}
            style={{ display: "flex", alignItems: "center", gap: 4 }}
          >
            <Eye size={14} /> {showPreview ? "Hide" : "Show"} Preview
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: showPreview ? "1fr 1fr" : "1fr", gap: 24 }}>
          <div>
            <div className={s.form}>
              <div>
                <label className={s.label}>Question Title *</label>
                <input
                  className={s.input}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give this question a descriptive title"
                />
              </div>

              <div>
                <label className={s.label}>Grade Band</label>
                <select className={s.select} value={gradeBand} onChange={(e) => setGradeBand(e.target.value)}>
                  <option value="">Any grade</option>
                  <option value="4-5">Grade 4-5</option>
                  <option value="6-7">Grade 6-7</option>
                  <option value="8-9">Grade 8-9</option>
                </select>
              </div>

              {selected.llm_prompt_template && (
                <GeneratePanel
                  templateId={selected.id}
                  slug={selected.slug}
                  gradeBand={gradeBand}
                  isGenerating={generateMut.isPending}
                  onGenerate={(desc) =>
                    generateMut.mutate(
                      { templateId: selected.id, description: desc, gradeBand },
                      {
                        onSuccess: (data) => {
                          setFormData((prev) => ({ ...prev, ...data }));
                          if (!title.trim() && typeof data.instruction === "string") {
                            setTitle(data.instruction.slice(0, 80));
                          }
                        },
                      },
                    )
                  }
                  error={generateMut.error ? String(generateMut.error) : null}
                />
              )}

              <div style={{ borderTop: "1px solid var(--color-border-subtle, #e2e8f0)", paddingTop: 16, marginTop: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: "var(--color-text-secondary, #666)" }}>
                  Question Content
                </div>
                {selected.input_schema.fields?.map((field) => (
                  <FieldInput
                    key={field.key}
                    field={field}
                    value={formData[field.key]}
                    onChange={(v) => setField(field.key, v)}
                    allData={formData}
                  />
                ))}
              </div>

              <div className={s.formActions}>
                <button className={s.cancelBtn} onClick={goBack}>Cancel</button>
                <button
                  className={s.cancelBtn}
                  onClick={() => handleSave(false)}
                  disabled={!title.trim() || isSaving}
                >
                  Save Draft
                </button>
                <button
                  className={s.submitBtn}
                  onClick={() => handleSave(true)}
                  disabled={!title.trim() || isSaving}
                >
                  {isSaving ? "Saving..." : "Publish"}
                </button>
              </div>
            </div>
          </div>

          {showPreview && (
            <div style={{ position: "sticky", top: 20, alignSelf: "start" }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--color-text-secondary, #666)", display: "flex", alignItems: "center", gap: 6 }}>
                <Eye size={14} /> Student View
              </div>
              <LivePreview slug={selected.slug} data={formData} />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div>
          <h1 className={s.title}>Create Question</h1>
          <p className={s.subtitle}>Pick a template, then fill in the question content</p>
        </div>
      </div>

      {questions && questions.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "var(--color-text-secondary, #666)" }}>
            Recently Created ({questions.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {questions.slice(0, 5).map((q) => (
              <div
                key={q.id}
                className={s.sessionCard}
                style={{ cursor: "pointer" }}
                onClick={() => openQuestion(q)}
              >
                <div className={s.sessionInfo}>
                  <div className={s.sessionTitle}>{q.title}</div>
                  <div className={s.sessionMeta}>
                    {q.template_name} {q.grade_band && `\u00B7 ${q.grade_band}`} {q.is_published ? "\u00B7 Published" : "\u00B7 Draft"}
                  </div>
                </div>
                <div className={s.sessionActions}>
                  <button
                    className={s.editBtn}
                    onClick={(e) => { e.stopPropagation(); openQuestion(q); }}
                  >
                    <Pencil size={12} /> Edit
                  </button>
                  <button
                    className={s.dangerBtn}
                    onClick={(e) => { e.stopPropagation(); if (confirm("Delete this question?")) deleteMut.mutate(q.id); }}
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "var(--color-text-secondary, #666)" }}>
        Choose a Template
      </div>
      <div className={s.grid}>
        {templates?.filter((t) => t.is_active).map((t) => (
          <div key={t.id} role="button" tabIndex={0} className={s.templatePickerCard} onClick={() => pickTemplate(t)} onKeyDown={(e) => e.key === "Enter" && pickTemplate(t)}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 24 }}>{t.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div>
                <div style={{ fontSize: 11, color: "var(--color-text-tertiary, #999)" }}>
                  {t.scorable ? "Scorable" : "Unscored"}
                </div>
              </div>
              <ChevronRight size={16} style={{ color: "var(--color-text-tertiary, #999)" }} />
            </div>
            <div style={{ fontSize: 12, color: "var(--color-text-secondary, #666)", lineHeight: 1.4 }}>
              {t.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
  allData,
}: {
  field: InputField;
  value: unknown;
  onChange: (v: unknown) => void;
  allData?: Record<string, unknown>;
}) {
  const strVal = typeof value === "string" ? value : "";

  if (field.type === "textarea") {
    return (
      <div style={{ marginBottom: 14 }}>
        <label className={s.label}>
          {field.label} {field.required && <span style={{ color: "#E53E3E" }}>*</span>}
        </label>
        <textarea
          className={s.textarea}
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          placeholder={field.label}
        />
      </div>
    );
  }

  if (field.type === "select" && field.options) {
    return (
      <div style={{ marginBottom: 14 }}>
        <label className={s.label}>
          {field.label} {field.required && <span style={{ color: "#E53E3E" }}>*</span>}
        </label>
        <select className={s.select} value={strVal} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select...</option>
          {field.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>
    );
  }

  if (field.type === "boolean") {
    return (
      <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          style={{ width: 16, height: 16 }}
        />
        <label className={s.label} style={{ marginBottom: 0 }}>
          {field.label}
        </label>
      </div>
    );
  }

  if (field.type === "number") {
    return (
      <div style={{ marginBottom: 14 }}>
        <label className={s.label}>
          {field.label} {field.required && <span style={{ color: "#E53E3E" }}>*</span>}
        </label>
        <input
          className={s.input}
          type="number"
          value={value !== undefined && value !== null ? String(value) : ""}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
          placeholder={field.label}
        />
      </div>
    );
  }

  if (field.type === "mcq_options") {
    return <McqOptionsInput field={field} value={value} onChange={onChange} />;
  }

  if (field.type === "flowchart_nodes") {
    return <FlowchartNodesBuilder field={field} value={value} onChange={onChange} allData={allData} />;
  }

  if (field.type === "flowchart_edges") {
    return <FlowchartEdgesBuilder field={field} value={value} onChange={onChange} allData={allData} />;
  }

  if (field.type === "multi_step_builder") {
    return <MultiStepBuilder field={field} value={value} onChange={onChange} />;
  }

  if (field.type === "categorized_list") {
    const categorySourceKey = field.category_source || "";
    const categories: string[] = Array.isArray(allData?.[categorySourceKey]) ? (allData![categorySourceKey] as string[]).filter(Boolean) : [];
    return <CategorizedListInput field={field} value={value} onChange={onChange} categories={categories} />;
  }

  if (field.type === "list") {
    return <ListFieldInput field={field} value={value} onChange={onChange} />;
  }

  return (
    <div style={{ marginBottom: 14 }}>
      <label className={s.label}>
        {field.label} {field.required && <span style={{ color: "#E53E3E" }}>*</span>}
      </label>
      <input
        className={s.input}
        value={strVal}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.label}
      />
    </div>
  );
}

function ListFieldInput({
  field,
  value,
  onChange,
}: {
  field: InputField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const items: string[] = Array.isArray(value) ? value : [];

  const addItem = () => onChange([...items, ""]);
  const removeItem = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, val: string) => {
    const next = [...items];
    next[idx] = val;
    onChange(next);
  };

  return (
    <div style={{ marginBottom: 14 }}>
      <label className={s.label}>
        {field.label} {field.required && <span style={{ color: "#E53E3E" }}>*</span>}
      </label>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              className={s.input}
              value={item}
              onChange={(e) => updateItem(i, e.target.value)}
              placeholder={`Item ${i + 1}`}
              style={{ flex: 1 }}
            />
            <button
              onClick={() => removeItem(i)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#E53E3E", padding: 4 }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <button
          onClick={addItem}
          style={{
            display: "flex", alignItems: "center", gap: 4, padding: "6px 12px",
            borderRadius: 8, border: "1px dashed #CBD5E0", background: "none",
            cursor: "pointer", fontSize: 12, color: "var(--color-text-secondary, #666)",
          }}
        >
          <Plus size={12} /> Add item
        </button>
      </div>
    </div>
  );
}

interface CategorizedItem {
  label: string;
  correct_category: string;
}

function CategorizedListInput({
  field,
  value,
  onChange,
  categories,
}: {
  field: InputField;
  value: unknown;
  onChange: (v: unknown) => void;
  categories: string[];
}) {
  const items: CategorizedItem[] = Array.isArray(value)
    ? value.map((v) =>
        typeof v === "object" && v && "label" in v
          ? (v as CategorizedItem)
          : { label: typeof v === "string" ? v : "", correct_category: "" },
      )
    : [];

  const addItem = () => onChange([...items, { label: "", correct_category: categories[0] || "" }]);
  const removeItem = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, patch: Partial<CategorizedItem>) => {
    const next = [...items];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };

  return (
    <div style={{ marginBottom: 14 }}>
      <label className={s.label}>
        {field.label} {field.required && <span style={{ color: "#E53E3E" }}>*</span>}
      </label>
      {categories.length === 0 && (
        <div style={{ fontSize: 11, color: "#D69E2E", marginBottom: 6 }}>
          Add categories above first, then add items here.
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              className={s.input}
              value={item.label}
              onChange={(e) => updateItem(i, { label: e.target.value })}
              placeholder="Item name"
              style={{ flex: 1 }}
            />
            <select
              className={s.select}
              value={item.correct_category}
              onChange={(e) => updateItem(i, { correct_category: e.target.value })}
              style={{ width: 140, flexShrink: 0 }}
            >
              <option value="">Category...</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <button
              onClick={() => removeItem(i)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#E53E3E", padding: 4 }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <button
          onClick={addItem}
          disabled={categories.length === 0}
          style={{
            display: "flex", alignItems: "center", gap: 4, padding: "6px 12px",
            borderRadius: 8, border: "1px dashed #CBD5E0", background: "none",
            cursor: categories.length === 0 ? "not-allowed" : "pointer", fontSize: 12,
            color: "var(--color-text-secondary, #666)",
            opacity: categories.length === 0 ? 0.5 : 1,
          }}
        >
          <Plus size={12} /> Add item
        </button>
      </div>
    </div>
  );
}

// ─── MCQ Options builder ──────────────────────────────────────────────────────

interface McqOption { text: string; is_correct: boolean }

function parseMcqOptions(v: unknown): McqOption[] {
  try {
    const arr = Array.isArray(v) ? v : (typeof v === "string" ? JSON.parse(v) : []);
    return arr.map((o: unknown) => {
      if (typeof o === "object" && o && "text" in o) return o as McqOption;
      return { text: typeof o === "string" ? o : String(o), is_correct: false };
    });
  } catch { return []; }
}

function McqOptionsInput({ field, value, onChange }: { field: InputField; value: unknown; onChange: (v: unknown) => void }) {
  const opts = parseMcqOptions(value);

  const update = (next: McqOption[]) => onChange(next);
  const addOpt = () => update([...opts, { text: "", is_correct: false }]);
  const removeOpt = (i: number) => update(opts.filter((_, idx) => idx !== i));
  const setText = (i: number, text: string) => { const n = [...opts]; n[i] = { ...n[i], text }; update(n); };
  const setCorrect = (i: number) => update(opts.map((o, idx) => ({ ...o, is_correct: idx === i })));

  return (
    <div style={{ marginBottom: 14 }}>
      <label className={s.label}>
        {field.label} {field.required && <span style={{ color: "#E53E3E" }}>*</span>}
      </label>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {opts.map((opt, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 10px", borderRadius: 10, border: opt.is_correct ? "1.5px solid #059669" : "1.5px solid #e2e8f0", background: opt.is_correct ? "#ECFDF5" : "#fafafa" }}>
            <div
              onClick={() => setCorrect(i)}
              title="Mark as correct"
              style={{ width: 18, height: 18, borderRadius: "50%", border: opt.is_correct ? "5px solid #059669" : "2px solid #CBD5E0", flexShrink: 0, cursor: "pointer", transition: "all 0.15s", background: "#fff" }}
            />
            <input
              className={s.input}
              value={opt.text}
              onChange={(e) => setText(i, e.target.value)}
              placeholder={`Option ${i + 1}`}
              style={{ flex: 1, fontSize: 12, border: "none", background: "transparent", outline: "none", padding: 0 }}
            />
            {opt.is_correct && <span style={{ fontSize: 11, color: "#059669", fontWeight: 700, flexShrink: 0 }}>✓ correct</span>}
            <button onClick={() => removeOpt(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#E53E3E", padding: 2, flexShrink: 0 }}>
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        <button
          onClick={addOpt}
          style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, border: "1px dashed #CBD5E0", background: "none", cursor: "pointer", fontSize: 12, color: "var(--color-text-secondary, #666)" }}
        >
          <Plus size={12} /> Add option
        </button>
        <div style={{ fontSize: 11, color: "#a0aec0" }}>Click the circle to mark the correct answer</div>
      </div>
    </div>
  );
}

// ─── Generate with AI panel ────────────────────────────────────────────────────

const SLUG_EXAMPLES: Record<string, string> = {
  fill_blanks:          `Photosynthesis sentence with 2 blanks — one for "sunlight" and one for "carbon dioxide"`,
  drag_drop_placement:  `Water cycle flowchart: evaporation → condensation → precipitation → collection, with 2 blank steps`,
  drag_drop_classifier: `Sort animals into: Mammals, Reptiles, Birds — include 8 animals across the 3 groups`,
  label_elements:       `Label parts of a plant cell — nucleus, cell wall, chloroplast, mitochondria`,
  mcq_single:           `What is the powerhouse of the cell? 4 options, 1 correct`,
  mcq_timed:            `Mental math: 7 × 8 = ? Timed 15 seconds, medium difficulty`,
  short_answer:         `Explain in 2-3 sentences why the sky is blue`,
  image_response:       `Student looks at a food chain diagram and describes the energy flow`,
  audio_response:       `Student listens to a short clip about the water cycle and recalls 2 facts`,
  multi_step:           `Step 1: MCQ on photosynthesis. Step 2: fill in the blank about chlorophyll. Step 3: short answer on why plants are green`,
  slider_input:         `Estimate the angle shown — answer is 45 degrees, range 0 to 180`,
  debate_opinion:       `Should AI be allowed to grade student essays? For / Against / Neutral stances`,
  ai_conversation:      `Spark guides student to discover why ice floats on water through questions`,
  draw_scribble:        `Draw a simple food chain with at least 3 organisms`,
  reflection_rating:    `How confident do you feel about fractions today? Emoji scale with follow-up`,
  geometry_explorer:    `Drag the ray to form an obtuse angle, then identify the angle type — MCQ`,
};

function GeneratePanel({
  templateId,
  slug,
  gradeBand,
  isGenerating,
  onGenerate,
  error,
}: {
  templateId: string;
  slug: string;
  gradeBand: string;
  isGenerating: boolean;
  onGenerate: (desc: string) => void;
  error: string | null;
}) {
  const [desc, setDesc] = useState("");
  void templateId;
  const example = SLUG_EXAMPLES[slug] ?? "Describe what you want the student to do";

  return (
    <div style={{
      background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
      border: "1.5px solid #c4b5fd",
      borderRadius: 12,
      padding: "14px 16px",
      marginBottom: 18,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#6d28d9", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
        ✨ Generate with AI
      </div>
      <textarea
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder={`e.g. "${example}"`}
        rows={3}
        style={{
          width: "100%", boxSizing: "border-box",
          padding: "8px 10px", borderRadius: 8,
          border: "1.5px solid #c4b5fd", fontSize: 12,
          resize: "vertical", outline: "none",
          fontFamily: "inherit", color: "#1a202c",
          background: "#fff",
        }}
      />
      {error && (
        <div style={{ fontSize: 11, color: "#E53E3E", marginTop: 4 }}>
          Generation failed — check your description and try again.
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <button
          onClick={() => desc.trim() && onGenerate(desc.trim())}
          disabled={!desc.trim() || isGenerating}
          style={{
            background: isGenerating || !desc.trim() ? "#a78bfa" : "#7c3aed",
            color: "#fff", border: "none", borderRadius: 8,
            padding: "7px 18px", fontSize: 12, fontWeight: 700,
            cursor: isGenerating || !desc.trim() ? "not-allowed" : "pointer",
          }}
        >
          {isGenerating ? "Generating…" : "Generate →"}
        </button>
      </div>
      <div style={{ fontSize: 10, color: "#7c3aed", marginTop: 4 }}>
        AI fills the fields below. You can edit anything after.{gradeBand ? ` Using grade band: ${gradeBand}.` : ""}
      </div>
    </div>
  );
}

// ─── Flowchart visual field renderers ─────────────────────────────────────────

interface NodeDef { id: string; type: string; label: string; blank: boolean; correct: string }
interface EdgeDef { from: string; to: string; label: string }

function parseNodesJson(v: unknown): NodeDef[] {
  try {
    const arr = typeof v === "string" ? JSON.parse(v) : v;
    if (!Array.isArray(arr)) return [];
    return arr.map((n: Record<string, unknown>, i: number) => ({
      id: String(n.id ?? `n${i + 1}`),
      type: String(n.type ?? "process"),
      label: String(n.label ?? ""),
      blank: !!n.blank,
      correct: String(n.correct ?? ""),
    }));
  } catch { return []; }
}

function parseEdgesJson(v: unknown): EdgeDef[] {
  try {
    const arr = typeof v === "string" ? JSON.parse(v) : v;
    if (!Array.isArray(arr)) return [];
    return arr.map((e: Record<string, unknown>) => ({
      from: String(e.from ?? ""),
      to: String(e.to ?? ""),
      label: String(e.label ?? ""),
    }));
  } catch { return []; }
}

function computeLayout(nodes: NodeDef[], edges: EdgeDef[]): (NodeDef & { x: number; y: number })[] {
  const outEdges = new Map<string, string[]>();
  edges.forEach((e) => {
    if (!outEdges.has(e.from)) outEdges.set(e.from, []);
    outEdges.get(e.from)!.push(e.to);
  });

  const start = nodes.find((n) => n.type === "start") ?? nodes[0];
  if (!start) return nodes.map((n) => ({ ...n, x: 50, y: 50 }));

  const levels: string[][] = [];
  const visited = new Set<string>();
  let queue = [start.id];
  while (queue.length > 0) {
    levels.push([...queue]);
    queue.forEach((id) => visited.add(id));
    const next: string[] = [];
    queue.forEach((id) => (outEdges.get(id) ?? []).forEach((t) => { if (!visited.has(t)) next.push(t); }));
    queue = next;
  }
  nodes.forEach((n) => { if (!visited.has(n.id)) levels.push([n.id]); });

  const positions = new Map<string, { x: number; y: number }>();
  const total = levels.length;
  levels.forEach((level, li) => {
    const y = total === 1 ? 50 : Math.round(8 + (li / (total - 1)) * 80);
    const count = level.length;
    level.forEach((id, ci) => {
      const x = count === 1 ? 50 : Math.round(20 + (ci / (count - 1)) * 60);
      positions.set(id, { x, y });
    });
  });

  return nodes.map((n) => ({ ...n, x: positions.get(n.id)?.x ?? 50, y: positions.get(n.id)?.y ?? 50 }));
}

function serializeNodes(nodes: NodeDef[], edges: EdgeDef[]): string {
  return JSON.stringify(computeLayout(nodes, edges).map(({ id, type, label, blank, correct, x, y }) => {
    const node: Record<string, unknown> = { id, type, x, y };
    if (blank) { node.blank = true; node.correct = correct; }
    else { node.label = label; }
    return node;
  }));
}

function FlowchartNodesBuilder({ field, value, onChange, allData }: {
  field: InputField; value: unknown; onChange: (v: unknown) => void; allData?: Record<string, unknown>;
}) {
  const nodes = parseNodesJson(value);
  const edges = parseEdgesJson(allData?.edges);

  const update = (next: NodeDef[]) => onChange(serializeNodes(next, edges));

  const addNode = () => {
    const id = `n${nodes.length + 1}`;
    update([...nodes, { id, type: "process", label: "", blank: false, correct: "" }]);
  };
  const removeNode = (i: number) => update(nodes.filter((_, idx) => idx !== i));
  const patch = (i: number, p: Partial<NodeDef>) => {
    const next = [...nodes];
    next[i] = { ...next[i], ...p };
    update(next);
  };

  const NODE_TYPES = ["start", "process", "decision", "end"];

  return (
    <div style={{ marginBottom: 14 }}>
      <label className={s.label}>
        {field.label} <span style={{ color: "#E53E3E" }}>*</span>
      </label>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {nodes.map((n, i) => (
          <div key={n.id} style={{ display: "flex", gap: 6, alignItems: "center", padding: "8px 10px", background: "#f8f9fa", borderRadius: 8, border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: 10, color: "#a0aec0", fontFamily: "monospace", minWidth: 20 }}>{n.id}</span>
            <select
              className={s.select}
              value={n.type}
              onChange={(e) => patch(i, { type: e.target.value })}
              style={{ width: 100, flexShrink: 0, fontSize: 12 }}
            >
              {NODE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            {n.blank ? (
              <input
                className={s.input}
                placeholder="Correct answer (student fills this)"
                value={n.correct}
                onChange={(e) => patch(i, { correct: e.target.value })}
                style={{ flex: 1, fontSize: 12, background: "#faf5ff", borderColor: "#c4b5fd" }}
              />
            ) : (
              <input
                className={s.input}
                placeholder="Label text"
                value={n.label}
                onChange={(e) => patch(i, { label: e.target.value })}
                style={{ flex: 1, fontSize: 12 }}
              />
            )}
            <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#4a5568", flexShrink: 0, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={n.blank}
                onChange={(e) => patch(i, { blank: e.target.checked })}
              />
              blank?
            </label>
            <button onClick={() => removeNode(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#E53E3E", padding: 2, flexShrink: 0 }}>
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        <button
          onClick={addNode}
          style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, border: "1px dashed #CBD5E0", background: "none", cursor: "pointer", fontSize: 12, color: "var(--color-text-secondary, #666)" }}
        >
          <Plus size={12} /> Add Node
        </button>
      </div>
    </div>
  );
}

// ─── Multi-step builder ────────────────────────────────────────────────────────

interface StepDef { step_number: number; type: string; data: Record<string, unknown> }

const STEP_TYPES = [
  "mcq_single", "fill_blanks", "short_answer", "slider_input",
  "drag_drop_classifier", "label_elements", "reflection_rating",
];

function parseSteps(v: unknown): StepDef[] {
  try {
    const arr = Array.isArray(v) ? v : (typeof v === "string" ? JSON.parse(v) : []);
    return arr.map((s: unknown, i: number) => {
      if (typeof s === "object" && s && "type" in s) {
        const o = s as Record<string, unknown>;
        return {
          step_number: typeof o.step_number === "number" ? o.step_number : i + 1,
          type: String(o.type ?? "mcq_single"),
          data: (typeof o.data === "object" && o.data && !Array.isArray(o.data))
            ? (o.data as Record<string, unknown>) : {},
        };
      }
      return { step_number: i + 1, type: "mcq_single", data: {} };
    });
  } catch { return []; }
}

function MultiStepBuilder({ field, value, onChange }: {
  field: InputField; value: unknown; onChange: (v: unknown) => void;
}) {
  const steps = parseSteps(value);

  const update = (next: StepDef[]) =>
    onChange(next.map((s, i) => ({ step_number: i + 1, type: s.type, data: s.data })));

  const addStep = () => update([...steps, { step_number: steps.length + 1, type: "mcq_single", data: {} }]);
  const removeStep = (i: number) => update(steps.filter((_, idx) => idx !== i));
  const patchType = (i: number, type: string) => {
    const next = [...steps]; next[i] = { ...next[i], type }; update(next);
  };
  const patchData = (i: number, jsonStr: string) => {
    try {
      const next = [...steps];
      next[i] = { ...next[i], data: JSON.parse(jsonStr) };
      update(next);
    } catch { /* ignore invalid JSON while typing */ }
  };

  return (
    <div style={{ marginBottom: 14 }}>
      <label className={s.label}>
        {field.label} {field.required && <span style={{ color: "#E53E3E" }}>*</span>}
      </label>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {steps.map((step, i) => (
          <div key={i} style={{ background: "#f8f9fa", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", minWidth: 52 }}>Step {i + 1}</span>
              <select
                className={s.select}
                value={step.type}
                onChange={(e) => patchType(i, e.target.value)}
                style={{ flex: 1, fontSize: 12 }}
              >
                {STEP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <button
                onClick={() => removeStep(i)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#E53E3E", padding: 2, flexShrink: 0 }}
              >
                <Trash2 size={13} />
              </button>
            </div>
            <textarea
              className={s.textarea}
              rows={4}
              defaultValue={JSON.stringify(step.data, null, 2)}
              onBlur={(e) => patchData(i, e.target.value)}
              placeholder={`{"instruction": "...", "options": [...]}`}
              style={{ fontSize: 11, fontFamily: "monospace", marginBottom: 0 }}
            />
            <div style={{ fontSize: 10, color: "#a0aec0", marginTop: 2 }}>
              Edit JSON for this step's question data. Blur to apply.
            </div>
          </div>
        ))}
        <button
          onClick={addStep}
          style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, border: "1px dashed #CBD5E0", background: "none", cursor: "pointer", fontSize: 12, color: "var(--color-text-secondary, #666)" }}
        >
          <Plus size={12} /> Add Step
        </button>
        {steps.length > 0 && (
          <div style={{ fontSize: 10, color: "#a0aec0" }}>
            AI Generation fills these automatically — use the Generate panel above.
          </div>
        )}
      </div>
    </div>
  );
}

function FlowchartEdgesBuilder({ field, value, onChange, allData }: {
  field: InputField; value: unknown; onChange: (v: unknown) => void; allData?: Record<string, unknown>;
}) {
  const edges = parseEdgesJson(value);
  const nodes = parseNodesJson(allData?.nodes);

  const update = (next: EdgeDef[]) => onChange(JSON.stringify(
    next.map(({ from, to, label }) => label ? { from, to, label } : { from, to })
  ));

  const addEdge = () => update([...edges, { from: nodes[0]?.id ?? "", to: nodes[1]?.id ?? "", label: "" }]);
  const removeEdge = (i: number) => update(edges.filter((_, idx) => idx !== i));
  const patch = (i: number, p: Partial<EdgeDef>) => {
    const next = [...edges]; next[i] = { ...next[i], ...p }; update(next);
  };

  const nodeLabel = (id: string) => {
    const n = nodes.find((x) => x.id === id);
    if (!n) return id;
    return `${id} (${n.blank ? "blank" : n.label || n.type})`;
  };

  return (
    <div style={{ marginBottom: 14 }}>
      <label className={s.label}>
        {field.label} <span style={{ color: "#E53E3E" }}>*</span>
      </label>
      {nodes.length < 2 && (
        <div style={{ fontSize: 11, color: "#D69E2E", marginBottom: 6 }}>Add nodes first, then define edges.</div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {edges.map((e, i) => (
          <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <select className={s.select} value={e.from} onChange={(ev) => patch(i, { from: ev.target.value })} style={{ flex: 1, fontSize: 12 }}>
              {nodes.map((n) => <option key={n.id} value={n.id}>{nodeLabel(n.id)}</option>)}
            </select>
            <span style={{ fontSize: 12, color: "#a0aec0" }}>→</span>
            <select className={s.select} value={e.to} onChange={(ev) => patch(i, { to: ev.target.value })} style={{ flex: 1, fontSize: 12 }}>
              {nodes.map((n) => <option key={n.id} value={n.id}>{nodeLabel(n.id)}</option>)}
            </select>
            <input
              className={s.input}
              value={e.label}
              onChange={(ev) => patch(i, { label: ev.target.value })}
              placeholder="Yes/No"
              style={{ width: 64, flexShrink: 0, fontSize: 12 }}
            />
            <button onClick={() => removeEdge(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#E53E3E", padding: 2 }}>
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        <button
          onClick={addEdge}
          disabled={nodes.length < 2}
          style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, border: "1px dashed #CBD5E0", background: "none", cursor: nodes.length < 2 ? "not-allowed" : "pointer", fontSize: 12, color: "var(--color-text-secondary, #666)", opacity: nodes.length < 2 ? 0.5 : 1 }}
        >
          <Plus size={12} /> Add Edge
        </button>
      </div>
    </div>
  );
}
