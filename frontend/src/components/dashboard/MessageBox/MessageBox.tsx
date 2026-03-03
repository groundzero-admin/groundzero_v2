import { useState } from "react";
import { Card } from "@/components/ui";
import { MessageSquare, Send } from "lucide-react";
import * as s from "./MessageBox.css";

export function MessageBox() {
  const [message, setMessage] = useState("");

  function handleSend() {
    if (!message.trim()) return;
    // TODO: POST to backend when endpoint exists
    setMessage("");
  }

  return (
    <Card elevation="flat">
      <div className={s.root}>
        <div className={s.header}>
          <MessageSquare size={16} /> Share your thoughts
        </div>
        <div className={s.subtitle}>
          Stuck on a concept? Have a cool idea? Send a message to your
          facilitator.
        </div>
        <div className={s.inputRow}>
          <input
            className={s.input}
            placeholder="Type your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button className={s.sendBtn} onClick={handleSend}>
            <Send size={16} />
          </button>
        </div>
      </div>
    </Card>
  );
}

export default MessageBox;
