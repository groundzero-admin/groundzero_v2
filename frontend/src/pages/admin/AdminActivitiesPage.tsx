/** Admin page — Activity bank. Cards grid with create/edit/delete. */
import { useState } from "react";
import { useNavigate } from "react-router";
import {
    useActivities,
    useCreateActivity,
    useUpdateActivity,
    useDeleteActivity,
    useCompetencies,
} from "@/api/hooks/useAdmin";
import type { Activity } from "@/api/types/admin";

const TYPES = ["warmup", "key_topic", "diy", "ai_lab", "artifact"] as const;
const TYPE_COLORS: Record<string, string> = {
    warmup: "#f59e0b",
    key_topic: "#6366f1",
    diy: "#10b981",
    ai_lab: "#ec4899",
    artifact: "#8b5cf6",
};

export default function AdminActivitiesPage() {
    const navigate = useNavigate();
    const { data: activities = [], isLoading } = useActivities();
    const { data: competencies = [] } = useCompetencies();
    const createMut = useCreateActivity();
    const updateMut = useUpdateActivity();
    const deleteMut = useDeleteActivity();

    const [showCreate, setShowCreate] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("");

    // Form state
    const [form, setForm] = useState<{
        id: string; name: string; module_id: string; type: Activity["type"]; description: string;
        duration_minutes: number; grade_bands: string[]; primary_competencies: { competency_id: string; expected_gain: number }[];
    }>({

        id: "",
        name: "",
        module_id: "level_1",
        type: "warmup",
        description: "",
        duration_minutes: 30,
        grade_bands: [] as string[],
        primary_competencies: [] as { competency_id: string; expected_gain: number }[],
    });

    function resetForm() {
        setForm({ id: "", name: "", module_id: "level_1", type: "warmup" as const, description: "", duration_minutes: 30, grade_bands: [], primary_competencies: [] });
    }

    function openEdit(a: Activity) {
        setEditId(a.id);
        setForm({
            id: a.id,
            name: a.name,
            module_id: a.module_id,
            type: a.type as Activity["type"],
            description: a.description || "",
            duration_minutes: a.duration_minutes || 30,
            grade_bands: a.grade_bands || [],
            primary_competencies: a.primary_competencies || [],
        });
    }

    async function handleSave() {
        if (editId) {
            await updateMut.mutateAsync({ id: editId, name: form.name, module_id: form.module_id, type: form.type, description: form.description || null, duration_minutes: form.duration_minutes, grade_bands: form.grade_bands.length ? form.grade_bands : null, primary_competencies: form.primary_competencies.length ? form.primary_competencies : null } as any);
            setEditId(null);
        } else {
            await createMut.mutateAsync({ id: form.id, name: form.name, module_id: form.module_id, type: form.type, description: form.description || null, duration_minutes: form.duration_minutes, grade_bands: form.grade_bands.length ? form.grade_bands : null, primary_competencies: form.primary_competencies.length ? form.primary_competencies : null } as any);
            setShowCreate(false);
        }
        resetForm();
    }

    const filtered = activities.filter(
        (a) =>
            (!search || a.name.toLowerCase().includes(search.toLowerCase()) || a.id.toLowerCase().includes(search.toLowerCase())) &&
            (!typeFilter || a.type === typeFilter)
    );

    const compMap = Object.fromEntries(competencies.map((c) => [c.id, c]));

    if (isLoading) {
        return (
            <div style={{ padding: 32, textAlign: "center", color: "#888" }}>Loading activities…</div>
        );
    }

    return (
        <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>📚 Activities</h1>
                    <p style={{ fontSize: 13, color: "#888", margin: "4px 0 0" }}>{activities.length} activities in bank</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowCreate(true); }}
                    style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
                >
                    + Create Activity
                </button>
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <input
                    placeholder="Search by name or ID…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, outline: "none" }}
                />
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, outline: "none" }}
                >
                    <option value="">All Types</option>
                    {TYPES.map((t) => (
                        <option key={t} value={t}>{t.replace("_", " ")}</option>
                    ))}
                </select>
            </div>

            {/* Activity Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
                {filtered.map((a) => (
                    <div
                        key={a.id}
                        style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: 10,
                            padding: 14,
                            background: "#fff",
                            cursor: "pointer",
                            transition: "box-shadow 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)")}
                        onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                            <div
                                onClick={() => navigate(`/admin/activities/${a.id}`)}
                                style={{ flex: 1 }}
                            >
                                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{a.name}</div>
                                <div style={{ fontSize: 11, color: "#999" }}>{a.id}</div>
                            </div>
                            <span
                                style={{
                                    fontSize: 10,
                                    fontWeight: 600,
                                    padding: "2px 8px",
                                    borderRadius: 6,
                                    background: `${TYPE_COLORS[a.type] || "#888"}20`,
                                    color: TYPE_COLORS[a.type] || "#888",
                                    textTransform: "uppercase",
                                    flexShrink: 0,
                                }}
                            >
                                {a.type.replace("_", " ")}
                            </span>
                        </div>
                        {a.description && (
                            <p style={{ fontSize: 12, color: "#666", margin: "4px 0 8px", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                {a.description}
                            </p>
                        )}
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                            {(a.primary_competencies || []).slice(0, 4).map((pc) => (
                                <span key={pc.competency_id} style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: "#f3f4f6", color: "#555" }}>
                                    {pc.competency_id} {compMap[pc.competency_id]?.name ? `· ${compMap[pc.competency_id].name.slice(0, 20)}` : ""}
                                </span>
                            ))}
                        </div>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                            <button onClick={(e) => { e.stopPropagation(); openEdit(a); }} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>Edit</button>
                            <button
                                onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${a.name}"?`)) deleteMut.mutate(a.id); }}
                                style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "1px solid #fecaca", background: "#fef2f2", color: "#ef4444", cursor: "pointer" }}
                            >Delete</button>
                        </div>
                    </div>
                ))}
            </div>

            {filtered.length === 0 && (
                <div style={{ textAlign: "center", padding: 40, color: "#aaa", fontSize: 14 }}>
                    {search || typeFilter ? "No activities match your filters." : "No activities yet. Create your first!"}
                </div>
            )}

            {/* Create / Edit Modal */}
            {(showCreate || editId) && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                    <div style={{ background: "#fff", borderRadius: 12, padding: 24, width: 500, maxHeight: "85vh", overflow: "auto" }}>
                        <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px" }}>{editId ? "Edit Activity" : "Create Activity"}</h2>

                        {!editId && (
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Activity ID *</label>
                                <input value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="e.g. L1-W1-S1-warmup" style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                            </div>
                        )}

                        <div style={{ marginBottom: 12 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Name *</label>
                            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Activity name" style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                        </div>

                        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Module</label>
                                <input value={form.module_id} onChange={(e) => setForm({ ...form, module_id: e.target.value })} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Type</label>
                                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Activity["type"] })} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, outline: "none", boxSizing: "border-box" }}>
                                    {TYPES.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                                </select>
                            </div>
                            <div style={{ width: 80 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Mins</label>
                                <input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: +e.target.value })} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                            </div>
                        </div>

                        <div style={{ marginBottom: 12 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Description</label>
                            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
                        </div>

                        {/* Competency Picker */}
                        <div style={{ marginBottom: 12 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Primary Competencies</label>
                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
                                {form.primary_competencies.map((pc) => (
                                    <span key={pc.competency_id} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: "#ede9fe", color: "#6366f1", display: "flex", alignItems: "center", gap: 4 }}>
                                        {pc.competency_id}
                                        <button onClick={() => setForm({ ...form, primary_competencies: form.primary_competencies.filter((x) => x.competency_id !== pc.competency_id) })} style={{ border: "none", background: "none", color: "#6366f1", cursor: "pointer", padding: 0, fontSize: 12 }}>×</button>
                                    </span>
                                ))}
                            </div>
                            <select
                                value=""
                                onChange={(e) => {
                                    if (e.target.value && !form.primary_competencies.find((p) => p.competency_id === e.target.value)) {
                                        setForm({ ...form, primary_competencies: [...form.primary_competencies, { competency_id: e.target.value, expected_gain: 0.15 }] });
                                    }
                                }}
                                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                            >
                                <option value="">+ Add competency…</option>
                                {competencies.map((c) => <option key={c.id} value={c.id}>{c.id} — {c.name}</option>)}
                            </select>
                        </div>

                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
                            <button onClick={() => { setShowCreate(false); setEditId(null); resetForm(); }} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", fontSize: 13, cursor: "pointer" }}>Cancel</button>
                            <button
                                onClick={handleSave}
                                disabled={!form.name || (!editId && !form.id)}
                                style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer", opacity: (!form.name || (!editId && !form.id)) ? 0.5 : 1 }}
                            >
                                {editId ? "Save Changes" : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
