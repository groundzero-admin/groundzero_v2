import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { Calendar, UserRound, Users } from "lucide-react";
import { api } from "@/api/client";

type ClassRecordingCard = {
  session_id: string;
  cohort_id: string | null;
  cohort_name: string | null;
  session_name: string;
  session_number: number;
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  teacher_name: string;
  hms_room_id: string | null;
  has_live_room: boolean;
};

export default function ClassRecordingsPage() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery<ClassRecordingCard[]>({
    queryKey: ["admin-class-recordings"],
    queryFn: () => api.get("/class-recordings").then((r) => r.data),
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>Class Recordings</div>
      <div style={{ fontSize: 13, color: "#64748b" }}>
        Latest sessions first. Open any card to view video recording and transcript assets.
      </div>

      {isLoading && <div style={{ color: "#64748b", fontSize: 14 }}>Loading recordings...</div>}
      {error && <div style={{ color: "#dc2626", fontSize: 14 }}>Failed to load recordings list.</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
        {(data ?? []).map((row) => (
          <div
            key={row.session_id}
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 14,
              background: "#fff",
              padding: 14,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{row.session_name}</div>
            <div style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 6 }}>
              <Users size={13} /> {row.cohort_name ?? "Unknown cohort"}
            </div>
            <div style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 6 }}>
              <Calendar size={13} /> {row.ended_at ? new Date(row.ended_at).toLocaleString() : "Not ended"}
            </div>
            <div style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 6 }}>
              <UserRound size={13} /> {row.teacher_name}
            </div>
            <button
              type="button"
              onClick={() => navigate(`/admin/sessions/${row.session_id}/recordings`)}
              disabled={!row.has_live_room}
              style={{
                marginTop: 6,
                border: "none",
                borderRadius: 10,
                padding: "10px 12px",
                background: row.has_live_room ? "#4f46e5" : "#94a3b8",
                color: "#fff",
                fontWeight: 700,
                fontSize: 12,
                cursor: row.has_live_room ? "pointer" : "not-allowed",
              }}
            >
              View Recording & Transcript
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
