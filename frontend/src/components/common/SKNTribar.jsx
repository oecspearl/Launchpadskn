import React from 'react';

const SKNTribar = () => (
  <div className="skn-tribar">
    <div style={{ flex: 1, background: 'var(--flag-green, #009e49)' }} />
    <div style={{ width: 28, background: 'var(--flag-yellow, #fcd116)' }} />
    <div style={{ width: 10, background: 'var(--flag-black, #000000)' }} />
    <div style={{ flex: 1, background: 'var(--flag-red, #c8001e)' }} />
  </div>
);

export default SKNTribar;
