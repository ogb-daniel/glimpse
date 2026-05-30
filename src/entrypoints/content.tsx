import ReactDOM from 'react-dom/client';
import React from 'react';
import { useMagicHold } from '@/hooks/use-magic-hold';
import { useAiStream } from '@/hooks/use-ai-stream';
import { useCodexUnderliner } from '@/hooks/use-codex-underliner';
import { useScrapbook } from '@/hooks/use-scrapbook';
import { MagicHoldAnimation } from '@/components/overlays/MagicHoldAnimation';
import { TacticalPopover } from '@/components/overlays/TacticalPopover';
import { CodexTooltip } from '@/components/overlays/CodexTooltip';
import { isPdfDocument, getNativePdfSelection, getPdfFallbackText } from '@/shared/utils/pdf-utils';
import { BloomContext } from '@/shared/types/messaging';
import { extractPageMetadata } from '@/shared/utils/metadata-utils';
import '@/assets/main.css';

const ContentApp: React.FC = () => {
  const { isHolding, isTriggered, position, dismiss } = useMagicHold();
  const { streamingText, isStreaming, error, startStream, resetStream } = useAiStream();
  const { getInteractionByTerm } = useScrapbook();
  const [capturedTerm, setCapturedTerm] = React.useState<string>('');
  
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

  const handleDeepChat = async () => {
    if (capturedTerm && streamingText) {
      const bloomContext: BloomContext = {
        term: capturedTerm,
        explanation: streamingText,
        metadata: extractPageMetadata(),
        timestamp: Date.now()
      };
      
      try {
        await (browser.storage as any).session.set({ bloom_context: bloomContext });
      } catch (e) {
        console.warn('Glimpse: session storage not available, falling back to local', e);
        await browser.storage.local.set({ bloom_context: bloomContext });
      }
    }

    browser.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' });
    dismiss();
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
        }

        if (text.length > 0) {
          setCapturedTerm(text);
          startStream(text);
        } else {
          // If we triggered but somehow got no text, dismiss
          dismiss();
        }
      } else if (!isTriggered) {
        hasTriggeredRef.current = false;
        setCapturedTerm('');
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

  return (
    <>
      <MagicHoldAnimation position={isHolding ? position : null} />
      <TacticalPopover 
        position={position} 
        isVisible={isTriggered} 
        streamingText={streamingText}
        isStreaming={isStreaming}
        error={error}
        onDeepChat={handleDeepChat}
      />
      <CodexTooltip 
        term={tooltipData?.term || ''}
        learnedAt={tooltipData?.learnedAt || 0}
        domainUrl={tooltipData?.domainUrl || ''}
        position={tooltipData?.position || null}
      />
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
