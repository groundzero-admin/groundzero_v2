import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
    useActivityQuestions,
    useDeleteActivityQuestion,
    useUpdateActivityQuestion,
    useGenerateQuestion,
    useQuestionTemplates,
} from "@/api/hooks/useAdmin";
import { useSkillGraph } from "@/api/hooks/useCompetencies";
import { Plus, Search, Trash2, Pencil, Eye } from "lucide-react";
import LivePreview from "./LivePreview";
import * as s from "./admin.css";

export default function QuestionBankPage() {
    const navigate = useNavigate();
    const { data: questions, isLoading } = useActivityQuestions();
    const { data: graph } = useSkillGraph();
    const deleteMut = useDeleteActivityQuestion();
    const updateMut = useUpdateActivityQuestion();
    const generateMut = useGenerateQuestion();
    const { data: qtTemplates } = useQuestionTemplates();

    const [search, setSearch] = useState("");
    const [pillarFilter, setPillarFilter] = useState("");
    const [competencyFilter, setCompetencyFilter] = useState("");
    const [compSearch, setCompSearch] = useState("");
    const [gradeFilter, setGradeFilter] = useState("");
    const [publishedFilter, setPublishedFilter] = useState<"all" | "published" | "draft">("all");

    // Modals
    const [previewQ, setPreviewQ] = useState<(typeof questions extends (infer T)[] ? T : any) | null>(null);
    const [editingQ, setEditingQ] = useState<(typeof questions extends (infer T)[] ? T : any) | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editGradeBand, setEditGradeBand] = useState("");
    const [editCompetencyIds, setEditCompetencyIds] = useState<string[]>([]);
    const [editDifficulty, setEditDifficulty] = useState(0.5);
    const [editPublished, setEditPublished] = useState(false);
    const [editDataJson, setEditDataJson] = useState("");
    const [aiDesc, setAiDesc] = useState("");

    const pillars = graph?.pillars ?? [];
    const capabilities = graph?.capabilities ?? [];
    const competencies = graph?.competencies ?? [];

    const filteredCapIds = pillarFilter
        ? capabilities.filter((c) => c.pillar_id === pillarFilter).map((c) => c.id)
        : capabilities.map((c) => c.id);
    const filteredComps = competencies.filter((c) => filteredCapIds.includes(c.capability_id));

    const compMap = Object.fromEntries(competencies.map((c) => [c.id, c.name]));

    const filtered = (questions ?? []).filter((q) => {
        if (search && !q.title.toLowerCase().includes(search.toLowerCase()) && !(q.template_name ?? "").toLowerCase().includes(search.toLowerCase())) return false;
        const qCompIds: string[] = (q.competency_ids && q.competency_ids.length) ? q.competency_ids : (q.competency_id ? [q.competency_id] : []);
        if (competencyFilter && !qCompIds.includes(competencyFilter)) return false;
        if (pillarFilter && competencyFilter === "") {
            // filter by pillar: any of the question competencies belongs to a capability in this pillar
            const ok = qCompIds.some((cid) => {
                const comp = competencies.find((c) => c.id === cid);
                return !!comp && filteredCapIds.includes(comp.capability_id);
            });
            if (!ok) return false;
        }
        if (gradeFilter && q.grade_band !== gradeFilter) return false;
        if (publishedFilter === "published" && !q.is_published) return false;
        if (publishedFilter === "draft" && q.is_published) return false;
        return true;
    });

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

    function openPreview(q: any) {
        setPreviewQ(q);
    }

    function openEdit(q: any) {
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
    }

    const compOptions = useMemo(() => {
        const capIds = pillarFilter
            ? capabilities.filter((c) => c.pillar_id === pillarFilter).map((c) => c.id)
            : capabilities.map((c) => c.id);
        return competencies.filter((c) => capIds.includes(c.capability_id));
    }, [pillarFilter, capabilities, competencies]);

    async function saveEdit() {
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
    }

    async function generateWithAi() {
        if (!editingQ) return;
        const templateId = editingQ.template_id as string | undefined;
        if (!templateId) {
            alert("This question is missing template_id, so AI generation is not available.");
            return;
        }
        const desc = aiDesc.trim();
        if (!desc) return;

        try {
            const data = await generateMut.mutateAsync({
                templateId,
                description: desc,
                gradeBand: editGradeBand,
            });
            // Merge generated fields into current JSON so admin can tweak after.
            let current: Record<string, unknown> = {};
            try { current = editDataJson.trim() ? JSON.parse(editDataJson) : {}; } catch { current = {}; }
            const merged = { ...current, ...data };
            setEditDataJson(JSON.stringify(merged, null, 2));
            // Nice UX: if title is empty, auto-fill from instruction-ish fields.
            if (!editTitle.trim() && typeof (data as any).instruction === "string") {
                setEditTitle(String((data as any).instruction).slice(0, 80));
            }
        } catch {
            // error shown inline via generateMut.error
        }
    }

    return (
        <div className={s.page}>
            <div className={s.header}>
                <div>
                    <h1 className={s.title}>Question Bank</h1>
                    <p className={s.subtitle}>{questions?.length ?? 0} questions total</p>
                </div>
                <button className={s.importBtn} onClick={() => navigate("/admin/create-question")}>
                    <Plus size={16} /> New Question
                </button>
            </div>

            {/* ── Filters ── */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
                <div style={{ position: "relative", flex: "1 1 200px" }}>
                    <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }} />
                    <input
                        className={s.input}
                        style={{ paddingLeft: 32 }}
                        placeholder="Search by title or template…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <select className={s.select} style={{ flex: "0 1 160px" }} value={pillarFilter} onChange={(e) => { setPillarFilter(e.target.value); setCompetencyFilter(""); }}>
                    <option value="">All pillars</option>
                    {pillars.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>

                <div style={{ flex: "0 1 240px", position: "relative" }}>
                    <input
                        className={s.input}
                        placeholder={competencyFilter ? `${competencyFilter}` : "Search competency…"}
                        value={compSearch}
                        onChange={(e) => { setCompSearch(e.target.value); if (!e.target.value) setCompetencyFilter(""); }}
                        style={{ marginBottom: 0 }}
                    />
                    {compSearch && (
                        <div style={{
                            position: "absolute", zIndex: 50, top: "100%", left: 0, right: 0,
                            background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 10,
                            boxShadow: "0 4px 20px rgba(0,0,0,0.12)", maxHeight: 200, overflowY: "auto",
                        }}>
                            <div
                                onMouseDown={() => { setCompetencyFilter(""); setCompSearch(""); }}
                                style={{ padding: "7px 12px", fontSize: 12, cursor: "pointer", color: "#a0aec0" }}
                            >
                                Clear filter
                            </div>
                            {filteredComps
                                .filter((c) => `${c.id} ${c.name}`.toLowerCase().includes(compSearch.toLowerCase()))
                                .map((c) => (
                                    <div
                                        key={c.id}
                                        onMouseDown={() => { setCompetencyFilter(c.id); setCompSearch(""); }}
                                        style={{
                                            padding: "7px 12px", fontSize: 13, cursor: "pointer",
                                            background: c.id === competencyFilter ? "#f0f4ff" : "transparent",
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f8f9fa")}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = c.id === competencyFilter ? "#f0f4ff" : "transparent")}
                                    >
                                        <span style={{ fontWeight: 600, color: "#6366f1", marginRight: 6 }}>{c.id}</span>{c.name}
                                    </div>
                                ))
                            }
                        </div>
                    )}
                </div>

                <select className={s.select} style={{ flex: "0 1 140px" }} value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
                    <option value="">All grades</option>
                    <option value="4-5">Grade 4-5</option>
                    <option value="6-7">Grade 6-7</option>
                    <option value="8-9">Grade 8-9</option>
                </select>

                <select className={s.select} style={{ flex: "0 1 140px" }} value={publishedFilter} onChange={(e) => setPublishedFilter(e.target.value as "all" | "published" | "draft")}>
                    <option value="all">All status</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                </select>
            </div>

            {isLoading && <p className={s.emptyState}>Loading…</p>}
            {!isLoading && filtered.length === 0 && <p className={s.emptyState}>No questions match your filters.</p>}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filtered.map((q) => (
                    <div key={q.id} className={s.sessionCard}>
                        <div className={s.sessionInfo}>
                            <div className={s.sessionTitle}>{q.title}</div>
                            <div className={s.sessionMeta}>
                                {q.template_name}
                                {(() => {
                                    const ids: string[] = (q.competency_ids && q.competency_ids.length) ? q.competency_ids : (q.competency_id ? [q.competency_id] : []);
                                    if (!ids.length) return "";
                                    const first = ids[0];
                                    const rest = ids.length - 1;
                                    return ` · ${first}${compMap[first] ? ` — ${compMap[first]}` : ""}${rest > 0 ? ` (+${rest})` : ""}`;
                                })()}
                                {q.grade_band && ` · ${q.grade_band}`}
                                {` · diff: ${q.difficulty.toFixed(2)}`}
                            </div>
                            {extractStatementSnippet(q.data) && (
                                <div style={{ marginTop: 6, fontSize: 12, color: "#059669", lineHeight: 1.4 }}>
                                    {(extractStatementSnippet(q.data) as string).slice(0, 140)}
                                    {(extractStatementSnippet(q.data) as string).length > 140 ? "…" : ""}
                                </div>
                            )}
                        </div>
                        <div className={s.sessionActions}>
                            <span className={`${s.badge} ${q.is_published ? s.badgeSuccess : ""}`} style={{ fontSize: 11 }}>
                                {q.is_published ? "Published" : "Draft"}
                            </span>
                            <button className={s.editBtn} onClick={() => openPreview(q)} title="Preview as student">
                                <Eye size={12} /> Preview
                            </button>
                            <button className={s.editBtn} onClick={() => openEdit(q)}>
                                <Pencil size={12} /> Edit
                            </button>
                            <button
                                className={s.dangerBtn}
                                onClick={() => { if (confirm(`Delete "${q.title}"?`)) deleteMut.mutate(q.id); }}
                                disabled={deleteMut.isPending}
                            >
                                <Trash2 size={12} /> Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Preview Modal ── */}
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
                                <LivePreview slug={previewQ.template_slug} data={previewQ.data ?? {}} />
                            ) : (
                                <div className={s.emptyState}>No preview available (missing template slug).</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Edit Modal ── */}
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
                                        const tmpl = qtTemplates?.find((t) => t.id === (editingQ.template_id as string));
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
                                        onClick={saveEdit}
                                        disabled={
                                            updateMut.isPending ||
                                            !editTitle.trim() ||
                                            editCompetencyIds.length === 0
                                        }
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
        </div>
    );
}
