import { useState } from "react";
import { useNavigate } from "react-router";
import { useActivityQuestions, useDeleteActivityQuestion } from "@/api/hooks/useAdmin";
import { useSkillGraph } from "@/api/hooks/useCompetencies";
import { Plus, Search, Trash2, Pencil } from "lucide-react";
import * as s from "./admin.css";

export default function QuestionBankPage() {
    const navigate = useNavigate();
    const { data: questions, isLoading } = useActivityQuestions();
    const { data: graph } = useSkillGraph();
    const deleteMut = useDeleteActivityQuestion();

    const [search, setSearch] = useState("");
    const [pillarFilter, setPillarFilter] = useState("");
    const [competencyFilter, setCompetencyFilter] = useState("");
    const [compSearch, setCompSearch] = useState("");
    const [gradeFilter, setGradeFilter] = useState("");
    const [publishedFilter, setPublishedFilter] = useState<"all" | "published" | "draft">("all");

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
        if (competencyFilter && q.competency_id !== competencyFilter) return false;
        if (pillarFilter && competencyFilter === "") {
            // filter by pillar: check if q.competency_id belongs to a capability in this pillar
            const comp = competencies.find((c) => c.id === q.competency_id);
            if (!comp || !filteredCapIds.includes(comp.capability_id)) return false;
        }
        if (gradeFilter && q.grade_band !== gradeFilter) return false;
        if (publishedFilter === "published" && !q.is_published) return false;
        if (publishedFilter === "draft" && q.is_published) return false;
        return true;
    });

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
                                {q.competency_id && ` · ${q.competency_id}${compMap[q.competency_id] ? ` — ${compMap[q.competency_id]}` : ""}`}
                                {q.grade_band && ` · ${q.grade_band}`}
                                {` · diff: ${q.difficulty.toFixed(2)}`}
                            </div>
                        </div>
                        <div className={s.sessionActions}>
                            <span className={`${s.badge} ${q.is_published ? s.badgeSuccess : ""}`} style={{ fontSize: 11 }}>
                                {q.is_published ? "Published" : "Draft"}
                            </span>
                            <button className={s.editBtn} onClick={() => navigate("/admin/create-question", { state: { editId: q.id } })}>
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
        </div>
    );
}
