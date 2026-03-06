import React from 'react';

function SKNTribar() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 'var(--tribar-h, 5px)',
        zIndex: 200,
        display: 'flex',
        pointerEvents: 'none',
      }}
    >
      <div style={{ flex: 1, background: 'var(--skn-green, #009e60)' }} />
      <div style={{ width: 28, background: 'var(--skn-yellow, #fcd116)' }} />
      <div style={{ width: 10, background: 'var(--skn-black, #000)' }} />
      <div style={{ flex: 1, background: 'var(--skn-red, #c8001e)' }} />
    </div>
  );
}

export default SKNTribar;
