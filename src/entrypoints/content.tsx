import ReactDOM from 'react-dom/client';
import React from 'react';
import { useMagicHold } from '@/hooks/use-magic-hold';
import { MagicHoldAnimation } from '@/components/overlays/MagicHoldAnimation';
import '@/assets/main.css';

const ContentApp: React.FC = () => {
  const { isHolding, position } = useMagicHold();
  return <MagicHoldAnimation position={isHolding ? position : null} />;
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
