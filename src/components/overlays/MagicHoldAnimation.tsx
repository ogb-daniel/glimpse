import React from 'react';

interface Props {
  position: { x: number; y: number } | null;
}

export const MagicHoldAnimation: React.FC<Props> = ({ position }) => {
  if (!position) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: 0,
        height: 0,
        pointerEvents: 'none',
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="pulse-ring"
          style={{
            width: '40px',
            height: '40px',
            marginLeft: '-20px',
            marginTop: '-20px',
            animationDelay: `${i * 0.4}s`,
          }}
        />
      ))}
    </div>
  );
};
