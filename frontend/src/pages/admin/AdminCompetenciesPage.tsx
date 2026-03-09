/** Admin Competencies Page — Create pillars, capabilities, and competencies. */
import { useState } from "react";
import {
    usePillars,
    useCreatePillar,
    useCapabilities,
    useCreateCapability,
    useCompetencies,
    useCreateCompetency,
} from "@/api/hooks/useAdmin";

export default function AdminCompetenciesPage() {
    const { data: pillars = [], isLoading: lp } = usePillars();
    const { data: capabilities = [], isLoading: lc } = useCapabilities();
    const { data: competencies = [], isLoading: lcmp } = useCompetencies();
    const createPillar = useCreatePillar();
    const createCapability = useCreateCapability();
    const createCompetency = useCreateCompetency();

    // Pillar form
    const [showPillarForm, setShowPillarForm] = useState(false);
    const [pForm, setPForm] = useState({ id: "", name: "", color: "#6366f1", description: "" });

    // Capability form
    const [showCapForm, setShowCapForm] = useState(false);
    const [capForm, setCapForm] = useState({ id: "", pillar_id: "", name: "", description: "" });

    // Competency form
    const [showCompForm, setShowCompForm] = useState(false);
    const [compForm, setCompForm] = useState({ id: "", capability_id: "", name: "", description: "", assessment_method: "mcq" });

    const pillarMap = Object.fromEntries(pillars.map((p) => [p.id, p]));
    const capMap = Object.fromEntries(capabilities.map((c) => [c.id, c]));

    if (lp || lc || lcmp) {
        return <div style={{ padding: 32, textAlign: "center", color: "#888" }}>Loading…</div>;
    }

    return (
        <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>🧠 Competency Framework</h1>
            <p style={{ fontSize: 13, color: "#888", margin: "0 0 20px" }}>
                {pillars.length} pillars · {capabilities.length} capabilities · {competencies.length} competencies
            </p>

            {/* ═══ PILLARS ═══ */}
            <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Pillars</h2>
                    <button onClick={() => { setPForm({ id: "", name: "", color: "#6366f1", description: "" }); setShowPillarForm(true); }} style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: "#6366f1", color: "#fff", fontWeight: 600, fontSize: 11, cursor: "pointer" }}>+ Add Pillar</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
                    {pillars.map((p) => (
                        <div key={p.id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 10, background: "#fff", borderLeft: `4px solid ${p.color}` }}>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                            <div style={{ fontSize: 10, color: "#999" }}>{p.id}</div>
                            <div style={{ fontSize: 11, color: "#666", marginTop: 3, lineHeight: 1.3 }}>{p.description.slice(0, 80)}{p.description.length > 80 ? "…" : ""}</div>
                        </div>
                    ))}
                    {pillars.length === 0 && <div style={{ color: "#aaa", fontSize: 12, padding: 12 }}>No pillars yet. Create the 4 learning pillars first.</div>}
                </div>
            </div>

            {/* ═══ CAPABILITIES ═══ */}
            <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Capabilities</h2>
                    <button onClick={() => { setCapForm({ id: "", pillar_id: pillars[0]?.id || "", name: "", description: "" }); setShowCapForm(true); }} disabled={pillars.length === 0} style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: pillars.length ? "#6366f1" : "#ccc", color: "#fff", fontWeight: 600, fontSize: 11, cursor: pillars.length ? "pointer" : "default" }}>+ Add Capability</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 8 }}>
                    {capabilities.map((c) => (
                        <div key={c.id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 10, background: "#fff" }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                                <span style={{ fontSize: 10, fontWeight: 700, color: "#6366f1" }}>{c.id}</span>
                            </div>
                            <div style={{ fontSize: 10, color: "#999" }}>Pillar: {pillarMap[c.pillar_id]?.name || c.pillar_id}</div>
                            <div style={{ fontSize: 11, color: "#666", marginTop: 3, lineHeight: 1.3 }}>{c.description.slice(0, 80)}{c.description.length > 80 ? "…" : ""}</div>
                        </div>
                    ))}
                    {capabilities.length === 0 && <div style={{ color: "#aaa", fontSize: 12, padding: 12 }}>No capabilities yet. Create pillars first, then add capabilities.</div>}
                </div>
            </div>

            {/* ═══ COMPETENCIES ═══ */}
            <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Competencies</h2>
                    <button onClick={() => { setCompForm({ id: "", capability_id: capabilities[0]?.id || "", name: "", description: "", assessment_method: "mcq" }); setShowCompForm(true); }} disabled={capabilities.length === 0} style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: capabilities.length ? "#6366f1" : "#ccc", color: "#fff", fontWeight: 600, fontSize: 11, cursor: capabilities.length ? "pointer" : "default" }}>+ Add Competency</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {competencies.map((c) => (
                        <div key={c.id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 12px", background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <span style={{ fontWeight: 600, fontSize: 13, marginRight: 8 }}>{c.id}</span>
                                <span style={{ fontSize: 13 }}>{c.name}</span>
                                <div style={{ fontSize: 10, color: "#999", marginTop: 1 }}>
                                    Capability: {capMap[c.capability_id]?.name || c.capability_id} · Method: {c.assessment_method}
                                </div>
                            </div>
                            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: c.assessment_method === "mcq" ? "#dbeafe" : c.assessment_method === "llm" ? "#ede9fe" : "#fef3c7", color: c.assessment_method === "mcq" ? "#2563eb" : c.assessment_method === "llm" ? "#7c3aed" : "#d97706", fontWeight: 600 }}>{c.assessment_method.toUpperCase()}</span>
                        </div>
                    ))}
                    {competencies.length === 0 && <div style={{ color: "#aaa", fontSize: 12, padding: 12 }}>No competencies yet. Create pillars → capabilities → competencies.</div>}
                </div>
            </div>

            {/* ═══ PILLAR MODAL ═══ */}
            {showPillarForm && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                    <div style={{ background: "#fff", borderRadius: 12, padding: 24, width: 420 }}>
                        <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Create Pillar</h3>
                        <div style={{ marginBottom: 10 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 3 }}>ID *</label>
                            <input value={pForm.id} onChange={(e) => setPForm({ ...pForm, id: e.target.value })} placeholder="e.g. communication" style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #ddd", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                        </div>
                        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 3 }}>Name *</label>
                                <input value={pForm.name} onChange={(e) => setPForm({ ...pForm, name: e.target.value })} placeholder="Communication" style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #ddd", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                            </div>
                            <div style={{ width: 60 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 3 }}>Color</label>
                                <input type="color" value={pForm.color} onChange={(e) => setPForm({ ...pForm, color: e.target.value })} style={{ width: "100%", height: 32, border: "none", cursor: "pointer" }} />
                            </div>
                        </div>
                        <div style={{ marginBottom: 14 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 3 }}>Description *</label>
                            <textarea value={pForm.description} onChange={(e) => setPForm({ ...pForm, description: e.target.value })} rows={2} style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #ddd", fontSize: 12, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
                        </div>
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                            <button onClick={() => setShowPillarForm(false)} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", fontSize: 12, cursor: "pointer" }}>Cancel</button>
                            <button disabled={!pForm.id || !pForm.name || !pForm.description} onClick={async () => { await createPillar.mutateAsync(pForm as any); setShowPillarForm(false); }} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: "#6366f1", color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer", opacity: (!pForm.id || !pForm.name) ? 0.5 : 1 }}>Create</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ CAPABILITY MODAL ═══ */}
            {showCapForm && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                    <div style={{ background: "#fff", borderRadius: 12, padding: 24, width: 420 }}>
                        <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Create Capability</h3>
                        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                            <div style={{ width: 60 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 3 }}>ID *</label>
                                <input value={capForm.id} onChange={(e) => setCapForm({ ...capForm, id: e.target.value })} placeholder="A" maxLength={1} style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #ddd", fontSize: 12, outline: "none", boxSizing: "border-box", textTransform: "uppercase" }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 3 }}>Pillar *</label>
                                <select value={capForm.pillar_id} onChange={(e) => setCapForm({ ...capForm, pillar_id: e.target.value })} style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #ddd", fontSize: 12, outline: "none", boxSizing: "border-box" }}>
                                    {pillars.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div style={{ marginBottom: 10 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 3 }}>Name *</label>
                            <input value={capForm.name} onChange={(e) => setCapForm({ ...capForm, name: e.target.value })} placeholder="e.g. Verbal Expression" style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #ddd", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                        </div>
                        <div style={{ marginBottom: 14 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 3 }}>Description *</label>
                            <textarea value={capForm.description} onChange={(e) => setCapForm({ ...capForm, description: e.target.value })} rows={2} style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #ddd", fontSize: 12, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
                        </div>
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                            <button onClick={() => setShowCapForm(false)} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", fontSize: 12, cursor: "pointer" }}>Cancel</button>
                            <button disabled={!capForm.id || !capForm.name || !capForm.description} onClick={async () => { await createCapability.mutateAsync(capForm as any); setShowCapForm(false); }} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: "#6366f1", color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer", opacity: (!capForm.id || !capForm.name) ? 0.5 : 1 }}>Create</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ COMPETENCY MODAL ═══ */}
            {showCompForm && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                    <div style={{ background: "#fff", borderRadius: 12, padding: 24, width: 460 }}>
                        <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Create Competency</h3>
                        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                            <div style={{ width: 80 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 3 }}>ID *</label>
                                <input value={compForm.id} onChange={(e) => setCompForm({ ...compForm, id: e.target.value })} placeholder="C1.1" style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #ddd", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 3 }}>Capability *</label>
                                <select value={compForm.capability_id} onChange={(e) => setCompForm({ ...compForm, capability_id: e.target.value })} style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #ddd", fontSize: 12, outline: "none", boxSizing: "border-box" }}>
                                    {capabilities.map((c) => <option key={c.id} value={c.id}>{c.id} — {c.name}</option>)}
                                </select>
                            </div>
                            <div style={{ width: 90 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 3 }}>Method *</label>
                                <select value={compForm.assessment_method} onChange={(e) => setCompForm({ ...compForm, assessment_method: e.target.value })} style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #ddd", fontSize: 12, outline: "none", boxSizing: "border-box" }}>
                                    <option value="mcq">MCQ</option>
                                    <option value="llm">LLM</option>
                                    <option value="both">Both</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ marginBottom: 10 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 3 }}>Name *</label>
                            <input value={compForm.name} onChange={(e) => setCompForm({ ...compForm, name: e.target.value })} placeholder="e.g. Articulating Ideas Clearly" style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #ddd", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                        </div>
                        <div style={{ marginBottom: 14 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 3 }}>Description *</label>
                            <textarea value={compForm.description} onChange={(e) => setCompForm({ ...compForm, description: e.target.value })} rows={2} style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #ddd", fontSize: 12, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
                        </div>
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                            <button onClick={() => setShowCompForm(false)} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", fontSize: 12, cursor: "pointer" }}>Cancel</button>
                            <button disabled={!compForm.id || !compForm.name || !compForm.description} onClick={async () => { await createCompetency.mutateAsync(compForm as any); setShowCompForm(false); }} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: "#6366f1", color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer", opacity: (!compForm.id || !compForm.name) ? 0.5 : 1 }}>Create</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
