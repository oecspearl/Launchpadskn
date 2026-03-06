import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContextSupabase';
import { useToast } from '../../contexts/ToastContext';
import { useStudentData } from '../../hooks/useStudentData';
import { useTutor } from '../../contexts/TutorContext';
import SkeletonLoader from '../common/SkeletonLoader';
import KeyboardShortcutsModal from '../common/KeyboardShortcutsModal';
import { registerShortcutHandler, unregisterShortcutHandler } from '../../utils/keyboardShortcuts';
import { getRecentlyViewedByType } from '../../services/recentlyViewedService';
import StudentPageHero from './StudentPageHero';
import './StudentDashboard.css';

// Subject colour palette for bands
const SUBJECT_COLORS = [
  'var(--skn-green)', 'var(--skn-red)', 'var(--skn-yellow)',
  '#3b82f6', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899',
];
const SUBJECT_EMOJIS = ['📐', '🧪', '📖', '🌍', '🎨', '💻', '🏃', '🎵'];

function getSubjectColor(index) {
  return SUBJECT_COLORS[index % SUBJECT_COLORS.length];
}

function getSubjectEmoji(index) {
  return SUBJECT_EMOJIS[index % SUBJECT_EMOJIS.length];
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'GOOD MORNING';
  if (h < 17) return 'GOOD AFTERNOON';
  return 'GOOD EVENING';
}

function formatTimeSlot(timeStr) {
  if (!timeStr) return { hour: '', ampm: '' };
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return { hour: `${hour12}:${String(m).padStart(2, '0')}`, ampm };
}

function getDaysLeft(dueDate) {
  return Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
}

function getDueClass(daysLeft) {
  if (daysLeft <= 0) return 'brutalist-assignment__due--urgent';
  if (daysLeft <= 3) return 'brutalist-assignment__due--soon';
  return 'brutalist-assignment__due--ok';
}

function StudentDashboard() {
  const { user, lastLoginTime } = useAuth();
  const { showSuccess } = useToast();
  const navigate = useNavigate();
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const { toggleTutor } = useTutor();

  const {
    myClass,
    subjects: mySubjects,
    lessons: weekLessons,
    assignments,
    grades,
    isLoading,
    error
  } = useStudentData(user);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const todayLessons = weekLessons.filter(lesson => {
    const lessonDate = new Date(lesson.lesson_date).toISOString().split('T')[0];
    return lessonDate === todayStr;
  });

  const getSubjectName = (classSubject) => {
    return classSubject?.subject_offering?.subject?.subject_name ||
      classSubject?.subject_name ||
      'Unknown Subject';
  };

  const handleLessonClick = (lesson) => {
    if (lesson?.lesson_id) navigate(`/student/lessons/${lesson.lesson_id}`);
  };

  useEffect(() => {
    registerShortcutHandler('dashboard', () => {
      navigate('/student/dashboard');
      showSuccess('Navigated to Dashboard');
    });
    registerShortcutHandler('lessons', () => navigate('/student/timetable'));
    registerShortcutHandler('help', () => setShowShortcutsModal(true));

    return () => {
      unregisterShortcutHandler('dashboard');
      unregisterShortcutHandler('lessons');
      unregisterShortcutHandler('help');
    };
  }, [navigate, showSuccess]);

  if (isLoading) {
    return (
      <div className="student-brutalist">
        <div style={{ padding: 32 }}>
          <SkeletonLoader variant="dashboard" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-brutalist">
        <div style={{ padding: 32, color: 'var(--skn-red)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
          Error loading dashboard data. Please try again.
        </div>
      </div>
    );
  }

  const pendingAssignments = assignments.filter(a => !a.submission_date);
  const currentHour = today.getHours();
  const currentLessonIndex = todayLessons.findIndex(l => {
    const [h] = (l.start_time || '').split(':').map(Number);
    const [eh] = (l.end_time || '').split(':').map(Number);
    return currentHour >= h && currentHour < eh;
  });

  return (
    <div className="student-brutalist">
      {/* Breadcrumb */}
      <div className="brutalist-breadcrumb">
        <button className="brutalist-breadcrumb__item" onClick={() => navigate('/student/dashboard')}>Home</button>
        <span className="brutalist-breadcrumb__sep">/</span>
        <span className="brutalist-breadcrumb__item brutalist-breadcrumb__item--active">Dashboard</span>
        <span className="brutalist-breadcrumb__pill">Live</span>
      </div>

      {/* Hero */}
      <StudentPageHero
        greeting={getGreeting()}
        studentName={user?.name || 'Student'}
        term={myClass?.form?.form_name}
        week={myClass?.class_name}
        institution="LaunchPad SKN"
        date={today}
        dayStreak={7}
      />

      {/* Page Content */}
      <div className="brutalist-page">

        {/* Stat Row */}
        <div className="brutalist-section fade-up fade-up-1">
          <div className="brutalist-stats">
            <div className="brutalist-stat" style={{ '--stat-accent': 'var(--skn-green)' }}>
              <div className="brutalist-stat__label">Subjects</div>
              <div className="brutalist-stat__value">{mySubjects.length}</div>
              <div className="brutalist-stat__delta brutalist-stat__delta--up">Enrolled</div>
            </div>
            <div className="brutalist-stat" style={{ '--stat-accent': 'var(--skn-red)' }}>
              <div className="brutalist-stat__label">Due Soon</div>
              <div className="brutalist-stat__value">{pendingAssignments.length}</div>
              {pendingAssignments.length > 0 && (
                <div className="brutalist-stat__delta brutalist-stat__delta--warn">Pending</div>
              )}
            </div>
            <div className="brutalist-stat" style={{ '--stat-accent': 'var(--skn-yellow)' }}>
              <div className="brutalist-stat__label">Today's Lessons</div>
              <div className="brutalist-stat__value">{todayLessons.length}</div>
              {currentLessonIndex >= 0 && (
                <div className="brutalist-stat__delta brutalist-stat__delta--up">In progress</div>
              )}
            </div>
            <div className="brutalist-stat" style={{ '--stat-accent': 'var(--slate)' }}>
              <div className="brutalist-stat__label">Grades</div>
              <div className="brutalist-stat__value">{grades.length}</div>
              <div className="brutalist-stat__delta brutalist-stat__delta--up">Recorded</div>
            </div>
          </div>
        </div>

        {/* AI Study Guide Banner */}
        <div className="brutalist-section fade-up fade-up-2">
          <div className="brutalist-ai-banner" onClick={toggleTutor}>
            <div className="brutalist-ai-banner__pattern" />
            <div className="brutalist-ai-banner__accent" />
            <div className="brutalist-ai-banner__icon">🎓</div>
            <div className="brutalist-ai-banner__body">
              <div className="brutalist-ai-banner__available">Available Now</div>
              <h3 className="brutalist-ai-banner__title">Study Guide</h3>
              <div className="brutalist-ai-banner__desc">
                Find videos, get explanations, discover resources, and practice with worksheets
              </div>
            </div>
            <div className="brutalist-ai-banner__cta">
              <div className="brutalist-ai-banner__chips">
                {mySubjects.slice(0, 3).map((s, i) => (
                  <span key={i} className="brutalist-ai-banner__chip">{getSubjectName(s)}</span>
                ))}
              </div>
              <button className="brutalist-ai-banner__btn" onClick={(e) => { e.stopPropagation(); toggleTutor(); }}>
                Launch →
              </button>
            </div>
          </div>
        </div>

        {/* Two Column: Timetable + Side Panels */}
        <div className="brutalist-section fade-up fade-up-3">
          <div className="brutalist-section-header">
            <h2 className="brutalist-section-title">Today's Schedule</h2>
            <button className="brutalist-section-link" onClick={() => navigate('/student/timetable')}>
              Full Timetable →
            </button>
          </div>

          <div className="brutalist-two-col">
            {/* Timetable */}
            <div className="brutalist-timetable">
              <div className="brutalist-timetable__header">
                <h3 className="brutalist-timetable__title">
                  {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h3>
                {currentLessonIndex >= 0 && (
                  <span className="brutalist-timetable__subtitle">
                    Period {currentLessonIndex + 1} Active
                  </span>
                )}
              </div>

              {todayLessons.length === 0 ? (
                <div style={{ padding: '32px 18px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(0,0,0,0.3)' }}>
                  NO LESSONS SCHEDULED TODAY
                </div>
              ) : (
                todayLessons.map((lesson, idx) => {
                  const subjectName = lesson.class_subject?.subject_offering?.subject?.subject_name || 'Lesson';
                  const teacher = lesson.class_subject?.teacher?.name || '';
                  const start = formatTimeSlot(lesson.start_time);
                  const isActive = idx === currentLessonIndex;
                  const isNext = idx === currentLessonIndex + 1;

                  return (
                    <div
                      key={idx}
                      className={`brutalist-timetable__slot ${isActive ? 'brutalist-timetable__slot--active' : ''}`}
                      onClick={() => handleLessonClick(lesson)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="brutalist-timetable__time">
                        <span className="brutalist-timetable__time-hour">{start.hour}</span>
                        <span className="brutalist-timetable__time-ampm">{start.ampm}</span>
                      </div>
                      <div className="brutalist-timetable__band" style={{ background: getSubjectColor(idx) }} />
                      <div className="brutalist-timetable__body">
                        <div className="brutalist-timetable__subject">{subjectName}</div>
                        {teacher && <div className="brutalist-timetable__teacher">{teacher}</div>}
                        {lesson.location && <div className="brutalist-timetable__room">{lesson.location}</div>}
                      </div>
                      <div className="brutalist-timetable__aside">
                        {isActive && <span className="brutalist-chip brutalist-chip--live">Live</span>}
                        {isNext && <span className="brutalist-chip brutalist-chip--next">Up Next</span>}
                        {!isActive && !isNext && idx < currentLessonIndex && (
                          <span className="brutalist-chip brutalist-chip--done">Done</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Side Panels */}
            <div>
              {/* Grades Panel */}
              {grades.length > 0 && (
                <div className="brutalist-panel">
                  <div className="brutalist-panel__header">
                    <h4 className="brutalist-panel__title">Recent Grades</h4>
                    <button className="brutalist-section-link" onClick={() => navigate('/student/grades')}>
                      View All →
                    </button>
                  </div>
                  <div className="brutalist-panel__body">
                    {grades.slice(0, 5).map((grade, idx) => {
                      const subjectName = grade.class_subject?.subject_offering?.subject?.subject_name || 'Subject';
                      const pct = grade.total_marks ? Math.round((grade.marks_obtained / grade.total_marks) * 100) : 0;
                      const letter = pct >= 90 ? 'A' : pct >= 80 ? 'B' : pct >= 70 ? 'C' : pct >= 60 ? 'D' : 'F';
                      const fillColor = pct >= 80 ? 'var(--skn-green)' : pct >= 70 ? 'var(--forest)' : pct >= 60 ? 'var(--amber)' : 'var(--skn-red)';

                      return (
                        <div key={idx} className="brutalist-grade-row">
                          <span className="brutalist-grade-row__subject">{subjectName}</span>
                          <div className="brutalist-grade-row__track">
                            <div className="brutalist-grade-row__fill" style={{ width: `${pct}%`, background: fillColor }} />
                          </div>
                          <span className="brutalist-grade-row__grade" style={{ color: fillColor }}>{letter}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Assignments Due Panel */}
              {assignments.length > 0 && (
                <div className="brutalist-panel">
                  <div className="brutalist-panel__header">
                    <h4 className="brutalist-panel__title">Assignments Due</h4>
                    <button className="brutalist-section-link" onClick={() => navigate('/student/assignments')}>
                      View All →
                    </button>
                  </div>
                  <div className="brutalist-panel__body">
                    {assignments.slice(0, 5).map((assignment, idx) => {
                      const daysLeft = getDaysLeft(assignment.due_date);
                      const dueLabel = daysLeft <= 0 ? 'Overdue' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft}d left`;
                      const dotColor = daysLeft <= 0 ? 'var(--skn-red)' : daysLeft <= 3 ? 'var(--skn-yellow)' : 'var(--fog)';

                      return (
                        <div key={idx} className="brutalist-due-row">
                          <div className="brutalist-due-row__dot" style={{ background: dotColor }} />
                          <div className="brutalist-due-row__info">
                            <div className="brutalist-due-row__title">{assignment.assessment_name}</div>
                            <div className="brutalist-due-row__subject">{assignment.assessment_type}</div>
                          </div>
                          <span className={`brutalist-due-row__date ${getDueClass(daysLeft)}`}>{dueLabel}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Assignments Section */}
        {assignments.length > 0 && (
          <div className="brutalist-section fade-up fade-up-4">
            <div className="brutalist-section-header">
              <h2 className="brutalist-section-title">Assignments</h2>
              <button className="brutalist-section-link" onClick={() => navigate('/student/assignments')}>
                View All →
              </button>
            </div>

            <div className="brutalist-assignments">
              {assignments.slice(0, 4).map((assignment, idx) => {
                const daysLeft = getDaysLeft(assignment.due_date);
                const dueLabel = daysLeft <= 0 ? 'Overdue' : `${daysLeft}d left`;
                const bandColor = daysLeft <= 0 ? 'var(--skn-red)' : daysLeft <= 3 ? 'var(--skn-yellow)' : 'var(--fog)';
                const chipClass = daysLeft <= 0 ? 'brutalist-chip--overdue' : 'brutalist-chip--pending';

                return (
                  <div key={idx} className="brutalist-assignment">
                    <div className="brutalist-assignment__band" style={{ background: bandColor }} />
                    <div className="brutalist-assignment__icon">{getSubjectEmoji(idx)}</div>
                    <div className="brutalist-assignment__body">
                      <div className="brutalist-assignment__eyebrow">
                        {assignment.assessment_type}
                      </div>
                      <h4 className="brutalist-assignment__title">{assignment.assessment_name}</h4>
                      <div className="brutalist-assignment__tags">
                        <span className="brutalist-assignment__tag">{assignment.assessment_type}</span>
                      </div>
                    </div>
                    <div className="brutalist-assignment__aside">
                      <span className={`brutalist-chip ${chipClass}`}>
                        {daysLeft <= 0 ? 'Overdue' : 'Pending'}
                      </span>
                      <span className={`brutalist-assignment__due ${getDueClass(daysLeft)}`}>{dueLabel}</span>
                      <span className="brutalist-assignment__points">
                        {assignment.total_marks || '—'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* My Subjects as Lesson Cards */}
        {mySubjects.length > 0 && (
          <div className="brutalist-section fade-up fade-up-5">
            <div className="brutalist-section-header">
              <h2 className="brutalist-section-title">My Subjects</h2>
              <button className="brutalist-section-link" onClick={() => navigate('/student/subjects')}>
                View All →
              </button>
            </div>

            <div className="brutalist-lessons">
              {mySubjects.slice(0, 3).map((cs, idx) => {
                const name = getSubjectName(cs);
                const color = getSubjectColor(idx);

                return (
                  <div
                    key={idx}
                    className="brutalist-lesson"
                    onClick={() => navigate(`/student/subjects/${cs.class_subject_id}`)}
                  >
                    <div className="brutalist-lesson__image" style={{ background: `linear-gradient(135deg, ${color}22, ${color}11)` }}>
                      {getSubjectEmoji(idx)}
                    </div>
                    <div className="brutalist-lesson__progress">
                      <div className="brutalist-lesson__progress-fill" style={{ width: '0%' }} />
                    </div>
                    <div className="brutalist-lesson__body">
                      <div className="brutalist-lesson__subject">{name}</div>
                      <h4 className="brutalist-lesson__title">{cs.teacher?.name || 'Teacher TBD'}</h4>
                      <div className="brutalist-lesson__footer">
                        <span className="brutalist-lesson__pct">Enrolled</span>
                        <button className="brutalist-lesson__continue">View →</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <KeyboardShortcutsModal
        show={showShortcutsModal}
        onHide={() => setShowShortcutsModal(false)}
      />
    </div>
  );
}

export default StudentDashboard;
