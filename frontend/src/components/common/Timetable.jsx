import React from 'react';
import { Card, Badge } from 'react-bootstrap';
import { FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import './Timetable.css';

/**
 * Timetable Component
 * Displays lessons in a weekly grid format
 * Shows time slots and lessons scheduled for each day
 */
function Timetable({ lessons = [], startDate = null, onLessonClick = null }) {
  // Default to current week if no startDate
  const weekStart = startDate 
    ? new Date(startDate) 
    : new Date(Date.now() - new Date().getDay() * 24 * 60 * 60 * 1000);
  
  weekStart.setHours(0, 0, 0, 0);
  
  // Generate week days
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    weekDays.push(date);
  }
  
  // Standard time slots (8 AM to 3 PM)
  const timeSlots = [
    { start: '08:00', end: '08:45', period: 1 },
    { start: '08:45', end: '09:30', period: 2 },
    { start: '09:30', end: '10:00', break: true }, // Break
    { start: '10:00', end: '10:45', period: 3 },
    { start: '10:45', end: '11:30', period: 4 },
    { start: '11:30', end: '12:15', period: 5 },
    { start: '12:15', end: '13:00', break: true }, // Lunch
    { start: '13:00', end: '13:45', period: 6 },
    { start: '13:45', end: '14:30', period: 7 },
    { start: '14:30', end: '15:15', period: 8 }
  ];
  
  // Group lessons by date and time
  const lessonsByDate = {};
  lessons.forEach(lesson => {
    const lessonDate = new Date(lesson.lesson_date).toDateString();
    if (!lessonsByDate[lessonDate]) {
      lessonsByDate[lessonDate] = {};
    }
    const timeKey = lesson.start_time?.substring(0, 5) || '00:00';
    lessonsByDate[lessonDate][timeKey] = lesson;
  });
  
  // Get lesson for specific date and time
  const getLesson = (date, timeSlot) => {
    const dateStr = date.toDateString();
    return lessonsByDate[dateStr]?.[timeSlot.start] || null;
  };
  
  // Format day name
  const getDayName = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isToday = date.toDateString() === today.toDateString();
    
    return {
      short: date.toLocaleDateString('en-US', { weekday: 'short' }),
      full: date.toLocaleDateString('en-US', { weekday: 'long' }),
      date: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      isToday
    };
  };
  
  // Get subject name from lesson
  const getSubjectName = (lesson) => {
    if (lesson.class_subject?.subject_offering?.subject?.subject_name) {
      return lesson.class_subject.subject_offering.subject.subject_name;
    }
    return lesson.lesson_title || 'Lesson';
  };
  
  // Get class name from lesson
  const getClassName = (lesson) => {
    if (lesson.class_subject?.class?.class_name) {
      return lesson.class_subject.class.class_name;
    }
    return '';
  };
  
  if (lessons.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <Card.Body className="text-center py-5">
          <p className="text-muted mb-0">No lessons scheduled for this week</p>
        </Card.Body>
      </Card>
    );
  }
  
  return (
    <div className="timetable-container">
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-0 py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Weekly Timetable</h5>
            <small className="text-muted">
              {weekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - 
              {weekDays[6].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            </small>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <table className="table timetable-table mb-0">
              <thead>
                <tr>
                  <th className="time-column">Time</th>
                  {weekDays.map((day, index) => {
                    const dayInfo = getDayName(day);
                    return (
                      <th 
                        key={index} 
                        className={`day-column ${dayInfo.isToday ? 'today' : ''}`}
                      >
                        <div className="day-header">
                          <div className="day-name">{dayInfo.short}</div>
                          <div className="day-date">
                            {dayInfo.date} {dayInfo.month}
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((slot, slotIndex) => {
                  if (slot.break) {
                    return (
                      <tr key={slotIndex} className="break-row">
                        <td colSpan={8} className="break-cell text-center">
                          <small className="text-muted">
                            {slot.start === '09:30' ? 'Break' : 'Lunch'}
                          </small>
                        </td>
                      </tr>
                    );
                  }
                  
                  return (
                    <tr key={slotIndex}>
                      <td className="time-cell">
                        <div className="time-slot">
                          <div className="time-start">{slot.start}</div>
                          <div className="time-end">{slot.end}</div>
                        </div>
                      </td>
                      {weekDays.map((day, dayIndex) => {
                        const lesson = getLesson(day, slot);
                        const dayInfo = getDayName(day);
                        
                        if (!lesson) {
                          return (
                            <td 
                              key={dayIndex} 
                              className={`lesson-cell empty ${dayInfo.isToday ? 'today' : ''}`}
                            >
                              <div className="empty-slot"></div>
                            </td>
                          );
                        }
                        
                        const subjectName = getSubjectName(lesson);
                        const className = getClassName(lesson);
                        
                        return (
                          <td 
                            key={dayIndex} 
                            className={`lesson-cell filled ${dayInfo.isToday ? 'today' : ''} ${onLessonClick ? 'clickable' : ''}`}
                            onClick={onLessonClick ? () => onLessonClick(lesson) : undefined}
                            style={onLessonClick ? { cursor: 'pointer' } : {}}
                          >
                            <div className="lesson-card">
                              <div className="lesson-subject">{subjectName}</div>
                              {className && (
                                <div className="lesson-class">{className}</div>
                              )}
                              {lesson.location && (
                                <div className="lesson-location">
                                  <FaMapMarkerAlt size={10} />
                                  {lesson.location}
                                </div>
                              )}
                              <div className="lesson-time">
                                <FaClock size={10} />
                                {lesson.start_time?.substring(0, 5)} - {lesson.end_time?.substring(0, 5)}
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}

export default Timetable;


