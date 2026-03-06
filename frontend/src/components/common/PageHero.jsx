import React from 'react';

const FONTS = {
  serif:     "'Source Serif 4', Georgia, serif",
  mono:      "'IBM Plex Mono', monospace",
  condensed: "'Barlow Condensed', sans-serif",
};

const PageHero = ({ greeting, title, subtitle, rightLabel, rightValue, rightSublabel }) => (
  <div style={{
    background: 'var(--slate, #2c3140)',
    padding: '32px',
    position: 'relative',
    overflow: 'hidden',
    borderLeft: '6px solid transparent',
    borderImage: 'linear-gradient(180deg, var(--skn-green, #009e60), var(--skn-yellow, #fcd116)) 1',
  }}>
    {/* Diagonal flag geometry overlay */}
    <div style={{
      position: 'absolute', top: -40, right: -60, width: '50%', height: '200%',
      background: 'rgba(0,158,96,0.06)', transform: 'skewX(-12deg)',
    }} />
    <div style={{
      position: 'absolute', top: -20, right: '15%', width: '30%', height: '200%',
      background: 'rgba(252,209,22,0.04)', transform: 'skewX(-12deg)',
    }} />

    <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        {greeting && (
          <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: '3px',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>
            {greeting}
          </div>
        )}
        <div style={{ fontFamily: FONTS.condensed, fontSize: 44, fontWeight: 800,
          color: 'white', letterSpacing: '1px', lineHeight: 1 }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontFamily: FONTS.serif, fontSize: 13, fontStyle: 'italic',
            color: 'rgba(255,255,255,0.35)', marginTop: 8 }}>
            {subtitle}
          </div>
        )}
      </div>
      {rightValue != null && (
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: FONTS.condensed, fontSize: 28, fontWeight: 800,
            color: 'var(--skn-yellow, #fcd116)', letterSpacing: '1px', lineHeight: 1 }}>
            {rightValue}
          </div>
          {rightLabel && (
            <div style={{ fontFamily: FONTS.mono, fontSize: 8, letterSpacing: '2px',
              textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
              {rightLabel}
            </div>
          )}
          {rightSublabel && (
            <div style={{ fontFamily: FONTS.mono, fontSize: 8,
              color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>
              {rightSublabel}
            </div>
          )}
        </div>
      )}
    </div>
  </div>
);

export default PageHero;
