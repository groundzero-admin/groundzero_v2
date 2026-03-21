import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useStudent } from "@/context/StudentContext";
import { useStudentById } from "@/api/hooks/useStudents";
import { useBenchmarkSession } from "../context/BenchmarkSessionContext";
import benchmarkApi, { type BenchmarkQuestion, getQuestionAudioUrl } from "../api";
import useVoiceRecording from "../hooks/useVoiceRecording";
import useConfetti from "../hooks/useConfetti";
import useSoundEffects from "../hooks/useSoundEffects";
import AdventureMap from "../components/AdventureMap";
import { CHARACTERS, type CharacterPose } from "../constants/characters";
import { CheckCircle, Loader2, Volume2, Trophy, ArrowRight, Pencil } from "lucide-react";

interface AnsweredQuestion {
  questionNumber: number;
  questionText: string;
  answerText: string;
}

type Phase = "loading" | "intro" | "map" | "speaking" | "answering" | "filler" | "feedback" | "retry_prompt" | "celebration";

const FILLER_MESSAGES = [
  "Alright, let me think about that for a moment...",
  "Hmm, give me a second to review your answer...",
  "Okay, let me take a look at what you said...",
  "Hold on, let me go through your answer...",
  "One moment while I check your response...",
];

export default function ConversationRoomPage() {
  const navigate = useNavigate();
  const { studentId } = useStudent();
  const { data: student } = useStudentById(studentId);
  const { selectedCharacter, sessionId } = useBenchmarkSession();

  const [questions, setQuestions] = useState<BenchmarkQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerText, setAnswerText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answered, setAnswered] = useState<AnsweredQuestion[]>([]);
  const [phase, setPhase] = useState<Phase>("loading");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [typedWords, setTypedWords] = useState<string[]>([]);
  const [typingDone, setTypingDone] = useState(false);
  const [introTypedWords, setIntroTypedWords] = useState<string[]>([]);
  const [introTypingDone, setIntroTypingDone] = useState(false);
  const [, setFeedbackText] = useState("");
  const [feedbackTypedWords, setFeedbackTypedWords] = useState<string[]>([]);
  const [retriesUsed, setRetriesUsed] = useState<Record<number, boolean>>({});
  const [retryHint, setRetryHint] = useState<string | null>(null);
  const [showContinueBtn, setShowContinueBtn] = useState(false);

  const [autoRunOnMap, setAutoRunOnMap] = useState(false);

  // Streak tracking
  const [streak, setStreak] = useState(0);
  const streakRef = useRef(0);
  const [streakDisplay, setStreakDisplay] = useState<{
    count: number;
    message: string;
    emoji: string;
    level: "nice" | "fire" | "unstoppable";
  } | null>(null);

  const { isRecording, liveTranscript, error: voiceError, startRecording, stopRecording } =
    useVoiceRecording();

  const character = CHARACTERS.find((c) => c.id === selectedCharacter?.id) || selectedCharacter || CHARACTERS[0];

  const currentPose: CharacterPose = useMemo(() => {
    if (phase === "celebration") return "happy";
    if (phase === "retry_prompt") return "encouraging";
    if (phase === "answering") return "listening";
    if (phase === "filler" && !isSpeaking) return "thinking";
    if (isSpeaking) return "speaking";
    return "idle";
  }, [phase, isSpeaking]);

  const [prevPose, setPrevPose] = useState<CharacterPose>("idle");
  const [poseTransitioning, setPoseTransitioning] = useState(false);

  useEffect(() => {
    if (currentPose !== prevPose) {
      setPoseTransitioning(true);
      const timer = setTimeout(() => {
        setPrevPose(currentPose);
        setPoseTransitioning(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentPose, prevPose]);

  const avatarSrc = character.poses?.[currentPose] || character.image;
  const prevAvatarSrc = character.poses?.[prevPose] || character.image;

  const confettiColors = useMemo(
    () => [character.color, character.accent, "#FFD700", "#FF6B6B", "#4ECDC4"],
    [character.color, character.accent],
  );
  const { smallBurst, doubleBurst, tripleBurst, screenWideBurst, celebrationBurst } = useConfetti(confettiColors);
  const { playPop, playWhoosh, playComplete, playStreak } = useSoundEffects();

  const bubbleRef = useRef<HTMLDivElement>(null);
  const isUserEditingRef = useRef(false);
  const prevWordCountRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setInterval>>(0 as unknown as ReturnType<typeof setInterval>);
  const introTimerRef = useRef<ReturnType<typeof setInterval>>(0 as unknown as ReturnType<typeof setInterval>);
  const feedbackTimerRef = useRef<ReturnType<typeof setInterval>>(0 as unknown as ReturnType<typeof setInterval>);

  // ─── Redirect if no session ───
  useEffect(() => {
    if (!sessionId || !selectedCharacter) {
      navigate("/benchmark/characters", { replace: true });
    }
  }, [sessionId, selectedCharacter, navigate]);

  // ─── Load questions ───
  useEffect(() => {
    if (!sessionId) return;
    benchmarkApi
      .getQuestions()
      .then((res: { data: BenchmarkQuestion[] }) => {
        setQuestions(res.data);
        setPhase("intro");
      })
      .catch(() => {
        alert("Failed to load questions. Please try again.");
        navigate("/benchmark");
      });
  }, [navigate, sessionId]);

  // ─── Intro greeting ───
  useEffect(() => {
    if (phase !== "intro") return;

    const greetingText = character.greeting;
    const words = greetingText.split(" ");
    setIntroTypedWords([]);
    setIntroTypingDone(false);
    let idx = 0;
    clearInterval(introTimerRef.current);
    introTimerRef.current = setInterval(() => {
      idx++;
      setIntroTypedWords(words.slice(0, idx));
      if (idx >= words.length) {
        clearInterval(introTimerRef.current);
        setIntroTypingDone(true);
      }
    }, 100);

    (async () => {
      try {
        setIsSpeaking(true);
        const { data } = await benchmarkApi.tts(greetingText, character.id);
        const blob = new Blob([data], { type: "audio/wav" });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(url);
          clearInterval(introTimerRef.current);
          setIntroTypedWords(words);
          setIntroTypingDone(true);
        };
        audio.onerror = () => {
          setIsSpeaking(false);
          clearInterval(introTimerRef.current);
          setIntroTypedWords(words);
          setIntroTypingDone(true);
        };
        await audio.play();
      } catch {
        setIsSpeaking(false);
        clearInterval(introTimerRef.current);
        setIntroTypedWords(words);
        setIntroTypingDone(true);
      }
    })();

    return () => {
      audioRef.current?.pause();
      clearInterval(introTimerRef.current);
    };
  }, [phase === "intro"]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Live transcript sync ───
  useEffect(() => {
    if (isRecording && liveTranscript) {
      setAnswerText(liveTranscript);
      if (bubbleRef.current && !isUserEditingRef.current) {
        bubbleRef.current.textContent = liveTranscript;
      }
    }
  }, [liveTranscript, isRecording]);

  const answerWords = answerText.trim() ? answerText.trim().split(/\s+/) : [];
  const newWordStart = prevWordCountRef.current;
  useEffect(() => {
    prevWordCountRef.current = answerWords.length;
  }, [answerWords.length]);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length || 8;
  const isLastQuestion = currentIndex >= totalQuestions - 1;

  // ─── Typing animation helpers ───
  const startTypingAnimation = useCallback((text: string) => {
    const words = text.split(" ");
    setTypedWords([]);
    setTypingDone(false);
    let idx = 0;
    clearInterval(typingTimerRef.current);
    typingTimerRef.current = setInterval(() => {
      idx++;
      setTypedWords(words.slice(0, idx));
      if (idx >= words.length) {
        clearInterval(typingTimerRef.current);
        setTypingDone(true);
      }
    }, 90);
  }, []);

  const skipTyping = useCallback(() => {
    if (!currentQuestion) return;
    clearInterval(typingTimerRef.current);
    setTypedWords(currentQuestion.text.split(" "));
    setTypingDone(true);
  }, [currentQuestion]);

  // ─── Speak question via pre-generated S3 audio (fallback to live TTS) ───
  const speakQuestion = useCallback(
    (text: string, question?: BenchmarkQuestion) => {
      setPhase("speaking");
      setIsSpeaking(true);
      startTypingAnimation(text);
      playPop();

      const finish = (blobUrl?: string) => {
        setIsSpeaking(false);
        setPhase("answering");
        if (blobUrl) URL.revokeObjectURL(blobUrl);
        skipTyping();
        bubbleRef.current?.focus();
        startRecording();
      };

      const fallbackToTts = () => {
        benchmarkApi.tts(text, character.id).then(({ data }) => {
          const blob = new Blob([data], { type: "audio/wav" });
          const blobUrl = URL.createObjectURL(blob);
          const fallback = new Audio(blobUrl);
          audioRef.current = fallback;
          fallback.onended = () => finish(blobUrl);
          fallback.onerror = () => finish();
          fallback.play().catch(() => finish());
        }).catch(() => finish());
      };

      if (question?.grade_band) {
        const s3Url = getQuestionAudioUrl(character.id, question.grade_band, question.question_number);
        const audio = new Audio(s3Url);
        audioRef.current = audio;
        audio.onended = () => finish();
        audio.onerror = () => fallbackToTts();
        audio.play().catch(() => fallbackToTts());
      } else {
        fallbackToTts();
      }
    },
    [character.id, startTypingAnimation, skipTyping, playPop, startRecording],
  );

  // ─── Trigger question speech on index change ───
  useEffect(() => {
    if (!currentQuestion || phase === "loading" || phase === "intro" || phase === "celebration" || phase === "map") return;
    setShowContinueBtn(false);
    setStreakDisplay(null);
    speakQuestion(currentQuestion.text, currentQuestion);
    return () => {
      audioRef.current?.pause();
      clearInterval(typingTimerRef.current);
    };
  }, [currentIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStartQuestions = useCallback(() => {
    audioRef.current?.pause();
    clearInterval(introTimerRef.current);
    setPhase("map");
  }, []);

  const handleOpenQuestion = useCallback(() => {
    if (!currentQuestion) return;
    setAutoRunOnMap(false);
    speakQuestion(currentQuestion.text, currentQuestion);
  }, [currentQuestion, speakQuestion]);

  // ─── Play feedback audio and show typed text ───
  const playFeedback = useCallback((text: string, audioBase64: string | null, needsRetry: boolean, hint: string | null) => {
    setPhase("feedback");
    setFeedbackText(text);
    setIsSpeaking(true);
    setStreakDisplay(null);

    // Streak tracking
    let newStreak = streakRef.current;
    if (!needsRetry) {
      newStreak = streakRef.current + 1;
      streakRef.current = newStreak;
      setStreak(newStreak);
      smallBurst();
    } else {
      streakRef.current = 0;
      setStreak(0);
    }

    const words = text.split(" ");
    setFeedbackTypedWords([]);
    let idx = 0;
    clearInterval(feedbackTimerRef.current);
    feedbackTimerRef.current = setInterval(() => {
      idx++;
      setFeedbackTypedWords(words.slice(0, idx));
      if (idx >= words.length) clearInterval(feedbackTimerRef.current);
    }, 80);

    const canRetry = needsRetry && !retriesUsed[currentIndex];
    const feedbackStartTime = Date.now();
    const MIN_FEEDBACK_DISPLAY_MS = 3000;
    let feedbackDone = false;

    // Determine streak milestone
    let streakMilestone: { count: number; message: string; emoji: string; level: "nice" | "fire" | "unstoppable" } | null = null;
    if (!needsRetry && newStreak >= 5) {
      streakMilestone = { count: newStreak, message: "UNSTOPPABLE!", emoji: "\u{26A1}", level: "unstoppable" };
    } else if (!needsRetry && newStreak >= 3) {
      streakMilestone = { count: newStreak, message: "On fire!", emoji: "\u{1F525}", level: "fire" };
    } else if (!needsRetry && newStreak >= 2) {
      streakMilestone = { count: newStreak, message: "Nice streak!", emoji: "\u{1F525}", level: "nice" };
    }

    const onFeedbackDone = () => {
      if (feedbackDone) return;
      feedbackDone = true;

      setIsSpeaking(false);
      clearInterval(feedbackTimerRef.current);
      setFeedbackTypedWords(words);

      const elapsed = Date.now() - feedbackStartTime;
      const remaining = Math.max(0, MIN_FEEDBACK_DISPLAY_MS - elapsed);

      if (canRetry) {
        setTimeout(() => {
          setRetryHint(hint || "Think about it differently and try again!");
          setPhase("retry_prompt");
        }, remaining + 800);
      } else if (streakMilestone) {
        // Show big streak celebration before continue button
        setTimeout(() => {
          setStreakDisplay(streakMilestone);
          playStreak();
          if (streakMilestone!.level === "unstoppable") screenWideBurst();
          else if (streakMilestone!.level === "fire") tripleBurst();
          else doubleBurst();
          // After celebration, show continue button
          setTimeout(() => setShowContinueBtn(true), 2800);
        }, remaining + 400);
      } else {
        setTimeout(() => {
          setShowContinueBtn(true);
        }, remaining + 500);
      }
    };

    if (audioBase64) {
      try {
        const bytes = Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: "audio/wav" });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        const cleanup = () => URL.revokeObjectURL(url);
        audio.onended = () => { cleanup(); onFeedbackDone(); };
        audio.onerror = () => { cleanup(); onFeedbackDone(); };
        audio.play().catch(() => { cleanup(); onFeedbackDone(); });
      } catch {
        onFeedbackDone();
      }
    } else {
      setTimeout(onFeedbackDone, MIN_FEEDBACK_DISPLAY_MS);
    }
  }, [smallBurst, doubleBurst, tripleBurst, screenWideBurst, playStreak, retriesUsed, currentIndex]);

  // ─── Submit answer -> filler -> feedback ───
  const handleSubmitAnswer = useCallback(async () => {
    if (!answerText.trim() || !sessionId || !currentQuestion || isSubmitting) return;

    if (isRecording) stopRecording();
    setIsSubmitting(true);
    const trimmedAnswer = answerText.trim();
    const isRetry = !!retriesUsed[currentIndex];

    try {
      await benchmarkApi.submitAnswer({
        session_id: sessionId,
        question_id: currentQuestion.id,
        question_number: currentQuestion.question_number,
        answer_text: trimmedAnswer,
        is_retry: isRetry,
      });

      if (!isRetry) {
        setAnswered((prev) => [
          ...prev,
          {
            questionNumber: currentQuestion.question_number,
            questionText: currentQuestion.text,
            answerText: trimmedAnswer,
          },
        ]);
      }
      setAnswerText("");
      prevWordCountRef.current = 0;
      if (bubbleRef.current) bubbleRef.current.textContent = "";
      setRetryHint(null);

      if (isLastQuestion) {
        setPhase("celebration");
        celebrationBurst();
        playComplete();
        await benchmarkApi.completeSession(sessionId);
        setTimeout(() => navigate(`/benchmark/report/${sessionId}`), 3500);
        return;
      }

      // Enter filler phase
      setPhase("filler");
      setIsSpeaking(true);
      playWhoosh();

      const fillerMsg = FILLER_MESSAGES[Math.floor(Math.random() * FILLER_MESSAGES.length)];
      const fillerWords = fillerMsg.split(" ");
      setFeedbackText(fillerMsg);
      setFeedbackTypedWords([]);
      let fidx = 0;
      clearInterval(feedbackTimerRef.current);
      feedbackTimerRef.current = setInterval(() => {
        fidx++;
        setFeedbackTypedWords(fillerWords.slice(0, fidx));
        if (fidx >= fillerWords.length) clearInterval(feedbackTimerRef.current);
      }, 80);

      // Fire TTS for filler + feedback fetch in parallel
      const fillerTtsPromise = benchmarkApi.tts(fillerMsg, character.id).catch(() => null);
      const feedbackPromise = benchmarkApi.fetchFeedback({
        question_text: currentQuestion.text,
        answer_text: trimmedAnswer,
        question_number: currentQuestion.question_number,
        character: character.id,
        is_retry: isRetry,
      }).catch(() => null);

      // Play filler TTS audio
      const fillerTtsResult = await fillerTtsPromise;
      if (fillerTtsResult?.data) {
        const blob = new Blob([fillerTtsResult.data], { type: "audio/wav" });
        const url = URL.createObjectURL(blob);
        await new Promise<void>((resolve) => {
          const audio = new Audio(url);
          audioRef.current = audio;
          let resolved = false;
          const done = () => {
            if (resolved) return;
            resolved = true;
            setIsSpeaking(false);
            URL.revokeObjectURL(url);
            clearInterval(feedbackTimerRef.current);
            setFeedbackTypedWords(fillerWords);
            resolve();
          };
          audio.onended = done;
          audio.onerror = done;
          audio.play().catch(done);
        });
      } else {
        await new Promise<void>((resolve) =>
          setTimeout(() => {
            setIsSpeaking(false);
            clearInterval(feedbackTimerRef.current);
            setFeedbackTypedWords(fillerWords);
            resolve();
          }, 2500),
        );
      }

      // Filler done — now await feedback and play it
      const feedbackResult = await feedbackPromise;
      const fb = feedbackResult?.data
        ? {
            text: feedbackResult.data.feedback_text,
            audioBase64: feedbackResult.data.audio_base64,
            needsRetry: feedbackResult.data.needs_retry,
            hint: feedbackResult.data.hint,
          }
        : null;

      if (fb) {
        playFeedback(fb.text, fb.audioBase64, fb.needsRetry, fb.hint);
      } else {
        playFeedback("Good effort on that one! Let's keep going.", null, false, null);
      }
    } catch {
      alert("Failed to submit answer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [answerText, sessionId, currentQuestion, isSubmitting, isLastQuestion, isRecording, stopRecording, navigate, celebrationBurst, playComplete, playWhoosh, character.id, playFeedback, retriesUsed, currentIndex]);


  const handleRetry = useCallback(() => {
    setRetriesUsed((prev) => ({ ...prev, [currentIndex]: true }));
    setAnswerText("");
    prevWordCountRef.current = 0;
    if (bubbleRef.current) bubbleRef.current.textContent = "";
    setRetryHint(null);
    setPhase("answering");
    startRecording();
    bubbleRef.current?.focus();
  }, [currentIndex, startRecording]);

  const handlePass = useCallback(() => {
    setRetryHint(null);
    streakRef.current = 0;
    setStreak(0);
    setCurrentIndex((i) => i + 1);
    setAutoRunOnMap(!!character.runVideo);
    setPhase("map");
  }, [character.runVideo]);

  const handleContinue = useCallback(() => {
    setShowContinueBtn(false);
    setStreakDisplay(null);
    setCurrentIndex((i) => i + 1);
    setAutoRunOnMap(!!character.runVideo);
    setPhase("map");
  }, [character.runVideo]);

  // ─── Loading ───
  if (phase === "loading") {
    return (
      <div className="cr-center" style={{ background: character.background }}>
        <img src={character.poses?.idle || character.image} alt="" className="cr-loading-avatar" />
        <p className="cr-loading-text">Getting your questions ready...</p>
        <style>{cssStyles}</style>
      </div>
    );
  }

  // ─── Intro ───
  if (phase === "intro") {
    return (
      <div className="cr-center" style={{ background: character.background, padding: 24 }}>
        <div className="cr-intro-card">
          <div
            className="cr-intro-avatar-ring"
            style={{
              borderColor: character.accent,
              boxShadow: isSpeaking
                ? `0 0 30px ${character.color}50, 0 0 60px ${character.color}20`
                : `0 6px 24px ${character.color}30`,
            }}
          >
            <img
              src={avatarSrc}
              alt={character.name}
              className={`cr-intro-avatar-img ${isSpeaking ? "cr-talking" : "cr-floating"}`}
            />
          </div>

          <h2 className="cr-intro-name">{character.name}</h2>

          <div className="cr-intro-bubble" style={{ borderColor: character.color + "20" }}>
            <div className="cr-intro-text">
              {introTypedWords.map((word, i) => (
                <span key={i} className="cr-word" style={{ animationDelay: `${i * 0.02}s` }}>
                  {word}{" "}
                </span>
              ))}
            </div>
            {isSpeaking && (
              <div className="cr-speaking-label" style={{ color: character.color }}>
                <Volume2 size={14} /> Speaking...
              </div>
            )}
          </div>

          {introTypingDone && !isSpeaking && (
            <button
              onClick={handleStartQuestions}
              className="cr-start-btn"
              style={{ background: `linear-gradient(135deg, ${character.color}, ${character.accent})`, boxShadow: `0 6px 20px ${character.color}40` }}
            >
              Let's Begin! <ArrowRight size={18} />
            </button>
          )}

          <p className="cr-intro-sub">{totalQuestions} questions ahead</p>
        </div>
        <style>{cssStyles}</style>
      </div>
    );
  }

  // ─── Adventure Map ───
  if (phase === "map") {
    return (
      <AdventureMap
        questions={questions}
        completed={answered.length}
        current={currentIndex}
        character={character}
        avatarImage={character.poses?.idle || character.image}
        onOpenQuestion={handleOpenQuestion}
        studentName={student?.name || "Student"}
        autoRun={autoRunOnMap}
      />
    );
  }

  // ─── Celebration ───
  if (phase === "celebration") {
    return (
      <div className="cr-center" style={{ background: character.background }}>
        <div className="cr-celeb-card">
          <div className="cr-celeb-badge" style={{ background: `linear-gradient(135deg, ${character.color}, ${character.accent})`, boxShadow: `0 10px 40px ${character.color}50` }}>
            <Trophy size={44} color="#fff" />
          </div>
          <h1 className="cr-celeb-title">Assessment Complete!</h1>
          <p className="cr-celeb-sub">You answered all {totalQuestions} questions!</p>
          <img src={character.poses?.happy || character.image} alt={character.name} className="cr-celeb-avatar" />
          <p className="cr-celeb-hint">Generating your report...</p>
        </div>
        <style>{cssStyles}</style>
      </div>
    );
  }

  // ─── Main Q&A flow ───
  return (
    <div className="cr-root" style={{ background: character.background }}>
      {/* Header */}
      <div className="cr-header">
        <img src={avatarSrc} alt={character.name} className="cr-header-avatar" />
        <div className="cr-header-info">
          <div className="cr-header-name">{character.name}</div>
          <div className="cr-header-sub">with {student?.name || "Student"}</div>
        </div>
        <div className="cr-header-right">
          {streak >= 2 && (
            <div className="cr-streak-badge" style={{ backgroundColor: character.color + "18", color: character.color }}>
              {"\u{1F525}"} {streak}
            </div>
          )}
          <span className="cr-header-count" style={{ color: character.color }}>
            {answered.length}/{totalQuestions}
          </span>
        </div>
      </div>

      {/* Progress bar (compact, replaces old journey map) */}
      <div className="cr-progress-strip">
        <div className="cr-progress-bar" style={{ backgroundColor: character.color + "25" }}>
          <div
            className="cr-progress-fill"
            style={{
              width: `${(answered.length / totalQuestions) * 100}%`,
              backgroundColor: character.color,
            }}
          />
        </div>
        <span className="cr-progress-label" style={{ color: character.color }}>
          Q{currentIndex + 1} of {totalQuestions}
        </span>
      </div>

      {/* Main area */}
      <div className="cr-main">
        {/* Question background illustration */}
        {currentQuestion?.image_url && (phase === "speaking" || phase === "answering" || phase === "filler" || phase === "feedback" || phase === "retry_prompt") && (
          <div key={currentQuestion.id} className="cr-q-bg">
            <img src={currentQuestion.image_url} alt="" className="cr-q-bg-img" />
          </div>
        )}

        {/* Retry prompt */}
        {phase === "retry_prompt" && currentQuestion && (
          <div className="cr-feedback-area">
            <div className="cr-avatar-section">
              <div
                className="cr-avatar-ring"
                style={{ borderColor: character.accent, boxShadow: `0 4px 16px ${character.color}30` }}
              >
                <img src={avatarSrc} alt={character.name} className="cr-avatar-img cr-floating" />
              </div>
            </div>
            <div className="cr-feedback-bubble" style={{ borderColor: character.color + "25" }}>
              <div className="cr-fb-badge" style={{ backgroundColor: "#FEEBC830", color: "#ED8936" }}>
                {"\u{1F4A1}"} Hint
              </div>
              <div className="cr-feedback-text">{retryHint}</div>
              <div className="cr-retry-actions">
                <button
                  onClick={handleRetry}
                  className="cr-retry-btn"
                  style={{ background: `linear-gradient(135deg, ${character.color}, ${character.accent})`, boxShadow: `0 4px 12px ${character.color}40` }}
                >
                  {"\u{1F504}"} Try Again
                </button>
                <button onClick={handlePass} className="cr-pass-btn">
                  Skip {"\u{27A1}\u{FE0F}"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filler / Feedback overlay */}
        {(phase === "filler" || phase === "feedback") && (
          <div className="cr-feedback-area">
            <div className="cr-avatar-section">
              <div
                className="cr-avatar-ring"
                style={{
                  borderColor: character.color,
                  boxShadow: isSpeaking
                    ? `0 0 20px ${character.color}50, 0 0 40px ${character.color}20`
                    : `0 4px 16px ${character.color}30`,
                }}
              >
                <div className="cr-pose-container">
                  <img src={prevAvatarSrc} alt="" className={`cr-avatar-img cr-pose-layer ${poseTransitioning ? "cr-pose-out" : ""}`} />
                  <img src={avatarSrc} alt={character.name} className={`cr-avatar-img cr-pose-layer ${poseTransitioning ? "cr-pose-in" : "cr-pose-visible"}`} />
                </div>
              </div>
              {isSpeaking && (
                <div className="cr-speaking-label" style={{ color: character.color }}>
                  <Volume2 size={12} /> {phase === "filler" ? "Processing..." : "Sharing feedback..."}
                </div>
              )}
            </div>

            <div className="cr-feedback-bubble" style={{ borderColor: character.color + "25" }}>
              {phase === "feedback" && (
                <div className="cr-fb-badge" style={{ backgroundColor: character.accent + "25", color: character.color }}>
                  Feedback
                </div>
              )}
              <div className="cr-feedback-text">
                {feedbackTypedWords.map((word, i) => (
                  <span key={`fb-${i}`} className="cr-word" style={{ animationDelay: `${i * 0.02}s` }}>
                    {word}{" "}
                  </span>
                ))}
              </div>
              {phase === "filler" && !isSpeaking && (
                <div className="cr-thinking-dots" style={{ color: character.color }}>
                  <span>Thinking</span>
                  <span className="cr-dot-anim">...</span>
                </div>
              )}
              {/* Streak celebration overlay -- BIG and center */}
              {phase === "feedback" && streakDisplay && (
                <div className={`cr-streak-overlay cr-streak-${streakDisplay.level}`} style={{ ["--streak-color" as string]: character.color }}>
                  <div className="cr-streak-emoji">
                    {streakDisplay.level === "unstoppable" ? "\u{26A1}\u{1F525}\u{26A1}" : streakDisplay.level === "fire" ? "\u{1F525}\u{1F525}\u{1F525}" : "\u{1F525}"}
                  </div>
                  <div className="cr-streak-count" style={{ color: character.color }}>{streakDisplay.count} in a row!</div>
                  <div className="cr-streak-label">{streakDisplay.message}</div>
                  <img
                    src={character.poses?.happy || character.image}
                    alt={character.name}
                    className="cr-streak-avatar"
                    style={{ borderColor: character.color }}
                  />
                </div>
              )}

              {phase === "feedback" && showContinueBtn && (
                <button
                  onClick={handleContinue}
                  className="cr-continue-btn"
                  style={{ background: `linear-gradient(135deg, ${character.color}, ${character.accent})`, boxShadow: `0 4px 12px ${character.color}40` }}
                >
                  Next Question <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Question */}
        {(phase === "speaking" || phase === "answering") && currentQuestion && (
          <div className="cr-question-area">
            <div className="cr-avatar-section">
              <div
                className="cr-avatar-ring"
                style={{
                  borderColor: isSpeaking ? character.color : character.accent,
                  boxShadow: isSpeaking
                    ? `0 0 20px ${character.color}50, 0 0 40px ${character.color}20`
                    : `0 4px 16px ${character.color}30`,
                }}
              >
                <div className="cr-pose-container">
                  <img src={prevAvatarSrc} alt="" className={`cr-avatar-img cr-pose-layer ${poseTransitioning ? "cr-pose-out" : ""}`} />
                  <img src={avatarSrc} alt={character.name} className={`cr-avatar-img cr-pose-layer ${poseTransitioning ? "cr-pose-in" : "cr-pose-visible"}`} />
                </div>
              </div>
              {isSpeaking && (
                <div className="cr-speaking-label" style={{ color: character.color }}>
                  <Volume2 size={12} /> Speaking...
                </div>
              )}
            </div>

            <div
              className="cr-q-bubble"
              style={{ borderColor: character.color + "25" }}
              onClick={!typingDone ? skipTyping : undefined}
            >
              <div className="cr-q-badge" style={{ backgroundColor: character.color + "18", color: character.color }}>
                Question {currentIndex + 1}
              </div>
              <div className="cr-q-text">
                {typedWords.map((word, i) => (
                  <span key={`${currentIndex}-${i}`} className="cr-word" style={{ animationDelay: `${i * 0.02}s` }}>
                    {word}{" "}
                  </span>
                ))}
              </div>
              {!isSpeaking && typingDone && (
                <button
                  onClick={(e) => { e.stopPropagation(); speakQuestion(currentQuestion.text, currentQuestion); }}
                  className="cr-replay-btn"
                  style={{ color: character.color }}
                >
                  <Volume2 size={13} /> Hear again
                </button>
              )}
              {!typingDone && (
                <span className="cr-skip-hint">Tap to show full question</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Input area — speech bubble style */}
      {phase === "answering" && currentQuestion && (
        <div className="cr-input-area">
          <div className="cr-bubble-row">
            <div
              className={`cr-answer-bubble ${isRecording ? "cr-bubble-glow" : ""}`}
              style={{
                borderColor: isRecording ? `${character.color}60` : `${character.color}30`,
                ["--glow-color" as string]: character.color,
              }}
            >
              {isRecording && (
                <div className="cr-mic-dot" style={{ background: character.color }} />
              )}

              {answerWords.length === 0 ? (
                <div className="cr-bubble-placeholder">
                  {isRecording ? (
                    <>
                      <span className="cr-listening-text">Listening</span>
                      <span className="cr-dot-wave">
                        <span className="cr-dot" />
                        <span className="cr-dot" />
                        <span className="cr-dot" />
                      </span>
                    </>
                  ) : (
                    <span className="cr-tap-hint"><Pencil size={12} /> Tap to type your answer...</span>
                  )}
                </div>
              ) : (
                <div className="cr-bubble-words">
                  {answerWords.map((word, i) => (
                    <span
                      key={`${currentIndex}-${i}`}
                      className={`cr-bubble-word ${i >= newWordStart ? "cr-word-new" : ""}`}
                      style={i >= newWordStart ? { animationDelay: `${(i - newWordStart) * 0.06}s` } : undefined}
                    >
                      {word}{" "}
                    </span>
                  ))}
                </div>
              )}

              <div
                ref={bubbleRef}
                className="cr-bubble-edit"
                contentEditable={!isSubmitting}
                suppressContentEditableWarning
                onFocus={() => { isUserEditingRef.current = true; }}
                onBlur={() => { isUserEditingRef.current = false; }}
                onInput={(e) => {
                  const text = (e.target as HTMLDivElement).textContent || "";
                  setAnswerText(text);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitAnswer();
                  }
                }}
              />

              <div className="cr-bubble-tail" style={{ borderTopColor: isRecording ? `${character.color}12` : "#fff" }} />
            </div>

            <button
              onClick={handleSubmitAnswer}
              disabled={isSubmitting || !answerText.trim()}
              className="cr-submit-btn"
              style={{
                background: `linear-gradient(135deg, ${character.color}, ${character.accent})`,
                opacity: isSubmitting || !answerText.trim() ? 0.4 : 1,
                boxShadow: answerText.trim() ? `0 4px 12px ${character.color}40` : "none",
              }}
            >
              {isSubmitting ? (
                <Loader2 size={18} className="cr-spinner" />
              ) : isLastQuestion ? (
                <><CheckCircle size={16} /> <span className="cr-btn-label">Done!</span></>
              ) : (
                <><span className="cr-btn-label">Send</span> {"\u{1F680}"}</>
              )}
            </button>
          </div>

          {voiceError && <div className="cr-voice-error">{voiceError}</div>}

          <div className="cr-hint">
            {isLastQuestion ? "Last question! \u{2728}" : `${totalQuestions - answered.length - 1} more to go`}
          </div>
        </div>
      )}

      <style>{cssStyles}</style>
    </div>
  );
}

const cssStyles = `
  /* ─── Animations ─── */
  @keyframes crSpin { to { transform: rotate(360deg); } }
  @keyframes crFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
  @keyframes crTalk { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.04); } }
  @keyframes crPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
  @keyframes crWordIn { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes crPop { 0% { transform: scale(0.3); opacity: 0; } 50% { transform: scale(1.08); } 100% { transform: scale(1); opacity: 1; } }
  @keyframes crWiggle { 0%, 100% { transform: rotate(0); } 25% { transform: rotate(-6deg); } 75% { transform: rotate(6deg); } }
  @keyframes crRecordPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
  @keyframes crDotBlink { 0% { opacity: 0; } 50% { opacity: 1; } 100% { opacity: 0; } }

  .cr-floating { animation: crFloat 3s ease-in-out infinite; }
  .cr-talking { animation: crTalk 0.5s ease-in-out infinite; }
  .cr-spinner { animation: crSpin 1s linear infinite; }

  .cr-word {
    display: inline; opacity: 0;
    animation: crWordIn 0.3s ease forwards;
  }

  /* ─── Layout ─── */
  .cr-center {
    min-height: 100vh; min-height: 100dvh;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 10px;
  }
  .cr-root {
    height: 100vh; height: 100dvh;
    display: flex; flex-direction: column;
    transition: background 500ms;
  }

  /* ─── Loading ─── */
  .cr-loading-avatar { width: 72px; height: 72px; border-radius: 50%; animation: crFloat 2s ease-in-out infinite; margin-bottom: 16px; }
  .cr-loading-text { color: #ffffffcc; font-size: 15px; font-family: 'Nunito', sans-serif; font-weight: 600; }

  /* ─── Intro ─── */
  .cr-intro-card {
    animation: crPop 0.5s ease-out;
    display: flex; flex-direction: column; align-items: center; gap: 16px;
    max-width: 460px; width: 100%;
  }
  .cr-intro-avatar-ring {
    width: 110px; height: 110px; border-radius: 50%; border: 3px solid;
    display: flex; align-items: center; justify-content: center;
    background: #ffffffcc; transition: box-shadow 0.4s;
  }
  .cr-intro-avatar-img { width: 96px; height: 96px; border-radius: 50%; object-fit: cover; }
  .cr-intro-name {
    font-size: 24px; font-family: 'Nunito', sans-serif; font-weight: 900;
    color: #fff; text-shadow: 0 2px 8px rgba(0,0,0,0.2); margin: 0;
  }
  .cr-intro-bubble {
    background: #ffffffee; border-radius: 20px; padding: 16px 22px;
    border: 2px solid; box-shadow: 0 6px 24px rgba(0,0,0,0.08);
    text-align: center; width: 100%;
  }
  .cr-intro-text {
    font-size: 16px; color: #26221D; line-height: 1.7;
    font-family: 'Nunito', sans-serif; font-weight: 500; min-height: 28px;
  }
  .cr-start-btn {
    display: flex; align-items: center; gap: 8px;
    padding: 14px 28px; border-radius: 24px; border: none;
    color: #fff; font-size: 16px; font-weight: 800; cursor: pointer;
    font-family: 'Nunito', sans-serif; animation: crPop 0.4s ease-out;
    transition: transform 150ms;
  }
  .cr-start-btn:hover { transform: scale(1.04); }
  .cr-intro-sub { font-size: 12px; color: #ffffffaa; font-weight: 500; font-family: 'Nunito', sans-serif; }

  /* ─── Celebration ─── */
  .cr-celeb-card { animation: crPop 0.6s ease-out; text-align: center; }
  .cr-celeb-badge {
    width: 96px; height: 96px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 16px;
  }
  .cr-celeb-title { font-size: 26px; font-family: 'Nunito', sans-serif; font-weight: 900; color: #fff; text-shadow: 0 2px 10px rgba(0,0,0,0.3); margin-bottom: 6px; }
  .cr-celeb-sub { font-size: 16px; color: #ffffffcc; font-weight: 500; margin-bottom: 6px; }
  .cr-celeb-avatar { width: 64px; height: 64px; border-radius: 50%; border: 3px solid #fff; margin-top: 12px; animation: crFloat 2s ease-in-out infinite; }
  .cr-celeb-hint { font-size: 13px; color: #ffffff99; margin-top: 12px; }

  /* ─── Streak celebration ─── */
  @keyframes crStreakIn { from { opacity: 0; transform: scale(0.5) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  @keyframes crStreakPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
  @keyframes crStreakShake { 0%, 100% { transform: rotate(0deg); } 20% { transform: rotate(-8deg); } 40% { transform: rotate(8deg); } 60% { transform: rotate(-5deg); } 80% { transform: rotate(5deg); } }
  @keyframes crFlameFlicker { 0%, 100% { text-shadow: 0 0 10px #ff440040, 0 0 20px #ff660020; } 50% { text-shadow: 0 0 20px #ff440080, 0 0 40px #ff660040, 0 0 60px #ff880020; } }

  .cr-streak-overlay {
    margin-top: 16px; padding: 20px 24px; border-radius: 20px; text-align: center;
    animation: crStreakIn 0.5s ease-out;
    background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
    border: 2px solid #FFD54F;
    box-shadow: 0 8px 32px rgba(255, 152, 0, 0.25);
  }
  .cr-streak-fire {
    background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 50%, #ffcc80 100%);
    border-color: #FF9800;
    box-shadow: 0 8px 32px rgba(255, 87, 34, 0.3);
  }
  .cr-streak-unstoppable {
    background: linear-gradient(135deg, #fff8e1 0%, #ffe082 30%, #ffab40 70%, #ff6d00 100%);
    border-color: #FF6D00;
    box-shadow: 0 8px 40px rgba(255, 109, 0, 0.4), 0 0 60px rgba(255, 152, 0, 0.15);
    animation: crStreakIn 0.5s ease-out, crStreakPulse 1.5s ease-in-out infinite 0.5s;
  }

  .cr-streak-emoji {
    font-size: 40px; line-height: 1; margin-bottom: 6px;
    animation: crFlameFlicker 1s ease-in-out infinite;
  }
  .cr-streak-unstoppable .cr-streak-emoji { font-size: 52px; animation: crStreakShake 0.6s ease-in-out infinite; }

  .cr-streak-count {
    font-size: 22px; font-weight: 900; font-family: 'Nunito', sans-serif;
    margin-bottom: 2px;
  }
  .cr-streak-unstoppable .cr-streak-count { font-size: 28px; }

  .cr-streak-label {
    font-size: 16px; font-weight: 800; color: #E65100;
    font-family: 'Nunito', sans-serif; text-transform: uppercase;
    letter-spacing: 1px; margin-bottom: 8px;
  }
  .cr-streak-fire .cr-streak-label { font-size: 18px; color: #D84315; }
  .cr-streak-unstoppable .cr-streak-label { font-size: 22px; color: #BF360C; letter-spacing: 2px; }

  .cr-streak-avatar {
    width: 56px; height: 56px; border-radius: 50%; border: 3px solid;
    object-fit: cover; animation: crStreakShake 1s ease-in-out infinite;
  }
  .cr-streak-unstoppable .cr-streak-avatar { width: 72px; height: 72px; border-width: 4px; }

  /* ─── Header ─── */
  .cr-header {
    padding: 8px 14px; background: #ffffffcc; backdrop-filter: blur(10px);
    display: flex; align-items: center; gap: 10px;
    border-bottom: 1px solid #ffffff40; flex-shrink: 0;
  }
  .cr-header-avatar { width: 32px; height: 32px; border-radius: 10px; object-fit: cover; }
  .cr-header-info { flex: 1; min-width: 0; }
  .cr-header-name { font-size: 14px; font-weight: 800; color: #26221D; font-family: 'Nunito', sans-serif; }
  .cr-header-sub { font-size: 11px; color: #7A7168; }
  .cr-header-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
  .cr-header-count { font-size: 13px; font-weight: 800; font-family: 'Nunito', sans-serif; }

  .cr-streak-badge {
    display: flex; align-items: center; gap: 4px;
    padding: 3px 10px; border-radius: 12px;
    font-size: 13px; font-weight: 800; font-family: 'Nunito', sans-serif;
    animation: crStreakPulse 1.5s ease-in-out infinite;
  }

  /* ─── Progress strip ─── */
  .cr-progress-strip {
    display: flex; align-items: center; gap: 10px;
    padding: 6px 14px;
    background: rgba(255,255,255,0.15);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid rgba(255,255,255,0.15);
    flex-shrink: 0;
  }
  .cr-progress-bar {
    flex: 1; height: 5px; border-radius: 3px; overflow: hidden;
  }
  .cr-progress-fill {
    height: 100%; border-radius: 3px;
    transition: width 600ms ease;
  }
  .cr-progress-label {
    font-size: 11px; font-weight: 800; font-family: 'Nunito', sans-serif;
    white-space: nowrap; flex-shrink: 0;
  }

  /* ─── Main ─── */
  .cr-main {
    flex: 1; overflow-y: auto; display: flex; align-items: center; justify-content: center;
    padding: 12px 14px; position: relative;
  }

  /* ─── Question background illustration ─── */
  @keyframes crBgFadeIn { from { opacity: 0; transform: scale(1.08); } to { opacity: 0.18; transform: scale(1); } }
  @keyframes crBgDrift { 0%, 100% { transform: scale(1.02) translate(0, 0); } 25% { transform: scale(1.04) translate(6px, -4px); } 50% { transform: scale(1.02) translate(-4px, 6px); } 75% { transform: scale(1.04) translate(4px, 4px); } }

  .cr-q-bg {
    position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .cr-q-bg-img {
    width: 85%; max-width: 380px; height: auto; border-radius: 24px;
    opacity: 0.18; object-fit: contain; filter: blur(1px) saturate(1.3);
    animation: crBgFadeIn 0.8s ease-out forwards, crBgDrift 20s ease-in-out infinite;
  }

  /* ─── Feedback / Filler area ─── */
  .cr-feedback-area {
    display: flex; flex-direction: column; align-items: center;
    gap: 14px; width: 100%; max-width: 580px; animation: crPop 0.4s ease-out;
    position: relative; z-index: 1;
  }
  .cr-feedback-bubble {
    border-radius: 20px; padding: 16px 20px; width: 100%;
    border: 2px solid; box-shadow: 0 4px 16px rgba(0,0,0,0.06);
    text-align: center; backdrop-filter: blur(8px);
    background: #ffffffdd;
  }
  .cr-fb-badge {
    display: inline-block; padding: 3px 12px; border-radius: 10px;
    font-size: 11px; font-weight: 800; margin-bottom: 10px;
  }
  .cr-feedback-text {
    font-size: 15px; color: #26221D; line-height: 1.7;
    font-family: 'Nunito', sans-serif; font-weight: 500;
  }
  .cr-thinking-dots {
    display: flex; align-items: center; justify-content: center; gap: 4px;
    margin-top: 10px; font-size: 13px; font-weight: 700;
  }
  .cr-dot-anim { animation: crPulse 1.2s ease-in-out infinite; }

  /* ─── Question area ─── */
  .cr-question-area {
    display: flex; flex-direction: column; align-items: center;
    gap: 14px; width: 100%; max-width: 580px; animation: crPop 0.5s ease-out;
    position: relative; z-index: 1;
  }
  .cr-avatar-section { display: flex; flex-direction: column; align-items: center; }
  .cr-avatar-ring {
    width: 80px; height: 80px; border-radius: 50%; border: 3px solid;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.4s; background: #ffffffcc;
  }
  .cr-avatar-img { width: 68px; height: 68px; border-radius: 50%; object-fit: cover; }

  /* ─── Pose crossfade ─── */
  .cr-pose-container { position: relative; width: 68px; height: 68px; }
  .cr-pose-layer { position: absolute; inset: 0; transition: opacity 300ms ease-in-out; }
  .cr-pose-visible { opacity: 1; }
  .cr-pose-in { opacity: 0; animation: crPoseFadeIn 300ms ease-in-out forwards; }
  .cr-pose-out { animation: crPoseFadeOut 300ms ease-in-out forwards; }
  @keyframes crPoseFadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  @keyframes crPoseFadeOut { from { opacity: 1; } to { opacity: 0; } }

  .cr-speaking-label {
    display: flex; align-items: center; gap: 5px; margin-top: 6px;
    font-size: 11px; font-weight: 600; animation: crPulse 1.5s ease-in-out infinite;
  }

  .cr-q-bubble {
    border-radius: 20px; padding: 16px 20px; width: 100%;
    border: 2px solid; box-shadow: 0 4px 16px rgba(0,0,0,0.06);
    text-align: center; cursor: pointer; backdrop-filter: blur(8px);
    background: #ffffffdd;
  }
  .cr-q-badge {
    display: inline-block; padding: 3px 12px; border-radius: 10px;
    font-size: 11px; font-weight: 800; margin-bottom: 10px;
  }
  .cr-q-text {
    font-size: 15px; color: #26221D; line-height: 1.7;
    font-family: 'Nunito', sans-serif; font-weight: 500;
  }
  .cr-replay-btn {
    display: inline-flex; align-items: center; gap: 5px; margin-top: 10px;
    padding: 5px 14px; border-radius: 8px; border: none; background: transparent;
    cursor: pointer; font-size: 12px; font-weight: 700;
  }
  .cr-skip-hint { font-size: 10px; color: #A89E94; margin-top: 6px; display: block; }

  /* ─── Input area ─── */
  .cr-input-area {
    border-top: 1px solid #ffffff40; padding: 10px 12px;
    background: #ffffffcc; backdrop-filter: blur(10px); flex-shrink: 0;
  }
  .cr-bubble-row { display: flex; gap: 8px; align-items: flex-end; justify-content: flex-end; }

  /* ─── Speech bubble ─── */
  @keyframes crBubbleGlow { 0%, 100% { box-shadow: 0 2px 12px var(--glow-color, #7c3aed)30; } 50% { box-shadow: 0 2px 24px var(--glow-color, #7c3aed)50, 0 0 8px var(--glow-color, #7c3aed)20; } }
  @keyframes crWordPop { from { opacity: 0; transform: scale(0.7) translateY(4px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  @keyframes crDotBounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }

  .cr-answer-bubble {
    position: relative; flex: 1; min-height: 48px; max-height: 140px;
    padding: 12px 16px; border-radius: 20px 20px 4px 20px;
    border: 2px solid; background: #fff;
    font-family: 'Nunito', sans-serif; font-size: 14px; color: #26221D; line-height: 1.5;
    transition: border-color 300ms, box-shadow 300ms;
    overflow-y: auto;
  }
  .cr-bubble-glow {
    animation: crBubbleGlow 2s ease-in-out infinite;
  }
  .cr-mic-dot {
    position: absolute; top: 8px; right: 8px; width: 8px; height: 8px;
    border-radius: 50%; animation: crRecordPulse 1s ease-in-out infinite;
  }

  .cr-bubble-placeholder {
    display: flex; align-items: center; gap: 6px;
    color: #A89E94; font-weight: 600; font-size: 13px;
    min-height: 24px; user-select: none;
  }
  .cr-listening-text { font-weight: 700; }
  .cr-dot-wave { display: flex; gap: 3px; align-items: center; }
  .cr-dot {
    width: 6px; height: 6px; border-radius: 50%; background: #A89E94;
    animation: crDotBounce 1.2s ease-in-out infinite;
  }
  .cr-dot:nth-child(2) { animation-delay: 0.15s; }
  .cr-dot:nth-child(3) { animation-delay: 0.3s; }
  .cr-tap-hint { display: flex; align-items: center; gap: 5px; }

  .cr-bubble-words {
    position: relative; z-index: 1; pointer-events: none;
  }
  .cr-bubble-word {
    display: inline; font-weight: 500;
  }
  .cr-word-new {
    animation: crWordPop 0.2s ease-out both;
  }

  .cr-bubble-edit {
    position: absolute; inset: 0; padding: 12px 16px;
    font-family: 'Nunito', sans-serif; font-size: 14px; color: transparent;
    caret-color: #26221D; line-height: 1.5; outline: none;
    border-radius: inherit; overflow-y: auto; word-wrap: break-word;
    z-index: 2;
  }
  .cr-bubble-edit:focus { color: #26221D; }
  .cr-bubble-edit:focus ~ .cr-bubble-words { opacity: 0; }

  .cr-bubble-tail {
    position: absolute; bottom: -8px; right: 16px;
    width: 0; height: 0;
    border-left: 8px solid transparent; border-right: 8px solid transparent;
    border-top: 8px solid #fff;
  }

  .cr-submit-btn {
    height: 44px; padding: 0 16px; border-radius: 22px; border: none; color: #fff;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    gap: 5px; font-size: 14px; font-weight: 800; transition: all 200ms;
    font-family: 'Nunito', sans-serif; flex-shrink: 0; white-space: nowrap;
  }
  .cr-btn-label { display: inline; }

  .cr-voice-error { margin-top: 4px; font-size: 11px; color: #E53E3E; font-weight: 500; text-align: center; }
  .cr-hint { margin-top: 6px; font-size: 12px; color: #7A7168; text-align: center; font-weight: 600; font-family: 'Nunito', sans-serif; }

  /* ─── Retry prompt ─── */
  .cr-retry-actions {
    display: flex; gap: 10px; justify-content: center; margin-top: 16px;
  }
  .cr-retry-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 10px 22px; border-radius: 20px; border: none;
    color: #fff; font-size: 14px; font-weight: 800; cursor: pointer;
    font-family: 'Nunito', sans-serif; transition: transform 150ms;
  }
  .cr-retry-btn:hover { transform: scale(1.04); }
  .cr-pass-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 10px 22px; border-radius: 20px;
    border: 2px solid #E8E0D8; background: #ffffffdd;
    color: #7A7168; font-size: 14px; font-weight: 700; cursor: pointer;
    font-family: 'Nunito', sans-serif; transition: all 150ms;
  }
  .cr-pass-btn:hover { background: #f5f0eb; border-color: #D4C9BD; }

  .cr-continue-btn {
    display: flex; align-items: center; gap: 8px; justify-content: center;
    margin-top: 16px; padding: 12px 28px; border-radius: 20px; border: none;
    color: #fff; font-size: 15px; font-weight: 800; cursor: pointer;
    font-family: 'Nunito', sans-serif; transition: transform 150ms;
    animation: crPop 0.4s ease-out;
  }
  .cr-continue-btn:hover { transform: scale(1.04); }

  /* ─── Desktop (>=640px) ─── */
  @media (min-width: 640px) {
    .cr-loading-avatar { width: 100px; height: 100px; }
    .cr-intro-avatar-ring { width: 150px; height: 150px; border-width: 4px; }
    .cr-intro-avatar-img { width: 132px; height: 132px; }
    .cr-intro-name { font-size: 28px; }
    .cr-intro-text { font-size: 18px; }
    .cr-intro-bubble { padding: 20px 28px; border-radius: 24px; }
    .cr-start-btn { padding: 16px 36px; font-size: 18px; border-radius: 28px; }
    .cr-intro-card { gap: 20px; }
    .cr-celeb-badge { width: 120px; height: 120px; }
    .cr-celeb-title { font-size: 32px; }
    .cr-celeb-avatar { width: 80px; height: 80px; }
    .cr-header { padding: 10px 20px; gap: 12px; }
    .cr-header-avatar { width: 40px; height: 40px; border-radius: 12px; }
    .cr-header-name { font-size: 16px; }
    .cr-header-count { font-size: 14px; }
    .cr-main { padding: 20px 24px; }
    .cr-q-bg-img { max-width: 480px; opacity: 0.2; filter: blur(0.5px) saturate(1.3); }
    .cr-feedback-area { max-width: 640px; gap: 20px; }
    .cr-feedback-bubble { padding: 22px 28px; border-radius: 24px; }
    .cr-feedback-text { font-size: 18px; line-height: 1.8; }
    .cr-question-area { gap: 20px; max-width: 640px; }
    .cr-avatar-ring { width: 140px; height: 140px; border-width: 4px; }
    .cr-avatar-img { width: 122px; height: 122px; }
    .cr-pose-container { width: 122px; height: 122px; }
    .cr-q-bubble { padding: 22px 28px; border-radius: 24px; }
    .cr-q-badge { font-size: 12px; padding: 4px 14px; }
    .cr-q-text { font-size: 18px; line-height: 1.8; }
    .cr-input-area { padding: 14px 20px; }
    .cr-bubble-row { gap: 10px; }
    .cr-answer-bubble { padding: 14px 20px; border-radius: 24px 24px 4px 24px; font-size: 16px; max-height: 180px; }
    .cr-bubble-edit { padding: 14px 20px; font-size: 16px; }
    .cr-bubble-placeholder { font-size: 14px; }
    .cr-submit-btn { height: 56px; padding: 0 24px; border-radius: 28px; font-size: 16px; }
    .cr-hint { font-size: 13px; margin-top: 8px; }
    .cr-retry-btn { padding: 12px 28px; font-size: 15px; border-radius: 24px; }
    .cr-pass-btn { padding: 12px 28px; font-size: 15px; border-radius: 24px; }
    .cr-streak-overlay { padding: 28px 32px; margin-top: 20px; border-radius: 24px; }
    .cr-streak-emoji { font-size: 52px; }
    .cr-streak-unstoppable .cr-streak-emoji { font-size: 64px; }
    .cr-streak-count { font-size: 26px; }
    .cr-streak-unstoppable .cr-streak-count { font-size: 34px; }
    .cr-streak-label { font-size: 18px; }
    .cr-streak-unstoppable .cr-streak-label { font-size: 26px; }
    .cr-streak-avatar { width: 72px; height: 72px; }
    .cr-streak-unstoppable .cr-streak-avatar { width: 88px; height: 88px; }
    .cr-streak-badge { font-size: 14px; padding: 4px 12px; }
  }
`;
