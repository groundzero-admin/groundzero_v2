import { useState } from "react";
import { Mail, Send } from "lucide-react";
import * as s from "./MessageBox.css";

export function MessageBox() {
  const [message, setMessage] = useState("");

  function handleSend() {
    if (!message.trim()) return;
    // TODO: POST to backend when endpoint exists
    setMessage("");
  }

  return (
    <div className={s.surface}>
      <div className={s.root}>
        <div className={s.header}>
          <Mail size={16} /> Share your thoughts
        </div>
        <div className={s.subtitle}>
        Stuck on something or have a great idea? Message your teacher directly.
        </div>
        <div className={s.inputRow}>
          <textarea
            className={s.input}
            placeholder="Type your message here..."
            value={message}
            rows={3}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button className={s.sendBtn} onClick={handleSend}>
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default MessageBox;
