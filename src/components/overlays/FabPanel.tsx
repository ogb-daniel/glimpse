import React from "react";
import { ScrapbookList } from "../features/scrapbook/ScrapbookList";
import { AiChat } from "../features/ai-chat/AiChat";
import { BloomContext } from "../../shared/types/messaging";

interface Props {
  isOpen: boolean;
  bloomContext: BloomContext | null;
  onCloseChat: () => void;
}

export const FabPanel: React.FC<Props> = ({
  isOpen,
  bloomContext,
  onCloseChat,
}) => {
  const [isManualChatOpen, setIsManualChatOpen] = React.useState(false);
  const [internalContext, setInternalContext] =
    React.useState<BloomContext | null>(null);

  // Auto-open chat if context is provided
  React.useEffect(() => {
    if (bloomContext) {
      setIsManualChatOpen(false);
      setInternalContext(null);
    }
  }, [bloomContext]);

  if (!isOpen) return null;

  const activeContext = bloomContext || internalContext;
  const showChat = activeContext !== null || isManualChatOpen;

  const handleCloseChat = () => {
    if (bloomContext) {
      onCloseChat();
    }
    setInternalContext(null);
    setIsManualChatOpen(false);
  };

  return (
    <div
      className="fab-panel"
      style={{
        position: "fixed",
        bottom: "96px",
        right: "24px",
        width: "400px",
        height: "600px",
        maxHeight: "calc(100vh - 120px)",
        backgroundColor: "var(--surface-base, #ffffff)",
        borderRadius: "12px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        zIndex: 2147483646,
        fontFamily: "var(--font-sans)",
        border: "1px solid var(--border-hairline, #e5e7eb)",
        pointerEvents: "auto",
      }}
    >
      {showChat ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <AiChat
            initialContext={activeContext || undefined}
            onClose={handleCloseChat}
          />
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <header
            style={{
              padding: "16px",
              borderBottom: "1px solid var(--border-hairline, #e5e7eb)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "var(--ink-primary)",
                }}
              >
                Glimpse Scrapbook
              </h1>
              <p
                className="text-caption"
                style={{ margin: "4px 0 0 0", color: "var(--ink-secondary)" }}
              >
                Your local research companion.
              </p>
            </div>
            <button
              className="btn-icon"
              onClick={() => setIsManualChatOpen(true)}
              title="New Chat"
              aria-label="New Chat"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </button>
          </header>
          <main style={{ flex: 1, overflowY: "auto" }}>
            <ScrapbookList
              onOpenChat={(context) => setInternalContext(context)}
            />
          </main>
        </div>
      )}
    </div>
  );
};
