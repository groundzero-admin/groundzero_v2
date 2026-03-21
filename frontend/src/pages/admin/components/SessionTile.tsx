import { ArrowUp, ArrowDown, Calendar, User, Hash, Eye, Pencil, BarChart2 } from "lucide-react";
import { useNavigate } from "react-router";
import type { CohortSession } from "@/api/types/admin";
import * as s from "../admin.css";

interface SessionTileProps {
    sess: CohortSession;
    idx: number;
    effectiveOrder: number;
    teacher: { id: string; full_name: string; email: string } | undefined;
    isFirst: boolean;
    isLast: boolean;
    isUpdatePending: boolean;
    isSessionViewLoading: boolean;
    onMoveUp: (sessionId: string) => void;
    onMoveDown: (sessionId: string) => void;
    onEdit: (sess: CohortSession) => void;
    onView: (sessionId: string) => void;
}

export default function SessionTile({
    sess,
    effectiveOrder,
    teacher,
    isFirst,
    isLast,
    isUpdatePending,
    isSessionViewLoading,
    onMoveUp,
    onMoveDown,
    onEdit,
    onView,
}: SessionTileProps) {
    const navigate = useNavigate();
    const scheduledLabel = sess.scheduled_at
        ? new Date(sess.scheduled_at).toLocaleString()
        : "Not scheduled";

    return (
        <div className={s.sessionTile}>
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
                            <User size={12} />{" "}
                            {teacher
                                ? teacher.full_name
                                : sess.teacher_id
                                  ? "Assigned"
                                  : "No teacher"}
                        </span>
                    </div>
                </div>
                <div className={s.sessionTileActions}>
                    <button
                        className={s.iconBtn}
                        onClick={() => onMoveUp(sess.id)}
                        disabled={isFirst || isUpdatePending}
                        title="Move up"
                    >
                        <ArrowUp size={16} />
                    </button>
                    <button
                        className={s.iconBtn}
                        onClick={() => onMoveDown(sess.id)}
                        disabled={isLast || isUpdatePending}
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
                    onClick={() => onView(sess.id)}
                    disabled={isSessionViewLoading}
                    title="View activities + questions"
                >
                    <Eye size={12} /> View
                </button>
                <button className={s.editBtn} onClick={() => onEdit(sess)}>
                    <Pencil size={12} /> Edit
                </button>
            </div>
        </div>
    );
}
