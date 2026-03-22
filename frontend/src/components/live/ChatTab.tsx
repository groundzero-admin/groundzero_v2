import { useRef } from "react";

export function ChatTab({ messages, chatText, setChatText, sendMessage }: {
    messages: any[];
    chatText: string;
    setChatText: (v: string) => void;
    sendMessage: () => void;
}) {
    const chatEndRef = useRef<HTMLDivElement>(null);
    const visible = messages.filter((m: any) => { try { return !JSON.parse(m.message)?.type; } catch { return true; } });

    return (
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: "6px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
                {visible.map((m: any, i: number) => (
                    <div key={i} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "8px 10px", fontSize: 10 }}>
                        <div style={{ fontWeight: 900, fontSize: 9, color: "#64748b", marginBottom: 2 }}>{m.senderName}</div>
                        <div style={{ color: "#0f172a" }}>{m.message}</div>
                    </div>
                ))}
                {!visible.length && <div style={{ textAlign: "center", padding: 20, color: "#94a3b8", fontSize: 11 }}>No messages yet</div>}
                <div ref={chatEndRef} />
            </div>
            <div style={{ display: "flex", padding: 10, gap: 8, borderTop: "1px solid #e2e8f0", background: "#ffffff" }}>
                <input
                    style={{ flex: 1, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "10px 12px", color: "#0f172a", fontSize: 12, outline: "none" }}
                    value={chatText}
                    onChange={e => setChatText(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendMessage()}
                    placeholder="Message…"
                />
                <button onClick={sendMessage} style={{ background: "#6366f1", border: "none", borderRadius: 12, padding: "10px 12px", color: "#fff", fontWeight: 900, fontSize: 12, cursor: "pointer" }}>↑</button>
            </div>
        </div>
    );
}
