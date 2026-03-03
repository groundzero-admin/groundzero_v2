import { useState } from "react";
import { Mic, MicOff, Video, VideoOff, Monitor, Hand } from "lucide-react";
import { ConfidenceChips } from "../ConfidenceChips";
import * as s from "./VideoArea.css";

const MOCK_STUDENTS = ["A", "R", "S", "M", "P"];
const STUDENT_COLORS = [
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
];

interface VideoAreaProps {
  facilitatorName?: string;
  confidence: "got_it" | "kinda" | "lost" | null;
  onConfidenceChange: (value: "got_it" | "kinda" | "lost" | null) => void;
  questionActive: boolean;
}

export function VideoArea({
  facilitatorName = "Facilitator",
  confidence,
  onConfidenceChange,
  questionActive,
}: VideoAreaProps) {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  return (
    <div className={s.root}>
      <div className={s.main}>
        <div className={s.liveBadge}>
          <span className={s.liveDot} />
          LIVE
        </div>
        <div className={s.facilitatorAvatar}>{facilitatorName[0]?.toUpperCase()}</div>
        <div className={s.facilitatorName}>{facilitatorName}</div>
      </div>

      <div className={s.thumbnails}>
        {MOCK_STUDENTS.map((initial, i) => (
          <div
            key={i}
            className={s.thumbnail}
            style={{ background: STUDENT_COLORS[i] }}
          >
            {initial}
          </div>
        ))}
      </div>

      <div className={s.controls}>
        <button
          className={`${s.controlBtn} ${!micOn ? s.controlBtnActive : ""}`}
          onClick={() => setMicOn(!micOn)}
        >
          {micOn ? <Mic size={18} /> : <MicOff size={18} />}
        </button>
        <button
          className={`${s.controlBtn} ${!camOn ? s.controlBtnActive : ""}`}
          onClick={() => setCamOn(!camOn)}
        >
          {camOn ? <Video size={18} /> : <VideoOff size={18} />}
        </button>
        <button className={s.controlBtn}>
          <Monitor size={18} />
        </button>
        <button className={s.controlBtn}>
          <Hand size={18} />
        </button>
      </div>

      <div className={s.bottomArea}>
        <ConfidenceChips
          value={confidence}
          onChange={onConfidenceChange}
          disabled={!questionActive}
        />
      </div>
    </div>
  );
}
