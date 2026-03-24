import { useEffect, useState, type FormEvent, type FormEventHandler } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    useCohort,
    useTemplates,
    useImportTemplates,
    useUpdateCohortSession,
    useSessionView,
    useActivities,
} from "@/api/hooks/useAdmin";
import { useSessionActivities, useAddSessionActivity, useRemoveSessionActivity } from "@/api/hooks/useTeacher";
import type { ImportTemplateItem } from "@/api/hooks/useAdmin";
import { api } from "@/api/client";
import type { CohortSession, SessionViewOut, SessionViewQuestion } from "@/api/types/admin";
import {
    ArrowLeft,
    Download,
    Pencil,
    Users,
    UserPlus,
    UserMinus,
    Search,
    ChevronLeft,
    ChevronRight,
    Calendar,
    User,
    ArrowUp,
    ArrowDown,
    ArrowUpDown,
    Hash,
    Eye,
    Layers,
    BarChart2,
} from "lucide-react";
import * as s from "./admin.css";
import LivePreview from "./LivePreview";

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

function EditSessionModal({
    sess, formTitle, setFormTitle, formDesc, setFormDesc,
    formScheduledAt, setFormScheduledAt, formTeacherId, setFormTeacherId,
    activitySearch, setActivitySearch,
    teachers, allActivities, updateSession, addSessionActivity, removeSessionActivity,
    onSubmit, onClose,
}: {
    sess: CohortSession;
    formTitle: string; setFormTitle: (v: string) => void;
    formDesc: string; setFormDesc: (v: string) => void;
    formScheduledAt: string; setFormScheduledAt: (v: string) => void;
    formTeacherId: string; setFormTeacherId: (v: string) => void;
    activitySearch: string; setActivitySearch: (v: string) => void;
    teachers: { id: string; full_name: string; email: string }[];
    allActivities: { id: string; name: string; type: string; duration_minutes: number | null }[];
    updateSession: { isPending: boolean };
    addSessionActivity: { mutate: (p: { sessionId: string; activityId: string }) => void; isPending: boolean };
    removeSessionActivity: { mutate: (p: { sessionId: string; activityId: string }) => void; isPending: boolean };
    onSubmit: FormEventHandler;
    onClose: () => void;
}) {
    const { data: sessionActivities } = useSessionActivities(sess.id);
    const linkedIds = new Set((sessionActivities ?? []).map((a) => a.activity_id));
    const searchLower = activitySearch.toLowerCase();
    const availableActivities = allActivities.filter(
        (a) => !linkedIds.has(a.id) && (!searchLower || a.name.toLowerCase().includes(searchLower) || a.id.toLowerCase().includes(searchLower))
    );

    return (
        <div className={s.overlay} onClick={onClose}>
            <div className={s.modal} style={{ maxWidth: 640, maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
                <h2 className={s.modalTitle}>Edit Session</h2>
                <form onSubmit={onSubmit} className={s.form}>
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
                            {teachers.map(t => (
                                <option key={t.id} value={t.id}>{t.full_name} ({t.email})</option>
                            ))}
                        </select>
                    </div>
                    <div className={s.formActions}>
                        <button type="button" className={s.cancelBtn} onClick={onClose}>Cancel</button>
                        <button type="submit" className={s.submitBtn} disabled={updateSession.isPending}>
                            {updateSession.isPending ? "Saving..." : "Save"}
                        </button>
                    </div>
                </form>

                {/* ── Activities ── */}
                <div style={{ borderTop: "1px solid var(--color-border-subtle)", marginTop: 16, paddingTop: 16 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>
                        Activities ({sessionActivities?.length ?? 0})
                    </div>
                    {(sessionActivities ?? []).length === 0 && (
                        <p style={{ fontSize: 13, opacity: 0.5, fontStyle: "italic" }}>No activities yet.</p>
                    )}
                    {(sessionActivities ?? []).map((a) => (
                        <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--color-border-subtle)" }}>
                            <div style={{ flex: 1, fontSize: 13 }}>
                                <span style={{ fontWeight: 500 }}>{a.activity_name ?? a.activity_id}</span>
                                <span style={{ opacity: 0.5, marginLeft: 8, fontSize: 11 }}>{a.activity_type} · {a.duration_minutes ? `${a.duration_minutes}m` : "—"}</span>
                                <span style={{ marginLeft: 8, fontSize: 11, opacity: 0.4 }}>{a.status}</span>
                            </div>
                            {(a.status === "pending" || a.status === "paused") && (
                                <button
                                    type="button"
                                    className={s.dangerBtn}
                                    style={{ padding: "3px 10px", fontSize: 11 }}
                                    disabled={removeSessionActivity.isPending}
                                    onClick={() => removeSessionActivity.mutate({ sessionId: sess.id, activityId: a.activity_id })}
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    ))}

                    <div style={{ marginTop: 14 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Add Activity</div>
                        <div style={{ position: "relative", marginBottom: 8 }}>
                            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }} />
                            <input
                                className={s.input}
                                style={{ paddingLeft: 30, fontSize: 13 }}
                                placeholder="Search activities..."
                                value={activitySearch}
                                onChange={(e) => setActivitySearch(e.target.value)}
                            />
                        </div>
                        <div style={{ maxHeight: 200, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                            {availableActivities.slice(0, 30).map((a) => (
                                <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0" }}>
                                    <div style={{ flex: 1, fontSize: 13 }}>
                                        <span style={{ fontWeight: 500 }}>{a.name}</span>
                                        <span style={{ opacity: 0.5, marginLeft: 8, fontSize: 11 }}>{a.type} · {a.duration_minutes ? `${a.duration_minutes}m` : "—"}</span>
                                    </div>
                                    <button
                                        type="button"
                                        className={s.addBtn}
                                        style={{ padding: "3px 10px", fontSize: 11 }}
                                        disabled={addSessionActivity.isPending}
                                        onClick={() => addSessionActivity.mutate({ sessionId: sess.id, activityId: a.id })}
                                    >
                                        + Add
                                    </button>
                                </div>
                            ))}
                            {availableActivities.length === 0 && (
                                <p style={{ fontSize: 12, opacity: 0.5, fontStyle: "italic" }}>
                                    {activitySearch ? "No matches." : "All activities already added."}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CohortDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const qc = useQueryClient();
    const { data: cohort, isLoading } = useCohort(id);
    const { data: templates } = useTemplates();
    const { data: allActivities } = useActivities();
    const importTemplates = useImportTemplates();
    const updateSession = useUpdateCohortSession();
    const addSessionActivity = useAddSessionActivity();
    const removeSessionActivity = useRemoveSessionActivity();

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
    const [activitySearch, setActivitySearch] = useState("");

    // Session viewer (admin preview)
    const [sessionViewSessionId, setSessionViewSessionId] = useState<string | null>(null);
    const [sessionViewActiveActivityId, setSessionViewActiveActivityId] = useState<string | null>(null);
    const [sessionViewPreviewQuestion, setSessionViewPreviewQuestion] = useState<SessionViewQuestion | null>(null);

    const {
        data: sessionView,
        isLoading: sessionViewLoading,
    } = useSessionView(id, sessionViewSessionId ?? undefined);

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

    useEffect(() => {
        if (!sessionView) return;
        if (sessionView.activities.length === 0) return;
        if (sessionViewActiveActivityId) return;
        setSessionViewActiveActivityId(sessionView.activities[0].activity_id);
    }, [sessionView, sessionViewActiveActivityId]);

    useEffect(() => {
        if (!sessionView || !sessionViewActiveActivityId) return;
        const act = sessionView.activities.find((a) => a.activity_id === sessionViewActiveActivityId);
        setSessionViewPreviewQuestion(act?.questions?.[0] ?? null);
    }, [sessionView, sessionViewActiveActivityId]);

    const unenrollMutation = useMutation({
        mutationFn: (studentId: string) =>
            api.delete(`/cohorts/${id}/students/${studentId}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["cohort-students", id] });
            qc.invalidateQueries({ queryKey: ["cohort-students-search", id] });
        },
    });

    if (isLoading) return <p className={s.emptyState}>Loading...</p>;
    if (!cohort) return <p className={s.emptyState}>Cohort not found.</p>;

    // Already imported template IDs
    const importedTemplateIds = new Set(cohort.sessions.map(s => s.template_id).filter(Boolean));

    function getEffectiveOrder(sess: CohortSession, fallbackIndex: number) {
        return (typeof sess.order === "number" ? sess.order : null) ?? sess.session_number ?? (fallbackIndex + 1);
    }

    const teacherById = new Map((teachers ?? []).map((t) => [t.id, t]));

    const sortedSessions = [...(cohort.sessions ?? [])].sort((a, b) => {
        // Always render in saved order if present; otherwise fallback to session_number.
        const aIdx = getEffectiveOrder(a, 0);
        const bIdx = getEffectiveOrder(b, 0);
        return aIdx - bIdx;
    });

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
        // Prefill current assignment so "Save" doesn't accidentally clear it.
        setFormTeacherId(sess.teacher_id ?? "");
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

    async function moveSession(sessionId: string, dir: "up" | "down") {
        if (!id) return;
        const list = [...sortedSessions];
        const fromIdx = list.findIndex((s) => s.id === sessionId);
        if (fromIdx === -1) return;
        const toIdx = dir === "up" ? fromIdx - 1 : fromIdx + 1;
        if (toIdx < 0 || toIdx >= list.length) return;

        const a = list[fromIdx];
        const b = list[toIdx];

        // Ensure we have numeric orders to swap (use current visual order)
        const aOrder = getEffectiveOrder(a, fromIdx);
        const bOrder = getEffectiveOrder(b, toIdx);

        // Swap orders and persist
        await updateSession.mutateAsync({ cohortId: id, sessionId: a.id, order: bOrder });
        await updateSession.mutateAsync({ cohortId: id, sessionId: b.id, order: aOrder });
    }

    async function applyOrderBySchedule() {
        if (!id) return;

        const scheduleSorted = [...(cohort!.sessions ?? [])].sort((a, b) => {
            const at = a.scheduled_at ? Date.parse(a.scheduled_at) : Number.POSITIVE_INFINITY;
            const bt = b.scheduled_at ? Date.parse(b.scheduled_at) : Number.POSITIVE_INFINITY;
            if (at !== bt) return at - bt;
            // tie-breaker: stable by current order
            return getEffectiveOrder(a, 0) - getEffectiveOrder(b, 0);
        });

        // Persist sequential order numbers (1..n)
        for (let i = 0; i < scheduleSorted.length; i++) {
            const sess = scheduleSorted[i];
            await updateSession.mutateAsync({ cohortId: id, sessionId: sess.id, order: i + 1 });
        }
    }

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

            {!!cohort.sessions.length && (
                <div style={{ marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <div>
                        <div className={s.title} style={{ fontSize: 18 }}>Imported Sessions</div>
                        <div className={s.subtitle}>
                            Cards show title, schedule, teacher, and template linkage. Use arrows to reorder.
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        <button
                            className={s.tinyBtn}
                            onClick={applyOrderBySchedule}
                            disabled={updateSession.isPending}
                            title="Sort by scheduled time and save to DB order"
                        >
                            <ArrowUpDown size={14} /> Sort by schedule
                        </button>
                    </div>
                </div>
            )}

            <div className={s.sessionGrid}>
                {sortedSessions.map((sess, idx) => {
                    const teacher = sess.teacher_id ? teacherById.get(sess.teacher_id) : undefined;
                    const effectiveOrder = getEffectiveOrder(sess, idx);
                    const scheduledLabel = sess.scheduled_at ? new Date(sess.scheduled_at).toLocaleString() : "Not scheduled";
                    const isFirst = idx === 0;
                    const isLast = idx === sortedSessions.length - 1;

                    return (
                        <div key={sess.id} className={s.sessionTile}>
                            <div className={s.sessionTileTop}>
                                <div style={{ minWidth: 0 }}>
                                    <div className={s.sessionTileTitle}>
                                        {sess.title ?? `Session ${sess.session_number}`}
                                    </div>
                                    <div className={s.sessionTileMeta} style={{ marginTop: 8 }}>
                                        <span className={s.metaPill} title="Saved order (used for sorting)">
                                            <Hash size={12} /> Order {effectiveOrder}
                                        </span>
                                        <span className={s.metaPill} title="Scheduled time">
                                            <Calendar size={12} /> {scheduledLabel}
                                        </span>
                                        <span className={s.metaPill} title="Assigned teacher">
                                            <User size={12} /> {teacher ? teacher.full_name : sess.teacher_id ? "Assigned" : "No teacher"}
                                        </span>
                                    </div>
                                </div>
                                <div className={s.sessionTileActions}>
                                    <button
                                        className={s.iconBtn}
                                        onClick={() => moveSession(sess.id, "up")}
                                        disabled={isFirst || updateSession.isPending}
                                        title="Move up"
                                    >
                                        <ArrowUp size={16} />
                                    </button>
                                    <button
                                        className={s.iconBtn}
                                        onClick={() => moveSession(sess.id, "down")}
                                        disabled={isLast || updateSession.isPending}
                                        title="Move down"
                                    >
                                        <ArrowDown size={16} />
                                    </button>
                                </div>
                            </div>

                            {sess.description ? (
                                <div className={s.sessionTileDesc}>{sess.description}</div>
                            ) : (
                                <div className={s.sessionTileDesc} style={{ opacity: 0.6 }}>
                                    No description
                                </div>
                            )}

                            <div className={s.sessionTileFooter}>
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                    {sess.is_live ? (
                                        <span className={`${s.badge} ${s.badgeWarning}`}>Live now</span>
                                    ) : (
                                        <span className={s.badge}>Not live</span>
                                    )}
                                </div>
                                <button
                                    className={s.editBtn}
                                    onClick={() => navigate(`/admin/sessions/${sess.id}/class-report`)}
                                    title="View class report"
                                >
                                    <BarChart2 size={12} /> Class Report
                                </button>
                                <button
                                    className={s.editBtn}
                                    onClick={() => {
                                        setSessionViewSessionId(sess.id);
                                        setSessionViewActiveActivityId(null);
                                        setSessionViewPreviewQuestion(null);
                                    }}
                                    disabled={sessionViewLoading}
                                    title="View activities + questions"
                                >
                                    <Eye size={12} /> View
                                </button>
                                <button className={s.editBtn} onClick={() => openEditSession(sess)}>
                                    <Pencil size={12} /> Edit
                                </button>
                            </div>
                        </div>
                    );
                })}
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
                <EditSessionModal
                    sess={editingSession}
                    formTitle={formTitle} setFormTitle={setFormTitle}
                    formDesc={formDesc} setFormDesc={setFormDesc}
                    formScheduledAt={formScheduledAt} setFormScheduledAt={setFormScheduledAt}
                    formTeacherId={formTeacherId} setFormTeacherId={setFormTeacherId}
                    activitySearch={activitySearch} setActivitySearch={setActivitySearch}
                    teachers={teachers ?? []}
                    allActivities={(allActivities ?? []) as { id: string; name: string; type: string; duration_minutes: number | null }[]}
                    updateSession={updateSession}
                    addSessionActivity={addSessionActivity}
                    removeSessionActivity={removeSessionActivity}
                    onSubmit={handleUpdateSession}
                    onClose={() => { setEditingSession(null); setActivitySearch(""); }}
                />
            )}

            {/* ── Session Viewer Modal (activities + questions) ── */}
            {sessionViewSessionId && (
                <div
                    className={s.overlay}
                    onClick={() => {
                        setSessionViewSessionId(null);
                        setSessionViewActiveActivityId(null);
                        setSessionViewPreviewQuestion(null);
                    }}
                >
                    <div
                        className={s.modal}
                        style={{
                            maxWidth: 1200,
                            width: "92vw",
                            maxHeight: "92vh",
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                            <div style={{ minWidth: 0 }}>
                                <h2 className={s.modalTitle} style={{ marginBottom: 8 }}>
                                    Session Viewer
                                </h2>
                                {sessionView ? (
                                    <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                                        {sessionView.session.title ?? `Session ${sessionView.session.session_number}`} · {sessionView.session.scheduled_at ? new Date(sessionView.session.scheduled_at).toLocaleString() : "Not scheduled"}
                                    </div>
                                ) : (
                                    <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Loading...</div>
                                )}
                            </div>
                            <button
                                type="button"
                                className={s.cancelBtn}
                                onClick={() => {
                                    setSessionViewSessionId(null);
                                    setSessionViewActiveActivityId(null);
                                    setSessionViewPreviewQuestion(null);
                                }}
                            >
                                Close
                            </button>
                        </div>

                        {sessionViewLoading ? (
                            <p className={s.emptyState} style={{ marginTop: 16 }}>Loading session plan...</p>
                        ) : !sessionView ? (
                            <p className={s.emptyState} style={{ marginTop: 16 }}>No data.</p>
                        ) : (
                            <SessionPlanViewer
                                sessionView={sessionView}
                                activeActivityId={sessionViewActiveActivityId}
                                onSelectActivity={(aid) => setSessionViewActiveActivityId(aid)}
                                previewQuestion={sessionViewPreviewQuestion}
                                onSelectQuestion={(q) => setSessionViewPreviewQuestion(q)}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function extractStatementSnippet(data: unknown): string | null {
    if (!data || typeof data !== "object") return null;
    const d = data as Record<string, unknown>;
    const candidates = [d.instruction, d.prompt, d.question, d.text, d.sentence, d.stem];
    for (const v of candidates) {
        if (typeof v === "string" && v.trim()) return v.trim();
    }
    return null;
}

function SessionPlanViewer({
    sessionView,
    activeActivityId,
    onSelectActivity,
    previewQuestion,
    onSelectQuestion,
}: {
    sessionView: SessionViewOut;
    activeActivityId: string | null;
    onSelectActivity: (activityId: string) => void;
    previewQuestion: SessionViewQuestion | null;
    onSelectQuestion: (q: SessionViewQuestion) => void;
}) {
    const activeActivity = sessionView.activities.find((a) => a.activity_id === activeActivityId) ?? sessionView.activities[0];
    const questions = activeActivity?.questions ?? [];

    return (
        <div style={{ display: "flex", flex: 1, minHeight: 0, gap: 16, marginTop: 16 }}>
            {/* Activities */}
            <div style={{ width: 320, flexShrink: 0, minHeight: 0, overflowY: "auto" }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                    <Layers size={16} /> Activities ({sessionView.activities.length})
                </div>
                {sessionView.activities.map((a, idx) => {
                    const selected = a.activity_id === activeActivity?.activity_id;
                    return (
                        <button
                            key={a.session_activity_id}
                            type="button"
                            onClick={() => onSelectActivity(a.activity_id)}
                            style={{
                                width: "100%",
                                textAlign: "left",
                                padding: 12,
                                borderRadius: 12,
                                border: selected ? "1px solid var(--color-primary, #6366f1)" : "1px solid var(--color-border-subtle, #e5e7eb)",
                                backgroundColor: selected ? "var(--color-surface-2, rgba(99,102,241,0.06))" : "var(--color-surface, #fff)",
                                cursor: "pointer",
                                marginBottom: 10,
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                                <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>Order {idx + 1}</span>
                                <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>{a.questions.length} questions</span>
                            </div>
                            <div style={{ fontWeight: 700, fontSize: 13, marginTop: 4 }}>{a.name}</div>
                            <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 4 }}>
                                {a.type} · {a.module_id} {a.duration_minutes != null ? `· ${a.duration_minutes}m` : ""}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Questions */}
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Questions ({questions.length})</div>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                        gap: 12,
                    }}
                >
                    {questions.map((q, qi) => {
                        const selected = previewQuestion?.id === q.id;
                        const snippet = extractStatementSnippet(q.data);
                        return (
                            <button
                                key={q.id}
                                type="button"
                                onClick={() => onSelectQuestion(q)}
                                style={{
                                    textAlign: "left",
                                    padding: 12,
                                    borderRadius: 14,
                                    border: selected ? "1px solid var(--color-primary, #6366f1)" : "1px solid var(--color-border-subtle, #e5e7eb)",
                                    backgroundColor: selected ? "var(--color-surface-2, rgba(99,102,241,0.06))" : "var(--color-surface, #fff)",
                                    cursor: "pointer",
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                                    <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>#{qi + 1}</span>
                                    <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
                                        {q.is_published ? "Published" : "Draft"}
                                    </span>
                                </div>
                                <div style={{ fontWeight: 800, fontSize: 13, marginTop: 6 }}>{q.title}</div>
                                {snippet && (
                                    <div style={{ marginTop: 8, fontSize: 12, color: "#059669", lineHeight: 1.35 }}>
                                        {snippet.slice(0, 160)}
                                        {snippet.length > 160 ? "…" : ""}
                                    </div>
                                )}
                                <div style={{ marginTop: 8, fontSize: 11, color: "var(--color-text-secondary)" }}>
                                    {q.template_name ?? q.template_slug ?? "—"} · Grade {q.grade_band || "any"} · Difficulty {q.difficulty}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Preview */}
            <div style={{ width: 400, flexShrink: 0, minHeight: 0, overflowY: "auto" }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                    <Eye size={16} /> Student Preview
                </div>
                {previewQuestion?.template_slug ? (
                    <LivePreview slug={previewQuestion.template_slug} data={previewQuestion.data ?? {}} />
                ) : (
                    <div className={s.emptyState}>Click a question card to preview.</div>
                )}
            </div>
        </div>
    );
}
