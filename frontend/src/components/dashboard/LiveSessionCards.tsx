/**
 * LiveSessionCards — "Next Session" hero + "Your Journey" timeline for student dashboard.
 */
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { CalendarClock, Loader2, Lock, Zap, ChevronRight } from "lucide-react";
import { useStudent } from "@/context/StudentContext";
import { api } from "@/api/client";
import * as s from "./LiveSessionCards.css";

interface LiveSession {
  id: string;
  title: string | null;
  description: string | null;
  order: number | null;
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  is_live: boolean;
  room_code_guest: string | null;
  cohort_name: string;
  cohort_id: string;
  student_name: string;
}

function useMyLiveSessions() {
  const { studentId } = useStudent();
  return useQuery<LiveSession[]>({
    queryKey: ["my-live-sessions"],
    queryFn: () => api.get("/students/me/live-sessions").then((r) => r.data),
    enabled: !!studentId,
  });
}

function parseScheduleDate(iso: string | null): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isSessionPast(sess: LiveSession): boolean {
  if (sess.ended_at) return true;
  const d = parseScheduleDate(sess.scheduled_at);
  if (!d) return false;
  return startOfDay(d) < startOfDay(new Date());
}

function formatDateLabel(iso: string | null): string {
  if (!iso) return "";
  const target = parseScheduleDate(iso);
  if (!target) return "";
  const today = startOfDay(new Date());
  const day = startOfDay(target);
  const diffDays = Math.round((day.getTime() - today.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;
  return target.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" });
}

function formatRelativeCompleted(iso: string | null): string {
  if (!iso) return "";
  const target = parseScheduleDate(iso);
  if (!target) return "";
  const today = startOfDay(new Date());
  const day = startOfDay(target);
  const diffDays = Math.round((today.getTime() - day.getTime()) / 86400000);
  if (diffDays === 0) return "Completed today";
  if (diffDays === 1) return "Completed yesterday";
  if (diffDays < 7) return `Completed ${diffDays} days ago`;
  if (diffDays < 14) return "Completed 1 week ago";
  return `Completed ${Math.floor(diffDays / 7)} weeks ago`;
}

function formatTimeLabel(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
}

function timeUntil(iso: string | null): string {
  if (!iso) return "";
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return "";
  const diffMs = target.getTime() - Date.now();
  if (diffMs <= 0) return "";
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 1) return `${Math.ceil(diffMs / 60000)} min`;
  if (hours < 24) return `${hours} hours`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""}`;
}

function sessionDisplayTitle(sess: LiveSession): string {
  return sess.title?.trim() || `Session ${sess.order ?? ""}`;
}

export function NextSessionCard() {
  const navigate = useNavigate();
  const { data: sessions = [], isLoading } = useMyLiveSessions();

  const upcoming = sessions
    .filter((s) => !isSessionPast(s))
    .sort(
      (a, b) =>
        (parseScheduleDate(a.scheduled_at)?.getTime() ?? 0) -
        (parseScheduleDate(b.scheduled_at)?.getTime() ?? 0),
    );
  const next = upcoming[0];

  if (isLoading) {
    return (
      <div className={s.liveCard}>
        <div className={s.loadingRow}>
          <Loader2 size={22} style={{ animation: "spin 1s linear infinite" }} />
          Loading your class schedule…
        </div>
      </div>
    );
  }

  if (!next) {
    const hasSessions = sessions.length > 0;
    return (
      <div className={s.liveCard}>
        <div className={s.liveHeaderRow}>
          <div className={s.liveLeft}>
            <div className={s.liveTitleRow}>
              <div className={s.liveIconWrap}>
                <Zap size={20} color="#f87171" fill="#fee2e2" />
              </div>
              <span className={s.liveLabel}>LIVE SESSION</span>
            </div>
            <h3 className={s.liveTitle}>{hasSessions ? "No upcoming class" : "No class on your schedule"}</h3>
            <p className={s.liveEmptyDesc}>
              {hasSessions
                ? "There isn’t a future session scheduled right now. Check back later for the next class."
                : "We don’t have any live sessions to show yet. When your cohort schedule is ready, it will appear here—check back later."}
            </p>
            <div className={s.lockRow}>
              <CalendarClock size={14} />
              Check back later
            </div>
          </div>

          <div className={s.timeBoxMuted}>
            <div className={s.timeBoxLabel}>Next class</div>
            <div className={s.timeBoxPlaceholder}>—</div>
          </div>
        </div>
      </div>
    );
  }

  const dateLabel = formatDateLabel(next.scheduled_at);
  const timeLabel = formatTimeLabel(next.scheduled_at);
  const unlockIn = timeUntil(next.scheduled_at);

  return (
    <div className={s.liveCard}>
      <div className={s.liveHeaderRow}>
        <div className={s.liveLeft}>
          <div className={s.liveTitleRow}>
            <div className={s.liveIconWrap}>
              <Zap size={20} color="#e11d48" fill="#fecaca" />
            </div>
            <span className={s.liveLabel}>LIVE SESSION</span>
          </div>
          {next.cohort_name && <p className={s.liveCohort}>{next.cohort_name}</p>}
          <h3 className={s.liveTitle}>{sessionDisplayTitle(next)}</h3>
          {next.description && <p className={s.liveDesc}>{next.description}</p>}

          {next.is_live ? (
            <button type="button" className={s.joinBtn} onClick={() => navigate("/live")}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#fff",
                  display: "inline-block",
                }}
              />
              Join Live Class
            </button>
          ) : (
            <div className={s.lockRow}>
              <Lock size={14} />
              {unlockIn ? `Class unlocks in ${unlockIn}` : "Class not started yet"}
            </div>
          )}
        </div>

        <div className={s.timeBox}>
          <div className={s.timeBoxLabel}>{dateLabel}</div>
          <div className={s.timeBoxTime}>{timeLabel}</div>
        </div>
      </div>
    </div>
  );
}

export function YourJourneyCard() {
  const { data: sessions = [], isLoading } = useMyLiveSessions();
  const [filterCohortId, setFilterCohortId] = useState<string | "all">("all");

  const cohorts = useMemo(() => {
    const m = new Map<string, string>();
    for (const x of sessions) {
      if (x.cohort_id) m.set(x.cohort_id, x.cohort_name?.trim() || "Cohort");
    }
    return Array.from(m.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [sessions]);

  const visibleSessions = useMemo(() => {
    if (filterCohortId === "all") return sessions;
    return sessions.filter((x) => x.cohort_id === filterCohortId);
  }, [sessions, filterCohortId]);

  useEffect(() => {
    if (
      filterCohortId !== "all" &&
      !cohorts.some((c) => c.id === filterCohortId)
    ) {
      setFilterCohortId("all");
    }
  }, [cohorts, filterCohortId]);

  if (isLoading) return null;

  if (!sessions.length) {
    return (
      <div className={s.journeyCard}>
        <div className={s.journeyHead}>
          <span style={{ fontSize: 18 }} aria-hidden>
            🕐
          </span>
          <h3 className={s.journeyTitle}>Your Journey</h3>
        </div>
        <p className={s.emptyHint}>Enroll in a cohort to see your session timeline.</p>
      </div>
    );
  }

  const showCohortPill =
    cohorts.length <= 1 || filterCohortId === "all";

  const upcoming = visibleSessions
    .filter((x) => !isSessionPast(x))
    .sort(
      (a, b) =>
        (parseScheduleDate(a.scheduled_at)?.getTime() ?? 0) -
        (parseScheduleDate(b.scheduled_at)?.getTime() ?? 0),
    );
  const past = visibleSessions
    .filter((x) => isSessionPast(x))
    .sort(
      (a, b) =>
        (parseScheduleDate(b.scheduled_at)?.getTime() ?? 0) -
        (parseScheduleDate(a.scheduled_at)?.getTime() ?? 0),
    );
  const journey = [...upcoming, ...past];

  return (
    <div className={s.journeyCard}>
      <div className={s.journeyHead}>
        <span style={{ fontSize: 18 }} aria-hidden>
          🕐
        </span>
        <h3 className={s.journeyTitle}>Your Journey</h3>
      </div>

      {cohorts.length > 1 && (
        <div className={s.cohortToggleRow} role="tablist" aria-label="Filter by cohort">
          <button
            type="button"
            role="tab"
            aria-selected={filterCohortId === "all"}
            className={filterCohortId === "all" ? s.cohortToggleActive : s.cohortToggle}
            onClick={() => setFilterCohortId("all")}
          >
            All
          </button>
          {cohorts.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={filterCohortId === c.id}
              className={filterCohortId === c.id ? s.cohortToggleActive : s.cohortToggle}
              onClick={() => setFilterCohortId(c.id)}
              title={c.name}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      <div className={s.journeyScroll}>
        {!journey.length ? (
          <p className={s.filterEmpty}>No sessions for this selection.</p>
        ) : (
          <div className={s.timeline}>
            <div className={s.timelineLine} />

            {journey.map((sess) => {
              const isPast = isSessionPast(sess);
              const upcomingIndex = upcoming.findIndex((u) => u.id === sess.id);
              const isNextUpcoming = !isPast && upcomingIndex === 0;
              const isFurtherUpcoming = !isPast && upcomingIndex > 0;

              let dotColor = "#a0a0a0";
              if (isNextUpcoming) dotColor = "#3b82f6";
              else if (isFurtherUpcoming) dotColor = "#9333ea";
              else if (isPast) dotColor = "#a0a0a0";

              const titleClass = isPast ? s.sessionTitleMuted : s.sessionTitle;
              const metaClass = isPast ? s.sessionMetaMuted : s.sessionMeta;
              const reviewClass = isPast ? s.reviewBtnMuted : s.reviewBtn;

              return (
                <div key={sess.id} className={s.node}>
                  <div className={s.dot} style={{ background: dotColor }} />

                  <div className={titleClass}>{sessionDisplayTitle(sess)}</div>
                  {sess.cohort_name && showCohortPill && (
                    <div className={isPast ? s.sessionCohortMuted : s.sessionCohort}>
                      {sess.cohort_name}
                    </div>
                  )}
                  <div className={metaClass}>
                    {isPast
                      ? formatRelativeCompleted(sess.scheduled_at)
                      : `${formatDateLabel(sess.scheduled_at)}${sess.scheduled_at ? ", " + formatTimeLabel(sess.scheduled_at) : ""}`}
                  </div>

                  {isPast && (
                    <button
                      type="button"
                      className={reviewClass}
                      onClick={() =>
                        window.open(`/session-review/${sess.id}`, "_blank", "noopener,noreferrer")
                      }
                    >
                      Review
                      <ChevronRight size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
