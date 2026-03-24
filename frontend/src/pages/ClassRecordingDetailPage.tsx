import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, Video, Download, MessageSquare, Users, Loader2 } from "lucide-react";
import { api } from "@/api/client";

type RecordingAsset = {
  id: string;
  type: string;
  status: string;
  output_mode?: string | null;
  path?: string | null;
  url?: string | null;
  created_at?: string | null;
};

type RecordingItem = {
  id: string;
  status: string;
  created_at?: string | null;
  started_at?: string | null;
  stopped_at?: string | null;
  assets: RecordingAsset[];
};

type RecordingDetail = {
  session_id: string;
  cohort_name?: string | null;
  session_name: string;
  teacher_name?: string | null;
  hms_room_id?: string | null;
  recordings: RecordingItem[];
};

export default function ClassRecordingDetailPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, error, isFetching } = useQuery<RecordingDetail>({
    queryKey: ["class-recording-detail", sessionId],
    queryFn: () => api.get(`/class-recordings/${sessionId}`).then((r) => r.data),
    enabled: !!sessionId,
    refetchInterval: (query) => {
      const rec = query.state.data?.recordings?.[0];
      if (!rec?.assets?.length) return false;
      const pending = rec.assets.some(
        (a) =>
          (a.type === "transcript" || a.type === "summary") &&
          a.status !== "completed" &&
          a.status !== "failed",
      );
      return pending ? 15_000 : false;
    },
  });

  const latestRecording = useMemo(() => data?.recordings?.[0] ?? null, [data]);
  const [openRecordingIds, setOpenRecordingIds] = useState<Record<string, boolean>>({});

  const recordingDerived = useMemo(() => {
    const rows = (data?.recordings ?? []).map((rec) => {
      const allVideoAssets = (rec.assets ?? []).filter(
        (a) => (a.type === "room-composite" || a.type === "room-vod") && a.url,
      );
      const preferredVideoAsset = allVideoAssets.find(
        (a) => !(a.path ?? "").toLowerCase().includes("rec-audio"),
      ) ?? allVideoAssets[0] ?? null;
      const transcriptAssets = (rec.assets ?? []).filter(
        (a) => (a.type === "transcript" || a.type === "summary") && a.url,
      );
      const pendingTranscripts = (rec.assets ?? []).filter(
        (a) =>
          (a.type === "transcript" || a.type === "summary") &&
          !a.url &&
          a.status !== "failed",
      );
      const extraDownloadAssets = (rec.assets ?? []).filter((a) => {
        if (!a.url || a.status !== "completed") return false;
        if (a.id === preferredVideoAsset?.id) return false;
        if (a.type === "transcript" || a.type === "summary") return false;
        if (a.type === "chat" || a.type === "speaker-label") return true;
        if (a.type === "room-composite" || a.type === "room-vod") {
          return (a.path ?? "").toLowerCase().includes("rec-audio");
        }
        return false;
      });
      return { rec, preferredVideoAsset, transcriptAssets, pendingTranscripts, extraDownloadAssets };
    });
    return rows;
  }, [data?.recordings]);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: 20, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            alignSelf: "flex-start",
            border: "1px solid #cbd5e1",
            background: "#fff",
            borderRadius: 10,
            padding: "8px 12px",
            display: "flex",
            gap: 6,
            alignItems: "center",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>Class Recording</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
            {data?.cohort_name ?? "-"} · {data?.session_name ?? "-"} · Teacher: {data?.teacher_name ?? "-"}
          </div>
        </div>

        {isLoading && <div style={{ color: "#64748b", fontSize: 14 }}>Loading recording assets...</div>}
        {error && <div style={{ color: "#dc2626", fontSize: 14 }}>Failed to load recording details.</div>}

        {!isLoading && !error && !latestRecording && (
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 18, color: "#475569" }}>
            No recording found for this session yet.
          </div>
        )}

        {recordingDerived.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {recordingDerived.map(({ rec, preferredVideoAsset, transcriptAssets, pendingTranscripts, extraDownloadAssets }, idx) => {
              const isOpen = openRecordingIds[rec.id] ?? idx === 0;
              return (
                <div key={rec.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden" }}>
                  <button
                    type="button"
                    onClick={() =>
                      setOpenRecordingIds((prev) => ({
                        ...prev,
                        [rec.id]: !isOpen,
                      }))
                    }
                    style={{
                      width: "100%",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      padding: "12px 14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      textAlign: "left",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>
                        Session occurrence {idx + 1}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                        {(rec.started_at || rec.created_at)
                          ? `Started: ${new Date(rec.started_at || rec.created_at || "").toLocaleString()}`
                          : "Start time unavailable"}{" "}
                        ·{" "}
                        {rec.stopped_at ? `Ended: ${new Date(rec.stopped_at).toLocaleString()}` : "Ended: —"}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>{isOpen ? "Hide" : "Open"}</div>
                  </button>

                  {isOpen && (
                    <div style={{ borderTop: "1px solid #e2e8f0", padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Video size={16} />
                        <div style={{ fontSize: 14, fontWeight: 700 }}>Recording Video</div>
                      </div>
                      {rec.status === "failed" ? (
                        <div style={{ fontSize: 13, color: "#dc2626" }}>Recording failed for this occurrence.</div>
                      ) : !preferredVideoAsset ? (
                        <div style={{ fontSize: 13, color: "#64748b" }}>Video asset not available yet.</div>
                      ) : (
                        <video
                          key={preferredVideoAsset.id}
                          controls
                          src={preferredVideoAsset.url ?? undefined}
                          style={{ width: "100%", maxHeight: 520, borderRadius: 12, background: "#0f172a" }}
                        />
                      )}

                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <FileText size={16} />
                        <div style={{ fontSize: 14, fontWeight: 700 }}>Transcripts and Summary</div>
                      </div>
                      {pendingTranscripts.length > 0 && (
                        <div style={{ fontSize: 13, color: "#64748b", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <Loader2 size={14} style={{ opacity: isFetching ? 1 : 0.5 }} aria-hidden />
                          {pendingTranscripts.map((a) => (
                            <span key={a.id} style={{ border: "1px dashed #cbd5e1", borderRadius: 8, padding: "4px 8px" }}>
                              {a.type}{a.output_mode ? ` (${a.output_mode})` : ""}: {a.status}
                            </span>
                          ))}
                        </div>
                      )}
                      {transcriptAssets.length > 0 ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {transcriptAssets.map((asset) => (
                            <a
                              key={asset.id}
                              href={asset.url ?? "#"}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                border: "1px solid #cbd5e1",
                                borderRadius: 10,
                                padding: "8px 12px",
                                textDecoration: "none",
                                color: "#0f172a",
                                fontSize: 12,
                                fontWeight: 700,
                                background: "#f8fafc",
                              }}
                            >
                              {asset.type}{asset.output_mode ? ` (${asset.output_mode})` : ""}
                            </a>
                          ))}
                        </div>
                      ) : (
                        pendingTranscripts.length === 0 && (
                          <div style={{ fontSize: 13, color: "#64748b" }}>
                            No transcript or summary links returned yet.
                          </div>
                        )
                      )}

                      {extraDownloadAssets.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Download size={16} />
                            <div style={{ fontSize: 14, fontWeight: 700 }}>Chat, audio, and other files</div>
                          </div>
                          {extraDownloadAssets.map((asset) => (
                            <a
                              key={asset.id}
                              href={asset.url ?? "#"}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                border: "1px solid #cbd5e1",
                                borderRadius: 10,
                                padding: "10px 12px",
                                textDecoration: "none",
                                color: "#0f172a",
                                fontSize: 13,
                                fontWeight: 600,
                                background: "#f8fafc",
                              }}
                            >
                              {asset.type === "chat" ? <MessageSquare size={16} /> : asset.type === "speaker-label" ? <Users size={16} /> : <Download size={16} />}
                              <span>{asset.type}{asset.output_mode ? ` · ${asset.output_mode}` : ""}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
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
