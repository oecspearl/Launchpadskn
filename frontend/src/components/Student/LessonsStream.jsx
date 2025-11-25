import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { 
  FaCalendarAlt, FaClock, FaMapMarkerAlt, FaChevronRight, FaCube
} from 'react-icons/fa';
import { supabase } from '../../config/supabase';
import ModelViewerComponent from '../InteractiveContent/Viewers/ModelViewerComponent';
import ViewerErrorBoundary from '../InteractiveContent/Viewers/ViewerErrorBoundary';
import './LessonsStream.css';

function LessonsStream({ lessons = [], classSubjectId }) {
  const navigate = useNavigate();
  const [lessonContentMap, setLessonContentMap] = useState({});
  const [loadingContent, setLoadingContent] = useState({});

  // Fetch content for lessons that have 3D models
  useEffect(() => {
    if (!lessons || lessons.length === 0) return;

    const fetchLessonContent = async () => {
      const lessonIds = lessons.map(l => l.lesson_id).filter(Boolean);
      if (lessonIds.length === 0) return;

      try {
        const { data, error } = await supabase
          .from('lesson_content')
          .select('lesson_id, content_type, content_id, title, url, metadata')
          .in('lesson_id', lessonIds)
          .eq('content_type', '3D_MODEL')
          .eq('is_published', true);

        if (error) {
          console.error('Error fetching lesson content:', error);
          return;
        }

        // Group content by lesson_id
        const contentMap = {};
        (data || []).forEach(item => {
          if (!contentMap[item.lesson_id]) {
            contentMap[item.lesson_id] = [];
          }
          contentMap[item.lesson_id].push(item);
        });

        setLessonContentMap(contentMap);
      } catch (err) {
        console.error('Error fetching lesson content:', err);
      }
    };

    fetchLessonContent();
  }, [lessons]);

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

                        {/* 3D Model Preview */}
                        {lessonContentMap[lesson.lesson_id] && lessonContentMap[lesson.lesson_id].length > 0 && (
                          <div className="lesson-3d-preview mt-3 mb-3">
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <FaCube className="text-primary" />
                              <Badge bg="primary">3D Model Available</Badge>
                            </div>
                            <div 
                              style={{ 
                                width: '100%', 
                                height: '200px', 
                                borderRadius: '8px', 
                                overflow: 'hidden',
                                border: '1px solid #dee2e6',
                                backgroundColor: '#1a1a1a',
                                position: 'relative',
                                cursor: 'pointer'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/student/lessons/${lesson.lesson_id}`);
                              }}
                            >
                              <ViewerErrorBoundary>
                                <ModelViewerComponent
                                  contentUrl={lessonContentMap[lesson.lesson_id][0].url}
                                  modelFormat="GLTF"
                                  modelProperties={{
                                    autoRotate: true,
                                    cameraControls: true,
                                    exposure: 1,
                                    shadowIntensity: 1,
                                    height: '200px'
                                  }}
                                  annotations={[]}
                                  onInteraction={() => {}}
                                  onStateChange={() => {}}
                                />
                              </ViewerErrorBoundary>
                              <div 
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.5) 100%)',
                                  pointerEvents: 'none',
                                  display: 'flex',
                                  alignItems: 'flex-end',
                                  padding: '8px'
                                }}
                              >
                                <small className="text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                                  Click to view full lesson
                                </small>
                              </div>
                            </div>
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
