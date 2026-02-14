import React, { useState } from 'react';
import { Card, Badge, Button, ButtonGroup } from 'react-bootstrap';
import { FaClock, FaMapMarkerAlt, FaList, FaTable } from 'react-icons/fa';
import './Timetable.css';

/**
 * Timetable Component
 * Displays lessons in a weekly grid format
 * Shows time slots and lessons scheduled for each day
 */
function Timetable({ lessons = [], startDate = null, onLessonClick = null, showAllUpcoming = true }) {
  // View mode state: 'grid' or 'list'
  const [viewMode, setViewMode] = useState('grid');
  
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
  let weekDays = [];
  
  if (showAllUpcoming && upcomingLessons.length > 0) {
    // Find the earliest lesson date
    const lessonDates = upcomingLessons
      .map(l => new Date(l.lesson_date))
      .filter(d => !isNaN(d.getTime()));
    
    if (lessonDates.length === 0) {
      // Fallback to current week if no valid dates
      weekStart = new Date(Date.now() - new Date().getDay() * 24 * 60 * 60 * 1000);
      weekStart.setHours(0, 0, 0, 0);
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        weekDays.push(date);
      }
    } else {
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
      const weeksNeeded = Math.max(1, Math.ceil(daysDiff / 7));
      
      // Generate all week days needed
      for (let week = 0; week < weeksNeeded; week++) {
        for (let day = 0; day < 7; day++) {
          const date = new Date(weekStart);
          date.setDate(weekStart.getDate() + (week * 7) + day);
          if (!isNaN(date.getTime())) {
            weekDays.push(date);
          }
        }
      }
    }
  } else {
    // Default to current week if no startDate
    weekStart = startDate 
      ? new Date(startDate) 
      : new Date(Date.now() - new Date().getDay() * 24 * 60 * 60 * 1000);
    
    if (isNaN(weekStart.getTime())) {
      weekStart = new Date(Date.now() - new Date().getDay() * 24 * 60 * 60 * 1000);
    }
    
    weekStart.setHours(0, 0, 0, 0);
    
    // Generate week days
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
  
  // Ensure weekDays is always defined
  if (!weekDays || weekDays.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <Card.Body className="text-center py-5">
          <p className="text-muted mb-0">No upcoming lessons scheduled</p>
        </Card.Body>
      </Card>
    );
  }

  if (upcomingLessons.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <Card.Body className="text-center py-5">
          <p className="text-muted mb-0">No upcoming lessons scheduled</p>
        </Card.Body>
      </Card>
    );
  }

  // Filter out any invalid dates from weekDays
  const validWeekDays = weekDays.filter(day => 
    day instanceof Date && !isNaN(day.getTime())
  );
  
  if (validWeekDays.length === 0) {
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
  if (showAllUpcoming && validWeekDays.length > 7) {
    for (let i = 0; i < validWeekDays.length; i += 7) {
      const weekSlice = validWeekDays.slice(i, i + 7);
      if (weekSlice.length > 0) {
        weeks.push(weekSlice);
      }
    }
  } else {
    if (validWeekDays.length > 0) {
      weeks.push(validWeekDays);
    }
  }
  
  if (weeks.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <Card.Body className="text-center py-5">
          <p className="text-muted mb-0">No upcoming lessons scheduled</p>
        </Card.Body>
      </Card>
    );
  }

  const renderWeekTable = (weekDaysForTable, weekIndex) => {
    if (!weekDaysForTable || weekDaysForTable.length === 0) {
      return null;
    }
    
    const weekStartDate = weekDaysForTable[0];
    const weekEndDate = weekDaysForTable[weekDaysForTable.length - 1];
    
    if (!weekStartDate || !weekEndDate) {
      return null;
    }
    
    // Validate dates are valid Date objects
    if (!(weekStartDate instanceof Date) || !(weekEndDate instanceof Date)) {
      return null;
    }
    
    if (isNaN(weekStartDate.getTime()) || isNaN(weekEndDate.getTime())) {
      return null;
    }
    
    return (
      <div key={weekIndex} className={weekIndex > 0 ? 'mt-4' : ''}>
        <Card className="border-0 shadow-sm">
          <Card.Header className="bg-white border-0 py-3">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">{showAllUpcoming ? 'Upcoming Lessons' : 'Weekly Timetable'}</h5>
              <small className="text-muted">
                {weekStartDate && typeof weekStartDate.toLocaleDateString === 'function' 
                  ? weekStartDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) 
                  : 'Date unavailable'} - 
                {weekEndDate && typeof weekEndDate.toLocaleDateString === 'function'
                  ? weekEndDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                  : 'Date unavailable'}
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

  // Render list view
  const renderListView = () => {
    // Sort lessons by date and time
    const sortedLessons = [...upcomingLessons].sort((a, b) => {
      const dateA = new Date(`${a.lesson_date}T${a.start_time || '00:00'}`);
      const dateB = new Date(`${b.lesson_date}T${b.start_time || '00:00'}`);
      return dateA - dateB;
    });

    // Group lessons by date
    const lessonsByDate = {};
    sortedLessons.forEach(lesson => {
      const lessonDate = new Date(lesson.lesson_date).toDateString();
      if (!lessonsByDate[lessonDate]) {
        lessonsByDate[lessonDate] = [];
      }
      lessonsByDate[lessonDate].push(lesson);
    });

    const sortedDates = Object.keys(lessonsByDate).sort((a, b) => {
      return new Date(a) - new Date(b);
    });

    return (
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-0 py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Upcoming Lessons</h5>
            <Badge bg="primary">{sortedLessons.length} lesson{sortedLessons.length !== 1 ? 's' : ''}</Badge>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {sortedDates.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted mb-0">No upcoming lessons scheduled</p>
            </div>
          ) : (
            <div className="list-group list-group-flush">
              {sortedDates.map((dateStr, dateIndex) => {
                const date = new Date(dateStr);
                const dayInfo = getDayName(date);
                const dayLessons = lessonsByDate[dateStr].sort((a, b) => {
                  const timeA = a.start_time || '00:00';
                  const timeB = b.start_time || '00:00';
                  return timeA.localeCompare(timeB);
                });

                return (
                  <div key={dateIndex} className="list-group-item border-0 px-4 py-3">
                    <div className="d-flex align-items-center mb-3">
                      <div className={`date-badge ${dayInfo.isToday ? 'today-badge' : ''}`}>
                        <div className="date-day">{dayInfo.date}</div>
                        <div className="date-month">{dayInfo.month}</div>
                        <div className="date-weekday">{dayInfo.short}</div>
                      </div>
                      <div className="ms-3 flex-grow-1">
                        <h6 className="mb-0">{dayInfo.full}</h6>
                        <small className="text-muted">
                          {dayLessons.length} lesson{dayLessons.length !== 1 ? 's' : ''}
                        </small>
                      </div>
                    </div>
                    <div className="lessons-list">
                      {dayLessons.map((lesson, lessonIndex) => {
                        const subjectName = getSubjectName(lesson);
                        const className = getClassName(lesson);
                        const startTime = lesson.start_time?.substring(0, 5) || '00:00';
                        const endTime = lesson.end_time?.substring(0, 5) || '00:00';

                        return (
                          <div
                            key={lessonIndex}
                            className={`lesson-list-item ${onLessonClick ? 'clickable' : ''}`}
                            onClick={onLessonClick ? () => onLessonClick(lesson) : undefined}
                            style={onLessonClick ? { cursor: 'pointer' } : {}}
                          >
                            <div className="d-flex align-items-start gap-3">
                              <div className="lesson-time-badge">
                                <div className="time-start">{startTime}</div>
                                <div className="time-end">{endTime}</div>
                              </div>
                              <div className="flex-grow-1">
                                <h6 className="mb-1">{subjectName}</h6>
                                {className && (
                                  <Badge bg="secondary" className="me-2 mb-1">{className}</Badge>
                                )}
                                {lesson.lesson_title && (
                                  <p className="mb-1 small text-muted">{lesson.lesson_title}</p>
                                )}
                                <div className="d-flex align-items-center gap-3 flex-wrap">
                                  {lesson.location && (
                                    <small className="text-muted">
                                      <FaMapMarkerAlt size={10} className="me-1" />
                                      {lesson.location}
                                    </small>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card.Body>
      </Card>
    );
  };

  return (
    <div className="timetable-container">
      {/* View Toggle */}
      <div className="d-flex justify-content-end mb-3">
        <ButtonGroup>
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'outline-secondary'}
            size="sm"
            onClick={() => setViewMode('grid')}
            title="Grid View"
          >
            <FaTable className="me-1" />
            Grid
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'outline-secondary'}
            size="sm"
            onClick={() => setViewMode('list')}
            title="List View"
          >
            <FaList className="me-1" />
            List
          </Button>
        </ButtonGroup>
      </div>

      {/* Render based on view mode */}
      {viewMode === 'list' ? renderListView() : weeks.map((weekDaysForTable, weekIndex) => renderWeekTable(weekDaysForTable, weekIndex))}
    </div>
  );
}

export default Timetable;


