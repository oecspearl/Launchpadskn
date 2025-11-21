import React, { useState, useMemo } from 'react';
import { Card, Badge, Button, Form, InputGroup } from 'react-bootstrap';
import { 
  FaCalendarAlt, FaClock, FaMapMarkerAlt, FaBook, 
  FaChevronRight, FaSearch, FaFilter
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './LessonsStream.css';

function LessonsStream({ lessons = [], classSubjectId = null }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, upcoming, past
  const [filterMonth, setFilterMonth] = useState('all');

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Format time helper
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
  };

  // Get month name helper
  const getMonthName = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Process and filter lessons
  const processedLessons = useMemo(() => {
    const now = new Date();
    
    return lessons.map(lesson => {
      const lessonDate = new Date(lesson.lesson_date + 'T' + (lesson.start_time || '00:00:00'));
      const isPast = lessonDate < now;
      const isToday = lessonDate.toDateString() === now.toDateString();
      const isUpcoming = !isPast && !isToday;
      
      return {
        ...lesson,
        lessonDateObj: lessonDate,
        isPast,
        isToday,
        isUpcoming,
        monthKey: lessonDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      };
    });
  }, [lessons]);

  // Filter lessons based on search, status, and month
  const filteredLessons = useMemo(() => {
    let filtered = processedLessons;

    // Filter by status
    if (filterStatus === 'upcoming') {
      filtered = filtered.filter(l => l.isUpcoming || l.isToday);
    } else if (filterStatus === 'past') {
      filtered = filtered.filter(l => l.isPast);
    }

    // Filter by month
    if (filterMonth !== 'all') {
      filtered = filtered.filter(l => l.monthKey === filterMonth);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(lesson => 
        (lesson.lesson_title || '').toLowerCase().includes(query) ||
        (lesson.topic || '').toLowerCase().includes(query) ||
        (lesson.description || '').toLowerCase().includes(query)
      );
    }

    // Sort: upcoming first (chronological), then past (reverse chronological)
    return filtered.sort((a, b) => {
      if (a.isUpcoming && b.isPast) return -1;
      if (a.isPast && b.isUpcoming) return 1;
      if (a.isToday && !b.isToday) return -1;
      if (!a.isToday && b.isToday) return 1;
      
      // Same category, sort by date
      return a.isUpcoming 
        ? a.lessonDateObj - b.lessonDateObj  // Upcoming: chronological
        : b.lessonDateObj - a.lessonDateObj; // Past: reverse chronological
    });
  }, [processedLessons, filterStatus, filterMonth, searchQuery]);

  // Group lessons by month
  const lessonsByMonth = useMemo(() => {
    const grouped = {};
    filteredLessons.forEach(lesson => {
      if (!grouped[lesson.monthKey]) {
        grouped[lesson.monthKey] = [];
      }
      grouped[lesson.monthKey].push(lesson);
    });
    return grouped;
  }, [filteredLessons]);

  // Get unique months for filter dropdown
  const availableMonths = useMemo(() => {
    const months = [...new Set(processedLessons.map(l => l.monthKey))].sort((a, b) => {
      return new Date(a) - new Date(b);
    });
    return months;
  }, [processedLessons]);

  // Get status badge
  const getStatusBadge = (lesson) => {
    if (lesson.isToday) {
      return <Badge bg="primary">Today</Badge>;
    } else if (lesson.isUpcoming) {
      return <Badge bg="success">Upcoming</Badge>;
    } else {
      return <Badge bg="secondary">Past</Badge>;
    }
  };

  // Get lesson card class
  const getLessonCardClass = (lesson) => {
    let classes = 'lesson-stream-card';
    if (lesson.isToday) classes += ' lesson-today';
    if (lesson.isUpcoming) classes += ' lesson-upcoming';
    if (lesson.isPast) classes += ' lesson-past';
    return classes;
  };

  if (lessons.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <Card.Body className="text-center py-5">
          <FaBook className="text-muted mb-3" style={{ fontSize: '3rem' }} />
          <p className="text-muted mb-0">No lessons available yet</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div className="lessons-stream-container">
      {/* Filters and Search */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <div className="row g-3">
            <div className="col-md-6">
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search lessons by title, topic, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </InputGroup>
            </div>
            <div className="col-md-3">
              <Form.Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Lessons</option>
                <option value="upcoming">Upcoming & Today</option>
                <option value="past">Past Lessons</option>
              </Form.Select>
            </div>
            <div className="col-md-3">
              <Form.Select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
              >
                <option value="all">All Months</option>
                {availableMonths.map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </Form.Select>
            </div>
          </div>
          {filteredLessons.length !== lessons.length && (
            <div className="mt-3">
              <small className="text-muted">
                Showing {filteredLessons.length} of {lessons.length} lessons
              </small>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Lessons Stream */}
      {filteredLessons.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center py-5">
            <FaFilter className="text-muted mb-3" style={{ fontSize: '3rem' }} />
            <p className="text-muted mb-0">No lessons match your filters</p>
            <Button 
              variant="outline-primary" 
              size="sm" 
              className="mt-3"
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('all');
                setFilterMonth('all');
              }}
            >
              Clear Filters
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <div className="lessons-stream-timeline">
          {Object.keys(lessonsByMonth).map(monthKey => (
            <div key={monthKey} className="month-section">
              <div className="month-header">
                <h5 className="month-title">{monthKey}</h5>
                <Badge bg="light" text="dark">
                  {lessonsByMonth[monthKey].length} lesson{lessonsByMonth[monthKey].length !== 1 ? 's' : ''}
                </Badge>
              </div>
              
              <div className="lessons-list">
                {lessonsByMonth[monthKey].map((lesson, index) => (
                  <Card 
                    key={lesson.lesson_id || index} 
                    className={getLessonCardClass(lesson)}
                  >
                    <Card.Body className="lesson-card-body">
                      <div className="lesson-card-content">
                        <div className="lesson-header">
                          <h6 className="lesson-title">{lesson.lesson_title || 'Lesson'}</h6>
                          <div className="lesson-status-badge">
                            {getStatusBadge(lesson)}
                          </div>
                        </div>
                        
                        <div className="lesson-meta">
                          <div className="meta-item">
                            <FaCalendarAlt className="me-1" />
                            <span>{formatDate(lesson.lesson_date)}</span>
                          </div>
                          {lesson.start_time && (
                            <div className="meta-item">
                              <FaClock className="me-1" />
                              <span>
                                {formatTime(lesson.start_time)}
                                {lesson.end_time && ` - ${formatTime(lesson.end_time)}`}
                              </span>
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
                            variant={lesson.isPast ? "outline-secondary" : "primary"}
                            size="sm"
                            onClick={() => navigate(`/student/lessons/${lesson.lesson_id}`)}
                            className="lesson-action-btn"
                          >
                            {lesson.isPast ? 'Review' : 'View'}
                            <FaChevronRight className="ms-1" style={{ fontSize: '0.75rem' }} />
                          </Button>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LessonsStream;

