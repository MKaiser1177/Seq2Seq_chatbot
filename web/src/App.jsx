import { useEffect, useRef, useState } from "react";

const suggestions = [
  "What makes a good day?",
  "Tell me something surprising",
  "I need a little inspiration",
];

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 2 1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9L12 2Z" />
      <path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m21 3-7.2 18-3.9-7.9L2 9.2 21 3Z" />
      <path d="M10 13 21 3" />
    </svg>
  );
}

function App() {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  async function sendMessage(text = draft) {
    const content = text.trim();
    if (!content || isSending) return;

    const history = messages.map(({ role, content: message }) => ({
      role,
      content: message,
    }));
    const nextMessages = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setDraft("");
    setError("");
    setIsSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, history }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.detail || "Milo couldn't reply just now.");
      }
      setMessages([...nextMessages, { role: "assistant", content: result.reply }]);
    } catch (requestError) {
      setMessages(messages);
      setDraft(content);
      setError(requestError.message || "Couldn't reach Milo. Please try again.");
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }

  function startNewChat() {
    setMessages([]);
    setDraft("");
    setError("");
    inputRef.current?.focus();
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="Milo home">
          <span className="brand-mark"><SparkleIcon /></span>
          <span>milo<span className="brand-period">.</span></span>
        </a>

        <button className="new-chat-button" onClick={startNewChat}>
          <span aria-hidden="true">＋</span> New conversation
        </button>

        <div className="sidebar-note">
          <span className="note-icon"><SparkleIcon /></span>
          <p>A little space to think out loud, get curious, or just say hello.</p>
        </div>

        <div className="sidebar-footer">
          <span className="avatar">M</span>
          <div>
            <strong>Your chat companion</strong>
            <span>Here whenever you need</span>
          </div>
          <span className="online-dot" aria-label="Online" />
        </div>
      </aside>

      <section className="chat-panel" aria-label="Chat with Milo">
        <header className="topbar">
          <div className="conversation-title">
            <span className="avatar topbar-avatar">M</span>
            <div>
              <h1>Milo</h1>
              <span className="availability"><span className="online-dot" /> Ready to chat</span>
            </div>
          </div>
          <button className="mobile-new-chat" onClick={startNewChat} aria-label="Start a new chat">
            ＋
          </button>
          <div className="model-label"><SparkleIcon /> BlenderBot</div>
        </header>

        <div className={`conversation ${messages.length ? "has-messages" : ""}`}>
          {messages.length === 0 ? (
            <div className="welcome">
              <div className="welcome-icon"><SparkleIcon /></div>
              <span className="eyebrow">YOUR FRIENDLY AI COMPANION</span>
              <h2>Good things start<br />with a <span>hello.</span></h2>
              <p>I'm Milo. Bring me a question, a thought, or just a moment to chat. Where should we start?</p>
              <div className="suggestions-label">A FEW IDEAS TO GET GOING</div>
              <div className="suggestions">
                {suggestions.map((suggestion) => (
                  <button key={suggestion} onClick={() => sendMessage(suggestion)}>
                    {suggestion}<span aria-hidden="true">↗</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="message-list" aria-live="polite">
              {messages.map((message, index) => (
                <article className={`message ${message.role}`} key={`${index}-${message.role}`}>
                  {message.role === "assistant" && <span className="message-avatar"><SparkleIcon /></span>}
                  <div className="message-body">
                    <span className="message-author">{message.role === "assistant" ? "Milo" : "You"}</span>
                    <p>{message.content}</p>
                  </div>
                </article>
              ))}
              {isSending && (
                <article className="message assistant" aria-label="Milo is typing">
                  <span className="message-avatar"><SparkleIcon /></span>
                  <div className="typing-indicator"><i /><i /><i /></div>
                </article>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="composer-area">
          {error && <p className="error-message" role="alert">{error}</p>}
          <form
            className="composer"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write a message..."
              aria-label="Write a message"
              rows={1}
              maxLength={2000}
              disabled={isSending}
            />
            <button className="send-button" type="submit" disabled={!draft.trim() || isSending} aria-label="Send message">
              <SendIcon />
            </button>
          </form>
          <p className="composer-hint">Press <kbd>Enter</kbd> to send · <kbd>Shift + Enter</kbd> for a new line</p>
        </div>
      </section>
    </main>
  );
}

export default App;
