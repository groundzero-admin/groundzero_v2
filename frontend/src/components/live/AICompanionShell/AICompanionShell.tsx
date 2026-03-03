import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, Send, X, CheckCircle, Sparkles } from "lucide-react";
import { useSparkStart, useSparkTurn, useSparkEnd } from "@/api/hooks/useSpark";
import type {
  SparkTrigger,
  SparkMessageOut,
  SparkConversationCreate,
} from "@/api/types";
import * as s from "./AICompanionShell.css";

interface Message {
  role: "spark" | "student";
  content: string;
}

export interface SparkTriggerData {
  studentId: string;
  questionId: string;
  trigger: SparkTrigger;
  competencyId?: string;
  selectedOption?: string;
  confidenceReport?: string;
}

interface AICompanionShellProps {
  triggerData?: SparkTriggerData | null;
  onEvidenceSubmitted?: () => void;
  onConversationEnd?: () => void;
}

export function AICompanionShell({
  triggerData,
  onEvidenceSubmitted,
  onConversationEnd,
}: AICompanionShellProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [hasBeenTriggered, setHasBeenTriggered] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastTriggerRef = useRef<string | null>(null);

  const { mutateAsync: startConversation, isPending: starting } = useSparkStart();
  const { mutateAsync: sendTurn, isPending: sending } = useSparkTurn(conversationId);
  const { mutateAsync: endConversation } = useSparkEnd(conversationId);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, starting, sending]);

  // Focus input when popup opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Auto-start conversation when trigger data arrives
  useEffect(() => {
    if (!triggerData) return;

    const triggerKey = `${triggerData.questionId}-${triggerData.trigger}`;
    if (lastTriggerRef.current === triggerKey) return;
    lastTriggerRef.current = triggerKey;

    const start = async () => {
      setMessages([]);
      setConversationId(null);
      setIsComplete(false);
      setHasBeenTriggered(true);
      setOpen(true);

      const payload: SparkConversationCreate = {
        student_id: triggerData.studentId,
        question_id: triggerData.questionId,
        trigger: triggerData.trigger,
        competency_id: triggerData.competencyId,
        selected_option: triggerData.selectedOption,
        confidence_report: triggerData.confidenceReport,
      };

      try {
        const resp = await startConversation(payload);
        setConversationId(resp.conversation_id);
        setMessages([toMessage(resp.message)]);
      } catch {
        setMessages([
          { role: "spark", content: "Something went wrong starting our chat. Try again!" },
        ]);
      }
    };

    start();
  }, [triggerData, startConversation]);

  // Reset when trigger data clears (next question)
  useEffect(() => {
    if (!triggerData) {
      setOpen(false);
      setMessages([]);
      setConversationId(null);
      setIsComplete(false);
      setHasBeenTriggered(false);
      setInputValue("");
      lastTriggerRef.current = null;
    }
  }, [triggerData]);

  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || !conversationId || isComplete) return;

    setMessages((prev) => [...prev, { role: "student", content: text }]);
    setInputValue("");

    try {
      const resp = await sendTurn(text);
      setMessages((prev) => [...prev, toMessage(resp.message)]);

      if (resp.evidence_submitted) {
        onEvidenceSubmitted?.();
      }
      if (resp.is_complete) {
        setIsComplete(true);
        onConversationEnd?.();
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "spark", content: "Hmm, I had trouble responding. Try sending that again?" },
      ]);
    }
  }, [inputValue, conversationId, isComplete, sendTurn, onEvidenceSubmitted, onConversationEnd]);

  const handleClose = useCallback(() => {
    setOpen(false);
    if (conversationId && !isComplete) {
      setIsComplete(true);
      onConversationEnd?.();
      // Fire-and-forget: try to end conversation in background
      endConversation()
        .then((resp) => {
          if (resp.evidence_submitted) onEvidenceSubmitted?.();
        })
        .catch(() => {});
    }
  }, [conversationId, isComplete, endConversation, onEvidenceSubmitted, onConversationEnd]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  // ── Render paths ──

  // 1. Not triggered → nothing (no inline teaser needed since it's page-level now)
  if (!hasBeenTriggered && !triggerData) {
    return null;
  }

  // 2. Collapsed → FAB
  if (!open && hasBeenTriggered) {
    return (
      <button
        className={isComplete ? s.fabNoPulse : s.fab}
        onClick={() => setOpen(true)}
        aria-label="Open SPARK chat"
      >
        <Sparkles size={22} />
      </button>
    );
  }

  // 3. Expanded → popup
  return (
    <div className={s.popup}>
      {/* Header */}
      <div className={s.header}>
        <span className={s.sparkle}>
          <Bot size={14} />
        </span>
        <span className={s.headerTitle}>SPARK</span>
        <button className={s.closeButton} onClick={handleClose} aria-label="Close">
          <X size={14} />
        </button>
      </div>

      {/* Messages */}
      <div className={s.messagesArea}>
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`${s.messageRow} ${msg.role === "student" ? s.messageRowStudent : ""}`}
          >
            {msg.role === "spark" && (
              <span className={s.avatarSmall}>
                <Sparkles size={12} />
              </span>
            )}
            <div
              className={`${s.bubble} ${msg.role === "spark" ? s.bubbleSpark : s.bubbleStudent}`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {(starting || sending) && (
          <div className={s.messageRow}>
            <span className={s.avatarSmall}>
              <Sparkles size={12} />
            </span>
            <div className={s.typingDots}>
              <span className={s.dot} />
              <span className={s.dot} />
              <span className={s.dot} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input or complete banner */}
      {isComplete ? (
        <div className={s.completeBanner}>
          <CheckCircle size={14} />
          Chat complete — keep going!
        </div>
      ) : (
        <div className={s.inputArea}>
          <input
            ref={inputRef}
            className={s.input}
            placeholder="Type your thinking..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!conversationId || starting || sending}
          />
          <button
            className={s.sendButton}
            data-active={inputValue.trim().length > 0 && !sending}
            onClick={handleSend}
            disabled={!inputValue.trim() || sending || !conversationId}
          >
            <Send size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

function toMessage(msg: SparkMessageOut): Message {
  return {
    role: msg.role === "student" ? "student" : "spark",
    content: msg.content,
  };
}
