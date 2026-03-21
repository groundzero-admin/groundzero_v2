import { useMemo } from "react";
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
  const allVideoAssets = (latestRecording?.assets ?? []).filter(
    (a) => (a.type === "room-composite" || a.type === "room-vod") && a.url,
  );
  const preferredVideoAsset = allVideoAssets.find(
    (a) => !(a.path ?? "").toLowerCase().includes("rec-audio"),
  ) ?? allVideoAssets[0] ?? null;
  const transcriptAssets = (latestRecording?.assets ?? []).filter(
    (a) => (a.type === "transcript" || a.type === "summary") && a.url,
  );
  const pendingTranscripts = (latestRecording?.assets ?? []).filter(
    (a) =>
      (a.type === "transcript" || a.type === "summary") &&
      !a.url &&
      a.status !== "failed",
  );

  const extraDownloadAssets = useMemo(() => {
    const assets = latestRecording?.assets ?? [];
    const primaryId = preferredVideoAsset?.id;
    return assets.filter((a) => {
      if (!a.url || a.status !== "completed") return false;
      if (a.id === primaryId) return false;
      if (a.type === "transcript" || a.type === "summary") return false;
      if (a.type === "chat" || a.type === "speaker-label") return true;
      if (a.type === "room-composite" || a.type === "room-vod") {
        return (a.path ?? "").toLowerCase().includes("rec-audio");
      }
      return false;
    });
  }, [latestRecording?.assets, preferredVideoAsset?.id]);

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

        {latestRecording && (
          <>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Video size={16} />
                <div style={{ fontSize: 14, fontWeight: 700 }}>Recording Video</div>
              </div>
              {latestRecording.status === "failed" ? (
                <div style={{ fontSize: 13, color: "#dc2626" }}>
                  Recording failed for this session.
                </div>
              ) : !preferredVideoAsset ? (
                <div style={{ fontSize: 13, color: "#64748b" }}>Video asset not available yet.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <video
                    key={preferredVideoAsset.id}
                    controls
                    src={preferredVideoAsset.url ?? undefined}
                    style={{ width: "100%", maxHeight: 540, borderRadius: 12, background: "#0f172a" }}
                  />
                </div>
              )}
            </div>

            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <FileText size={16} />
                <div style={{ fontSize: 14, fontWeight: 700 }}>Transcripts and Summary</div>
              </div>
              {pendingTranscripts.length > 0 && (
                <div
                  style={{
                    fontSize: 13,
                    color: "#64748b",
                    marginBottom: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <Loader2 size={14} style={{ opacity: isFetching ? 1 : 0.5 }} aria-hidden />
                  {pendingTranscripts.map((a) => (
                    <span key={a.id} style={{ border: "1px dashed #cbd5e1", borderRadius: 8, padding: "4px 8px" }}>
                      {a.type}
                      {a.output_mode ? ` (${a.output_mode})` : ""}: {a.status}
                    </span>
                  ))}
                  <span style={{ color: "#94a3b8" }}>— checking every 15s until ready.</span>
                </div>
              )}
              {transcriptAssets.length === 0 && pendingTranscripts.length === 0 ? (
                <div style={{ fontSize: 13, color: "#64748b" }}>
                  No transcript or summary links returned yet. If transcription was enabled, wait a few minutes and refresh.
                </div>
              ) : (
                transcriptAssets.length > 0 && (
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
                        {asset.type}
                        {asset.output_mode ? ` (${asset.output_mode})` : ""}
                      </a>
                    ))}
                  </div>
                )
              )}
            </div>

            {extraDownloadAssets.length > 0 && (
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <Download size={16} />
                  <div style={{ fontSize: 14, fontWeight: 700 }}>Chat, audio, and other files</div>
                </div>
                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>
                  The main video above is a browser capture of the class view (usually the teacher). These are separate exports from 100ms: chat log, speaker labels, and an optional audio-only copy.
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
                      <span>
                        {asset.type === "chat" && "Chat export (CSV)"}
                        {asset.type === "speaker-label" && "Speaker labels (CSV)"}
                        {asset.type === "room-composite" && "Audio-only recording (MP4)"}
                        {!["chat", "speaker-label", "room-composite"].includes(asset.type) && asset.type}
                        {asset.output_mode ? ` · ${asset.output_mode}` : ""}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
