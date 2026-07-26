import React, { useState, useRef, useEffect } from "react";
import { chatQuery } from "../api/client";

function renderText(text) {
  if (typeof text !== "string") return "";

  return text.replace(
    /\*\*(.*?)\*\*/g,
    "<strong>$1</strong>"
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState([
    {
      role: "agent",
      text: `Hello! I'm your AML Investigation Assistant.
  
  You can ask me to:
  
  • Summarize the dataset
  • Show top risky accounts
  • Look up an account
  • Find money laundering accounts`
    }
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages]);

  async function send() {

    const text = input.trim();

    if (!text || loading) return;

    setInput("");

    setMessages(prev => [
      ...prev,
      {
        role: "user",
        text
      }
    ]);

    setLoading(true);

    try {

      const res = await chatQuery(text);

      let reply = res?.reply_text;

      if (Array.isArray(reply))
        reply = reply.join("\n");

      if (typeof reply !== "string")
        reply = JSON.stringify(reply);

      setMessages(prev => [
        ...prev,
        {
          role: "agent",
          text: reply
        }
      ]);

    } catch {

      setMessages(prev => [
        ...prev,
        {
          role: "agent",
          text: "Unable to connect to the backend."
        }
      ]);

    }

    setLoading(false);
  }

  function onKeyDown(e) {

    if (e.key === "Enter" && !e.shiftKey) {

      e.preventDefault();

      send();

    }

  }

  return (

    <div className="chat-layout">

      <div className="chat-main">

        <div
          style={{
            padding: "18px 40px",
            borderBottom: "1px solid var(--hairline)"
          }}
        >

          <div
            style={{
              fontSize: 18,
              fontWeight: 700
            }}
          >

XCAPADE AML Investigation Assistant

          </div>

          <div
            style={{
              fontSize: 13,
              color: "var(--ink-muted)",
              marginTop: 4
            }}
          >

        Ask questions about suspicious activity, customer risk, AML reports, or transaction summaries.

        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            color: "var(--ink-muted)"
          }}
        >
          Examples:
          <br />
          • Summarize the dataset
          <br />
          • Show top risky accounts
          <br />
          • Show account 100428660
          <br />
          • Find money laundering accounts
        </div>

          </div>

        </div>

        <div className="chat-history">

          {messages.map((m, i) => (

            <div
              key={i}
              className={`chat-msg ${m.role}`}
            >

              {m.role === "agent" && (

                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    color: "var(--ink-muted)",
                    marginBottom: 8
                  }}
                >

                  Xcapade Agent

                </div>

              )}

              <div
                className="msg-content"
                dangerouslySetInnerHTML={{
                  __html: renderText(m.text)
                }}
              />

            </div>

          ))}

          {loading && (

            <div className="chat-msg agent">

              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  color: "var(--ink-muted)"
                }}
              >

                Xcapade Agent

              </div>

              <div style={{ marginTop: 8 }}>

                Running AML analysis...

              </div>

            </div>

          )}

          <div ref={bottomRef} />

        </div>

        <div className="chat-input-area">

          <div className="chat-input-box">

            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Try 'Summarize the dataset' or 'Show top risky accounts...'"
              disabled={loading}
            />

            <div className="chat-input-footer">

              <span className="chat-input-hint">

                Enter to send · Shift+Enter for newline

              </span>

              <button
                className="btn-editorial-primary"
                onClick={send}
                disabled={loading}
              >

                {loading ? "Thinking..." : "Send Message"}

              </button>

            </div>

          </div>

        </div>

      </div>

    </div>

  );

}