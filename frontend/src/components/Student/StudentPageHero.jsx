import React from 'react';

function StudentPageHero({ greeting, studentName, term, week, institution, date, dayStreak = 0 }) {
  const today = date || new Date();
  const dayNum = today.getDate();
  const monthStr = today.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const dayOfWeek = today.toLocaleString('en-US', { weekday: 'long' }).toUpperCase();

  const firstName = studentName?.split(' ')[0] || 'Student';
  const lastName = studentName?.split(' ').slice(1).join(' ') || '';

  return (
    <div className="brutalist-hero">
      {/* Background layers */}
      <div className="brutalist-hero__bg-grid" />
      <div className="brutalist-hero__bg-green" />
      <div className="brutalist-hero__bg-ink" />
      <div className="brutalist-hero__bg-diag-red" />
      <div className="brutalist-hero__bg-diag-yellow" />

      {/* Content */}
      <div className="brutalist-hero__content">
        <div className="brutalist-hero__left">
          <div className="brutalist-hero__rule" />
          <div className="brutalist-hero__greeting">
            {greeting || 'GOOD MORNING'}
          </div>
          <h1 className="brutalist-hero__name">
            <span className="brutalist-hero__name-first">{firstName}</span>
            {lastName && <> {lastName}</>}
          </h1>
          <div className="brutalist-hero__meta">
            {term && <>{term}</>}
            {week && <> · Week {week}</>}
            {institution && <> · {institution}</>}
          </div>
        </div>

        <div className="brutalist-hero__right">
          <div className="brutalist-hero__date">
            <span className="brutalist-hero__date-num">{dayNum}</span>
            <span className="brutalist-hero__date-month">{monthStr}</span>
            <span className="brutalist-hero__date-day">{dayOfWeek}</span>
          </div>

          {dayStreak > 0 && (
            <>
              <div className="brutalist-hero__divider" />
              <div className="brutalist-hero__streak">
                <span className="brutalist-hero__streak-icon">🔥</span>
                <span className="brutalist-hero__streak-num">{dayStreak}</span>
                <span className="brutalist-hero__streak-label">DAY STREAK</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentPageHero;
