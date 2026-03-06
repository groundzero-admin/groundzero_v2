import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useStudent } from "@/context/StudentContext";
import { useStudentById } from "@/api/hooks/useStudents";
import { useBenchmarkSession } from "../context/BenchmarkSessionContext";
import benchmarkApi, { type BenchmarkQuestion } from "../api";
import useVoiceRecording from "../hooks/useVoiceRecording";
import { Mic, MicOff, ChevronRight, CheckCircle, Loader2, Volume2 } from "lucide-react";

interface AnsweredQuestion {
  questionNumber: number;
  questionText: string;
  answerText: string;
}

export default function ConversationRoomPage() {
  const navigate = useNavigate();
  const { studentId } = useStudent();
  const { data: student } = useStudentById(studentId);
  const { selectedCharacter, sessionId } = useBenchmarkSession();

  const [questions, setQuestions] = useState<BenchmarkQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerText, setAnswerText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [answered, setAnswered] = useState<AnsweredQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [avatarPulse, setAvatarPulse] = useState(false);

  const { isRecording, liveTranscript, error: voiceError, startRecording, stopRecording, cancelRecording } =
    useVoiceRecording();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const historyEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const character = selectedCharacter || {
    id: "harry_potter",
    name: "Guide",
    image: "/characters/harry_potter.svg",
    color: "#805AD5",
    accent: "#B794F4",
    greeting: "Let's get started!",
  };

  useEffect(() => {
    benchmarkApi
      .getQuestions()
      .then((res: { data: BenchmarkQuestion[] }) => {
        setQuestions(res.data);
        setLoadingQuestions(false);
      })
      .catch(() => {
        alert("Failed to load questions. Please try again.");
        navigate("/benchmark");
      });
  }, [navigate]);

  useEffect(() => {
    if (isRecording && liveTranscript) {
      setAnswerText(liveTranscript);
    }
  }, [liveTranscript, isRecording]);

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [answered, currentIndex]);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length || 20;
  const progress = Math.round((answered.length / totalQuestions) * 100);
  const isLastQuestion = currentIndex >= totalQuestions - 1;

  const speakQuestion = useCallback(
    async (text: string) => {
      setIsSpeaking(true);
      setAvatarPulse(true);
      try {
        const { data } = await benchmarkApi.tts(text, character.id);
        const blob = new Blob([data], { type: "audio/wav" });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => {
          setIsSpeaking(false);
          setAvatarPulse(false);
          URL.revokeObjectURL(url);
          textareaRef.current?.focus();
        };
        audio.onerror = () => {
          setIsSpeaking(false);
          setAvatarPulse(false);
        };
        await audio.play();
      } catch {
        setIsSpeaking(false);
        setAvatarPulse(false);
      }
    },
    [character.id],
  );

  useEffect(() => {
    if (currentQuestion && !loadingQuestions) {
      speakQuestion(currentQuestion.text);
    }
    return () => {
      audioRef.current?.pause();
    };
  }, [currentIndex, loadingQuestions]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmitAnswer = useCallback(async () => {
    if (!answerText.trim() || !sessionId || !currentQuestion || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await benchmarkApi.submitAnswer({
        session_id: sessionId,
        question_id: currentQuestion.id,
        question_number: currentQuestion.question_number,
        answer_text: answerText.trim(),
      });

      setAnswered((prev) => [
        ...prev,
        {
          questionNumber: currentQuestion.question_number,
          questionText: currentQuestion.text,
          answerText: answerText.trim(),
        },
      ]);
      setAnswerText("");

      if (isLastQuestion) {
        setIsCompleting(true);
        await benchmarkApi.completeSession(sessionId);
        navigate(`/benchmark/report/${sessionId}`);
      } else {
        setCurrentIndex((i) => i + 1);
      }
    } catch {
      alert("Failed to submit answer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [answerText, sessionId, currentQuestion, isSubmitting, isLastQuestion, navigate]);

  const handleMicToggle = useCallback(() => {
    if (isRecording) {
      const finalText = stopRecording();
      if (finalText) {
        setAnswerText(finalText);
      }
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmitAnswer();
    }
  };

  if (loadingQuestions || isCompleting) {
    return (
      <div style={styles.loadingContainer}>
        <div style={spinnerStyle(character.color)} />
        <p style={styles.loadingText}>
          {isCompleting ? "Generating your report..." : "Loading questions..."}
        </p>
        <style>{spinKeyframes}</style>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      {/* Header */}
      <div style={styles.header}>
        <img src={character.image} alt={character.name} style={styles.headerAvatar} />
        <div style={{ flex: 1 }}>
          <div style={styles.headerName}>{character.name}</div>
          <div style={styles.headerSub}>
            Diagnostic with {student?.name || "Student"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={styles.progressLabel}>
            {answered.length + (currentQuestion ? 1 : 0)} / {totalQuestions}
          </div>
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${progress}%`, backgroundColor: character.color }} />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={styles.chatArea}>
        {/* Previous Q&A (compact) */}
        {answered.map((a, idx) => (
          <div key={idx} style={styles.answeredRow}>
            <div style={styles.answeredQ}>
              <span style={styles.qBadgeSmall}>Q{a.questionNumber}</span> {a.questionText}
            </div>
            <div style={{ ...styles.answeredA, borderColor: character.color + "30" }}>
              <CheckCircle size={10} color="#38A169" style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{a.answerText}</span>
            </div>
          </div>
        ))}

        {/* Current question - avatar speaks */}
        {currentQuestion && !isCompleting && (
          <div style={styles.questionSection}>
            {/* Large avatar */}
            <div style={styles.avatarContainer}>
              <div
                style={{
                  ...styles.avatarRing,
                  borderColor: avatarPulse ? character.color : "transparent",
                  boxShadow: avatarPulse ? `0 0 30px ${character.color}40, 0 0 60px ${character.color}20` : "none",
                }}
              >
                <img
                  src={character.image}
                  alt={character.name}
                  style={{
                    ...styles.avatarImage,
                    animation: avatarPulse ? "avatarBounce 1s ease-in-out infinite" : "none",
                  }}
                />
              </div>
              {isSpeaking && (
                <div style={styles.speakingIndicator}>
                  <Volume2 size={14} color={character.color} />
                  <span style={{ color: character.color, fontSize: 11, fontWeight: 600 }}>Speaking...</span>
                </div>
              )}
            </div>

            {/* Question bubble */}
            <div style={{ ...styles.questionBubble, borderColor: character.color + "20" }}>
              <div style={{ ...styles.qBadge, backgroundColor: character.color + "15", color: character.color }}>
                Question {currentQuestion.question_number}
              </div>
              <div style={styles.questionText}>{currentQuestion.text}</div>
              {!isSpeaking && (
                <button
                  onClick={() => speakQuestion(currentQuestion.text)}
                  style={{ ...styles.replayBtn, color: character.color }}
                  title="Replay question"
                >
                  <Volume2 size={14} /> Replay
                </button>
              )}
            </div>
          </div>
        )}
        <div ref={historyEndRef} />
      </div>

      {/* Input area */}
      {currentQuestion && !isCompleting && (
        <div style={styles.inputArea}>
          <div style={styles.inputRow}>
            {/* Mic button */}
            <button
              onClick={handleMicToggle}
              disabled={isSubmitting}
              style={{
                ...styles.micBtn,
                backgroundColor: isRecording ? "#E53E3E" : character.color,
                opacity: isSubmitting ? 0.4 : 1,
              }}
              title={isRecording ? "Stop recording" : "Record answer"}
            >
              {isRecording ? (
                <MicOff size={18} color="#fff" />
              ) : (
                <Mic size={20} color="#fff" />
              )}
            </button>

            {/* Text input */}
            <textarea
              ref={textareaRef}
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isRecording
                  ? "Listening... your words will appear here"
                  : "Speak or type your answer..."
              }
              disabled={isSubmitting}
              rows={3}
              style={{
                ...styles.textarea,
                borderColor: isRecording ? "#E53E3E" : "#E8E0D8",
                backgroundColor: isRecording ? "#FFF5F5" : "#FAF7F4",
              }}
              onFocus={(e) => { if (!isRecording) e.target.style.borderColor = character.color; }}
              onBlur={(e) => { if (!isRecording) e.target.style.borderColor = "#E8E0D8"; }}
            />

            {/* Submit */}
            <button
              onClick={handleSubmitAnswer}
              disabled={isSubmitting || !answerText.trim()}
              style={{
                ...styles.submitBtn,
                backgroundColor: character.color,
                opacity: isSubmitting || !answerText.trim() ? 0.4 : 1,
              }}
            >
              {isSubmitting ? (
                <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
              ) : isLastQuestion ? (
                <>Finish <CheckCircle size={16} /></>
              ) : (
                <>Next <ChevronRight size={16} /></>
              )}
            </button>
          </div>

          {isRecording && (
            <div style={styles.recordingBar}>
              <div style={styles.recordingDot} />
              <span>Recording... click the mic to stop</span>
              <button onClick={cancelRecording} style={styles.cancelBtn}>
                <MicOff size={12} /> Cancel
              </button>
            </div>
          )}

          {voiceError && (
            <div style={{ marginTop: 8, fontSize: 12, color: "#E53E3E", fontWeight: 500 }}>
              {voiceError}
            </div>
          )}

          <div style={styles.hint}>
            {isLastQuestion
              ? "Last question. Your report will be generated after submission."
              : `${totalQuestions - answered.length - 1} questions remaining`}
          </div>
        </div>
      )}

      <style>{`
        ${spinKeyframes}
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes avatarBounce { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.04); } }
        @keyframes recordPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}

const spinKeyframes = `@keyframes spin { to { transform: rotate(360deg); } }`;

function spinnerStyle(color: string): React.CSSProperties {
  return { width: 48, height: 48, border: "3px solid #E8E0D8", borderTopColor: color, borderRadius: "50%", animation: "spin 1s linear infinite" };
}

const styles: Record<string, React.CSSProperties> = {
  root: { height: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#FAF7F4" },
  loadingContainer: { height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#FAF7F4", flexDirection: "column", gap: 16 },
  loadingText: { color: "#7A7168", fontSize: 15, fontFamily: "'Inter', sans-serif" },

  header: { padding: "12px 24px", borderBottom: "1px solid #E8E0D8", backgroundColor: "#FFFFFF", display: "flex", alignItems: "center", gap: 14 },
  headerAvatar: { width: 40, height: 40, borderRadius: 10, objectFit: "cover" },
  headerName: { fontSize: 16, fontWeight: 700, color: "#26221D", fontFamily: "'Nunito', sans-serif" },
  headerSub: { fontSize: 12, color: "#A89E94" },
  progressLabel: { fontSize: 13, fontWeight: 600, color: "#3D3730" },
  progressBar: { width: 120, height: 6, backgroundColor: "#E8E0D8", borderRadius: 999, overflow: "hidden", marginTop: 4 },
  progressFill: { height: "100%", borderRadius: 999, transition: "width 500ms ease" },

  chatArea: { flex: 1, overflowY: "auto", padding: "20px 24px" },

  answeredRow: { marginBottom: 12, padding: "10px 14px", backgroundColor: "#fff", borderRadius: 12, border: "1px solid #F0EBE6" },
  answeredQ: { fontSize: 12, color: "#7A7168", lineHeight: 1.5, marginBottom: 4 },
  qBadgeSmall: { fontSize: 10, fontWeight: 700, color: "#A89E94" },
  answeredA: { fontSize: 13, color: "#3D3730", display: "flex", gap: 6, alignItems: "flex-start", paddingTop: 4, borderTop: "1px solid", lineHeight: 1.5 },

  questionSection: { display: "flex", flexDirection: "column", alignItems: "center", gap: 20, paddingTop: 8, animation: "fadeIn 0.5s ease" },

  avatarContainer: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8 },
  avatarRing: { width: 140, height: 140, borderRadius: "50%", border: "4px solid", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s ease" },
  avatarImage: { width: 120, height: 120, borderRadius: "50%", objectFit: "cover" },
  speakingIndicator: { display: "flex", alignItems: "center", gap: 4, animation: "recordPulse 1.5s ease-in-out infinite" },

  questionBubble: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: "18px 22px", maxWidth: 600, width: "100%", border: "1px solid", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", textAlign: "center" },
  qBadge: { display: "inline-block", padding: "3px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, marginBottom: 10 },
  questionText: { fontSize: 16, color: "#26221D", lineHeight: 1.7, fontFamily: "'Inter', sans-serif" },
  replayBtn: { display: "inline-flex", alignItems: "center", gap: 4, marginTop: 12, padding: "4px 12px", borderRadius: 6, border: "none", backgroundColor: "transparent", cursor: "pointer", fontSize: 12, fontWeight: 600 },

  inputArea: { borderTop: "1px solid #E8E0D8", padding: "14px 24px", backgroundColor: "#FFFFFF" },
  inputRow: { display: "flex", gap: 10, alignItems: "flex-end" },
  micBtn: { width: 48, height: 48, borderRadius: 12, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 200ms" },
  textarea: { flex: 1, padding: "12px 16px", borderRadius: 12, border: "1px solid", fontSize: 14, outline: "none", color: "#26221D", fontFamily: "'Inter', sans-serif", resize: "none", lineHeight: 1.5, transition: "border-color 200ms" },
  submitBtn: { height: 48, padding: "0 20px", borderRadius: 12, border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 14, fontWeight: 600, transition: "opacity 200ms", fontFamily: "'Inter', sans-serif" },

  recordingBar: { display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: 12, color: "#E53E3E", fontWeight: 500 },
  recordingDot: { width: 8, height: 8, borderRadius: "50%", backgroundColor: "#E53E3E", animation: "recordPulse 1s ease-in-out infinite" },
  cancelBtn: { display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 4, border: "1px solid #E53E3E30", backgroundColor: "transparent", color: "#E53E3E", cursor: "pointer", fontSize: 11, marginLeft: "auto" },

  hint: { marginTop: 8, fontSize: 11, color: "#A89E94", textAlign: "center" },
};
