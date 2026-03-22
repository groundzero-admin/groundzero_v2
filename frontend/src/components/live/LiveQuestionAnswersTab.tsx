/**
 * Live class — inspect each question in an activity and students' answers (human-readable + optional raw JSON).
 */
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type { SessionActivity } from "@/api/types";
import type { Student } from "@/api/types";
import type { SessionViewOut } from "@/api/types/admin";
import { useActivityQuestionResponses } from "@/api/hooks/useTeacher";
import LivePreview from "@/pages/admin/LivePreview";
import { renderStudentAnswerSummary } from "@/components/live/studentResponseSummary";
import * as s from "./LiveQuestionAnswersTab.css";

export function LiveQuestionAnswersTab({
  cohortId,
  sessionId,
  sessionActivities,
  sessionView,
  cohortStudents,
}: {
  cohortId: string;
  sessionId: string;
  sessionActivities: SessionActivity[] | undefined;
  sessionView: SessionViewOut | undefined;
  cohortStudents: Student[] | undefined;
}) {
  const defaultActivityId = useMemo(() => {
    const active = sessionActivities?.find((a) => a.status === "active");
    if (active) return active.activity_id;
    const ordered = [...(sessionActivities ?? [])].sort((a, b) => a.order - b.order);
    return ordered[0]?.activity_id ?? null;
  }, [sessionActivities]);

  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [qIdx, setQIdx] = useState(0);

  useEffect(() => {
    if (defaultActivityId) setSelectedActivityId(defaultActivityId);
  }, [defaultActivityId]);

  useEffect(() => {
    setQIdx(0);
  }, [selectedActivityId]);

  const { data, isLoading, error } = useActivityQuestionResponses(
    cohortId,
    sessionId,
    selectedActivityId,
  );

  const questions = data?.questions ?? [];
  const block = questions[qIdx];
  const totalQ = questions.length;

  const viewAct = sessionView?.activities.find((a) => a.activity_id === selectedActivityId);
  const previewMeta = useMemo(() => {
    if (!viewAct || !block) return null;
    return (
      viewAct.questions.find((q) => q.id === block.activity_question_id) ??
      viewAct.questions[qIdx] ??
      null
    );
  }, [viewAct, block, qIdx]);

  const rows = useMemo(() => {
    if (!cohortStudents?.length) return [];
    if (!block) return [];
    const m = new Map(block.responses.map((r) => [r.student_id, r]));
    return cohortStudents.map((s) => {
      const r = m.get(s.id);
      return {
        student_id: s.id,
        student_name: s.name,
        hasResponse: !!r,
        outcome: r?.outcome,
        response: r?.response ?? null,
        created_at: r?.created_at,
      };
    });
  }, [cohortStudents, block]);

  if (!sessionActivities?.length) {
    return <div className={s.emptyState}>No activities on this session yet.</div>;
  }

  return (
    <div className={s.root}>
      <div className={s.activityBar}>
        <label className={s.activityLabel} htmlFor="live-answers-activity">
          ACTIVITY
        </label>
        <select
          id="live-answers-activity"
          className={s.select}
          value={selectedActivityId ?? ""}
          onChange={(e) => setSelectedActivityId(e.target.value || null)}
        >
          {[...sessionActivities]
            .sort((a, b) => a.order - b.order)
            .map((a) => (
              <option key={a.id} value={a.activity_id}>
                {a.order}. {a.activity_name ?? a.activity_id}
                {a.status === "active" ? " (live)" : a.status === "paused" ? " (paused)" : ""}
              </option>
            ))}
        </select>
      </div>

      <div className={s.mainColumn}>
        {error && (
          <div style={{ fontSize: 11, color: "#b91c1c", padding: 4 }}>
            Couldn’t load responses. Try again.
          </div>
        )}

        {isLoading && totalQ === 0 && (
          <div className={s.loadingRow}>
            <Loader2 size={18} className={s.spin} />
            Loading…
          </div>
        )}

        {!isLoading && totalQ === 0 && (
          <div style={{ fontSize: 11, color: "#64748b", padding: 8 }}>
            This activity has no questions, or none are linked yet.
          </div>
        )}

        {totalQ > 0 && block && (
          <>
            <div className={s.navRow}>
              <button
                type="button"
                className={s.navBtn}
                onClick={() => setQIdx((i) => Math.max(0, i - 1))}
                disabled={qIdx <= 0}
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <span className={s.navLabel}>
                Q{qIdx + 1} / {totalQ}
              </span>
              <button
                type="button"
                className={s.navBtn}
                onClick={() => setQIdx((i) => Math.min(totalQ - 1, i + 1))}
                disabled={qIdx >= totalQ - 1}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>

            <section className={s.questionCard} aria-label="Question preview">
              <div className={s.questionMeta}>{block.template_slug ?? "question"}</div>
              <div className={s.questionTitle}>{block.title}</div>
              {previewMeta?.template_slug ? (
                <div className={s.questionPreviewScroll}>
                  <LivePreview slug={previewMeta.template_slug ?? "mcq_single"} data={previewMeta.data ?? {}} />
                </div>
              ) : (
                <div
                  className={s.questionPreviewScroll}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 12 }}
                >
                  No preview data
                </div>
              )}
            </section>

            <section className={s.answersCard} aria-label="Student preview">
              <div className={s.answersHeader}>STUDENT PREVIEW</div>
              <div className={s.answersScroll}>
                {rows.map((row) => (
                  <details key={row.student_id} className={s.studentDisclosure}>
                    <summary
                      className={`${s.studentSummary} ${row.hasResponse ? s.studentSummaryAnswered : s.studentSummaryNoAnswer}`}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <ChevronDown size={14} className={s.disclosureChevron} aria-hidden />
                        <span style={{ fontWeight: 700, fontSize: 11 }}>{row.student_name}</span>
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        {row.hasResponse ? (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              padding: "2px 8px",
                              borderRadius: 999,
                              background: (row.outcome ?? 0) >= 0.5 ? "rgba(34,197,94,0.18)" : "rgba(239,68,68,0.18)",
                              color: (row.outcome ?? 0) >= 0.5 ? "#15803d" : "#b91c1c",
                            }}
                          >
                            {(row.outcome ?? 0) >= 0.5 ? "Correct" : "Incorrect"}
                          </span>
                        ) : (
                          <span style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8" }}>No response</span>
                        )}
                      </span>
                    </summary>
                    <div className={s.studentDetailBody}>
                      {!row.hasResponse && (
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>This student has not submitted an answer for this question yet.</div>
                      )}
                      {row.hasResponse && row.response && Object.keys(row.response).length > 0 && (
                        <>
                          <div
                            style={{
                              padding: "10px 12px",
                              borderRadius: 8,
                              background: "#f8fafc",
                              border: "1px solid #e2e8f0",
                            }}
                          >
                            {renderStudentAnswerSummary(
                              block.template_slug,
                              row.response as Record<string, unknown>,
                              previewMeta?.data as Record<string, unknown> | undefined,
                            ) ?? (
                              <div style={{ fontSize: 11, color: "#64748b" }}>
                                No formatter for this template — expand “Technical: raw JSON” below.
                              </div>
                            )}
                          </div>
                          <details style={{ marginTop: 8 }}>
                            <summary
                              style={{
                                fontSize: 10,
                                cursor: "pointer",
                                color: "#94a3b8",
                                fontWeight: 600,
                                userSelect: "none",
                              }}
                            >
                              Technical: raw JSON
                            </summary>
                            <pre
                              style={{
                                margin: "6px 0 0",
                                padding: 8,
                                borderRadius: 8,
                                background: "#0f172a",
                                color: "#e2e8f0",
                                fontSize: 10,
                                lineHeight: 1.45,
                                overflow: "auto",
                                maxHeight: 120,
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                              }}
                            >
                              {JSON.stringify(row.response, null, 2)}
                            </pre>
                          </details>
                        </>
                      )}
                      {row.hasResponse && (!row.response || Object.keys(row.response).length === 0) && (
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>Empty response payload</div>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
