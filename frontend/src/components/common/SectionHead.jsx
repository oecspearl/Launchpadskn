import React from 'react';

const FONTS = {
  mono:      "'IBM Plex Mono', monospace",
  condensed: "'Barlow Condensed', sans-serif",
};

const SectionHead = ({ title, action, onAction }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 4, height: 20, background: 'var(--skn-green, #009e60)', flexShrink: 0 }} />
      <span style={{ fontFamily: FONTS.condensed, fontSize: 20, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--ink, #0f0f0f)' }}>
        {title}
      </span>
    </div>
    {action && (
      <button onClick={onAction} style={{
        fontFamily: FONTS.mono, fontSize: 9.5, letterSpacing: '1.5px',
        textTransform: 'uppercase', color: 'rgba(0,0,0,0.3)',
        background: 'none', border: 'none', cursor: 'pointer',
        transition: 'color 0.15s',
      }}
        onMouseEnter={e => e.target.style.color = '#009e60'}
        onMouseLeave={e => e.target.style.color = 'rgba(0,0,0,0.3)'}
      >
        {action}
      </button>
    )}
  </div>
);

export default SectionHead;
