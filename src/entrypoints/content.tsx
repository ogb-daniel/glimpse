import ReactDOM from 'react-dom/client';
import React from 'react';
import { useMagicHold } from '@/hooks/use-magic-hold';
import { useAiStream } from '@/hooks/use-ai-stream';
import { useCodexUnderliner } from '@/hooks/use-codex-underliner';
import { useScrapbook } from '@/hooks/use-scrapbook';
import { MagicHoldAnimation } from '@/components/overlays/MagicHoldAnimation';
import { TacticalPopover } from '@/components/overlays/TacticalPopover';
import { CodexTooltip } from '@/components/overlays/CodexTooltip';
import { FabButton } from '@/components/overlays/FabButton';
import { FabPanel } from '@/components/overlays/FabPanel';
import { isPdfDocument, getNativePdfSelection, getPdfFallbackText } from '@/shared/utils/pdf-utils';
import { BloomContext } from '@/shared/types/messaging';
import { extractPageMetadata } from '@/shared/utils/metadata-utils';
import '@/assets/main.css';

const STORAGE_KEY_ENABLED = 'glimpse_enabled';

const ContentApp: React.FC = () => {
  const [enabled, setEnabled] = React.useState(true);
  const { isHolding, isTriggered, position, dismiss } = useMagicHold();
  const { streamingText, isStreaming, error, startStream, startElaborateStream, resetStream, setCachedStream } = useAiStream();
  const { getInteractionByTerm } = useScrapbook();
  const [capturedTerm, setCapturedTerm] = React.useState<string>('');
  const [capturedContext, setCapturedContext] = React.useState<string>('');

  // Load enabled state from storage and listen for toggle messages
  React.useEffect(() => {
    browser.storage.local.get(STORAGE_KEY_ENABLED).then((stored) => {
      setEnabled(stored[STORAGE_KEY_ENABLED] !== false);
    });

    const listener = (msg: any) => {
      if (msg?.type === 'GLIMPSE_TOGGLE') {
        setEnabled(msg.payload.enabled);
      }
    };
    browser.runtime.onMessage.addListener(listener);
    return () => browser.runtime.onMessage.removeListener(listener);
  }, []);
  
  // FAB State
  const [isFabOpen, setIsFabOpen] = React.useState(false);
  const [fabContext, setFabContext] = React.useState<BloomContext | null>(null);

  // Codex Tooltip State
  const [tooltipData, setTooltipData] = React.useState<{
    term: string;
    learnedAt: number;
    domainUrl: string;
    position: { x: number; y: number };
  } | null>(null);
  const hoverTimer = React.useRef<any>(null);
  const latestHoverTerm = React.useRef<string | null>(null);

  // Initialize Underliner
  useCodexUnderliner();

  const handleAskFollowUp = async () => {
    if (capturedTerm && streamingText) {
      const bloomContext: BloomContext = {
        term: capturedTerm,
        explanation: streamingText,
        metadata: {
          ...extractPageMetadata(),
          surroundingText: capturedContext
        },
        timestamp: Date.now()
      };
      
      setFabContext(bloomContext);
      setIsFabOpen(true);
    }
    dismiss();
  };

  const handleExplainFurther = () => {
    if (capturedTerm) {
      startElaborateStream(capturedTerm, { ...extractPageMetadata(), surroundingText: capturedContext });
    }
  };

  React.useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('glimpse-codex-underline')) {
        const term = target.dataset.term;
        if (!term) return;

        latestHoverTerm.current = term;
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
        
        hoverTimer.current = setTimeout(async () => {
          const result = await getInteractionByTerm(term);
          if (latestHoverTerm.current === term && result.success && result.data) {
            const rect = target.getBoundingClientRect();
            setTooltipData({
              term: result.data.term,
              learnedAt: result.data.learnedAt,
              domainUrl: result.data.domainUrl,
              position: { x: rect.left + rect.width / 2, y: rect.top }
            });
          }
        }, 1000); // 1s delay per AC #3
      } else if (!target.closest('.codex-tooltip')) {
        clearTooltip();
      }
    };

    const clearTooltip = () => {
      latestHoverTerm.current = null;
      if (hoverTimer.current) {
        clearTimeout(hoverTimer.current);
        hoverTimer.current = null;
      }
      setTooltipData(null);
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('glimpse-codex-underline')) {
        clearTooltip();
      }
    };

    window.addEventListener('mouseover', handleMouseOver);
    window.addEventListener('mouseout', handleMouseOut);

    return () => {
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mouseout', handleMouseOut);
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    };
  }, [getInteractionByTerm]);

  const hasTriggeredRef = React.useRef(false);

  React.useEffect(() => {
    const fetchAndStart = async () => {
      if (isTriggered && !hasTriggeredRef.current) {
        hasTriggeredRef.current = true;
        let text = '';
        let surroundingText = '';
        if (isPdfDocument()) {
          // Attempt native bridge first
          text = await getNativePdfSelection();
          
          // Patch: Fallback to PDF.js extraction if native selection is empty (e.g. non-standard viewer)
          if (!text) {
            text = await getPdfFallbackText(window.location.href);
          }
        } else {
          const selection = window.getSelection();
          text = selection?.toString().trim() || '';
          
          if (selection && selection.rangeCount > 0) {
            // Get a much larger context window from the full page text
            const fullText = document.body.innerText || document.body.textContent || '';
            const index = fullText.indexOf(text);
            if (index !== -1) {
              const start = Math.max(0, index - 1000);
              const end = Math.min(fullText.length, index + text.length + 1000);
              surroundingText = fullText.substring(start, end);
              if (start > 0) surroundingText = '...' + surroundingText;
              if (end < fullText.length) surroundingText = surroundingText + '...';
            } else {
              // Fallback to parent element if indexOf fails (e.g., due to whitespace differences)
              const range = selection.getRangeAt(0);
              const container = range.commonAncestorContainer;
              const parentElement = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as HTMLElement;
              if (parentElement) {
                 surroundingText = parentElement.innerText || parentElement.textContent || '';
                 if (surroundingText.length > 2000) {
                    surroundingText = surroundingText.substring(0, 2000) + '...';
                 }
              }
            }
          }
        }

        if (text.length > 0) {
          setCapturedTerm(text);
          setCapturedContext(surroundingText);

          // Check for existing term first
          const existing = await getInteractionByTerm(text);
          if (existing.success && existing.data) {
             setCachedStream(existing.data.explanation);
          } else {
             startStream(text, surroundingText);
          }
        } else {
          // If we triggered but somehow got no text, dismiss
          dismiss();
        }
      } else if (!isTriggered) {
        hasTriggeredRef.current = false;
        setCapturedTerm('');
        setCapturedContext('');
        resetStream();
      }
    };

    fetchAndStart();
  }, [isTriggered, startStream, resetStream, dismiss]);

  React.useEffect(() => {
    if (!isTriggered) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTriggered, dismiss]);

  // Patch: Guard against rendering in tiny iframes where the UI would be clipped
  if (typeof window !== 'undefined' && window.innerWidth < 100) {
    return null;
  }

  // Guard: Extension disabled via popup toggle
  if (!enabled) {
    return null;
  }

  return (
    <>
      <MagicHoldAnimation position={isHolding ? position : null} />
      <TacticalPopover 
        position={position} 
        isVisible={isTriggered} 
        streamingText={streamingText}
        isStreaming={isStreaming}
        error={error}
        onAskFollowUp={handleAskFollowUp}
        onExplainFurther={handleExplainFurther}
        onDismiss={dismiss}
      />
      <CodexTooltip 
        term={tooltipData?.term || ''}
        learnedAt={tooltipData?.learnedAt || 0}
        domainUrl={tooltipData?.domainUrl || ''}
        position={tooltipData?.position || null}
      />
      <FabButton isOpen={isFabOpen} onClick={() => setIsFabOpen(!isFabOpen)} />
      <FabPanel isOpen={isFabOpen} bloomContext={fabContext} onCloseChat={() => setFabContext(null)} />
    </>
  );
};

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',
  allFrames: true,

  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'glimpse-overlays',
      position: 'inline',
      anchor: 'body',
      append: 'last',
      onMount: (container: HTMLElement) => {
        const wrapper = document.createElement('div');
        wrapper.style.position = 'absolute';
        wrapper.style.top = '0';
        wrapper.style.left = '0';
        wrapper.style.width = '100%';
        wrapper.style.height = '100%';
        wrapper.style.zIndex = '2147483647';
        // Finding 8: Ensure wrapper doesn't block interactions on host page
        wrapper.style.pointerEvents = 'none';
        wrapper.style.background = 'transparent';
        wrapper.style.border = 'none';
        wrapper.style.padding = '0';
        wrapper.style.margin = '0';
        
        container.append(wrapper);
        
        const root = ReactDOM.createRoot(wrapper);
        root.render(<ContentApp />);
        
        return { root, wrapper };
      },
      onRemove: (elements) => {
        elements?.root.unmount();
        elements?.wrapper.remove();
      },
    });

    ui.mount();
  },
});
