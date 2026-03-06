import React from 'react';

const FONTS = {
  mono: "'IBM Plex Mono', monospace",
};

const CHIP_STYLES = {
  live:    { bg: 'rgba(0,158,96,0.12)',   color: '#006b40', border: 'rgba(0,158,96,0.25)',   label: 'Live'      },
  next:    { bg: 'rgba(252,209,22,0.15)', color: '#c9a500', border: 'rgba(252,209,22,0.3)',  label: 'Up Next'     },
  done:    { bg: 'rgba(0,0,0,0.05)',      color: 'rgba(0,0,0,0.3)', border: 'rgba(0,0,0,0.08)', label: 'Done'   },
  urgent:  { bg: 'rgba(200,0,30,0.08)',   color: '#9a0017', border: 'rgba(200,0,30,0.15)',   label: 'Urgent'      },
  review:  { bg: 'rgba(44,49,64,0.08)',   color: '#2c3140', border: 'rgba(44,49,64,0.15)',   label: 'In Review'   },
  pending: { bg: 'rgba(252,209,22,0.15)', color: '#c9a500', border: 'rgba(252,209,22,0.3)',  label: 'Pending'     },
  completed: { bg: 'rgba(0,158,96,0.12)', color: '#006b40', border: 'rgba(0,158,96,0.25)',   label: 'Completed'   },
  scheduled: { bg: 'rgba(44,49,64,0.08)', color: '#2c3140', border: 'rgba(44,49,64,0.15)',   label: 'Scheduled'   },
  active:  { bg: 'rgba(0,158,96,0.12)',   color: '#006b40', border: 'rgba(0,158,96,0.25)',   label: 'Active'      },
};

const StatusChip = ({ status, label }) => {
  const s = CHIP_STYLES[status] || CHIP_STYLES.done;
  return (
    <span style={{
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      fontWeight: 600,
      letterSpacing: '1.5px',
      textTransform: 'uppercase',
      padding: '3px 9px',
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
      display: 'inline-block',
      lineHeight: 1.4,
    }}>
      {label || s.label}
    </span>
  );
};

export { CHIP_STYLES };
export default StatusChip;
