import React from 'react';
import { Card, Badge } from 'react-bootstrap';
import { FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import './Timetable.css';

/**
 * Timetable Component
 * Displays lessons in a weekly grid format
 * Shows time slots and lessons scheduled for each day
 */
function Timetable({ lessons = [], startDate = null, onLessonClick = null, showAllUpcoming = true }) {
  // showAllUpcoming defaults to true to show all upcoming lessons
  // Filter to only upcoming lessons (from today onwards)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const upcomingLessons = showAllUpcoming 
    ? lessons.filter(lesson => {
        const lessonDate = new Date(lesson.lesson_date);
        lessonDate.setHours(0, 0, 0, 0);
        return lessonDate >= today;
      })
    : lessons;

  // If showing all upcoming, calculate the date range needed
  let weekStart;
  let weekDays;
  
  if (showAllUpcoming && upcomingLessons.length > 0) {
    // Find the earliest lesson date
    const lessonDates = upcomingLessons.map(l => new Date(l.lesson_date));
    const earliestDate = new Date(Math.min(...lessonDates));
    earliestDate.setHours(0, 0, 0, 0);
    
    // Find the latest lesson date
    const latestDate = new Date(Math.max(...lessonDates));
    latestDate.setHours(0, 0, 0, 0);
    
    // Start from the beginning of the week containing the earliest lesson
    weekStart = new Date(earliestDate);
    weekStart.setDate(earliestDate.getDate() - earliestDate.getDay());
    
    // Calculate number of weeks needed
    const daysDiff = Math.ceil((latestDate - weekStart) / (1000 * 60 * 60 * 24));
    const weeksNeeded = Math.ceil(daysDiff / 7);
    
    // Generate all week days needed
    weekDays = [];
    for (let week = 0; week < weeksNeeded; week++) {
      for (let day = 0; day < 7; day++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + (week * 7) + day);
        weekDays.push(date);
      }
    }
  } else {
    // Default to current week if no startDate
    weekStart = startDate 
      ? new Date(startDate) 
      : new Date(Date.now() - new Date().getDay() * 24 * 60 * 60 * 1000);
    
    weekStart.setHours(0, 0, 0, 0);
    
    // Generate week days
    weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      weekDays.push(date);
    }
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
  upcomingLessons.forEach(lesson => {
    const lessonDate = new Date(lesson.lesson_date).toDateString();
    if (!lessonsByDate[lessonDate]) {
      lessonsByDate[lessonDate] = {};
    }
    const timeKey = lesson.start_time?.substring(0, 5) || '00:00';
    // Handle multiple lessons at same time on same day
    if (!lessonsByDate[lessonDate][timeKey]) {
      lessonsByDate[lessonDate][timeKey] = [];
    }
    lessonsByDate[lessonDate][timeKey].push(lesson);
  });
  
  // Get lessons for specific date and time (can be multiple)
  const getLessons = (date, timeSlot) => {
    const dateStr = date.toDateString();
    const lessons = lessonsByDate[dateStr]?.[timeSlot.start];
    return Array.isArray(lessons) ? lessons : (lessons ? [lessons] : []);
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
  
  if (upcomingLessons.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <Card.Body className="text-center py-5">
          <p className="text-muted mb-0">No upcoming lessons scheduled</p>
        </Card.Body>
      </Card>
    );
  }

  // Group days into weeks for display
  const weeks = [];
  if (showAllUpcoming && weekDays.length > 7) {
    for (let i = 0; i < weekDays.length; i += 7) {
      weeks.push(weekDays.slice(i, i + 7));
    }
  } else {
    weeks.push(weekDays);
  }

  const renderWeekTable = (weekDaysForTable, weekIndex) => {
    const weekStartDate = weekDaysForTable[0];
    const weekEndDate = weekDaysForTable[weekDaysForTable.length - 1];
    
    return (
      <div key={weekIndex} className={weekIndex > 0 ? 'mt-4' : ''}>
        <Card className="border-0 shadow-sm">
          <Card.Header className="bg-white border-0 py-3">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">{showAllUpcoming ? 'Upcoming Lessons' : 'Weekly Timetable'}</h5>
              <small className="text-muted">
                {weekStartDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - 
                {weekEndDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </small>
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="table-responsive">
              <table className="table timetable-table mb-0">
                <thead>
                  <tr>
                    <th className="time-column">Time</th>
                    {weekDaysForTable.map((day, index) => {
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
                          <td colSpan={weekDaysForTable.length + 1} className="break-cell text-center">
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
                        {weekDaysForTable.map((day, dayIndex) => {
                          const lessons = getLessons(day, slot);
                          const dayInfo = getDayName(day);
                          
                          if (lessons.length === 0) {
                            return (
                              <td 
                                key={dayIndex} 
                                className={`lesson-cell empty ${dayInfo.isToday ? 'today' : ''}`}
                              >
                                <div className="empty-slot"></div>
                              </td>
                            );
                          }
                          
                          // Show first lesson, or multiple if they fit
                          return (
                            <td 
                              key={dayIndex} 
                              className={`lesson-cell filled ${dayInfo.isToday ? 'today' : ''} ${onLessonClick ? 'clickable' : ''}`}
                            >
                              {lessons.map((lesson, lessonIndex) => {
                                const subjectName = getSubjectName(lesson);
                                const className = getClassName(lesson);
                                
                                return (
                                  <div 
                                    key={lessonIndex}
                                    className="lesson-card"
                                    onClick={onLessonClick ? (e) => {
                                      e.stopPropagation();
                                      onLessonClick(lesson);
                                    } : undefined}
                                    style={onLessonClick ? { cursor: 'pointer' } : {}}
                                  >
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
                                );
                              })}
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
  };

  return (
    <div className="timetable-container">
      {weeks.map((weekDaysForTable, weekIndex) => renderWeekTable(weekDaysForTable, weekIndex))}
    </div>
  );
}

export default Timetable;


