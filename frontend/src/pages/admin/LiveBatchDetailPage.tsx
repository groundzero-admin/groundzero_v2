import { useState, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    useLiveBatch,
    useTemplateCohorts,
    useImportTemplate,
    useUpdateLiveBatchSession,
} from "@/api/hooks/useAdmin";
import { api } from "@/api/client";
import type { LiveBatchSession } from "@/api/types/admin";
import { ArrowLeft, Download, Pencil, Link2, FileEdit, Users, UserPlus, UserMinus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import * as s from "./admin.css";

// ── Enrollment types ──

interface EnrolledStudent {
    enrollment_id: string;
    student_id: string;
    user_id: string;
    full_name: string;
    email: string;
    plain_password: string | null;
    board: string | null;
    grade: number | null;
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

export default function LiveBatchDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const qc = useQueryClient();
    const { data: batch, isLoading } = useLiveBatch(id);
    const { data: templates } = useTemplateCohorts();
    const importTemplate = useImportTemplate();
    const updateSession = useUpdateLiveBatchSession();

    // Session modals
    const [showImportModal, setShowImportModal] = useState(false);
    const [editingSession, setEditingSession] = useState<LiveBatchSession | null>(null);
    const [formTitle, setFormTitle] = useState("");
    const [formDesc, setFormDesc] = useState("");
    const [formDay, setFormDay] = useState(1);
    const [formStartTime, setFormStartTime] = useState("");
    const [formEndTime, setFormEndTime] = useState("");

    // Student enrollment
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [linkSearch, setLinkSearch] = useState("");
    const [linkPage, setLinkPage] = useState(1);
    const linkPageSize = 10;

    // Enrolled students query
    const { data: enrolledStudents } = useQuery<EnrolledStudent[]>({
        queryKey: ["batch-students", id],
        queryFn: () => api.get(`/live-batches/${id}/students`).then((r) => r.data),
        enabled: !!id,
    });

    // Search students for linking (paginated)
    const { data: searchData } = useQuery<PaginatedSearch>({
        queryKey: ["batch-students-search", id, linkSearch, linkPage],
        queryFn: () =>
            api.get(`/live-batches/${id}/students/search`, { params: { q: linkSearch, page: linkPage, page_size: linkPageSize } }).then((r) => r.data),
        enabled: !!id && showLinkModal,
    });

    const enrollMutation = useMutation({
        mutationFn: (studentId: string) =>
            api.post(`/live-batches/${id}/students`, { student_id: studentId }).then((r) => r.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["batch-students", id] });
            qc.invalidateQueries({ queryKey: ["batch-students-search", id] });
        },
    });

    const unenrollMutation = useMutation({
        mutationFn: (studentId: string) =>
            api.delete(`/live-batches/${id}/students/${studentId}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["batch-students", id] });
            qc.invalidateQueries({ queryKey: ["batch-students-search", id] });
        },
    });

    // Session handlers
    async function handleImport(templateCohortId: string) {
        if (!id) return;
        await importTemplate.mutateAsync({ batchId: id, templateCohortId });
        setShowImportModal(false);
    }

    function openEditSession(sess: LiveBatchSession) {
        setEditingSession(sess);
        setFormTitle(sess.title);
        setFormDesc(sess.description ?? "");
        setFormDay(sess.day);
        // Parse existing timing e.g. "10:00-12:00" into start/end
        const parts = (sess.daily_timing ?? "").split("-");
        setFormStartTime(parts[0]?.trim() ?? "");
        setFormEndTime(parts[1]?.trim() ?? "");
    }

    async function handleUpdateSession(e: FormEvent) {
        e.preventDefault();
        if (!id || !editingSession) return;
        await updateSession.mutateAsync({
            batchId: id,
            sessionId: editingSession.id,
            title: formTitle,
            description: formDesc || undefined,
            day: formDay,
            daily_timing: formStartTime && formEndTime ? `${formStartTime}-${formEndTime}` : undefined,
        });
        setEditingSession(null);
    }

    if (isLoading) return <p className={s.emptyState}>Loading...</p>;
    if (!batch) return <p className={s.emptyState}>Batch not found.</p>;

    return (
        <div className={s.page}>
            <button className={s.backLink} onClick={() => navigate("/admin/batches")}>
                <ArrowLeft size={14} /> Back to Batches
            </button>

            <div className={s.header}>
                <div>
                    <h1 className={s.title}>{batch.name}</h1>
                    <div className={s.subtitle}>
                        Starts {new Date(batch.start_date).toLocaleDateString()} · {batch.daily_timing}
                        {batch.description && ` · ${batch.description}`}
                    </div>
                </div>
                <button className={s.importBtn} onClick={() => setShowImportModal(true)}>
                    <Download size={18} /> Import Template
                </button>
            </div>

            {/* ── Sessions Section ── */}
            {!batch.sessions.length && (
                <p className={s.emptyState}>
                    No sessions yet. Import from a template cohort to get started.
                </p>
            )}

            <div className={s.sessionList}>
                {batch.sessions.map((sess) => (
                    <div key={sess.id} className={s.sessionCard}>
                        <div className={s.sessionOrder}>{sess.order}</div>
                        <div className={s.sessionInfo}>
                            <div className={s.sessionTitle}>{sess.title}</div>
                            <div className={s.sessionMeta}>
                                Day {sess.day}
                                {sess.scheduled_date && ` · ${new Date(sess.scheduled_date).toLocaleDateString()}`}
                                {sess.daily_timing && ` · ${sess.daily_timing}`}
                                {sess.description && ` — ${sess.description}`}
                            </div>
                            <div style={{ marginTop: 4 }}>
                                {sess.template_session_id && !sess.is_locally_modified && (
                                    <span className={`${s.badge} ${s.badgeSuccess}`}>
                                        <Link2 size={10} style={{ marginRight: 4 }} /> Linked to template
                                    </span>
                                )}
                                {sess.is_locally_modified && (
                                    <span className={`${s.badge} ${s.badgeWarning}`}>
                                        <FileEdit size={10} style={{ marginRight: 4 }} /> Locally modified
                                    </span>
                                )}
                            </div>
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
                        <UserPlus size={16} /> Link Student
                    </button>
                </div>

                {!enrolledStudents?.length && (
                    <p className={s.emptyState}>No students enrolled in this batch yet.</p>
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
                                        if (confirm(`Unlink ${st.full_name} from this batch?`))
                                            unenrollMutation.mutate(st.student_id);
                                    }}
                                >
                                    <UserMinus size={12} /> Unlink
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Link Student Modal (search & enroll) ── */}
            {showLinkModal && (
                <div className={s.overlay} onClick={() => setShowLinkModal(false)}>
                    <div className={s.modal} onClick={(e) => e.stopPropagation()}>
                        <h2 className={s.modalTitle}>Link Student to Batch</h2>
                        <div style={{ position: "relative", marginBottom: 16 }}>
                            <Search
                                size={16}
                                style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }}
                            />
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
                            {!searchData?.students.length && (
                                <p className={s.emptyState}>No students found.</p>
                            )}
                            {searchData?.students.map((st) => (
                                <div
                                    key={st.student_id}
                                    className={s.sessionCard}
                                    style={{ opacity: st.already_enrolled ? 0.5 : 1 }}
                                >
                                    <div className={s.sessionOrder} style={{ width: 36, height: 36, fontSize: 11 }}>
                                        {st.full_name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
                                    </div>
                                    <div className={s.sessionInfo}>
                                        <div className={s.sessionTitle} style={{ fontSize: 13 }}>{st.full_name}</div>
                                        <div className={s.sessionMeta}>{st.email}</div>
                                    </div>
                                    {st.already_enrolled ? (
                                        <span className={`${s.badge} ${s.badgeSuccess}`} style={{ fontSize: 11 }}>
                                            Already enrolled
                                        </span>
                                    ) : (
                                        <button
                                            className={s.addBtn}
                                            style={{ padding: "4px 12px", fontSize: 12 }}
                                            onClick={() => enrollMutation.mutate(st.student_id)}
                                            disabled={enrollMutation.isPending}
                                        >
                                            <UserPlus size={12} /> Enroll
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        {/* Pagination */}
                        {searchData && searchData.total_pages > 0 && (
                            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 12 }}>
                                <button
                                    className={s.cancelBtn}
                                    style={{ padding: "4px 8px" }}
                                    onClick={() => setLinkPage((p) => Math.max(1, p - 1))}
                                    disabled={linkPage <= 1}
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span style={{ fontSize: 13 }}>
                                    {searchData.page}/{searchData.total_pages}
                                </span>
                                <button
                                    className={s.cancelBtn}
                                    style={{ padding: "4px 8px" }}
                                    onClick={() => setLinkPage((p) => Math.min(searchData.total_pages, p + 1))}
                                    disabled={linkPage >= searchData.total_pages}
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        )}
                        <div className={s.formActions} style={{ marginTop: 12 }}>
                            <button className={s.cancelBtn} onClick={() => setShowLinkModal(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Import Template Modal ── */}
            {showImportModal && (
                <div className={s.overlay} onClick={() => setShowImportModal(false)}>
                    <div className={s.modal} onClick={(e) => e.stopPropagation()}>
                        <h2 className={s.modalTitle}>Import from Template</h2>
                        <p className={s.subtitle} style={{ marginBottom: 16 }}>
                            Select a template cohort. All its sessions will be linked to this batch.
                            Already-imported sessions will be skipped.
                        </p>
                        {!templates?.length && (
                            <p className={s.emptyState}>No template cohorts available. Create one first.</p>
                        )}
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {templates?.map((t) => (
                                <button
                                    key={t.id}
                                    className={s.templatePickerCard}
                                    onClick={() => handleImport(t.id)}
                                    disabled={importTemplate.isPending}
                                >
                                    <div className={s.cardTitle} style={{ fontSize: 14 }}>{t.name}</div>
                                    <div className={s.cardMeta}>
                                        Level {t.level} · {t.mode}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Edit Session Modal ── */}
            {editingSession && (
                <div className={s.overlay} onClick={() => setEditingSession(null)}>
                    <div className={s.modal} onClick={(e) => e.stopPropagation()}>
                        <h2 className={s.modalTitle}>Edit Session (Local Override)</h2>
                        <p className={s.subtitle} style={{ marginBottom: 16 }}>
                            Editing this session will mark it as locally modified. It will no longer
                            auto-sync from the parent template.
                        </p>
                        <form onSubmit={handleUpdateSession} className={s.form}>
                            <div>
                                <label className={s.label}>Title</label>
                                <input
                                    className={s.input}
                                    value={formTitle}
                                    onChange={(e) => setFormTitle(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className={s.label}>Description</label>
                                <textarea
                                    className={s.textarea}
                                    value={formDesc}
                                    onChange={(e) => setFormDesc(e.target.value)}
                                />
                            </div>
                            <div>
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
                            <div>
                                <label className={s.label}>Session Timing (override)</label>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <input
                                        className={s.input}
                                        type="time"
                                        value={formStartTime}
                                        onChange={(e) => setFormStartTime(e.target.value)}
                                    />
                                    <span style={{ fontWeight: 500, opacity: 0.5 }}>to</span>
                                    <input
                                        className={s.input}
                                        type="time"
                                        value={formEndTime}
                                        onChange={(e) => setFormEndTime(e.target.value)}
                                    />
                                </div>
                                <span style={{ fontSize: 11, opacity: 0.5, marginTop: 4, display: "block" }}>
                                    Leave empty to use batch default ({batch?.daily_timing})
                                </span>
                            </div>
                            <div className={s.formActions}>
                                <button type="button" className={s.cancelBtn} onClick={() => setEditingSession(null)}>
                                    Cancel
                                </button>
                                <button type="submit" className={s.submitBtn} disabled={updateSession.isPending}>
                                    {updateSession.isPending ? "Saving..." : "Save Override"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
