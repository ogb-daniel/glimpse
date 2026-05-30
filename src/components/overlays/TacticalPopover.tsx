import React from 'react';

interface Props {
  position: { x: number; y: number } | null;
  isVisible: boolean;
}

export const TacticalPopover: React.FC<Props> = ({ position, isVisible }) => {
  if (!position || !isVisible) return null;

  return (
    <div
      className="tactical-popover"
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, 10px)',
        pointerEvents: 'auto',
      }}
    >
      <div className="popover-content">
        <header>
          <span className="text-caption">Glimpse Synthesis</span>
        </header>
        <main>
          <p className="text-serif">Synthesizing...</p>
        </main>
      </div>
    </div>
  );
};
