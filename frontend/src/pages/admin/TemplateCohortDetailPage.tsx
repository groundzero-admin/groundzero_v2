import { useState, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router";
import {
    useTemplateCohort,
    useCreateTemplateSession,
    useUpdateTemplateSession,
    useDeleteTemplateSession,
} from "@/api/hooks/useAdmin";
import { ArrowLeft, Plus, Trash2, Pencil } from "lucide-react";
import * as s from "./admin.css";

export default function TemplateCohortDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: cohort, isLoading } = useTemplateCohort(id);
    const createSession = useCreateTemplateSession();
    const updateSession = useUpdateTemplateSession();
    const deleteSession = useDeleteTemplateSession();

    const [showSessionModal, setShowSessionModal] = useState(false);
    const [editingSession, setEditingSession] = useState<string | null>(null);
    const [formTitle, setFormTitle] = useState("");
    const [formDesc, setFormDesc] = useState("");
    const [formDay, setFormDay] = useState(1);
    const [formOrder, setFormOrder] = useState(0);

    function openAddSession() {
        setEditingSession(null);
        setFormTitle("");
        setFormDesc("");
        setFormDay(1);
        setFormOrder((cohort?.sessions.length ?? 0) + 1);
        setShowSessionModal(true);
    }

    function openEditSession(sess: { id: string; title: string; description: string | null; day: number; order: number }) {
        setEditingSession(sess.id);
        setFormTitle(sess.title);
        setFormDesc(sess.description ?? "");
        setFormDay(sess.day);
        setFormOrder(sess.order);
        setShowSessionModal(true);
    }

    async function handleSubmitSession(e: FormEvent) {
        e.preventDefault();
        if (!id) return;

        if (editingSession) {
            await updateSession.mutateAsync({
                cohortId: id,
                sessionId: editingSession,
                title: formTitle,
                description: formDesc || undefined,
                day: formDay,
                order: formOrder,
            });
        } else {
            await createSession.mutateAsync({
                cohortId: id,
                title: formTitle,
                description: formDesc || undefined,
                day: formDay,
                order: formOrder,
            });
        }
        setShowSessionModal(false);
    }

    async function handleDeleteSession(sessionId: string) {
        if (!id) return;
        if (!confirm("Delete this session?")) return;
        await deleteSession.mutateAsync({ cohortId: id, sessionId });
    }

    if (isLoading) return <p className={s.emptyState}>Loading...</p>;
    if (!cohort) return <p className={s.emptyState}>Template cohort not found.</p>;

    return (
        <div className={s.page}>
            <button className={s.backLink} onClick={() => navigate("/admin/templates")}>
                <ArrowLeft size={14} /> Back to Templates
            </button>

            <div className={s.header}>
                <div>
                    <h1 className={s.title}>{cohort.name}</h1>
                    <div className={s.subtitle}>
                        Level {cohort.level} · {cohort.mode}
                        {cohort.description && ` · ${cohort.description}`}
                    </div>
                </div>
                <button className={s.addBtn} onClick={openAddSession}>
                    <Plus size={18} /> Add Session
                </button>
            </div>

            {!cohort.sessions.length && (
                <p className={s.emptyState}>No sessions yet. Add one to build your template.</p>
            )}

            <div className={s.sessionList}>
                {cohort.sessions.map((sess) => (
                    <div key={sess.id} className={s.sessionCard}>
                        <div className={s.sessionOrder}>{sess.order}</div>
                        <div className={s.sessionInfo}>
                            <div className={s.sessionTitle}>{sess.title}</div>
                            <div className={s.sessionMeta}>
                                Day {sess.day}
                                {sess.description && ` — ${sess.description}`}
                            </div>
                        </div>
                        <div className={s.sessionActions}>
                            <button className={s.editBtn} onClick={() => openEditSession(sess)}>
                                <Pencil size={12} /> Edit
                            </button>
                            <button className={s.dangerBtn} onClick={() => handleDeleteSession(sess.id)}>
                                <Trash2 size={12} /> Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Session Modal */}
            {showSessionModal && (
                <div className={s.overlay} onClick={() => setShowSessionModal(false)}>
                    <div className={s.modal} onClick={(e) => e.stopPropagation()}>
                        <h2 className={s.modalTitle}>{editingSession ? "Edit Session" : "Add Session"}</h2>
                        <form onSubmit={handleSubmitSession} className={s.form}>
                            <div>
                                <label className={s.label}>Title *</label>
                                <input
                                    className={s.input}
                                    value={formTitle}
                                    onChange={(e) => setFormTitle(e.target.value)}
                                    placeholder="e.g. Introduction to AI"
                                    required
                                />
                            </div>
                            <div>
                                <label className={s.label}>Description</label>
                                <textarea
                                    className={s.textarea}
                                    value={formDesc}
                                    onChange={(e) => setFormDesc(e.target.value)}
                                    placeholder="Optional description"
                                />
                            </div>
                            <div style={{ display: "flex", gap: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <label className={s.label}>Day (offset)</label>
                                    <input
                                        className={s.input}
                                        type="number"
                                        min={1}
                                        value={formDay}
                                        onChange={(e) => setFormDay(Number(e.target.value))}
                                        required
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label className={s.label}>Order</label>
                                    <input
                                        className={s.input}
                                        type="number"
                                        min={0}
                                        value={formOrder}
                                        onChange={(e) => setFormOrder(Number(e.target.value))}
                                        required
                                    />
                                </div>
                            </div>
                            <div className={s.formActions}>
                                <button type="button" className={s.cancelBtn} onClick={() => setShowSessionModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className={s.submitBtn}>
                                    {editingSession ? "Update" : "Add"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
