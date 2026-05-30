import React from 'react';

interface Props {
  term: string;
  learnedAt: number;
  domainUrl: string;
  position: { x: number; y: number } | null;
}

export const CodexTooltip: React.FC<Props> = ({ term, learnedAt, domainUrl, position }) => {
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const [coords, setCoords] = React.useState<{ left: number; top: number } | null>(null);

  React.useLayoutEffect(() => {
    if (position && tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect();
      let left = position.x;
      let top = position.y - 12;

      // Horizontal boundary detection
      if (left - rect.width / 2 < 10) {
        left = rect.width / 2 + 10;
      } else if (left + rect.width / 2 > window.innerWidth - 10) {
        left = window.innerWidth - rect.width / 2 - 10;
      }

      // Vertical boundary detection (flip if at top)
      if (top - rect.height < 10) {
        top = position.y + rect.height + 20;
      }

      setCoords({ left, top });
    } else {
      setCoords(null);
    }
  }, [position]);

  if (!position) return null;

  const date = new Date(learnedAt).toLocaleDateString();
  
  return (
    <div 
      ref={tooltipRef}
      className="codex-tooltip"
      style={{
        position: 'fixed',
        left: coords?.left ?? position.x,
        top: coords?.top ?? position.y,
        opacity: coords ? 1 : 0,
        transform: coords ? 'translate(-50%, -100%)' : 'translate(-50%, -100%) scale(0.95)',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
        padding: '8px 12px',
        background: 'var(--surface-overlay)',
        backdropFilter: 'blur(8px)',
        border: '1px solid var(--border-hairline)',
        borderTop: '2px solid var(--accent-gold)',
        borderRadius: 'var(--radius-sm)',
        boxShadow: 'var(--shadow-popover)',
        zIndex: 1000000,
        pointerEvents: 'none',
        fontSize: '11px',
        lineHeight: '1.4',
        fontFamily: 'var(--font-sans)',
        color: 'var(--ink-secondary)',
        minWidth: '160px',
        maxWidth: '240px'
      }}
    >
      <div style={{ fontWeight: 600, color: 'var(--ink-primary)', marginBottom: '2px', fontSize: '12px' }}>{term}</div>
      <div>Learned on {date}</div>
      <div style={{ 
        fontStyle: 'italic', 
        overflow: 'hidden', 
        textOverflow: 'ellipsis', 
        whiteSpace: 'nowrap',
        marginTop: '2px' 
      }}>
        Source: {domainUrl}
      </div>
    </div>
  );
};
