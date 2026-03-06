import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { useLiveBatches } from "@/api/hooks/useAdmin";
import { Plus, Copy, Check, Search, ChevronLeft, ChevronRight } from "lucide-react";
import * as s from "./admin.css";

// ── Types ──

interface AdminStudent {
    id: string;
    student_id: string | null;
    email: string;
    full_name: string;
    plain_password: string | null;
    board: string | null;
    grade: number | null;
    grade_band: string | null;
    is_active: boolean;
    created_at: string;
}

interface PaginatedStudents {
    students: AdminStudent[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

// ── Component ──

export default function AdminStudentsPage() {
    const qc = useQueryClient();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [formError, setFormError] = useState("");

    // Form state
    const [formName, setFormName] = useState("");
    const [formEmail, setFormEmail] = useState("");
    const [formPassword, setFormPassword] = useState("");
    const [formBoard, setFormBoard] = useState("cbse");
    const [formGrade, setFormGrade] = useState(6);
    const [formGradeBand, setFormGradeBand] = useState("6-7");
    const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);

    const pageSize = 10;

    const { data: batches } = useLiveBatches();

    const { data, isLoading } = useQuery<PaginatedStudents>({
        queryKey: ["admin-students", page, pageSize, search],
        queryFn: () =>
            api
                .get("/admin/students", { params: { page, page_size: pageSize, search } })
                .then((r) => r.data),
    });

    const createStudent = useMutation({
        mutationFn: (payload: {
            email: string;
            password: string;
            full_name: string;
            board: string;
            grade: number;
            grade_band: string;
        }) => api.post("/admin/students", payload).then((r) => r.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-students"] });
            setShowModal(false);
            resetForm();
        },
    });

    function resetForm() {
        setFormName("");
        setFormEmail("");
        setFormPassword("");
        setFormBoard("cbse");
        setFormGrade(6);
        setFormGradeBand("6-7");
        setSelectedBatchIds([]);
    }

    // Auto-set grade band based on grade
    function handleGradeChange(g: number) {
        setFormGrade(g);
        if (g >= 4 && g <= 5) setFormGradeBand("4-5");
        else if (g >= 6 && g <= 7) setFormGradeBand("6-7");
        else if (g >= 8 && g <= 9) setFormGradeBand("8-9");
    }

    async function handleCreate(e: FormEvent) {
        e.preventDefault();
        setFormError("");
        try {
            const newStudent = await createStudent.mutateAsync({
                email: formEmail,
                password: formPassword,
                full_name: formName,
                board: formBoard,
                grade: formGrade,
                grade_band: formGradeBand,
            });
            // Auto-enroll in selected batches
            if (selectedBatchIds.length && newStudent.student_id) {
                await Promise.all(
                    selectedBatchIds.map((batchId) =>
                        api.post(`/live-batches/${batchId}/students`, {
                            student_id: newStudent.student_id,
                        }).catch(() => { }) // silently skip if enrollment fails
                    )
                );
            }
        } catch (err: unknown) {
            const msg =
                (err as { response?: { data?: { detail?: string } } })?.response?.data
                    ?.detail ?? "Failed to create student. Please try again.";
            setFormError(msg);
        }
    }

    async function copyCredentials(student: AdminStudent) {
        const message = `Hello ${student.full_name},\n\nHere are your login credentials for Ground Zero:\n\nEmail: ${student.email}\nPassword: ${student.plain_password ?? "(not available)"}\n\nLogin at: ${window.location.origin}/login`;
        await navigator.clipboard.writeText(message);
        setCopiedId(student.id);
        setTimeout(() => setCopiedId(null), 2000);
    }

    return (
        <div className={s.page}>
            <div className={s.header}>
                <div>
                    <h1 className={s.title}>All Students</h1>
                    <p className={s.subtitle}>
                        {data ? `${data.total} student${data.total !== 1 ? "s" : ""} total` : "Loading..."}
                    </p>
                </div>
                <button className={s.addBtn} onClick={() => setShowModal(true)}>
                    <Plus size={18} /> Add Student
                </button>
            </div>

            {/* Live search bar — queries backend on every keystroke */}
            <div style={{ position: "relative", marginBottom: 20 }}>
                <Search
                    size={16}
                    style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }}
                />
                <input
                    className={s.input}
                    style={{ paddingLeft: 36 }}
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
            </div>

            {/* Student list */}
            {isLoading && <p className={s.emptyState}>Loading...</p>}

            {
                !isLoading && !data?.students.length && (
                    <p className={s.emptyState}>No students found.</p>
                )
            }

            <div className={s.sessionList}>
                {data?.students.map((st) => (
                    <div key={st.id} className={s.sessionCard}>
                        <div className={s.sessionOrder} style={{ width: 40, height: 40, fontSize: 12 }}>
                            {st.full_name
                                .split(" ")
                                .map((w) => w[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                        </div>
                        <div className={s.sessionInfo}>
                            <div className={s.sessionTitle}>{st.full_name}</div>
                            <div className={s.sessionMeta}>
                                {st.email}
                                {st.board && ` · ${st.board.toUpperCase()}`}
                                {st.grade && ` · Grade ${st.grade}`}
                                {st.grade_band && ` · Band ${st.grade_band}`}
                            </div>
                        </div>
                        <div className={s.sessionActions}>
                            {st.plain_password && (
                                <button
                                    className={copiedId === st.id ? s.addBtn : s.editBtn}
                                    style={copiedId === st.id ? { padding: "4px 12px", fontSize: 12 } : {}}
                                    onClick={() => copyCredentials(st)}
                                >
                                    {copiedId === st.id ? (
                                        <>
                                            <Check size={12} /> Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={12} /> Copy Credentials
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination */}
            {
                data && data.total_pages > 1 && (
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 24 }}>
                        <button
                            className={s.cancelBtn}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span style={{ fontSize: 14 }}>
                            Page {data.page} of {data.total_pages}
                        </span>
                        <button
                            className={s.cancelBtn}
                            onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                            disabled={page >= data.total_pages}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )
            }

            {/* Create Student Modal */}
            {
                showModal && (
                    <div className={s.overlay} onClick={() => setShowModal(false)}>
                        <div className={s.modal} onClick={(e) => e.stopPropagation()}>
                            <h2 className={s.modalTitle}>Add New Student</h2>
                            {formError && (
                                <div style={{
                                    padding: "10px 14px",
                                    borderRadius: 8,
                                    backgroundColor: "rgba(252,129,129,0.15)",
                                    color: "#e53e3e",
                                    fontSize: 13,
                                    fontWeight: 500,
                                    marginBottom: 4,
                                }}>
                                    {formError}
                                </div>
                            )}
                            <form onSubmit={handleCreate} className={s.form}>
                                <div>
                                    <label className={s.label}>Full Name *</label>
                                    <input
                                        className={s.input}
                                        value={formName}
                                        onChange={(e) => setFormName(e.target.value)}
                                        placeholder="e.g. Aarav Sharma"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className={s.label}>Email *</label>
                                    <input
                                        className={s.input}
                                        type="email"
                                        value={formEmail}
                                        onChange={(e) => setFormEmail(e.target.value)}
                                        placeholder="e.g. aarav@example.com"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className={s.label}>Password * (min 8 characters)</label>
                                    <input
                                        className={s.input}
                                        value={formPassword}
                                        onChange={(e) => setFormPassword(e.target.value)}
                                        placeholder="Create a password for the student"
                                        required
                                        minLength={8}
                                    />
                                </div>
                                <div>
                                    <label className={s.label}>Board</label>
                                    <select className={s.select} value={formBoard} onChange={(e) => setFormBoard(e.target.value)}>
                                        <option value="cbse">CBSE</option>
                                        <option value="icse">ICSE</option>
                                        <option value="ib">IB</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={s.label}>Grade (4-9)</label>
                                    <input
                                        className={s.input}
                                        type="number"
                                        min={4}
                                        max={9}
                                        value={formGrade}
                                        onChange={(e) => handleGradeChange(Number(e.target.value))}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className={s.label}>Grade Band</label>
                                    <select className={s.select} value={formGradeBand} onChange={(e) => setFormGradeBand(e.target.value)}>
                                        <option value="4-5">4-5</option>
                                        <option value="6-7">6-7</option>
                                        <option value="8-9">8-9</option>
                                    </select>
                                </div>
                                {/* Optional: enroll in batches */}
                                {batches && batches.length > 0 && (
                                    <div>
                                        <label className={s.label}>Enroll in Batches (optional)</label>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 140, overflowY: "auto" }}>
                                            {batches.map((b) => (
                                                <label key={b.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedBatchIds.includes(b.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) setSelectedBatchIds((prev) => [...prev, b.id]);
                                                            else setSelectedBatchIds((prev) => prev.filter((x) => x !== b.id));
                                                        }}
                                                    />
                                                    {b.name}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className={s.formActions}>
                                    <button type="button" className={s.cancelBtn} onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className={s.submitBtn} disabled={createStudent.isPending}>
                                        {createStudent.isPending ? "Creating..." : "Create Student"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
