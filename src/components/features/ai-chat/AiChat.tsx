import React, { useState, useEffect, useRef } from "react";
import { BloomContext } from "../../../shared/types/messaging";
import { useAiStream } from "../../../hooks/use-ai-stream";
import { extractPageMetadata } from "../../../shared/utils/metadata-utils";
import "./AiChat.css";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  initialContext?: BloomContext;
  onClose: () => void;
}

export const AiChat: React.FC<Props> = ({ initialContext, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const { streamingText, isStreaming, error, continueStream } = useAiStream();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialContext) {
      setMessages([
        { role: "user", content: `Explain the term: ${initialContext.term}` },
        { role: "assistant", content: initialContext.explanation },
      ]);
    } else {
      setMessages([
        {
          role: "assistant",
          content: "Hello! I am Glimpse. How can I help you today?",
        },
      ]);
    }
  }, [initialContext]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingText]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isStreaming) return;

    const userMessage: Message = { role: "user", content: inputValue };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue("");

    let metadata = initialContext?.metadata;
    if (!metadata) {
      const pageMeta = extractPageMetadata();
      // Grab a chunk of the visible page text for context, same approach as the popup flow
      const fullText =
        document.body?.innerText || document.body?.textContent || "";
      const surroundingText =
        fullText.length > 2000 ? fullText.substring(0, 2000) + "..." : fullText;
      metadata = { ...pageMeta, surroundingText };
    }
    console.log(metadata);

    continueStream(inputValue, newMessages, metadata);
  };

  useEffect(() => {
    if (!isStreaming && streamingText && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "user") {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: streamingText },
        ]);
      }
    }
  }, [isStreaming, streamingText, messages]);

  return (
    <div className="ai-chat-container">
      <header className="chat-header">
        <button
          className="btn-icon"
          onClick={onClose}
          aria-label="Back to Scrapbook"
        >
          ←
        </button>
        <div className="header-info" style={{ marginLeft: "var(--spacing-2)" }}>
          <span className="text-caption">
            {initialContext ? `Deep Dive: ${initialContext.term}` : "New Chat"}
          </span>
        </div>
      </header>

      <div className="chat-messages" ref={scrollRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <div className="message-bubble">
              <p className="text-serif" style={{ margin: 0 }}>
                {msg.content}
              </p>
            </div>
          </div>
        ))}
        {isStreaming && (
          <div className="message assistant">
            <div className="message-bubble">
              <p className="text-serif" style={{ margin: 0 }}>
                {streamingText}
              </p>
            </div>
          </div>
        )}
        {error && (
          <div className="error-message">
            <p className="text-error" style={{ margin: 0 }}>
              {error.message}
            </p>
          </div>
        )}
      </div>

      <form className="chat-input-form" onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Ask a follow-up..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isStreaming}
          autoFocus
        />
        <button type="submit" disabled={isStreaming || !inputValue.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};
