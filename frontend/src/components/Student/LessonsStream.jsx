import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { 
  FaCalendarAlt, FaClock, FaMapMarkerAlt, FaChevronRight
} from 'react-icons/fa';
import './LessonsStream.css';

function LessonsStream({ lessons = [], classSubjectId }) {
  const navigate = useNavigate();

  // Helper function to format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Helper function to format time
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
  };

  // Group lessons by month
  const groupLessonsByMonth = (lessons) => {
    const grouped = {};
    
    lessons.forEach(lesson => {
      if (!lesson.lesson_date) return;
      
      const date = new Date(lesson.lesson_date);
      const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(lesson);
    });

    // Sort lessons within each month by date
    Object.keys(grouped).forEach(month => {
      grouped[month].sort((a, b) => {
        const dateA = new Date(a.lesson_date);
        const dateB = new Date(b.lesson_date);
        return dateA - dateB;
      });
    });

    return grouped;
  };

  // Determine if lesson is past, today, or upcoming
  const getLessonStatus = (lesson) => {
    if (!lesson.lesson_date) return 'upcoming';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lessonDate = new Date(lesson.lesson_date);
    lessonDate.setHours(0, 0, 0, 0);
    
    if (lessonDate < today) return 'past';
    if (lessonDate.getTime() === today.getTime()) return 'today';
    return 'upcoming';
  };

  const groupedLessons = groupLessonsByMonth(lessons);
  const months = Object.keys(groupedLessons).sort((a, b) => {
    return new Date(a) - new Date(b);
  });

  if (!lessons || lessons.length === 0) {
    return (
      <div className="lessons-stream-container">
        <Card>
          <Card.Body className="text-center py-5">
            <p className="text-muted mb-0">No lessons available</p>
          </Card.Body>
        </Card>
      </div>
    );
  }

  return (
    <div className="lessons-stream-container">
      <div className="lessons-stream-timeline">
        {months.map((month) => (
          <div key={month} className="month-section">
            <div className="month-header">
              <h3 className="month-title">{month}</h3>
            </div>
            <div className="lessons-list">
              {groupedLessons[month].map((lesson, index) => {
                const status = getLessonStatus(lesson);
                const isPast = status === 'past';
                const isToday = status === 'today';
                
                return (
                  <Card 
                    key={lesson.lesson_id || index} 
                    className={`lesson-stream-card ${
                      isToday ? 'lesson-today' : 
                      isPast ? 'lesson-past' : 
                      'lesson-upcoming'
                    }`}
                  >
                    <Card.Body className="lesson-card-body">
                      <div className="lesson-card-content">
                        <div className="lesson-header">
                          <h5 className="lesson-title">
                            {lesson.lesson_title || 'Lesson'}
                          </h5>
                          {lesson.status && (
                            <Badge 
                              bg={
                                lesson.status === 'COMPLETED' ? 'success' :
                                lesson.status === 'CANCELLED' ? 'danger' :
                                isPast ? 'secondary' : 'primary'
                              }
                              className="lesson-status-badge"
                            >
                              {lesson.status || (isPast ? 'Past' : 'Upcoming')}
                            </Badge>
                          )}
                        </div>

                        <div className="lesson-meta">
                          {lesson.lesson_date && (
                            <div className="meta-item">
                              <FaCalendarAlt className="me-1" />
                              <span>{formatDate(lesson.lesson_date)}</span>
                            </div>
                          )}
                          {lesson.start_time && lesson.end_time && (
                            <div className="meta-item">
                              <FaClock className="me-1" />
                              <span>{formatTime(lesson.start_time)} - {formatTime(lesson.end_time)}</span>
                            </div>
                          )}
                          {lesson.location && (
                            <div className="meta-item">
                              <FaMapMarkerAlt className="me-1" />
                              <span>{lesson.location}</span>
                            </div>
                          )}
                        </div>

                        {lesson.topic && (
                          <div className="lesson-topic">
                            <Badge bg="info" className="me-1">Topic</Badge>
                            <span className="small">{lesson.topic}</span>
                          </div>
                        )}

                        {lesson.description && (
                          <p className="lesson-description">
                            {lesson.description.length > 150
                              ? `${lesson.description.substring(0, 150)}...`
                              : lesson.description}
                          </p>
                        )}

                        {lesson.homework_description && (
                          <div className="lesson-homework">
                            <Badge bg="warning">Homework Assigned</Badge>
                            {lesson.homework_due_date && (
                              <small className="text-muted ms-2">
                                Due: {formatDate(lesson.homework_due_date)}
                              </small>
                            )}
                          </div>
                        )}

                        <div className="lesson-action">
                          <Button
                            variant={isPast ? "outline-secondary" : "primary"}
                            size="sm"
                            onClick={() => navigate(`/student/lessons/${lesson.lesson_id}`)}
                            className="lesson-action-btn"
                          >
                            {isPast ? 'Review' : 'View'}
                            <FaChevronRight className="ms-1" style={{ fontSize: '0.75rem' }} />
                          </Button>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LessonsStream;
