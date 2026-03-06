import React, { useState } from 'react';

const T = {
  sknGreen:  '#009e60',
  ink:       '#0f0f0f',
  slate:     '#2c3140',
};

const FONTS = {
  mono:      "'IBM Plex Mono', monospace",
  condensed: "'Barlow Condensed', sans-serif",
};

const StatCell = ({ label, value, delta, deltaDir, color = 'var(--mist)' }) => {
  const [hovered, setHovered] = useState(false);
  const deltaColour = { up: '#006b40', warn: '#c9a500', down: '#c8001e' }[deltaDir] || T.slate;
  const deltaPrefix = { up: '\u2191 ', warn: '\u26A0 ', down: '\u2193 ' }[deltaDir] || '';
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '18px 20px',
        background: hovered ? 'var(--parchment, #faf7f2)' : 'white',
        borderRight: '1px solid var(--fog, #d4cec4)',
        position: 'relative',
        cursor: 'default',
        transition: 'background 0.15s',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: hovered ? color : 'var(--mist, #e8e2d8)',
        transition: 'background 0.2s',
      }} />
      <div style={{ fontFamily: FONTS.mono, fontSize: 8.5, letterSpacing: '2px',
        textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontFamily: FONTS.condensed, fontSize: 38, fontWeight: 800,
        letterSpacing: '1px', lineHeight: 1, color: T.ink }}>
        {value}
      </div>
      {delta && (
        <div style={{ fontFamily: FONTS.mono, fontSize: 9, color: deltaColour, marginTop: 6 }}>
          {deltaPrefix}{delta}
        </div>
      )}
    </div>
  );
};

const StatRow = ({ cells }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: `repeat(${cells.length}, 1fr)`,
    border: '1px solid var(--fog, #d4cec4)',
    background: 'white',
  }}>
    {cells.map((c, i) => <StatCell key={i} {...c} />)}
  </div>
);

export { StatCell };
export default StatRow;
