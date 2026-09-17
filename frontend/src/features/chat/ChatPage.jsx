import { useEffect, useState } from "react";
import { chatWithAgent, getMessages } from "./api.js";

const sampleMessages = [
  {
    role: "assistant",
    content: "Hello! I can help you with emergency guidance. Ask me anything about the incident or upload an image for analysis.",
  },
];

const ChatPage = () => {
  const [messages, setMessages] = useState(sampleMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const result = await getMessages({
          incidentId: "temp-incident",
          userId: "temp-user",
        });

        const fetched = result?.data || [];
        if (fetched.length > 0) {
          setMessages(fetched.map((msg) => ({ role: msg.role, content: msg.content })));
        }
      } catch (error) {
        console.error("Failed to fetch chat history:", error);
      }
    };

    loadMessages();
  }, []);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const newUserMessage = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, newUserMessage]);
    setInput("");
    setLoading(true);

    try {
      const result = await chatWithAgent({
        prompt: trimmed,
        incidentId: "temp-incident",
        userId: "temp-user",
      });

      const assistantReply =
        result?.data?.reply ||
        result?.data?.finalResponse ||
        "I’m here to help. Please provide more details.";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            typeof assistantReply === "string"
              ? assistantReply
              : JSON.stringify(assistantReply, null, 2),
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error?.response?.data?.message ||
            "Something went wrong while contacting the agent service.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 20 }}>
      <div
        style={{
          border: "1px solid #dfe7f5",
          borderRadius: 16,
          background: "#ffffff",
          boxShadow: "0 15px 30px rgba(15, 23, 42, 0.08)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "18px 20px",
            borderBottom: "1px solid #edf2f7",
            background: "linear-gradient(135deg, #0f172a, #1d4ed8)",
            color: "white",
            fontWeight: 700,
          }}
        >
          ResQ AI Chat
        </div>

        <div
          style={{
            height: 420,
            overflowY: "auto",
            padding: 20,
            background: "#f8fafc",
          }}
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  maxWidth: "75%",
                  padding: "12px 14px",
                  borderRadius: 14,
                  background: msg.role === "user" ? "#2563eb" : "#e2e8f0",
                  color: msg.role === "user" ? "white" : "#0f172a",
                  whiteSpace: "pre-wrap",
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ color: "#475569", fontSize: 14 }}>Agent is thinking...</div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            padding: 16,
            borderTop: "1px solid #edf2f7",
            background: "white",
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
            placeholder="Type your message..."
            style={{
              flex: 1,
              border: "1px solid #cbd5e1",
              borderRadius: 10,
              padding: "12px 14px",
              fontSize: 14,
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            style={{
              border: "none",
              borderRadius: 10,
              padding: "12px 18px",
              background: loading ? "#93c5fd" : "#1d4ed8",
              color: "white",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
