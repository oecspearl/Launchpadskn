import React from 'react';
import StatCard from './StatCard';
import './dashboard.css';

/**
 * Responsive 4 -> 2 -> 1 column stat grid.
 * @param {Array<{icon, label, value, wide?}>} stats
 */
function StatsGrid({ stats = [] }) {
  return (
    <div className="ed-stats">
      {stats.map((s, i) => (
        <StatCard
          key={s.label || i}
          icon={s.icon}
          label={s.label}
          value={s.value}
          wide={s.wide}
          delay={i * 60}
        />
      ))}
    </div>
  );
}

export default StatsGrid;
