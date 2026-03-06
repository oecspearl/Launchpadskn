import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContextSupabase';
import { useToast } from '../../contexts/ToastContext';
import { classService } from '../../services/classService';
import { studentService } from '../../services/studentService';
import Timetable from '../common/Timetable';
import SkeletonLoader from '../common/SkeletonLoader';
import KeyboardShortcutsModal from '../common/KeyboardShortcutsModal';
import { registerShortcutHandler, unregisterShortcutHandler } from '../../utils/keyboardShortcuts';
import './TeacherDashboard.css';

const SUBJECT_COLORS = [
  'var(--skn-green)', 'var(--skn-red)', 'var(--skn-yellow)',
  '#3b82f6', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899',
];

function getSubjectColor(index) {
  return SUBJECT_COLORS[index % SUBJECT_COLORS.length];
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'GOOD MORNING';
  if (h < 17) return 'GOOD AFTERNOON';
  return 'GOOD EVENING';
}

function TeacherDashboard() {
  const { user, lastLoginTime } = useAuth();
  const { showSuccess } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Get teacher ID
  const teacherId = user?.user_id || user?.userId || user?.id;
  const isValidTeacherId = teacherId && (typeof teacherId === 'number' || !teacherId.includes('-'));

  // Queries
  const { data: myClasses = [], isLoading: isLoadingClasses } = useQuery({
    queryKey: ['teacher-classes', teacherId],
    queryFn: () => classService.getClassesByTeacher(teacherId),
    enabled: !!isValidTeacherId
  });

  // Get week date range
  const { weekStart, weekEnd, todayStr } = useMemo(() => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    return {
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      todayStr: today.toISOString().split('T')[0]
    };
  }, []);

  const { data: weekLessons = [], isLoading: isLoadingLessons } = useQuery({
    queryKey: ['teacher-lessons', teacherId, weekStart, weekEnd],
    queryFn: () => classService.getLessonsByTeacher(teacherId, weekStart, weekEnd),
    enabled: !!isValidTeacherId
  });

  // Get assessments for all class subjects
  const { data: allAssessments = [], isLoading: isLoadingAssessments } = useQuery({
    queryKey: ['teacher-assessments', myClasses.map(cs => cs.class_subject_id)],
    queryFn: async () => {
      const assessments = [];
      for (const classSubject of myClasses) {
        try {
          const csAssessments = await studentService.getAssessmentsByClassSubject(
            classSubject.class_subject_id
          );
          assessments.push(...(csAssessments || []));
        } catch (err) {
          console.warn('Error fetching assessments:', err);
        }
      }
      return assessments;
    },
    enabled: myClasses.length > 0
  });

  const isLoading = isLoadingClasses || isLoadingLessons || isLoadingAssessments;

  // Computed data
  const todayLessons = useMemo(() => {
    return (weekLessons || [])
      .filter(lesson => {
        const lessonDate = new Date(lesson.lesson_date).toISOString().split('T')[0];
        return lessonDate === todayStr;
      })
      .sort((a, b) => {
        const timeA = a.start_time || '00:00';
        const timeB = b.start_time || '00:00';
        return timeA.localeCompare(timeB);
      });
  }, [weekLessons, todayStr]);

  const upcomingAssessments = useMemo(() => {
    return (allAssessments || [])
      .filter(a => a.due_date && new Date(a.due_date) >= new Date())
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
      .slice(0, 5);
  }, [allAssessments]);

  const uniqueClasses = useMemo(() => {
    return Array.from(
      new Map(myClasses.map(cs => [cs.class?.class_id, cs])).values()
    );
  }, [myClasses]);

  // Helper functions
  const getSubjectName = (classSubject) => {
    return classSubject?.subject_offering?.subject?.subject_name ||
      classSubject?.subject_name ||
      'Subject';
  };

  const getClassName = (classSubject) => {
    return classSubject?.class?.class_name || '';
  };

  const getFormName = (classSubject) => {
    return classSubject?.class?.form?.form_name || '';
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
  };

  const formatLastLogin = () => {
    if (!lastLoginTime) return null;
    const date = new Date(lastLoginTime);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // Register keyboard shortcuts
  useEffect(() => {
    registerShortcutHandler('dashboard', () => {
      navigate('/teacher');
      showSuccess('Navigated to Dashboard');
    });

    registerShortcutHandler('lessons', () => {
      setActiveTab('classes');
      showSuccess('Viewing Classes');
    });

    registerShortcutHandler('help', () => {
      setShowShortcutsModal(true);
    });

    return () => {
      unregisterShortcutHandler('dashboard');
      unregisterShortcutHandler('lessons');
      unregisterShortcutHandler('help');
    };
  }, [navigate, showSuccess]);

  const today = new Date();

  if (!isValidTeacherId) {
    return (
      <div className="teacher-brutalist">
        <div className="teacher-alert">Loading user information...</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="teacher-brutalist">
        <div style={{ padding: 32 }}>
          <SkeletonLoader variant="dashboard" />
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-brutalist">
      {/* Hero */}
      <div className="teacher-hero">
        <div className="teacher-hero__bg-grid" />
        <div className="teacher-hero__bg-green" />
        <div className="teacher-hero__bg-ink" />
        <div className="teacher-hero__bg-diag-red" />
        <div className="teacher-hero__bg-diag-yellow" />

        <div className="teacher-hero__content">
          <div className="teacher-hero__left">
            <div className="teacher-hero__rule" />
            <div className="teacher-hero__greeting">{getGreeting()}</div>
            <h1 className="teacher-hero__name">{user?.name || 'Teacher'}</h1>
            <div className="teacher-hero__meta">
              {uniqueClasses.length} class{uniqueClasses.length !== 1 ? 'es' : ''} · {myClasses.length} subject{myClasses.length !== 1 ? 's' : ''}
              {formatLastLogin() && <> · Last login: {formatLastLogin()}</>}
            </div>
          </div>
          <div className="teacher-hero__right">
            <div className="teacher-hero__date">
              <span className="teacher-hero__date-num">{today.getDate()}</span>
              <span className="teacher-hero__date-month">
                {today.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
              </span>
              <span className="teacher-hero__date-day">
                {today.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="teacher-tabs">
        <button
          className={`teacher-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`teacher-tab ${activeTab === 'timetable' ? 'active' : ''}`}
          onClick={() => setActiveTab('timetable')}
        >
          Timetable
        </button>
        <button
          className={`teacher-tab ${activeTab === 'classes' ? 'active' : ''}`}
          onClick={() => setActiveTab('classes')}
        >
          My Classes
        </button>
      </div>

      {/* Page Content */}
      <div className="teacher-page">
        {activeTab === 'overview' && (
          <>
            {/* Stat Row */}
            <div className="teacher-section fade-up fade-up-1">
              <div className="teacher-stats">
                <div className="teacher-stat" style={{ '--stat-accent': 'var(--skn-green)' }}>
                  <div className="teacher-stat__label">Classes</div>
                  <div className="teacher-stat__value">{uniqueClasses.length}</div>
                  <div className="teacher-stat__delta teacher-stat__delta--up">Active this term</div>
                </div>
                <div className="teacher-stat" style={{ '--stat-accent': 'var(--skn-yellow)' }}>
                  <div className="teacher-stat__label">Today's Lessons</div>
                  <div className="teacher-stat__value">{todayLessons.length}</div>
                  <div className="teacher-stat__delta teacher-stat__delta--up">Scheduled</div>
                </div>
                <div className="teacher-stat" style={{ '--stat-accent': '#3b82f6' }}>
                  <div className="teacher-stat__label">Subjects</div>
                  <div className="teacher-stat__value">{myClasses.length}</div>
                  <div className="teacher-stat__delta teacher-stat__delta--up">Assigned</div>
                </div>
                <div className="teacher-stat" style={{ '--stat-accent': 'var(--skn-red)' }}>
                  <div className="teacher-stat__label">Assessments</div>
                  <div className="teacher-stat__value">{upcomingAssessments.length}</div>
                  <div className="teacher-stat__delta teacher-stat__delta--warn">Upcoming</div>
                </div>
              </div>
            </div>

            {/* Two Column: Lessons + Side Panels */}
            <div className="teacher-section fade-up fade-up-2">
              <div className="teacher-section-header">
                <h2 className="teacher-section-title">Today's Schedule</h2>
                <button className="teacher-section-link" onClick={() => setActiveTab('timetable')}>
                  Full Timetable →
                </button>
              </div>

              <div className="teacher-two-col">
                {/* Today's Lessons */}
                <div className="teacher-lessons-panel">
                  <div className="teacher-lessons-panel__header">
                    <h3 className="teacher-lessons-panel__title">
                      {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </h3>
                    <span className="teacher-lessons-panel__count">
                      {todayLessons.length} lesson{todayLessons.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {todayLessons.length === 0 ? (
                    <div className="teacher-empty">No lessons scheduled today</div>
                  ) : (
                    todayLessons.map((lesson, idx) => {
                      const subjectName = lesson.class_subject?.subject_offering?.subject?.subject_name || 'Lesson';
                      const className = lesson.class_subject?.class?.class_name || '';

                      return (
                        <div key={idx} className="teacher-lesson-slot">
                          <div className="teacher-lesson-slot__time">
                            <span className="teacher-lesson-slot__time-hour">{formatTime(lesson.start_time)}</span>
                            <span className="teacher-lesson-slot__time-end">{formatTime(lesson.end_time)}</span>
                          </div>
                          <div className="teacher-lesson-slot__band" style={{ background: getSubjectColor(idx) }} />
                          <div className="teacher-lesson-slot__body">
                            <div className="teacher-lesson-slot__subject">{subjectName}</div>
                            <div className="teacher-lesson-slot__class">{className}</div>
                            {lesson.location && (
                              <div className="teacher-lesson-slot__room">{lesson.location}</div>
                            )}
                            {lesson.lesson_title && (
                              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 12, fontStyle: 'italic', color: 'rgba(0,0,0,0.4)', marginTop: 4 }}>
                                {lesson.lesson_title}
                              </div>
                            )}
                          </div>
                          <div className="teacher-lesson-slot__action">
                            <button
                              className="teacher-lesson-slot__btn"
                              onClick={() => navigate(`/teacher/lessons/${lesson.lesson_id}`)}
                            >
                              View →
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Side Panels */}
                <div>
                  {/* Upcoming Assessments */}
                  {upcomingAssessments.length > 0 && (
                    <div className="teacher-panel">
                      <div className="teacher-panel__header">
                        <h4 className="teacher-panel__title">Upcoming Assessments</h4>
                      </div>
                      <div className="teacher-panel__body">
                        {upcomingAssessments.map((assessment, idx) => {
                          const dueDate = new Date(assessment.due_date);
                          const daysLeft = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
                          const dueLabel = daysLeft <= 0 ? 'Overdue' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft}d left`;
                          const dotColor = daysLeft <= 0 ? 'var(--skn-red)' : daysLeft <= 3 ? 'var(--skn-yellow)' : 'var(--fog)';
                          const dueClass = daysLeft <= 0 ? 'teacher-assess-row__due--urgent' : daysLeft <= 3 ? 'teacher-assess-row__due--soon' : 'teacher-assess-row__due--ok';

                          return (
                            <div key={idx} className="teacher-assess-row">
                              <div className="teacher-assess-row__dot" style={{ background: dotColor }} />
                              <div className="teacher-assess-row__info">
                                <div className="teacher-assess-row__name">{assessment.assessment_name}</div>
                                <div className="teacher-assess-row__type">{assessment.assessment_type}</div>
                              </div>
                              <span className={`teacher-assess-row__due ${dueClass}`}>{dueLabel}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Quick Classes Panel */}
                  <div className="teacher-panel">
                    <div className="teacher-panel__header">
                      <h4 className="teacher-panel__title">My Classes</h4>
                      <button className="teacher-section-link" onClick={() => setActiveTab('classes')}>
                        View All →
                      </button>
                    </div>
                    <div className="teacher-panel__body">
                      {uniqueClasses.length === 0 ? (
                        <div className="teacher-empty">No classes assigned</div>
                      ) : (
                        uniqueClasses.slice(0, 4).map((cs, idx) => {
                          const classId = cs.class?.class_id;
                          const subjectsForClass = myClasses.filter(s => s.class?.class_id === classId);
                          return (
                            <div
                              key={idx}
                              className="teacher-assess-row"
                              style={{ cursor: 'pointer' }}
                              onClick={() => navigate(`/teacher/classes/${classId}`)}
                            >
                              <div className="teacher-assess-row__dot" style={{ background: getSubjectColor(idx) }} />
                              <div className="teacher-assess-row__info">
                                <div className="teacher-assess-row__name">
                                  {getFormName(cs)} - {getClassName(cs)}
                                </div>
                                <div className="teacher-assess-row__type">
                                  {subjectsForClass.length} subject{subjectsForClass.length !== 1 ? 's' : ''}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Classes Grid */}
            <div className="teacher-section fade-up fade-up-3">
              <div className="teacher-section-header">
                <h2 className="teacher-section-title">All Classes</h2>
              </div>

              {uniqueClasses.length === 0 ? (
                <div className="teacher-panel">
                  <div className="teacher-empty">No classes assigned to you</div>
                </div>
              ) : (
                <div className="teacher-classes-grid">
                  {uniqueClasses.map((classSubject, index) => {
                    const className = getClassName(classSubject);
                    const formName = getFormName(classSubject);
                    const classId = classSubject.class?.class_id;
                    const subjectsForClass = myClasses.filter(cs => cs.class?.class_id === classId);

                    return (
                      <div key={index} className="teacher-class-card" onClick={() => navigate(`/teacher/classes/${classId}`)}>
                        <div className="teacher-class-card__name">{className}</div>
                        <div className="teacher-class-card__form">{formName}</div>
                        <div className="teacher-class-card__subjects">
                          {subjectsForClass.map((cs, idx) => (
                            <span key={idx} className="teacher-class-card__subject-tag">
                              {getSubjectName(cs)}
                            </span>
                          ))}
                        </div>
                        <button
                          className="teacher-class-card__btn"
                          onClick={(e) => { e.stopPropagation(); navigate(`/teacher/classes/${classId}`); }}
                        >
                          Manage Class
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'timetable' && (
          <div className="teacher-section fade-up fade-up-1">
            <Timetable lessons={weekLessons} />
          </div>
        )}

        {activeTab === 'classes' && (
          <div className="teacher-section fade-up fade-up-1">
            {uniqueClasses.length === 0 ? (
              <div className="teacher-panel">
                <div className="teacher-empty">No classes assigned to you</div>
              </div>
            ) : (
              <div className="teacher-classes-grid">
                {uniqueClasses.map((classSubject, index) => {
                  const className = getClassName(classSubject);
                  const formName = getFormName(classSubject);
                  const classId = classSubject.class?.class_id;
                  const subjectsForClass = myClasses.filter(cs => cs.class?.class_id === classId);

                  return (
                    <div key={index} className="teacher-class-card" onClick={() => navigate(`/teacher/classes/${classId}`)}>
                      <div className="teacher-class-card__name">{className}</div>
                      <div className="teacher-class-card__form">{formName}</div>
                      <div className="teacher-class-card__subjects">
                        {subjectsForClass.map((cs, idx) => (
                          <span key={idx} className="teacher-class-card__subject-tag">
                            {getSubjectName(cs)}
                          </span>
                        ))}
                      </div>
                      <button
                        className="teacher-class-card__btn"
                        onClick={(e) => { e.stopPropagation(); navigate(`/teacher/classes/${classId}`); }}
                      >
                        Manage Class
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
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

export default TeacherDashboard;
