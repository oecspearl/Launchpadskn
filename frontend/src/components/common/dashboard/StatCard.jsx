import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import './dashboard.css';

/**
 * Editorial stat card.
 * @param {React.ComponentType} icon - lucide icon component
 * @param {string} label
 * @param {string|number} value
 * @param {boolean} wide - render the dark "hero" variant (spans 2 columns)
 * @param {number} delay - stagger animation delay (ms)
 */
function StatCard({ icon: Icon, label, value, wide = false, delay = 0 }) {
  return (
    <article
      className={`ed-stat ${wide ? 'ed-stat--wide' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="ed-stat-top">
        <span className="ed-stat-icon">
          {Icon && <Icon size={18} strokeWidth={1.75} />}
        </span>
        <ArrowUpRight size={15} className="ed-stat-arrow" />
      </div>
      <p className="ed-stat-label">{label}</p>
      <p className="ed-stat-value">{value}</p>
    </article>
  );
}

export default StatCard;
