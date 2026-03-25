import React, { useState, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import {
  useQuestionTemplates,
  useCreateActivityQuestion,
  useUpdateActivityQuestion,
  useActivityQuestions,
  useDeleteActivityQuestion,
  useGenerateQuestion,
} from "@/api/hooks/useAdmin";
import { useSkillGraph } from "@/api/hooks/useCompetencies";
import { api } from "@/api/client";
import type { QuestionTemplate, InputField, ActivityQuestion } from "@/api/types/admin";
import {
  ArrowLeft, ChevronRight, Eye, Trash2, Plus, Pencil,
} from "lucide-react";
import LivePreview from "./LivePreview";
import { useStudents } from "@/api/hooks/useStudents";
import * as s from "./admin.css";

type Step = "pick" | "fill";

export default function CreateQuestionPage() {
  const navigate = useNavigate();
  const { data: templates, isLoading: loadingT } = useQuestionTemplates();
  const { data: questions, isLoading: loadingQ } = useActivityQuestions();
  const { data: graph } = useSkillGraph();
  const { data: students } = useStudents();
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
  const [competencyIds, setCompetencyIds] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState(0.5);
  const [pillarFilter, setPillarFilter] = useState("");
  const [compSearch, setCompSearch] = useState("");
  const [compOpen, setCompOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const previewStudentId = students?.[0]?.id ?? null;
  const previewCompetencyId = competencyIds[0] ?? null;

  // Recently created modals (match Question Bank UX)
  const [previewQ, setPreviewQ] = useState<ActivityQuestion | null>(null);
  const [editingQ, setEditingQ] = useState<ActivityQuestion | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editGradeBand, setEditGradeBand] = useState("");
  const [editCompetencyIds, setEditCompetencyIds] = useState<string[]>([]);
  const [editDifficulty, setEditDifficulty] = useState(0.5);
  const [editPublished, setEditPublished] = useState(false);
  const [editDataJson, setEditDataJson] = useState("");
  const [aiDesc, setAiDesc] = useState("");

  // Competency tree: pillar → capabilities → competencies
  const pillars = graph?.pillars ?? [];
  const capabilities = graph?.capabilities ?? [];
  const competencies = graph?.competencies ?? [];
  const filteredCapIds = pillarFilter
    ? capabilities.filter((c) => c.pillar_id === pillarFilter).map((c) => c.id)
    : capabilities.map((c) => c.id);
  const filteredComps = competencies.filter((c) => filteredCapIds.includes(c.capability_id));

  function extractStatementSnippet(data: unknown): string | null {
    if (!data || typeof data !== "object") return null;
    const d = data as Record<string, unknown>;
    const candidates = [
      d.instruction,
      d.prompt,
      d.question,
      d.text,
      d.sentence,
      d.stem,
    ];
    for (const v of candidates) {
      if (typeof v === "string" && v.trim()) return v.trim();
    }
    return null;
  }

  const compOptions = useMemo(() => {
    const capIds = pillarFilter
      ? capabilities.filter((c) => c.pillar_id === pillarFilter).map((c) => c.id)
      : capabilities.map((c) => c.id);
    return competencies.filter((c) => capIds.includes(c.capability_id));
  }, [pillarFilter, capabilities, competencies]);

  const openRecentPreview = useCallback((q: ActivityQuestion) => {
    setPreviewQ(q);
  }, []);

  const openRecentEdit = useCallback((q: ActivityQuestion) => {
    setEditingQ(q);
    setEditTitle(q.title ?? "");
    setEditGradeBand(q.grade_band ?? "");
    setEditCompetencyIds(
      (q.competency_ids && q.competency_ids.length) ? q.competency_ids : (q.competency_id ? [q.competency_id] : []),
    );
    setEditDifficulty(typeof q.difficulty === "number" ? q.difficulty : 0.5);
    setEditPublished(!!q.is_published);
    setEditDataJson(JSON.stringify(q.data ?? {}, null, 2));
    setAiDesc("");
  }, []);

  const saveRecentEdit = useCallback(async () => {
    if (!editingQ) return;
    let parsed: Record<string, unknown> = {};
    try {
      parsed = editDataJson.trim() ? JSON.parse(editDataJson) : {};
    } catch {
      alert("Invalid JSON in Question Content. Fix it and try again.");
      return;
    }
    await updateMut.mutateAsync({
      id: editingQ.id,
      title: editTitle.trim(),
      grade_band: editGradeBand,
      competency_ids: editCompetencyIds,
      difficulty: editDifficulty,
      is_published: editPublished,
      data: parsed,
    });
    setEditingQ(null);
  }, [editingQ, editDataJson, updateMut, editTitle, editGradeBand, editCompetencyIds, editDifficulty, editPublished]);

  const generateWithAi = useCallback(async () => {
    if (!editingQ) return;
    const templateId = editingQ.template_id as string | undefined;
    if (!templateId) {
      alert("This question is missing template_id, so AI generation is not available.");
      return;
    }
    const desc = aiDesc.trim();
    if (!desc) return;
    const data = await generateMut.mutateAsync({
      templateId,
      description: desc,
      gradeBand: editGradeBand,
    });
    let current: Record<string, unknown> = {};
    try { current = editDataJson.trim() ? JSON.parse(editDataJson) : {}; } catch { current = {}; }
    const merged = { ...current, ...data };
    setEditDataJson(JSON.stringify(merged, null, 2));
    if (!editTitle.trim() && typeof (data as any).instruction === "string") {
      setEditTitle(String((data as any).instruction).slice(0, 80));
    }
  }, [editingQ, aiDesc, generateMut, editGradeBand, editDataJson, editTitle]);

  const pickTemplate = useCallback((t: QuestionTemplate) => {
    setSelected(t);
    setEditingId(null);
    setStep("fill");
    setFormData({});
    setTitle("");
    setGradeBand("");
    setCompetencyIds([]);
    setDifficulty(0.5);
    setPillarFilter("");
    setCompSearch("");
    setCompOpen(false);
  }, []);

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
  const canSave = !!title.trim() && competencyIds.length > 0;

  const handleSave = useCallback(
    (publish: boolean) => {
      if (!selected || !title.trim() || competencyIds.length === 0) return;
      const payload = { title: title.trim(), data: formData, grade_band: gradeBand, competency_ids: competencyIds, difficulty, is_published: publish };
      if (editingId) {
        updateMut.mutate({ id: editingId, ...payload }, { onSuccess: () => goBack() });
      } else {
        createMut.mutate({ template_id: selected.id, ...payload }, { onSuccess: () => goBack() });
      }
    },
    [selected, editingId, title, formData, gradeBand, competencyIds, difficulty, createMut, updateMut, goBack],
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

              <div>
                <label className={s.label}>Pillar <span style={{ color: "#a0aec0", fontWeight: 400 }}>(filter)</span></label>
                <select className={s.select} value={pillarFilter} onChange={(e) => { setPillarFilter(e.target.value); setCompetencyIds([]); }}>
                  <option value="">All pillars</option>
                  {pillars.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <CompetencyPicker
                label="Competency"
                required
                options={filteredComps}
                values={competencyIds}
                onSelect={(id) => {
                  setCompetencyIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
                  setCompOpen(false);
                  setCompSearch("");
                }}
                onRemove={(id) => setCompetencyIds((prev) => prev.filter((x) => x !== id))}
                search={compSearch}
                onSearchChange={setCompSearch}
                open={compOpen}
                onToggle={() => setCompOpen((o) => !o)}
                onBlur={() => setTimeout(() => setCompOpen(false), 150)}
              />

              <div>
                <label className={s.label} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Difficulty</span>
                  <span style={{ fontWeight: 700, color: "#6366f1" }}>{difficulty.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min={0} max={1} step={0.05}
                  value={difficulty}
                  onChange={(e) => setDifficulty(parseFloat(e.target.value))}
                  style={{ width: "100%", accentColor: "#6366f1" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#a0aec0", marginTop: 2 }}>
                  <span>Easy (0.0)</span><span>Hard (1.0)</span>
                </div>
              </div>

              <div>
                <label className={s.label}>Hint <span style={{ fontWeight: 400, color: "#a0aec0" }}>(shown to student on wrong answer)</span></label>
                <textarea
                  className={s.input}
                  rows={2}
                  placeholder="e.g. Think about what the question is really asking..."
                  value={typeof formData.hint === "string" ? formData.hint : ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, hint: e.target.value }))}
                  style={{ resize: "vertical" as const, minHeight: 56 }}
                />
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
                          setFormData((prev) => {
                            const merged = { ...prev };
                            for (const [k, v] of Object.entries(data)) {
                              if (v !== null && v !== undefined && v !== "") merged[k] = v;
                            }
                            return merged;
                          });
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
                    onChange={(v) => {
                      setField(field.key, v);
                    }}
                    allData={formData}
                  />
                ))}
              </div>

              <div className={s.formActions}>
                <button className={s.cancelBtn} onClick={goBack}>Cancel</button>
                <button
                  className={s.cancelBtn}
                  onClick={() => handleSave(false)}
                  disabled={!canSave || isSaving}
                >
                  Save Draft
                </button>
                <button
                  className={s.submitBtn}
                  onClick={() => handleSave(true)}
                  disabled={!canSave || isSaving}
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
              <LivePreview
                slug={selected.slug}
                data={
                  selected.slug === "ai_conversation" && previewStudentId && previewCompetencyId
                    ? {
                        ...formData,
                        __spark_student_id: previewStudentId,
                        __spark_competency_id: previewCompetencyId,
                      }
                    : formData
                }
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={s.page}>
      <div className={s.header}>
        <button
          className={s.addBtn}
          type="button"
          onClick={() => navigate("/admin/question-bank")}
        >
          ← Back to Question Bank
        </button>
        <div style={{ textAlign: "center", flex: 1 }}>
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
                style={{ cursor: "default" }}
              >
                <div className={s.sessionInfo}>
                  <div className={s.sessionTitle}>{q.title}</div>
                  <div className={s.sessionMeta}>
                    {q.template_name} {q.grade_band && `\u00B7 ${q.grade_band}`} {q.is_published ? "\u00B7 Published" : "\u00B7 Draft"}
                  </div>
                  {extractStatementSnippet(q.data) && (
                    <div style={{ marginTop: 6, fontSize: 12, color: "#059669", lineHeight: 1.4 }}>
                      {(extractStatementSnippet(q.data) as string).slice(0, 140)}
                      {(extractStatementSnippet(q.data) as string).length > 140 ? "…" : ""}
                    </div>
                  )}
                </div>
                <div className={s.sessionActions}>
                  <button
                    className={s.editBtn}
                    onClick={() => openRecentPreview(q)}
                  >
                    <Eye size={12} /> Preview
                  </button>
                  <button
                    className={s.editBtn}
                    onClick={() => openRecentEdit(q)}
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

      {/* ── Preview Modal (recent) ── */}
      {previewQ && (
        <div className={s.overlay} onClick={() => setPreviewQ(null)}>
          <div className={s.modal} style={{ maxWidth: 760 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div>
                <h2 className={s.modalTitle} style={{ marginBottom: 6 }}>Preview</h2>
                <div className={s.subtitle}>
                  {previewQ.title} {previewQ.template_name ? `· ${previewQ.template_name}` : ""}
                </div>
              </div>
              <button className={s.cancelBtn} onClick={() => setPreviewQ(null)}>Close</button>
            </div>
            <div style={{ marginTop: 14 }}>
              {previewQ.template_slug ? (
                <LivePreview
                  slug={previewQ.template_slug}
                  data={
                    previewQ.template_slug === "ai_conversation" && previewStudentId
                      ? {
                          ...(previewQ.data ?? {}),
                          __spark_student_id: previewStudentId,
                          __spark_competency_id: previewQ.competency_id,
                        }
                      : previewQ.data ?? {}
                  }
                />
              ) : (
                <div className={s.emptyState}>No preview available (missing template slug).</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal (recent) ── */}
      {editingQ && (
        <div className={s.overlay} onClick={() => setEditingQ(null)}>
          <div className={s.modal} style={{ maxWidth: 860 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div>
                <h2 className={s.modalTitle} style={{ marginBottom: 6 }}>Edit Question</h2>
                <div className={s.subtitle}>
                  {editingQ.template_name ?? "—"} · ID: <span style={{ fontFamily: "monospace" }}>{editingQ.id}</span>
                </div>
              </div>
              <button className={s.cancelBtn} onClick={() => setEditingQ(null)}>Close</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 16 }}>
              <div>
                <div className={s.form}>
                  {(() => {
                    const tmpl = templates?.find((t) => t.id === (editingQ.template_id as string));
                    const canGen = !!tmpl?.llm_prompt_template;
                    if (!canGen) return null;
                    return (
                      <div style={{
                        background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                        border: "1px solid #86efac",
                        borderRadius: 12,
                        padding: "12px 14px",
                        marginBottom: 4,
                      }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: "#047857", marginBottom: 8 }}>
                          Generate with AI
                        </div>
                        <textarea
                          className={s.textarea}
                          value={aiDesc}
                          onChange={(e) => setAiDesc(e.target.value)}
                          rows={3}
                          placeholder="Describe what you want the new question to be…"
                          style={{ marginBottom: 0, background: "#fff" }}
                        />
                        {generateMut.error && (
                          <div style={{ fontSize: 11, color: "#E53E3E", marginTop: 6 }}>
                            Generation failed — try again.
                          </div>
                        )}
                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                          <button
                            className={s.submitBtn}
                            onClick={generateWithAi}
                            disabled={generateMut.isPending || !aiDesc.trim()}
                          >
                            {generateMut.isPending ? "Generating..." : "Generate"}
                          </button>
                        </div>
                        <div style={{ fontSize: 11, opacity: 0.7, marginTop: 6, color: "#065f46" }}>
                          This will update the JSON below (you can still edit manually).
                        </div>
                      </div>
                    );
                  })()}

                  <div>
                    <label className={s.label}>Title *</label>
                    <input className={s.input} value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                  </div>
                  <div>
                    <label className={s.label}>Grade band</label>
                    <select className={s.select} value={editGradeBand} onChange={(e) => setEditGradeBand(e.target.value)}>
                      <option value="">Any</option>
                      <option value="4-5">4-5</option>
                      <option value="6-7">6-7</option>
                      <option value="8-9">8-9</option>
                    </select>
                  </div>
                  <div>
                    <label className={s.label}>Competency *</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                      {editCompetencyIds.map((cid) => (
                        <button
                          key={cid}
                          type="button"
                          className={s.metaPill}
                          onClick={() => setEditCompetencyIds((prev) => prev.filter((x) => x !== cid))}
                          title="Remove"
                          style={{ cursor: "pointer" }}
                        >
                          {cid} ×
                        </button>
                      ))}
                      {!editCompetencyIds.length && (
                        <span style={{ fontSize: 12, color: "var(--color-text-tertiary, #94a3b8)" }}>
                          Select one or more competencies below
                        </span>
                      )}
                    </div>
                    <select
                      className={s.select}
                      value=""
                      onChange={(e) => {
                        const id = e.target.value;
                        if (!id) return;
                        setEditCompetencyIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
                      }}
                    >
                      <option value="">Add competency…</option>
                      {compOptions.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.id} — {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={s.label} style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Difficulty</span>
                      <span style={{ fontWeight: 700, color: "#6366f1" }}>{editDifficulty.toFixed(2)}</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={editDifficulty}
                      onChange={(e) => setEditDifficulty(parseFloat(e.target.value))}
                      style={{ width: "100%", accentColor: "#6366f1" }}
                    />
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--color-text-secondary, #666)" }}>
                    <input type="checkbox" checked={editPublished} onChange={(e) => setEditPublished(e.target.checked)} />
                    Published
                  </label>
                  <div>
                    <label className={s.label}>Question content (JSON)</label>
                    <textarea
                      className={s.textarea}
                      value={editDataJson}
                      onChange={(e) => setEditDataJson(e.target.value)}
                      rows={10}
                      style={{ fontFamily: "monospace", fontSize: 12 }}
                    />
                    <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>
                      This updates `activity_questions.data`. Keep valid JSON.
                    </div>
                  </div>
                </div>
                <div className={s.formActions}>
                  <button className={s.cancelBtn} onClick={() => setEditingQ(null)}>Cancel</button>
                  <button
                    className={s.submitBtn}
                    onClick={saveRecentEdit}
                    disabled={updateMut.isPending || !editTitle.trim() || editCompetencyIds.length === 0}
                  >
                    {updateMut.isPending ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>

              <div style={{ alignSelf: "start" }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--color-text-secondary, #666)", display: "flex", alignItems: "center", gap: 6 }}>
                  <Eye size={14} /> Student Preview
                </div>
                {editingQ.template_slug ? (
                  (() => {
                    let parsed: Record<string, unknown> = {};
                    try { parsed = editDataJson.trim() ? JSON.parse(editDataJson) : {}; } catch { parsed = editingQ.data ?? {}; }
                    return <LivePreview slug={editingQ.template_slug} data={parsed} />;
                  })()
                ) : (
                  <div className={s.emptyState}>No preview available (missing template slug).</div>
                )}
              </div>
            </div>
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

// ─── Searchable Competency Picker ────────────────────────────────────────────

interface CompetencyOption { id: string; name: string }

function CompetencyPicker({
  label,
  required,
  options,
  values,
  onSelect,
  onRemove,
  search,
  onSearchChange,
  open,
  onToggle,
  onBlur,
}: {
  label: string;
  required?: boolean;
  options: CompetencyOption[];
  values: string[];
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
  open: boolean;
  onToggle: () => void;
  onBlur: () => void;
}) {
  const selected = values
    .map((id) => options.find((o) => o.id === id))
    .filter(Boolean) as CompetencyOption[];
  const visibleOptions = options.filter((o) =>
    !search || `${o.id} ${o.name}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ marginBottom: 14, position: "relative" }}>
      <label className={s.label}>
        {label} {required && <span style={{ color: "#E53E3E" }}>*</span>}
      </label>
      <div
        className={s.input}
        onClick={onToggle}
        style={{ cursor: "pointer", userSelect: "none", display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: 38 }}
      >
        {selected.length ? (
          <span style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {selected.slice(0, 3).map((c) => (
              <span
                key={c.id}
                className={s.metaPill}
                style={{ cursor: "pointer" }}
                onClick={(e) => { e.stopPropagation(); onRemove(c.id); }}
                title="Remove"
              >
                {c.id}
              </span>
            ))}
            {selected.length > 3 && (
              <span style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                +{selected.length - 3} more
              </span>
            )}
          </span>
        ) : (
          <span style={{ color: "#a0aec0", fontSize: 13 }}>Select competencies…</span>
        )}
        <span style={{ fontSize: 10, color: "#a0aec0" }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div style={{
          position: "absolute", zIndex: 50, top: "100%", left: 0, right: 0,
          background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 10,
          boxShadow: "0 4px 20px rgba(0,0,0,0.12)", overflow: "hidden",
        }}>
          <div style={{ padding: "8px 10px", borderBottom: "1px solid #f0f0f0" }}>
            <input
              className={s.input}
              autoFocus
              placeholder="Search by id or name…"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              onBlur={onBlur}
              style={{ marginBottom: 0 }}
            />
          </div>
          <div style={{ maxHeight: 220, overflowY: "auto" }}>
            {visibleOptions.length === 0 && (
              <div style={{ padding: "10px 14px", fontSize: 12, color: "#a0aec0" }}>No results</div>
            )}
            {visibleOptions.map((o) => (
              <div
                key={o.id}
                onMouseDown={() => onSelect(o.id)}
                style={{
                  padding: "8px 14px", fontSize: 13, cursor: "pointer",
                  background: values.includes(o.id) ? "#f0f4ff" : "transparent",
                  borderLeft: values.includes(o.id) ? "3px solid #6366f1" : "3px solid transparent",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f8f9fa")}
                onMouseLeave={(e) => (e.currentTarget.style.background = values.includes(o.id) ? "#f0f4ff" : "transparent")}
              >
                <span style={{ fontWeight: 600, color: "#6366f1", marginRight: 6 }}>{o.id}</span>
                {o.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Image upload field ───────────────────────────────────────────────────────

function ImageUploadField({ field, value, onChange }: { field: InputField; value: unknown; onChange: (v: unknown) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const url = typeof value === "string" ? value : "";

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const { data } = await api.post("/admin/media/presigned-upload", { file_name: file.name, content_type: file.type });
      const uploadRes = await fetch(data.upload_url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!uploadRes.ok) throw new Error(`s3 ${uploadRes.status}`);
      onChange(data.public_url);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ marginBottom: 14 }}>
      <div className={s.label}>
        {field.label} {field.required && <span style={{ color: "#E53E3E" }}>*</span>}
      </div>
      <input ref={inputRef} type="file" accept="image/*,application/pdf" style={{ display: "none" }} onChange={handleFile} />
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          style={{ padding: "8px 16px", borderRadius: 8, background: "#6366f1", color: "#fff", fontWeight: 600, fontSize: 13, border: "none", cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.7 : 1 }}
        >
          {uploading ? "Uploading..." : url ? "Replace" : "↑ Upload Image"}
        </button>
        {error && <span style={{ fontSize: 12, color: "#dc2626" }}>{error}</span>}
      </div>
      {url && <img src={url} alt="preview" style={{ marginTop: 8, maxHeight: 120, maxWidth: "100%", borderRadius: 8, border: "1px solid #e2e8f0", objectFit: "contain" }} />}
    </div>
  );
}

// ─── Field input ──────────────────────────────────────────────────────────────

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

  if (field.type === "image_upload") {
    return <ImageUploadField field={field} value={value} onChange={onChange} />;
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

function serializeNodes(nodes: NodeDef[]): string {
  return JSON.stringify(nodes.map(({ id, type, label, blank, correct }) => {
    const node: Record<string, unknown> = { id, type };
    if (blank) { node.blank = true; node.correct = correct; }
    else { node.label = label; }
    return node;
  }));
}

function FlowchartNodesBuilder({ field, value, onChange, allData: _allData }: {
  field: InputField; value: unknown; onChange: (v: unknown) => void; allData?: Record<string, unknown>;
}) {
  const nodes = parseNodesJson(value);

  const update = (next: NodeDef[]) => onChange(serializeNodes(next));

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
