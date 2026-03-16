import { useState, useCallback } from "react";
import {
  useQuestionTemplates,
  useCreateActivityQuestion,
  useUpdateActivityQuestion,
  useActivityQuestions,
  useDeleteActivityQuestion,
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
}: {
  field: InputField;
  value: unknown;
  onChange: (v: unknown) => void;
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
