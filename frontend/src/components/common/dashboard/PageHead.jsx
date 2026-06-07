import React from 'react';
import './dashboard.css';

/** Editorial page header: mono eyebrow, serif title, muted subtitle. */
function PageHead({ eyebrow, title, subtitle }) {
  return (
    <div className="ed-page-head">
      {eyebrow && <p className="ed-eyebrow">{eyebrow}</p>}
      <h2>{title}</h2>
      {subtitle && <p className="ed-sub">{subtitle}</p>}
    </div>
  );
}

export default PageHead;
