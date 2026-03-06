import React from 'react';

const FONTS = {
  mono: "'IBM Plex Mono', monospace",
};

const Panel = ({ title, action, onAction, children, style }) => (
  <div style={{ border: '1px solid var(--fog, #d4cec4)', background: 'white', ...style }}>
    <div style={{
      background: 'var(--mist, #e8e2d8)', borderBottom: '1px solid var(--fog, #d4cec4)',
      padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <span style={{ fontFamily: FONTS.mono, fontSize: 9, fontWeight: 600,
        letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(0,0,0,0.5)' }}>
        {title}
      </span>
      {action && (
        <button onClick={onAction} style={{
          fontFamily: FONTS.mono, fontSize: 9, letterSpacing: '1.5px',
          textTransform: 'uppercase', color: 'var(--skn-green, #009e60)',
          background: 'none', border: 'none', cursor: 'pointer',
        }}>
          {action}
        </button>
      )}
    </div>
    <div style={{ padding: '14px 16px' }}>{children}</div>
  </div>
);

export default Panel;
