import { useState, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    useCohort,
    useTemplates,
    useImportTemplates,
    useUpdateCohortSession,
} from "@/api/hooks/useAdmin";
import type { ImportTemplateItem } from "@/api/hooks/useAdmin";
import { api } from "@/api/client";
import type { CohortSession } from "@/api/types/admin";
import { ArrowLeft, Download, Pencil, Link2, Users, UserPlus, UserMinus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import * as s from "./admin.css";

// ── Enrollment types ──

interface EnrolledStudent {
    enrollment_id: string;
    student_id: string;
    user_id: string;
    full_name: string;
    email: string;
    board: string | null;
    grade: number | null;
    invite_status: string;
    enrolled_at: string;
}

interface SearchStudent {
    student_id: string;
    user_id: string;
    full_name: string;
    email: string;
    already_enrolled: boolean;
}

interface PaginatedSearch {
    students: SearchStudent[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

export default function CohortDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const qc = useQueryClient();
    const { data: cohort, isLoading } = useCohort(id);
    const { data: templates } = useTemplates();
    const importTemplates = useImportTemplates();
    const updateSession = useUpdateCohortSession();

    // Teachers for assignment
    const { data: teachers } = useQuery<{ id: string; full_name: string; email: string }[]>({
        queryKey: ["teachers"],
        queryFn: () => api.get("/cohorts/teachers").then(r => r.data),
    });

    // Session modals
    const [showImportModal, setShowImportModal] = useState(false);
    const [importItems, setImportItems] = useState<Map<string, { scheduled_at: string; teacher_id: string }>>(new Map());
    const [editingSession, setEditingSession] = useState<CohortSession | null>(null);
    const [formTitle, setFormTitle] = useState("");
    const [formDesc, setFormDesc] = useState("");
    const [formScheduledAt, setFormScheduledAt] = useState("");
    const [formTeacherId, setFormTeacherId] = useState("");

    // Student enrollment
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [linkSearch, setLinkSearch] = useState("");
    const [linkPage, setLinkPage] = useState(1);
    const linkPageSize = 10;

    const { data: enrolledStudents } = useQuery<EnrolledStudent[]>({
        queryKey: ["cohort-students", id],
        queryFn: () => api.get(`/cohorts/${id}/students`).then((r) => r.data),
        enabled: !!id,
    });

    const { data: searchData } = useQuery<PaginatedSearch>({
        queryKey: ["cohort-students-search", id, linkSearch, linkPage],
        queryFn: () =>
            api.get(`/cohorts/${id}/students/search`, { params: { q: linkSearch, page: linkPage, page_size: linkPageSize } }).then((r) => r.data),
        enabled: !!id && showLinkModal,
    });

    const enrollMutation = useMutation({
        mutationFn: (studentId: string) =>
            api.post(`/cohorts/${id}/students`, { student_id: studentId }).then((r) => r.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["cohort-students", id] });
            qc.invalidateQueries({ queryKey: ["cohort-students-search", id] });
        },
    });

    const unenrollMutation = useMutation({
        mutationFn: (studentId: string) =>
            api.delete(`/cohorts/${id}/students/${studentId}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["cohort-students", id] });
            qc.invalidateQueries({ queryKey: ["cohort-students-search", id] });
        },
    });

    // Already imported template IDs
    const importedTemplateIds = new Set(cohort?.sessions.map(s => s.template_id).filter(Boolean));

    function toggleTemplate(tid: string) {
        setImportItems(prev => {
            const next = new Map(prev);
            if (next.has(tid)) next.delete(tid);
            else next.set(tid, { scheduled_at: "", teacher_id: "" });
            return next;
        });
    }

    function updateImportItem(tid: string, field: "scheduled_at" | "teacher_id", value: string) {
        setImportItems(prev => {
            const next = new Map(prev);
            const item = next.get(tid);
            if (item) {
                next.set(tid, { ...item, [field]: value });
            }
            return next;
        });
    }

    async function handleImport() {
        if (!id || importItems.size === 0) return;
        const items: ImportTemplateItem[] = Array.from(importItems.entries()).map(([tid, config]) => ({
            template_id: tid,
            scheduled_at: config.scheduled_at || undefined,
            teacher_id: config.teacher_id || undefined,
        }));
        await importTemplates.mutateAsync({ cohortId: id, items });
        setImportItems(new Map());
        setShowImportModal(false);
    }

    function openEditSession(sess: CohortSession) {
        setEditingSession(sess);
        setFormTitle(sess.title ?? "");
        setFormDesc(sess.description ?? "");
        setFormScheduledAt(sess.scheduled_at ? sess.scheduled_at.slice(0, 16) : "");
        setFormTeacherId("");
    }

    async function handleUpdateSession(e: FormEvent) {
        e.preventDefault();
        if (!id || !editingSession) return;
        await updateSession.mutateAsync({
            cohortId: id,
            sessionId: editingSession.id,
            title: formTitle,
            description: formDesc || undefined,
            scheduled_at: formScheduledAt || undefined,
            teacher_id: formTeacherId || undefined,
        });
        setEditingSession(null);
    }

    if (isLoading) return <p className={s.emptyState}>Loading...</p>;
    if (!cohort) return <p className={s.emptyState}>Cohort not found.</p>;

    return (
        <div className={s.page}>
            <button className={s.backLink} onClick={() => navigate("/admin/cohorts")}>
                <ArrowLeft size={14} /> Back to Cohorts
            </button>

            <div className={s.header}>
                <div>
                    <h1 className={s.title}>{cohort.name}</h1>
                    <div className={s.subtitle}>
                        Grade {cohort.grade_band}
                        {cohort.board && ` · ${cohort.board.toUpperCase()}`}
                        {cohort.description && ` · ${cohort.description}`}
                    </div>
                </div>
                <button className={s.importBtn} onClick={() => setShowImportModal(true)}>
                    <Download size={18} /> Import Templates
                </button>
            </div>

            {/* ── Sessions Section ── */}
            {!cohort.sessions.length && (
                <p className={s.emptyState}>
                    No sessions yet. Import templates to create sessions.
                </p>
            )}

            <div className={s.sessionList}>
                {cohort.sessions.map((sess) => (
                    <div key={sess.id} className={s.sessionCard}>
                        <div className={s.sessionOrder}>{sess.order ?? sess.session_number}</div>
                        <div className={s.sessionInfo}>
                            <div className={s.sessionTitle}>{sess.title ?? `Session ${sess.session_number}`}</div>
                            <div className={s.sessionMeta}>
                                {sess.scheduled_at && new Date(sess.scheduled_at).toLocaleString()}
                                {sess.description && ` — ${sess.description}`}
                            </div>
                            {sess.template_id && (
                                <span className={`${s.badge} ${s.badgeSuccess}`} style={{ marginTop: 4 }}>
                                    <Link2 size={10} style={{ marginRight: 4 }} /> From template
                                </span>
                            )}
                        </div>
                        <div className={s.sessionActions}>
                            <button className={s.editBtn} onClick={() => openEditSession(sess)}>
                                <Pencil size={12} /> Edit
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Students Section ── */}
            <div style={{ marginTop: 32 }}>
                <div className={s.header}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Users size={20} />
                        <h2 className={s.title} style={{ fontSize: 18 }}>
                            Enrolled Students ({enrolledStudents?.length ?? 0})
                        </h2>
                    </div>
                    <button className={s.addBtn} onClick={() => setShowLinkModal(true)}>
                        <UserPlus size={16} /> Add Student
                    </button>
                </div>

                {!enrolledStudents?.length && (
                    <p className={s.emptyState}>No students enrolled in this cohort yet.</p>
                )}

                <div className={s.sessionList}>
                    {enrolledStudents?.map((st) => (
                        <div key={st.enrollment_id} className={s.sessionCard}>
                            <div className={s.sessionOrder} style={{ width: 40, height: 40, fontSize: 12 }}>
                                {st.full_name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
                            </div>
                            <div className={s.sessionInfo}>
                                <div className={s.sessionTitle}>{st.full_name}</div>
                                <div className={s.sessionMeta}>
                                    {st.email}
                                    {st.board && ` · ${st.board.toUpperCase()}`}
                                    {st.grade && ` · Grade ${st.grade}`}
                                </div>
                            </div>
                            <div className={s.sessionActions}>
                                <button
                                    className={s.dangerBtn}
                                    onClick={() => {
                                        if (confirm(`Remove ${st.full_name} from this cohort?`))
                                            unenrollMutation.mutate(st.student_id);
                                    }}
                                >
                                    <UserMinus size={12} /> Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Add Student Modal ── */}
            {showLinkModal && (
                <div className={s.overlay} onClick={() => setShowLinkModal(false)}>
                    <div className={s.modal} onClick={(e) => e.stopPropagation()}>
                        <h2 className={s.modalTitle}>Add Student to Cohort</h2>
                        <div style={{ position: "relative", marginBottom: 16 }}>
                            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }} />
                            <input
                                className={s.input}
                                style={{ paddingLeft: 36 }}
                                placeholder="Search by name or email..."
                                value={linkSearch}
                                onChange={(e) => { setLinkSearch(e.target.value); setLinkPage(1); }}
                                autoFocus
                            />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 350, overflowY: "auto" }}>
                            {!searchData?.students.length && <p className={s.emptyState}>No students found.</p>}
                            {searchData?.students.map((st) => (
                                <div key={st.student_id} className={s.sessionCard} style={{ opacity: st.already_enrolled ? 0.5 : 1 }}>
                                    <div className={s.sessionOrder} style={{ width: 36, height: 36, fontSize: 11 }}>
                                        {st.full_name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
                                    </div>
                                    <div className={s.sessionInfo}>
                                        <div className={s.sessionTitle} style={{ fontSize: 13 }}>{st.full_name}</div>
                                        <div className={s.sessionMeta}>{st.email}</div>
                                    </div>
                                    {st.already_enrolled ? (
                                        <span className={`${s.badge} ${s.badgeSuccess}`} style={{ fontSize: 11 }}>Already enrolled</span>
                                    ) : (
                                        <button className={s.addBtn} style={{ padding: "4px 12px", fontSize: 12 }} onClick={() => enrollMutation.mutate(st.student_id)} disabled={enrollMutation.isPending}>
                                            <UserPlus size={12} /> Enroll
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        {searchData && searchData.total_pages > 0 && (
                            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 12 }}>
                                <button className={s.cancelBtn} style={{ padding: "4px 8px" }} onClick={() => setLinkPage((p) => Math.max(1, p - 1))} disabled={linkPage <= 1}>
                                    <ChevronLeft size={16} />
                                </button>
                                <span style={{ fontSize: 13 }}>{searchData.page}/{searchData.total_pages}</span>
                                <button className={s.cancelBtn} style={{ padding: "4px 8px" }} onClick={() => setLinkPage((p) => Math.min(searchData.total_pages, p + 1))} disabled={linkPage >= searchData.total_pages}>
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        )}
                        <div className={s.formActions} style={{ marginTop: 12 }}>
                            <button className={s.cancelBtn} onClick={() => setShowLinkModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Import Templates Modal ── */}
            {showImportModal && (
                <div className={s.overlay} onClick={() => setShowImportModal(false)}>
                    <div className={s.modal} style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
                        <h2 className={s.modalTitle}>Import Templates</h2>
                        <p className={s.subtitle} style={{ marginBottom: 16 }}>
                            Select templates, assign a schedule and teacher for each.
                        </p>
                        {!templates?.length && <p className={s.emptyState}>No templates available.</p>}
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 450, overflowY: "auto" }}>
                            {templates?.map((t) => {
                                const alreadyImported = importedTemplateIds.has(t.id);
                                const selected = importItems.has(t.id);
                                const config = importItems.get(t.id);
                                return (
                                    <div key={t.id} style={{ opacity: alreadyImported ? 0.5 : 1 }}>
                                        <button
                                            className={s.templatePickerCard}
                                            style={{
                                                border: selected ? "2px solid var(--color-primary, #6366f1)" : undefined,
                                                width: "100%",
                                            }}
                                            onClick={() => !alreadyImported && toggleTemplate(t.id)}
                                            disabled={alreadyImported}
                                        >
                                            <div className={s.cardTitle} style={{ fontSize: 14 }}>{t.title}</div>
                                            <div className={s.cardMeta}>
                                                {t.activities.length} activities
                                                {alreadyImported && " · Already imported"}
                                            </div>
                                        </button>
                                        {selected && config && (
                                            <div style={{ display: "flex", gap: 8, padding: "8px 4px", flexWrap: "wrap" }}>
                                                <div style={{ flex: 1, minWidth: 180 }}>
                                                    <label className={s.label} style={{ fontSize: 11 }}>Scheduled Date & Time</label>
                                                    <input
                                                        className={s.input}
                                                        type="datetime-local"
                                                        value={config.scheduled_at}
                                                        onChange={(e) => updateImportItem(t.id, "scheduled_at", e.target.value)}
                                                    />
                                                </div>
                                                <div style={{ flex: 1, minWidth: 180 }}>
                                                    <label className={s.label} style={{ fontSize: 11 }}>Assign Teacher</label>
                                                    <select
                                                        className={s.select}
                                                        value={config.teacher_id}
                                                        onChange={(e) => updateImportItem(t.id, "teacher_id", e.target.value)}
                                                    >
                                                        <option value="">-- No teacher --</option>
                                                        {teachers?.map(tc => (
                                                            <option key={tc.id} value={tc.id}>{tc.full_name} ({tc.email})</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div className={s.formActions} style={{ marginTop: 16 }}>
                            <button className={s.cancelBtn} onClick={() => setShowImportModal(false)}>Cancel</button>
                            <button
                                className={s.submitBtn}
                                onClick={handleImport}
                                disabled={importItems.size === 0 || importTemplates.isPending}
                            >
                                {importTemplates.isPending ? "Importing..." : `Import ${importItems.size} template${importItems.size !== 1 ? "s" : ""}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Edit Session Modal ── */}
            {editingSession && (
                <div className={s.overlay} onClick={() => setEditingSession(null)}>
                    <div className={s.modal} onClick={(e) => e.stopPropagation()}>
                        <h2 className={s.modalTitle}>Edit Session</h2>
                        <form onSubmit={handleUpdateSession} className={s.form}>
                            <div>
                                <label className={s.label}>Title</label>
                                <input className={s.input} value={formTitle} onChange={(e) => setFormTitle(e.target.value)} required />
                            </div>
                            <div>
                                <label className={s.label}>Description</label>
                                <textarea className={s.textarea} value={formDesc} onChange={(e) => setFormDesc(e.target.value)} />
                            </div>
                            <div>
                                <label className={s.label}>Scheduled Date & Time</label>
                                <input className={s.input} type="datetime-local" value={formScheduledAt} onChange={(e) => setFormScheduledAt(e.target.value)} />
                            </div>
                            <div>
                                <label className={s.label}>Assign Teacher</label>
                                <select className={s.select} value={formTeacherId} onChange={(e) => setFormTeacherId(e.target.value)}>
                                    <option value="">-- No teacher --</option>
                                    {teachers?.map(t => (
                                        <option key={t.id} value={t.id}>{t.full_name} ({t.email})</option>
                                    ))}
                                </select>
                            </div>
                            <div className={s.formActions}>
                                <button type="button" className={s.cancelBtn} onClick={() => setEditingSession(null)}>Cancel</button>
                                <button type="submit" className={s.submitBtn} disabled={updateSession.isPending}>
                                    {updateSession.isPending ? "Saving..." : "Save"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
