import React, { useState } from 'react';
import StatusChip from './StatusChip';

const T = {
  sknGreen:  '#009e60',
  sknRed:    '#c8001e',
  amber:     '#c9a500',
  ink:       '#0f0f0f',
};

const FONTS = {
  serif:     "'Source Serif 4', Georgia, serif",
  mono:      "'IBM Plex Mono', monospace",
  condensed: "'Barlow Condensed', sans-serif",
};

const HCard = ({ band = T.sknGreen, icon, eyebrow, title, desc, tags = [], status, due, points, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const dueColour = due?.urgent ? T.sknRed : due?.soon ? T.amber : 'rgba(0,0,0,0.3)';
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'stretch',
        background: hovered ? 'var(--parchment, #faf7f2)' : 'white',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative', overflow: 'hidden',
        transition: 'background 0.15s',
      }}
    >
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
        background: hovered ? T.sknGreen : 'transparent',
        transition: 'background 0.15s',
      }} />
      <div style={{ width: 5, flexShrink: 0, background: band }} />
      <div style={{
        width: 76, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 26, borderRight: '1px solid rgba(0,0,0,0.05)',
        background: 'var(--parchment, #faf7f2)', flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, padding: '14px 18px', minWidth: 0 }}>
        {eyebrow && (
          <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: '2px',
            textTransform: 'uppercase', color: T.sknGreen, marginBottom: 4 }}>
            {eyebrow}
          </div>
        )}
        <div style={{ fontFamily: FONTS.serif, fontSize: 14, fontWeight: 600,
          color: T.ink, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {title}
        </div>
        {desc && (
          <div style={{ fontFamily: FONTS.serif, fontSize: 11.5, fontStyle: 'italic',
            fontWeight: 300, color: 'rgba(0,0,0,0.45)', marginBottom: tags.length > 0 ? 6 : 0 }}>
            {desc}
          </div>
        )}
        {tags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {tags.map((tag, i) => (
              <span key={i} style={{
                fontFamily: FONTS.mono, fontSize: 8.5, letterSpacing: '1px',
                textTransform: 'uppercase', padding: '2px 8px',
                border: '1px solid rgba(0,0,0,0.1)', color: 'rgba(0,0,0,0.4)',
              }}>{tag}</span>
            ))}
          </div>
        )}
      </div>
      <div style={{
        minWidth: 140, borderLeft: '1px solid rgba(0,0,0,0.05)',
        padding: '14px 18px', display: 'flex', flexDirection: 'column',
        alignItems: 'flex-start', justifyContent: 'space-between',
      }}>
        {status && <StatusChip status={status} />}
        {due && (
          <div style={{ fontFamily: FONTS.mono, fontSize: 9,
            color: dueColour, letterSpacing: '0.5px' }}>
            {due.label}
          </div>
        )}
        {points != null && (
          <div style={{ fontFamily: FONTS.condensed, fontSize: 20, fontWeight: 800,
            color: 'rgba(0,0,0,0.12)', letterSpacing: '1px' }}>
            {points}pts
          </div>
        )}
      </div>
    </div>
  );
};

export default HCard;
