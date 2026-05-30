import React from 'react';

interface Props {
  term: string;
  learnedAt: number;
  domainUrl: string;
  position: { x: number; y: number } | null;
}

export const CodexTooltip: React.FC<Props> = ({ term, learnedAt, domainUrl, position }) => {
  if (!position) return null;

  const date = new Date(learnedAt).toLocaleDateString();
  
  return (
    <div 
      className="codex-tooltip"
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)',
        marginTop: '-12px',
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
