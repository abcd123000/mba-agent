"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";

const STARTER_PROMPTS = [
  "I want to start a healthtech consultancy in India. Where do I begin?",
  "Help me understand the competitive landscape for telemedicine in India",
  "How do I size the market for a B2B health SaaS targeting hospitals?",
  "I'm stuck on the GTM strategy for my healthtech startup",
];

const FRAMEWORKS = [
  { name: "Porter's 5 Forces", definition: "Assess industry attractiveness via rivalry, new entrants, suppliers, buyers, and substitutes." },
  { name: "SWOT", definition: "Map Strengths, Weaknesses, Opportunities, and Threats to guide strategic choices." },
  { name: "PESTLE", definition: "Scan Political, Economic, Social, Technological, Legal, and Environmental factors shaping a market." },
  { name: "TAM/SAM/SOM", definition: "Size a market from Total Addressable down to Serviceable Obtainable to gauge realistic opportunity." },
  { name: "BCG Matrix", definition: "Classify products as Stars, Cash Cows, Question Marks, or Dogs by growth and market share." },
];

const REMEMBERED_KEY = "mba-remembered-frameworks";

function getMessageText(message: { role: string; content: unknown; parts?: Array<{ type: string; text?: string }> }): string {
  if (message.parts && Array.isArray(message.parts)) {
    return message.parts
      .filter((p) => p.type === "text")
      .map((p) => p.text ?? "")
      .join("");
  }
  if (typeof message.content === "string") return message.content;
  return "";
}

function renderLine(line: string, i: number) {
  if (line.startsWith("## ")) {
    return <h2 key={i} style={{ fontWeight: 700, color: "#065f46", marginTop: 12, marginBottom: 4, fontSize: 15 }}>{line.replace("## ", "")}</h2>;
  }
  if (line.startsWith("# ")) {
    return <h1 key={i} style={{ fontWeight: 700, color: "#047857", marginTop: 8, marginBottom: 4, fontSize: 16 }}>{line.replace("# ", "")}</h1>;
  }
  if (line.startsWith("- ") || line.startsWith("* ")) {
    const content = line.replace(/^[-*] /, "").replace(/\*\*(.*?)\*\*/g, "$1");
    return <p key={i} style={{ paddingLeft: 16, color: "#374151", marginBottom: 2 }}>• {content}</p>;
  }
  if (line.trim() === "---") return <hr key={i} style={{ borderColor: "#e5e7eb", margin: "8px 0" }} />;
  if (line.trim() === "") return <div key={i} style={{ height: 6 }} />;

  const parts = line.split(/\*\*(.*?)\*\*/g);
  return (
    <p key={i} style={{ color: "#374151", lineHeight: 1.6, marginBottom: 2 }}>
      {parts.map((part, j) =>
        j % 2 === 1 ? <strong key={j} style={{ fontWeight: 600, color: "#111827" }}>{part}</strong> : part
      )}
    </p>
  );
}

export default function Home() {
  const { messages, sendMessage, status } = useChat();
  const isLoading = status === "streaming" || status === "submitted";
  const [input, setInput] = useState("");
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const [remembered, setRemembered] = useState<Record<string, boolean>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const stored = localStorage.getItem(REMEMBERED_KEY);
    if (stored) setRemembered(JSON.parse(stored));
  }, []);

  const toggleFlip = (name: string) => setFlipped((prev) => ({ ...prev, [name]: !prev[name] }));

  const toggleRemember = (name: string) => {
    setRemembered((prev) => {
      const next = { ...prev, [name]: !prev[name] };
      localStorage.setItem(REMEMBERED_KEY, JSON.stringify(next));
      return next;
    });
  };

  const submit = () => {
    if (input.trim()) {
      sendMessage({ text: input });
      setInput("");
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb", display: "flex", flexDirection: "column", fontFamily: "Arial, sans-serif" }}>
      {/* Header */}
      <header style={{ backgroundColor: "#fff", borderBottom: "1px solid #e5e7eb", padding: "12px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, backgroundColor: "#059669", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 12 }}>
          MBA
        </div>
        <div>
          <div style={{ fontWeight: 600, color: "#111827", fontSize: 15 }}>Healthcare Strategy Assistant</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Your MBA thinking partner for healthtech & healthcare</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 8, height: 8, backgroundColor: "#10b981", borderRadius: "50%", display: "inline-block" }}></span>
          <span style={{ fontSize: 12, color: "#6b7280" }}>Active</span>
        </div>
      </header>

      {/* Chat Area */}
      <main style={{ flex: 1, overflowY: "auto", padding: "24px 16px", maxWidth: 768, margin: "0 auto", width: "100%" }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", marginTop: 24, marginBottom: 40 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Where are you stuck?</h2>
            <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 32 }}>
              I&apos;ll use MBA frameworks to help you think through it — not just hand you answers.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  style={{
                    textAlign: "left", padding: 16, backgroundColor: "#fff",
                    border: "1px solid #e5e7eb", borderRadius: 12,
                    fontSize: 14, color: "#374151", cursor: "pointer",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {messages.map((msg) => {
            const fullText = getMessageText(msg as unknown as Parameters<typeof getMessageText>[0]);

            // Extract FRAMEWORKS_USED line
            const frameworkMatch = fullText.match(/^FRAMEWORKS_USED:\s*\[(.+?)\]/m);
            const frameworks = frameworkMatch ? frameworkMatch[1].split(",").map(f => f.trim()) : [];
            const text = fullText.replace(/^FRAMEWORKS_USED:.*\n?/m, "").trimStart();

            return (
              <div key={msg.id} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                {msg.role === "assistant" && (
                  <div style={{ width: 28, height: 28, backgroundColor: "#059669", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700, marginRight: 10, marginTop: 4, flexShrink: 0 }}>
                    M
                  </div>
                )}
                <div style={{ maxWidth: "85%", display: "flex", flexDirection: "column", gap: 8 }}>
                  {/* Framework badges */}
                  {msg.role === "assistant" && frameworks.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {frameworks.map((f) => (
                        <span key={f} style={{
                          backgroundColor: "#ecfdf5", color: "#065f46",
                          border: "1px solid #6ee7b7", borderRadius: 20,
                          padding: "2px 10px", fontSize: 11, fontWeight: 600,
                        }}>
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                  <div style={{
                    borderRadius: 16, padding: "10px 16px",
                    backgroundColor: msg.role === "user" ? "#059669" : "#fff",
                    color: msg.role === "user" ? "#fff" : "#111827",
                    border: msg.role === "user" ? "none" : "1px solid #e5e7eb",
                    boxShadow: msg.role === "assistant" ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                    fontSize: 14,
                  }}>
                    {msg.role === "assistant"
                      ? text.split("\n").map((line, i) => renderLine(line, i))
                      : <p>{text}</p>
                    }
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div style={{ width: 28, height: 28, backgroundColor: "#059669", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700, marginRight: 10, flexShrink: 0 }}>
                M
              </div>
              <div style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: "10px 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <span style={{ color: "#6b7280", fontSize: 14 }}>Thinking...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </main>

      {/* Input */}
      <div style={{ backgroundColor: "#fff", borderTop: "1px solid #e5e7eb", padding: "16px" }}>
        <div style={{ maxWidth: 768, margin: "0 auto", display: "flex", gap: 12, alignItems: "flex-end" }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
            placeholder="Describe where you're stuck… (Shift+Enter for new line)"
            rows={2}
            style={{
              flex: 1, resize: "none", border: "1px solid #d1d5db", borderRadius: 12,
              padding: "10px 14px", fontSize: 14, outline: "none", fontFamily: "inherit",
            }}
          />
          <button
            onClick={submit}
            disabled={isLoading || !input.trim()}
            style={{
              backgroundColor: isLoading || !input.trim() ? "#d1d5db" : "#059669",
              color: "#fff", padding: "10px 20px", borderRadius: 12,
              border: "none", fontSize: 14, fontWeight: 500, cursor: isLoading || !input.trim() ? "default" : "pointer",
              flexShrink: 0,
            }}
          >
            Send
          </button>
        </div>
        <div style={{ maxWidth: 768, margin: "12px auto 0", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
          {FRAMEWORKS.map(({ name, definition }) => {
            const isFlipped = !!flipped[name];
            const isRemembered = !!remembered[name];
            return (
              <div key={name} style={{ perspective: 600, width: 130, height: 60 }}>
                <div
                  onClick={() => toggleFlip(name)}
                  style={{
                    position: "relative", width: "100%", height: "100%", cursor: "pointer",
                    transformStyle: "preserve-3d", transition: "transform 0.5s",
                    transform: isFlipped ? "rotateY(180deg)" : "none",
                  }}
                >
                  <div style={{
                    position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
                    backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: 10,
                    display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center",
                    padding: 6, fontSize: 11, fontWeight: 600, color: "#374151",
                  }}>
                    {isRemembered && <span style={{ position: "absolute", top: 2, right: 4, color: "#f59e0b" }}>★</span>}
                    {name}
                  </div>
                  <div style={{
                    position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
                    transform: "rotateY(180deg)", backgroundColor: "#ecfdf5", border: "1px solid #6ee7b7", borderRadius: 10,
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center",
                    padding: 6, gap: 4,
                  }}>
                    <span style={{ fontSize: 9.5, color: "#065f46", lineHeight: 1.3 }}>{definition}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleRemember(name); }}
                      style={{
                        border: "none", background: "none", cursor: "pointer", fontSize: 11,
                        color: isRemembered ? "#f59e0b" : "#9ca3af", padding: 0,
                      }}
                    >
                      {isRemembered ? "★ Remembered" : "☆ Remember"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
