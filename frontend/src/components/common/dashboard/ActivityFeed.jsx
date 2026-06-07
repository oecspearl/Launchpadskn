import React from 'react';
import { Activity, Clock } from 'lucide-react';
import './dashboard.css';

/**
 * Contained activity list.
 * @param {Array<{icon?, primary, secondary?, time?}>} items
 * @param {{icon?, title, hint?}} empty - empty-state content
 */
function ActivityFeed({ items = [], empty }) {
  if (!items.length) {
    const EmptyIcon = empty?.icon || Activity;
    return (
      <div className="ed-activity">
        <div className="ed-empty">
          <div className="ed-empty-icon"><EmptyIcon size={20} strokeWidth={1.75} /></div>
          <p className="ed-empty-text">{empty?.title || 'No recent activity'}</p>
          {empty?.hint && <p className="ed-empty-hint">{empty.hint}</p>}
        </div>
      </div>
    );
  }

  return (
    <ul className="ed-activity">
      {items.map((a, i) => {
        const Icon = a.icon || Activity;
        return (
          <li key={a.id || i} className="ed-activity-row">
            <span className="ed-activity-mark"><Icon size={15} strokeWidth={2} /></span>
            <div className="ed-activity-main">
              <p className="ed-activity-who">{a.primary}</p>
              {a.secondary && <p className="ed-activity-where">{a.secondary}</p>}
            </div>
            {a.time && (
              <span className="ed-activity-when"><Clock size={12} /> {a.time}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default ActivityFeed;
