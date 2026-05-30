import ReactDOM from 'react-dom/client';
import React from 'react';
import { useMagicHold } from '@/hooks/use-magic-hold';
import { useAiStream } from '@/hooks/use-ai-stream';
import { MagicHoldAnimation } from '@/components/overlays/MagicHoldAnimation';
import { TacticalPopover } from '@/components/overlays/TacticalPopover';
import '@/assets/main.css';

const ContentApp: React.FC = () => {
  const { isHolding, isTriggered, position, dismiss } = useMagicHold();
  const { streamingText, isStreaming, error, startStream, resetStream } = useAiStream();

  React.useEffect(() => {
    if (isTriggered) {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      // Finding 7: Ensure selection is not empty before starting stream
      if (text && text.length > 0) {
        startStream(text);
      }
    } else {
      resetStream();
    }
  }, [isTriggered, startStream, resetStream]);

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

  return (
    <>
      <MagicHoldAnimation position={isHolding ? position : null} />
      <TacticalPopover 
        position={position} 
        isVisible={isTriggered} 
        streamingText={streamingText}
        isStreaming={isStreaming}
        error={error}
      />
    </>
  );
};

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',

  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'glimpse-overlays',
      position: 'inline',
      anchor: 'body',
      append: 'last',
      onMount: (container: HTMLElement) => {
        const wrapper = document.createElement('div');
        // The popover attribute ensures it appears on the top layer
        wrapper.setAttribute('popover', 'manual');
        // Finding 8: Ensure wrapper doesn't block interactions on host page
        wrapper.style.pointerEvents = 'none';
        wrapper.style.background = 'transparent';
        wrapper.style.border = 'none';
        wrapper.style.padding = '0';
        wrapper.style.margin = '0';
        
        container.append(wrapper);
        
        const root = ReactDOM.createRoot(wrapper);
        root.render(<ContentApp />);
        
        // Show the popover immediately so it's ready to display top-layer content
        // @ts-ignore - Popover API might not be in the types yet
        if (wrapper.showPopover) wrapper.showPopover();
        
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
