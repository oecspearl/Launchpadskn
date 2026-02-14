import React, { useState } from 'react';
import { Container, Row, Col, Card, Accordion, Badge, Alert } from 'react-bootstrap';
import {
  FaUserGraduate, FaBook, FaCalendarAlt, FaClipboardList,
  FaFileAlt, FaVideo, FaImage, FaDownload, FaUpload,
  FaCheckCircle, FaQuestionCircle, FaInfoCircle, FaChartBar,
  FaTasks, FaGraduationCap, FaClock, FaMapMarkerAlt,
  FaArrowRight, FaEye, FaBookOpen, FaPoll, FaFlask,
  FaTrophy, FaBell, FaSearch, FaBookmark
} from 'react-icons/fa';
import './HelpPage.css';

function StudentHelpPage() {
  const [activeKey, setActiveKey] = useState('0');

  return (
    <Container fluid className="help-page-container">
      <Row>
        <Col>
          <div className="help-header mb-4">
            <h1 className="display-4">
              <FaUserGraduate className="me-3" />
              Student Help Guide
            </h1>
            <p className="lead text-muted">
              Complete guide to learning and navigating LaunchPad SKN LMS
            </p>
          </div>

          <Alert variant="info" className="mb-4">
            <FaInfoCircle className="me-2" />
            <strong>Welcome, Student!</strong> This guide will help you navigate the learning platform, 
            access your lessons, submit assignments, and track your progress.
          </Alert>

          <Accordion activeKey={activeKey} onSelect={(k) => setActiveKey(k)} className="help-accordion">
            {/* Dashboard Overview */}
            <Accordion.Item eventKey="0">
              <Accordion.Header>
                <FaChartBar className="me-2" />
                <strong>Student Dashboard</strong>
              </Accordion.Header>
              <Accordion.Body>
                <h5>Understanding Your Dashboard</h5>
                <p>Your dashboard is your home base for all learning activities.</p>
                
                <h6 className="mt-3">Key Sections:</h6>
                <ul>
                  <li><strong>Class Information:</strong> See your Form and Class details</li>
                  <li><strong>My Subjects:</strong> Grid view of all your subjects</li>
                  <li><strong>Today's Lessons:</strong> Schedule of lessons for today</li>
                  <li><strong>Weekly Timetable:</strong> Visual weekly schedule</li>
                  <li><strong>Upcoming Assignments:</strong> Assignments and assessments due soon</li>
                  <li><strong>Recent Grades:</strong> Latest grades and feedback</li>
                  <li><strong>Announcements:</strong> Important messages from teachers</li>
                </ul>

                <h6 className="mt-3">Navigation Tips:</h6>
                <ul>
                  <li>Click on any subject card to view subject details</li>
                  <li>Click on a lesson to access lesson content</li>
                  <li>Use the timetable to see your full weekly schedule</li>
                  <li>Check assignments regularly for due dates</li>
                </ul>
              </Accordion.Body>
            </Accordion.Item>

            {/* My Subjects */}
            <Accordion.Item eventKey="1">
              <Accordion.Header>
                <FaBook className="me-2" />
                <strong>My Subjects</strong>
              </Accordion.Header>
              <Accordion.Body>
                <h5>Accessing and Navigating Your Subjects</h5>
                <p>View all subjects you're enrolled in and access subject-specific content.</p>
                
                <h6 className="mt-3">Subject Page Features:</h6>
                <ul>
                  <li><strong>Subject Information:</strong> View subject details, teacher, and class info</li>
                  <li><strong>Lessons Tab:</strong> See all lessons (upcoming and past)</li>
                  <li><strong>Assignments Tab:</strong> View and submit assignments</li>
                  <li><strong>Grades Tab:</strong> Track your performance and grades</li>
                  <li><strong>Resources Tab:</strong> Access subject materials and resources</li>
                </ul>

                <h6 className="mt-3">Step-by-Step: Accessing a Subject</h6>
                <ol>
                  <li>From dashboard, click on a subject card</li>
                  <li>Or navigate to <strong>My Subjects</strong> in the menu</li>
                  <li>Click on the subject you want to view</li>
                  <li>Use tabs to navigate between Lessons, Assignments, and Grades</li>
                </ol>

                <h6 className="mt-3">Subject Information Displayed:</h6>
                <ul>
                  <li>Subject name and code (e.g., CSEC Mathematics)</li>
                  <li>Teacher name and contact information</li>
                  <li>Class and Form information</li>
                  <li>Subject description and learning outcomes</li>
                </ul>
              </Accordion.Body>
            </Accordion.Item>

            {/* Lessons */}
            <Accordion.Item eventKey="2">
              <Accordion.Header>
                <FaCalendarAlt className="me-2" />
                <strong>Accessing Lessons</strong>
              </Accordion.Header>
              <Accordion.Body>
                <h5>Viewing and Engaging with Lesson Content</h5>
                <p>Access lesson materials, complete activities, and track your learning.</p>
                
                <h6 className="mt-3">Lesson Page Features:</h6>
                <ul>
                  <li><strong>Lesson Details:</strong> Title, topic, date, time, and location</li>
                  <li><strong>Learning Objectives:</strong> What you'll learn in this lesson</li>
                  <li><strong>Lesson Plan:</strong> Detailed lesson content and activities</li>
                  <li><strong>Lesson Materials:</strong> Files, videos, images, and links</li>
                  <li><strong>Learning Activities:</strong> Interactive activities to complete</li>
                  <li><strong>Key Concepts:</strong> Important concepts covered</li>
                  <li><strong>Reflection Questions:</strong> Questions to think about</li>
                  <li><strong>Summary:</strong> Lesson summary and takeaways</li>
                </ul>

                <h6 className="mt-3">Step-by-Step: Accessing a Lesson</h6>
                <ol>
                  <li>From dashboard, click on a lesson in "Today's Lessons"</li>
                  <li>Or go to a subject page and click on a lesson</li>
                  <li>View lesson details and content</li>
                  <li>Complete learning activities</li>
                  <li>Review materials and resources</li>
                </ol>

                <h6 className="mt-3">Content Types You'll See:</h6>
                <ul>
                  <li><strong>Files:</strong> Download PDFs, documents, presentations</li>
                  <li><strong>Videos:</strong> Watch embedded videos or follow links</li>
                  <li><strong>Images:</strong> View diagrams, charts, photos</li>
                  <li><strong>Links:</strong> Access external resources</li>
                  <li><strong>Interactive Content:</strong> Quizzes, flashcards, interactive videos</li>
                </ul>

                <h6 className="mt-3">Attendance Status:</h6>
                <ul>
                  <li>See your attendance status for each lesson</li>
                  <li>Statuses: Present, Absent, Late, or Excused</li>
                  <li>Contact your teacher if there's an error</li>
                </ul>
              </Accordion.Body>
            </Accordion.Item>

            {/* Assignments */}
            <Accordion.Item eventKey="3">
              <Accordion.Header>
                <FaTasks className="me-2" />
                <strong>Assignments and Submissions</strong>
              </Accordion.Header>
              <Accordion.Body>
                <h5>Submitting Assignments and Tracking Progress</h5>
                <p>Complete and submit assignments, and track your submission status.</p>
                
                <h6 className="mt-3">Assignment Features:</h6>
                <ul>
                  <li><strong>View Assignments:</strong> See all assignments for each subject</li>
                  <li><strong>Due Dates:</strong> Track when assignments are due</li>
                  <li><strong>Submission Status:</strong> See if you've submitted</li>
                  <li><strong>Grades:</strong> View grades and feedback when available</li>
                  <li><strong>File Upload:</strong> Submit files (PDF, DOC, DOCX, TXT)</li>
                  <li><strong>Text Submission:</strong> Submit written responses</li>
                  <li><strong>Update Submissions:</strong> Edit submissions before due date</li>
                </ul>

                <h6 className="mt-3">Step-by-Step: Submitting an Assignment</h6>
                <ol>
                  <li>Navigate to the subject page</li>
                  <li>Click on <strong>Assignments</strong> tab</li>
                  <li>Find the assignment you want to submit</li>
                  <li>Click <Badge bg="primary">Submit</Badge> button</li>
                  <li>Choose submission method:
                    <ul>
                      <li><strong>File Upload:</strong> Click "Choose File" and select your file</li>
                      <li><strong>Text Submission:</strong> Type your response in the text box</li>
                      <li>Or use both methods</li>
                    </ul>
                  </li>
                  <li>Click <Badge bg="success">Submit Assignment</Badge></li>
                  <li>You'll see a confirmation message</li>
                </ol>

                <h6 className="mt-3">Assignment Status Indicators:</h6>
                <ul>
                  <li><Badge bg="warning">Not Submitted</Badge> - Assignment not yet submitted</li>
                  <li><Badge bg="info">Submitted</Badge> - Assignment submitted, awaiting grading</li>
                  <li><Badge bg="success">Graded</Badge> - Assignment graded, view feedback</li>
                  <li><Badge bg="danger">Overdue</Badge> - Assignment past due date</li>
                </ul>

                <Alert variant="warning" className="mt-3">
                  <strong>Important:</strong> Make sure to submit assignments before the due date. 
                  Late submissions may not be accepted.
                </Alert>
              </Accordion.Body>
            </Accordion.Item>

            {/* Grades */}
            <Accordion.Item eventKey="4">
              <Accordion.Header>
                <FaGraduationCap className="me-2" />
                <strong>Viewing Grades and Progress</strong>
              </Accordion.Header>
              <Accordion.Body>
                <h5>Tracking Your Academic Performance</h5>
                <p>Monitor your grades, see feedback, and track progress across all subjects.</p>
                
                <h6 className="mt-3">Grade Features:</h6>
                <ul>
                  <li><strong>Subject Grades:</strong> View grades for each subject</li>
                  <li><strong>Assessment Breakdown:</strong> See grades for individual assessments</li>
                  <li><strong>Overall Performance:</strong> View your average grade per subject</li>
                  <li><strong>Progress Tracking:</strong> See improvement over time</li>
                  <li><strong>Teacher Feedback:</strong> Read comments and feedback</li>
                  <li><strong>Grade History:</strong> View past grades and assessments</li>
                </ul>

                <h6 className="mt-3">Step-by-Step: Viewing Your Grades</h6>
                <ol>
                  <li>Navigate to a subject page</li>
                  <li>Click on <strong>Grades</strong> tab</li>
                  <li>View all assessments and grades</li>
                  <li>Click on an assessment to see detailed feedback</li>
                </ol>

                <h6 className="mt-3">Understanding Grades:</h6>
                <ul>
                  <li>Grades use Caribbean grading system: A+, A, B+, B, C, D, F</li>
                  <li>Percentages are shown alongside letter grades</li>
                  <li>Overall subject average is calculated automatically</li>
                  <li>Term averages are displayed when available</li>
                </ul>
              </Accordion.Body>
            </Accordion.Item>

            {/* Interactive Content */}
            <Accordion.Item eventKey="5">
              <Accordion.Header>
                <FaFlask className="me-2" />
                <strong>Interactive Learning Content</strong>
              </Accordion.Header>
              <Accordion.Body>
                <h5>Engaging with Interactive Learning Tools</h5>
                <p>Use quizzes, flashcards, interactive videos, and books to enhance your learning.</p>
                
                <h6 className="mt-3">Interactive Content Types:</h6>
                
                <h6 className="mt-3">1. Quizzes</h6>
                <ul>
                  <li>Take quizzes to test your knowledge</li>
                  <li>See immediate feedback on answers</li>
                  <li>Review explanations for correct answers</li>
                  <li>Track your quiz scores</li>
                </ul>

                <h6 className="mt-3">2. Flashcards</h6>
                <ul>
                  <li>Study with digital flashcards</li>
                  <li>Flip cards to see answers</li>
                  <li>Review difficult cards more often</li>
                  <li>Use for vocabulary and concept memorization</li>
                </ul>

                <h6 className="mt-3">3. Interactive Videos</h6>
                <ul>
                  <li>Watch videos with built-in checkpoints</li>
                  <li>Answer questions during the video</li>
                  <li>Take notes at pause points</li>
                  <li>Reflect on key concepts</li>
                </ul>

                <h6 className="mt-3">4. Interactive Books</h6>
                <ul>
                  <li>Read multimedia books with rich content</li>
                  <li>View images, videos, and quizzes within books</li>
                  <li>Navigate through pages easily</li>
                  <li>Complete activities as you read</li>
                </ul>

                <h6 className="mt-3">Tips for Using Interactive Content:</h6>
                <ul>
                  <li>Complete quizzes to test your understanding</li>
                  <li>Use flashcards regularly for better retention</li>
                  <li>Engage fully with interactive videos</li>
                  <li>Take your time with interactive books</li>
                </ul>
              </Accordion.Body>
            </Accordion.Item>

            {/* Timetable */}
            <Accordion.Item eventKey="6">
              <Accordion.Header>
                <FaClock className="me-2" />
                <strong>Weekly Timetable</strong>
              </Accordion.Header>
              <Accordion.Body>
                <h5>Understanding Your Weekly Schedule</h5>
                <p>View and navigate your weekly class schedule.</p>
                
                <h6 className="mt-3">Timetable Features:</h6>
                <ul>
                  <li><strong>Weekly View:</strong> See all lessons for the week</li>
                  <li><strong>Time Slots:</strong> View lessons by time of day</li>
                  <li><strong>Color Coding:</strong> Different colors for different subjects</li>
                  <li><strong>Lesson Details:</strong> Click to see lesson information</li>
                  <li><strong>Location Info:</strong> See room numbers and locations</li>
                </ul>

                <h6 className="mt-3">Using the Timetable:</h6>
                <ul>
                  <li>Navigate to dashboard and click "Weekly Timetable" tab</li>
                  <li>View your full weekly schedule</li>
                  <li>Click on any lesson to view details</li>
                  <li>Plan your week ahead</li>
                </ul>
              </Accordion.Body>
            </Accordion.Item>

            {/* Study Tips */}
            <Accordion.Item eventKey="7">
              <Accordion.Header>
                <FaBookOpen className="me-2" />
                <strong>Study Tips and Best Practices</strong>
              </Accordion.Header>
              <Accordion.Body>
                <h5>Maximizing Your Learning Experience</h5>
                
                <h6 className="mt-3">Organization:</h6>
                <ul>
                  <li>Check your dashboard daily for updates</li>
                  <li>Review upcoming assignments regularly</li>
                  <li>Use the timetable to plan your study schedule</li>
                  <li>Keep track of due dates</li>
                </ul>

                <h6 className="mt-3">Engagement:</h6>
                <ul>
                  <li>Complete all lesson activities</li>
                  <li>Engage with interactive content</li>
                  <li>Review lesson materials before class</li>
                  <li>Take notes while viewing lessons</li>
                </ul>

                <h6 className="mt-3">Assignment Management:</h6>
                <ul>
                  <li>Start assignments early</li>
                  <li>Submit before due dates</li>
                  <li>Review teacher feedback</li>
                  <li>Use feedback to improve</li>
                </ul>

                <h6 className="mt-3">Progress Tracking:</h6>
                <ul>
                  <li>Regularly check your grades</li>
                  <li>Identify areas for improvement</li>
                  <li>Celebrate your achievements</li>
                  <li>Set goals for improvement</li>
                </ul>
              </Accordion.Body>
            </Accordion.Item>

            {/* Troubleshooting */}
            <Accordion.Item eventKey="8">
              <Accordion.Header>
                <FaQuestionCircle className="me-2" />
                <strong>Troubleshooting</strong>
              </Accordion.Header>
              <Accordion.Body>
                <h5>Common Issues and Solutions</h5>
                
                <h6 className="mt-3">Issue: Cannot see my subjects</h6>
                <p><strong>Solution:</strong> Contact your teacher or administrator to ensure you're properly enrolled.</p>

                <h6 className="mt-3">Issue: Cannot access a lesson</h6>
                <p><strong>Solution:</strong> Check if the lesson date has passed or contact your teacher.</p>

                <h6 className="mt-3">Issue: File upload failing</h6>
                <p><strong>Solution:</strong> Ensure file is under 20MB and in supported format (PDF, DOC, DOCX, TXT).</p>

                <h6 className="mt-3">Issue: Video not playing</h6>
                <p><strong>Solution:</strong> Check your internet connection and try refreshing the page.</p>

                <h6 className="mt-3">Issue: Assignment submission not working</h6>
                <p><strong>Solution:</strong> Ensure you've filled in required fields and file is uploaded correctly.</p>

                <h6 className="mt-3">Issue: Grades not showing</h6>
                <p><strong>Solution:</strong> Grades may not be released yet. Contact your teacher for information.</p>

                <Alert variant="warning" className="mt-3">
                  <strong>Need More Help?</strong> Contact your teacher or school administrator for assistance.
                </Alert>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>

          <Card className="mt-4 help-footer">
            <Card.Body>
              <h5>Quick Navigation</h5>
              <Row>
                <Col md={4}>
                  <h6>Learning</h6>
                  <ul className="list-unstyled">
                    <li><FaArrowRight className="me-2" />My Subjects</li>
                    <li><FaArrowRight className="me-2" />Lessons</li>
                    <li><FaArrowRight className="me-2" />Timetable</li>
                    <li><FaArrowRight className="me-2" />Interactive Content</li>
                  </ul>
                </Col>
                <Col md={4}>
                  <h6>Assignments & Grades</h6>
                  <ul className="list-unstyled">
                    <li><FaArrowRight className="me-2" />Submit Assignments</li>
                    <li><FaArrowRight className="me-2" />View Grades</li>
                    <li><FaArrowRight className="me-2" />Track Progress</li>
                  </ul>
                </Col>
                <Col md={4}>
                  <h6>Resources</h6>
                  <ul className="list-unstyled">
                    <li><FaArrowRight className="me-2" />Lesson Materials</li>
                    <li><FaArrowRight className="me-2" />Downloads</li>
                    <li><FaArrowRight className="me-2" />Announcements</li>
                  </ul>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default StudentHelpPage;

