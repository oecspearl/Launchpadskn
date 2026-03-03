import React from 'react';
import { Row, Col, Badge, Alert } from 'react-bootstrap';
import {
  FaUserGraduate, FaBook, FaCalendarAlt, FaClipboardList,
  FaFileAlt, FaCheckCircle, FaQuestionCircle, FaInfoCircle, FaChartBar,
  FaTasks, FaGraduationCap, FaClock, FaFlask,
  FaEye, FaBookOpen, FaChalkboardTeacher, FaUsers,
  FaChartLine, FaUserPlus, FaShieldAlt,
  FaClipboardCheck, FaLayerGroup, FaLightbulb, FaMagic,
  FaSchool, FaChild, FaEnvelope, FaComments
} from 'react-icons/fa';

const helpContent = {
  // ─── STUDENT ────────────────────────────────────────────
  student: {
    icon: FaUserGraduate,
    title: 'Student Help Guide',
    subtitle: 'Complete guide to learning and navigating LaunchPad SKN LMS',
    welcomeMessage: 'Welcome, Student! This guide will help you navigate the learning platform, access your lessons, submit assignments, and track your progress.',
    quickLinks: [
      { label: 'My Subjects', icon: FaBook, path: '/student/subjects' },
      { label: 'Dashboard', icon: FaChartBar, path: '/student/dashboard' },
      { label: 'Progress', icon: FaChartLine, path: '/student/progress' },
    ],
    sections: [
      {
        title: 'Student Dashboard',
        icon: FaChartBar,
        content: (
          <>
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
          </>
        ),
      },
      {
        title: 'My Subjects',
        icon: FaBook,
        content: (
          <>
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
          </>
        ),
      },
      {
        title: 'Accessing Lessons',
        icon: FaCalendarAlt,
        content: (
          <>
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
          </>
        ),
      },
      {
        title: 'Assignments and Submissions',
        icon: FaTasks,
        content: (
          <>
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
          </>
        ),
      },
      {
        title: 'Viewing Grades and Progress',
        icon: FaGraduationCap,
        content: (
          <>
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
          </>
        ),
      },
      {
        title: 'Interactive Learning Content',
        icon: FaFlask,
        content: (
          <>
            <h5>Engaging with Interactive Learning Tools</h5>
            <p>Use quizzes, flashcards, interactive videos, and books to enhance your learning.</p>
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
          </>
        ),
      },
      {
        title: 'Weekly Timetable',
        icon: FaClock,
        content: (
          <>
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
          </>
        ),
      },
      {
        title: 'Study Tips and Best Practices',
        icon: FaBookOpen,
        content: (
          <>
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
          </>
        ),
      },
      {
        title: 'Troubleshooting',
        icon: FaQuestionCircle,
        content: (
          <>
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
          </>
        ),
      },
    ],
  },

  // ─── INSTRUCTOR ─────────────────────────────────────────
  instructor: {
    icon: FaChalkboardTeacher,
    title: 'Teacher/Instructor Help Guide',
    subtitle: 'Complete guide to teaching and managing your classes in LaunchPad SKN LMS',
    welcomeMessage: 'Welcome, Teacher! This guide covers all teaching features including lesson planning, content management, grading, and student engagement tools.',
    quickLinks: [
      { label: 'My Classes', icon: FaChalkboardTeacher, path: '/teacher/dashboard' },
      { label: 'Curriculum', icon: FaBook, path: '/teacher/curriculum' },
      { label: 'Report Cards', icon: FaFileAlt, path: '/teacher/report-cards' },
    ],
    sections: [
      {
        title: 'Teacher Dashboard',
        icon: FaChartBar,
        content: (
          <>
            <h5>Overview of Your Teaching Dashboard</h5>
            <p>Your dashboard provides a central hub for all your teaching activities.</p>
            <h6 className="mt-3">Key Sections:</h6>
            <ul>
              <li><strong>My Classes:</strong> View all classes you teach, organized by class</li>
              <li><strong>Today's Lessons:</strong> See your schedule for today with times and locations</li>
              <li><strong>Weekly Timetable:</strong> Visual weekly schedule of all your lessons</li>
              <li><strong>Upcoming Assessments:</strong> Track assignments and assessments due soon</li>
              <li><strong>Quick Actions:</strong> Fast access to common tasks</li>
            </ul>
            <h6 className="mt-3">Navigation Tips:</h6>
            <ul>
              <li>Click on any class to view class details and students</li>
              <li>Click on a lesson to access lesson planning and content</li>
              <li>Use the timetable view to see your full weekly schedule</li>
              <li>Access gradebook directly from class pages</li>
            </ul>
          </>
        ),
      },
      {
        title: 'Lesson Planning',
        icon: FaCalendarAlt,
        content: (
          <>
            <h5>Creating and Managing Lessons</h5>
            <p>Plan and organize your lessons with detailed objectives, plans, and homework assignments.</p>
            <h6 className="mt-3">Key Features:</h6>
            <ul>
              <li><strong>Create Lessons:</strong> Add new lessons with date, time, and location</li>
              <li><strong>Learning Objectives:</strong> Define what students will learn</li>
              <li><strong>Lesson Plans:</strong> Write detailed lesson plans with rich text editor</li>
              <li><strong>Homework Assignments:</strong> Assign homework with due dates</li>
              <li><strong>Status Tracking:</strong> Mark lessons as Scheduled, Completed, or Cancelled</li>
              <li><strong>AI-Powered Planning:</strong> Use AI to generate lesson plans</li>
            </ul>
            <h6 className="mt-3">Step-by-Step: Creating a Lesson</h6>
            <ol>
              <li>Navigate to your class-subject page</li>
              <li>Click <Badge bg="primary">+ Add Lesson</Badge></li>
              <li>Enter lesson title and topic</li>
              <li>Set date, time, and location</li>
              <li>Add learning objectives</li>
              <li>Write your lesson plan (use the rich text editor for formatting)</li>
              <li>Optionally add homework assignment</li>
              <li>Click <Badge bg="success">Save Lesson</Badge></li>
            </ol>
            <h6 className="mt-3">AI Lesson Planning:</h6>
            <ul>
              <li>Click <Badge bg="info"><FaMagic className="me-1" />AI Generate</Badge> for AI assistance</li>
              <li>Provide topic, subject, form level, and duration</li>
              <li>AI generates comprehensive lesson plan with objectives</li>
              <li>Edit and customize the generated content</li>
            </ul>
          </>
        ),
      },
      {
        title: 'Lesson Content Management',
        icon: FaFileAlt,
        content: (
          <>
            <h5>Adding and Organizing Lesson Content</h5>
            <p>Enrich your lessons with files, videos, interactive content, and more.</p>
            <h6 className="mt-3">Content Types Available:</h6>
            <ul>
              <li><strong>Learning Outcomes:</strong> Define what students will achieve</li>
              <li><strong>Key Concepts:</strong> Highlight important concepts</li>
              <li><strong>Learning Activities:</strong> Step-by-step activities for students</li>
              <li><strong>Files:</strong> Upload PDFs, documents, presentations</li>
              <li><strong>Videos:</strong> Add YouTube or Vimeo videos</li>
              <li><strong>Images:</strong> Include diagrams, charts, photos</li>
              <li><strong>Links:</strong> Share external resources</li>
              <li><strong>Quizzes:</strong> Create interactive quizzes</li>
              <li><strong>Flashcards:</strong> Build study flashcards</li>
              <li><strong>Interactive Videos:</strong> Add checkpoints to videos</li>
              <li><strong>Interactive Books:</strong> Create multimedia books</li>
              <li><strong>Assignments:</strong> Create graded assignments</li>
            </ul>
            <h6 className="mt-3">Step-by-Step: Adding Content</h6>
            <ol>
              <li>Navigate to a lesson</li>
              <li>Click <Badge bg="primary">Manage Content</Badge></li>
              <li>Click <Badge bg="success">+ Add Content</Badge></li>
              <li>Select content type from dropdown</li>
              <li>Fill in required information:
                <ul>
                  <li>For files: Upload file and add description</li>
                  <li>For videos: Enter video URL</li>
                  <li>For text content: Use rich text editor</li>
                </ul>
              </li>
              <li>Set content section (Introduction, Learning, Assessment, etc.)</li>
              <li>Click <Badge bg="success">Add</Badge></li>
            </ol>
            <h6 className="mt-3">AI Content Generation:</h6>
            <ul>
              <li>Use <Badge bg="info"><FaMagic className="me-1" />AI Assistant</Badge> to generate content</li>
              <li>Generate learning outcomes, key concepts, activities, and more</li>
              <li>Customize AI-generated content to fit your needs</li>
              <li>Save time with automated content creation</li>
            </ul>
            <h6 className="mt-3">Content Organization:</h6>
            <ul>
              <li>Drag and drop to reorder content</li>
              <li>Organize by sections (Introduction, Learning, Assessment, Resources, Closure)</li>
              <li>Mark content as required or optional</li>
              <li>Set estimated time for each content item</li>
            </ul>
          </>
        ),
      },
      {
        title: 'Attendance Marking',
        icon: FaCheckCircle,
        content: (
          <>
            <h5>Marking Student Attendance</h5>
            <p>Track student attendance for each lesson with detailed status options.</p>
            <h6 className="mt-3">Key Features:</h6>
            <ul>
              <li><strong>Quick Marking:</strong> One-click attendance marking</li>
              <li><strong>Bulk Actions:</strong> Mark all students as Present, Absent, or Late at once</li>
              <li><strong>Status Options:</strong> Present, Absent, Late, Excused</li>
              <li><strong>Notes:</strong> Add notes per student for special circumstances</li>
              <li><strong>Search:</strong> Search students by name to quickly find them</li>
              <li><strong>Real-time Stats:</strong> See attendance counts as you mark</li>
              <li><strong>Visual Indicators:</strong> Color-coded status badges</li>
            </ul>
            <h6 className="mt-3">Step-by-Step: Marking Attendance</h6>
            <ol>
              <li>Navigate to a lesson</li>
              <li>Click <Badge bg="primary">Mark Attendance</Badge></li>
              <li>Use bulk actions to mark all students at once, or mark individually</li>
              <li>For each student, select their status:
                <ul>
                  <li><Badge bg="success">Present</Badge> - Student is in class</li>
                  <li><Badge bg="danger">Absent</Badge> - Student is not present</li>
                  <li><Badge bg="warning">Late</Badge> - Student arrived late</li>
                  <li><Badge bg="info">Excused</Badge> - Student has valid excuse</li>
                </ul>
              </li>
              <li>Add notes if needed (optional)</li>
              <li>Click <Badge bg="success">Save Attendance</Badge></li>
            </ol>
            <Alert variant="info" className="mt-3">
              <strong>Tip:</strong> You can update attendance records after the lesson if needed.
            </Alert>
          </>
        ),
      },
      {
        title: 'Grade Entry and Management',
        icon: FaClipboardCheck,
        content: (
          <>
            <h5>Entering and Managing Student Grades</h5>
            <p>Record and track student performance with comprehensive grading tools.</p>
            <h6 className="mt-3">Key Features:</h6>
            <ul>
              <li><strong>Individual Entry:</strong> Enter grades one student at a time</li>
              <li><strong>Bulk Entry:</strong> Copy/paste marks for multiple students</li>
              <li><strong>Auto-Calculation:</strong> Automatic percentage calculation</li>
              <li><strong>Caribbean Grading:</strong> Support for A+, A, B+, B, C, D, F system</li>
              <li><strong>Comments:</strong> Add feedback per student</li>
              <li><strong>Statistics:</strong> View class averages and grade distribution</li>
              <li><strong>Gradebook:</strong> Comprehensive gradebook view</li>
            </ul>
            <h6 className="mt-3">Step-by-Step: Entering Grades</h6>
            <ol>
              <li>Navigate to an assessment</li>
              <li>Click <Badge bg="primary">Enter Grades</Badge></li>
              <li>For each student:
                <ul>
                  <li>Enter marks or percentage</li>
                  <li>System auto-calculates grade letter</li>
                  <li>Add comments (optional)</li>
                </ul>
              </li>
              <li>Or use bulk entry:
                <ul>
                  <li>Copy marks from spreadsheet</li>
                  <li>Paste into bulk entry field</li>
                  <li>System matches students automatically</li>
                </ul>
              </li>
              <li>Click <Badge bg="success">Save Grades</Badge></li>
            </ol>
            <h6 className="mt-3">Gradebook Features:</h6>
            <ul>
              <li>View all assessments for a class-subject</li>
              <li>See student progress over time</li>
              <li>Calculate term averages</li>
              <li>Export grade reports</li>
            </ul>
          </>
        ),
      },
      {
        title: 'Interactive Content Creation',
        icon: FaLayerGroup,
        content: (
          <>
            <h5>Creating Engaging Interactive Content</h5>
            <p>Build interactive learning experiences with quizzes, flashcards, videos, and books.</p>
            <h6 className="mt-3">1. Quizzes</h6>
            <ul>
              <li>Create multiple choice, true/false, and short answer questions</li>
              <li>Add explanations for correct answers</li>
              <li>Set time limits and point values</li>
              <li>Use AI to generate quiz questions</li>
            </ul>
            <h6 className="mt-3">2. Flashcards</h6>
            <ul>
              <li>Create flashcard sets for vocabulary or concepts</li>
              <li>Add images to cards</li>
              <li>Organize by tags</li>
              <li>AI-generated flashcard sets available</li>
            </ul>
            <h6 className="mt-3">3. Interactive Videos</h6>
            <ul>
              <li>Add checkpoints to videos (questions, notes, pauses)</li>
              <li>Embed YouTube or Vimeo videos</li>
              <li>Create engaging video learning experiences</li>
              <li>AI can generate checkpoints automatically</li>
            </ul>
            <h6 className="mt-3">4. Interactive Books</h6>
            <ul>
              <li>Create multimedia books with pages</li>
              <li>Add text, images, videos, quizzes to pages</li>
              <li>Build comprehensive learning resources</li>
              <li>AI can generate complete books</li>
            </ul>
            <h6 className="mt-3">Step-by-Step: Creating a Quiz</h6>
            <ol>
              <li>In lesson content management, select "Quiz" content type</li>
              <li>Click <Badge bg="primary">Create Quiz</Badge></li>
              <li>Enter quiz title and description</li>
              <li>Add questions:
                <ul>
                  <li>Select question type</li>
                  <li>Enter question text</li>
                  <li>Add answer options (for multiple choice)</li>
                  <li>Mark correct answer</li>
                  <li>Add explanation (optional)</li>
                </ul>
              </li>
              <li>Set quiz settings (time limit, etc.)</li>
              <li>Click <Badge bg="success">Save Quiz</Badge></li>
            </ol>
          </>
        ),
      },
      {
        title: 'Student View Preview',
        icon: FaEye,
        content: (
          <>
            <h5>Previewing What Students See</h5>
            <p>See exactly how your lessons and content appear to students.</p>
            <h6 className="mt-3">Key Features:</h6>
            <ul>
              <li><strong>Lesson Preview:</strong> View lesson as students see it</li>
              <li><strong>Content Preview:</strong> Preview all content items</li>
              <li><strong>Student Experience:</strong> Understand student navigation</li>
              <li><strong>Mobile View:</strong> See how content appears on mobile devices</li>
            </ul>
            <h6 className="mt-3">Accessing Student View:</h6>
            <ol>
              <li>Navigate to any lesson</li>
              <li>Click <Badge bg="info"><FaEye className="me-1" />Student View</Badge></li>
              <li>Preview the lesson interface</li>
              <li>Test content accessibility</li>
            </ol>
          </>
        ),
      },
      {
        title: 'Content Library',
        icon: FaBookOpen,
        content: (
          <>
            <h5>Managing Your Content Library</h5>
            <p>Store and reuse content across multiple lessons and classes.</p>
            <h6 className="mt-3">Key Features:</h6>
            <ul>
              <li><strong>Save Content:</strong> Save content items to your library</li>
              <li><strong>Reuse Content:</strong> Import from library to new lessons</li>
              <li><strong>Organize:</strong> Tag and categorize content</li>
              <li><strong>Search:</strong> Find content quickly</li>
              <li><strong>Share:</strong> Share content with other teachers (if enabled)</li>
            </ul>
          </>
        ),
      },
      {
        title: 'Teaching Best Practices',
        icon: FaLightbulb,
        content: (
          <>
            <h5>Tips for Effective Teaching with LMS</h5>
            <h6 className="mt-3">Lesson Planning:</h6>
            <ul>
              <li>Plan lessons in advance for better organization</li>
              <li>Use learning objectives to guide your planning</li>
              <li>Include varied content types for engagement</li>
              <li>Set clear homework expectations</li>
            </ul>
            <h6 className="mt-3">Content Creation:</h6>
            <ul>
              <li>Use the rich text editor for formatted content</li>
              <li>Leverage AI tools to save time</li>
              <li>Mix different content types (text, video, interactive)</li>
              <li>Organize content logically by sections</li>
            </ul>
            <h6 className="mt-3">Student Engagement:</h6>
            <ul>
              <li>Use interactive content to increase engagement</li>
              <li>Provide timely feedback on assignments</li>
              <li>Mark attendance consistently</li>
              <li>Use the gradebook to track student progress</li>
            </ul>
            <h6 className="mt-3">Time Management:</h6>
            <ul>
              <li>Use templates for recurring lesson types</li>
              <li>Reuse content from your library</li>
              <li>Batch similar tasks (grading, attendance)</li>
              <li>Set up lessons for the entire term in advance</li>
            </ul>
          </>
        ),
      },
      {
        title: 'Troubleshooting',
        icon: FaQuestionCircle,
        content: (
          <>
            <h5>Common Issues and Solutions</h5>
            <h6 className="mt-3">Issue: Cannot see my classes</h6>
            <p><strong>Solution:</strong> Contact admin to ensure you're assigned to class-subject combinations.</p>
            <h6 className="mt-3">Issue: Video not playing</h6>
            <p><strong>Solution:</strong> Verify the video URL is correct and publicly accessible.</p>
            <h6 className="mt-3">Issue: File upload failing</h6>
            <p><strong>Solution:</strong> Check file size (max 20MB) and file type is supported.</p>
            <h6 className="mt-3">Issue: Grades not saving</h6>
            <p><strong>Solution:</strong> Ensure you're entering valid marks and the assessment exists.</p>
            <h6 className="mt-3">Issue: AI generation not working</h6>
            <p><strong>Solution:</strong> Check that API key is configured. Contact admin if issues persist.</p>
            <Alert variant="warning" className="mt-3">
              <strong>Need More Help?</strong> Contact your system administrator or IT support.
            </Alert>
          </>
        ),
      },
    ],
  },

  // ─── ADMIN ──────────────────────────────────────────────
  admin: {
    icon: FaShieldAlt,
    title: 'Administrator Help Guide',
    subtitle: 'Comprehensive guide to managing your Learning Management System',
    welcomeMessage: 'Welcome, Administrator! This guide covers all administrative features available in the LaunchPad SKN LMS. Use the sections below to learn about each feature.',
    quickLinks: [
      { label: 'Forms', icon: FaGraduationCap, path: '/admin/forms' },
      { label: 'Classes', icon: FaUsers, path: '/admin/classes' },
      { label: 'Subjects', icon: FaBook, path: '/admin/subjects' },
      { label: 'Students', icon: FaUserGraduate, path: '/admin/students' },
    ],
    sections: [
      {
        title: 'Dashboard Overview',
        icon: FaChartLine,
        content: (
          <>
            <Row>
              <Col md={6}>
                <h5>Main Dashboard Features</h5>
                <ul>
                  <li><strong>Statistics Overview:</strong> View key metrics at a glance</li>
                  <li><strong>Quick Access Cards:</strong> Navigate to major management sections</li>
                  <li><strong>Recent Activity:</strong> Monitor system activity and changes</li>
                  <li><strong>Navigation Tabs:</strong> Access Overview, Institutions, Students, Instructors, Courses, and Reports</li>
                </ul>
              </Col>
              <Col md={6}>
                <h5>Key Metrics Displayed</h5>
                <ul>
                  <li>Total number of students</li>
                  <li>Total number of instructors</li>
                  <li>Active courses/subjects</li>
                  <li>System-wide statistics</li>
                </ul>
              </Col>
            </Row>
          </>
        ),
      },
      {
        title: 'Form Management',
        icon: FaGraduationCap,
        content: (
          <>
            <h5>Creating and Managing Forms (Year Groups)</h5>
            <p>Forms represent year groups in the Caribbean secondary school system (Form 1, Form 2, etc.)</p>
            <h6 className="mt-3">Key Features:</h6>
            <ul>
              <li><strong>Create Forms:</strong> Add new year groups to the system</li>
              <li><strong>Edit Forms:</strong> Update form names, academic years, and settings</li>
              <li><strong>Assign Coordinators:</strong> Assign form coordinators to oversee each form</li>
              <li><strong>Set Academic Years:</strong> Configure academic year periods</li>
              <li><strong>View Statistics:</strong> See enrollment counts and form status</li>
            </ul>
            <h6 className="mt-3">Step-by-Step: Creating a Form</h6>
            <ol>
              <li>Navigate to <strong>Admin Dashboard &rarr; Forms</strong></li>
              <li>Click <Badge bg="primary">+ Add New Form</Badge></li>
              <li>Enter form name (e.g., "Form 1", "Form 2")</li>
              <li>Set academic year start and end dates</li>
              <li>Optionally assign a form coordinator</li>
              <li>Click <Badge bg="success">Save</Badge></li>
            </ol>
            <Alert variant="warning" className="mt-3">
              <strong>Important:</strong> Forms must be created before classes can be assigned to them.
            </Alert>
          </>
        ),
      },
      {
        title: 'Class Management',
        icon: FaUsers,
        content: (
          <>
            <h5>Creating and Managing Classes</h5>
            <p>Classes are groups within a Form (e.g., Form 3A, Form 3B)</p>
            <h6 className="mt-3">Key Features:</h6>
            <ul>
              <li><strong>Create Classes:</strong> Add classes within each Form</li>
              <li><strong>Assign Form Tutors:</strong> Assign homeroom teachers to classes</li>
              <li><strong>Set Capacity:</strong> Define maximum enrollment for each class</li>
              <li><strong>Room Assignment:</strong> Assign physical classroom locations</li>
              <li><strong>Auto-Generate Codes:</strong> System automatically generates class codes</li>
              <li><strong>Enrollment Tracking:</strong> View current enrollment counts</li>
            </ul>
            <h6 className="mt-3">Step-by-Step: Creating a Class</h6>
            <ol>
              <li>Navigate to <strong>Admin Dashboard &rarr; Classes</strong></li>
              <li>Select the Form from the dropdown</li>
              <li>Click <Badge bg="primary">+ Add New Class</Badge></li>
              <li>Enter class name (e.g., "3A", "3B")</li>
              <li>Set capacity and room number</li>
              <li>Assign a form tutor (homeroom teacher)</li>
              <li>Click <Badge bg="success">Save</Badge></li>
            </ol>
          </>
        ),
      },
      {
        title: 'Subject Management',
        icon: FaBook,
        content: (
          <>
            <h5>Managing Subjects and Curriculum</h5>
            <p>The Subject Management section has two main tabs:</p>
            <h6 className="mt-3">1. Subjects Tab</h6>
            <ul>
              <li><strong>Create Subjects:</strong> Add subjects to the catalog (e.g., Mathematics, English Language)</li>
              <li><strong>CXC Codes:</strong> Set CSEC/CAPE codes for Caribbean examinations</li>
              <li><strong>Department Assignment:</strong> Assign subjects to academic departments</li>
              <li><strong>School Linking:</strong> Link subjects to specific schools</li>
              <li><strong>Edit/Delete:</strong> Update or remove subjects as needed</li>
            </ul>
            <h6 className="mt-3">2. Form Offerings Tab</h6>
            <ul>
              <li><strong>Add Subjects to Forms:</strong> Define which subjects are offered in each Form</li>
              <li><strong>Curriculum Framework:</strong> Set curriculum standards and frameworks</li>
              <li><strong>Learning Outcomes:</strong> Define expected learning outcomes per Form</li>
              <li><strong>View Offerings:</strong> See all subjects offered in each Form</li>
            </ul>
            <h6 className="mt-3">Step-by-Step: Creating a Subject</h6>
            <ol>
              <li>Navigate to <strong>Admin Dashboard &rarr; Subjects</strong></li>
              <li>Click on <strong>Subjects Tab</strong></li>
              <li>Click <Badge bg="primary">+ Add New Subject</Badge></li>
              <li>Enter subject name and code</li>
              <li>Set CXC code (if applicable)</li>
              <li>Assign to a department</li>
              <li>Click <Badge bg="success">Save</Badge></li>
            </ol>
          </>
        ),
      },
      {
        title: 'Student Assignment',
        icon: FaUserGraduate,
        content: (
          <>
            <h5>Assigning Students to Classes</h5>
            <p>Assign students to their homeroom classes within Forms</p>
            <h6 className="mt-3">Key Features:</h6>
            <ul>
              <li><strong>View All Assignments:</strong> See which students are in which classes</li>
              <li><strong>Filter by Form/Class:</strong> Narrow down the view</li>
              <li><strong>Search Students:</strong> Find specific students quickly</li>
              <li><strong>Assign Students:</strong> Add students to classes</li>
              <li><strong>Remove Assignments:</strong> Remove students from classes</li>
              <li><strong>Unassigned View:</strong> See students not yet assigned to any class</li>
            </ul>
            <h6 className="mt-3">Step-by-Step: Assigning a Student</h6>
            <ol>
              <li>Navigate to <strong>Admin Dashboard &rarr; Student Assignment</strong></li>
              <li>Filter by Form and Class (optional)</li>
              <li>Search for the student by name</li>
              <li>Click <Badge bg="primary">Assign</Badge> next to the student</li>
              <li>Select the target class from the dropdown</li>
              <li>Click <Badge bg="success">Confirm</Badge></li>
            </ol>
            <Alert variant="info" className="mt-3">
              <strong>Tip:</strong> Use bulk assignment features to assign multiple students at once.
            </Alert>
          </>
        ),
      },
      {
        title: 'Class-Subject Assignment',
        icon: FaClipboardList,
        content: (
          <>
            <h5>Assigning Subjects to Classes and Teachers</h5>
            <p>Define which subjects each class studies and assign teachers</p>
            <h6 className="mt-3">Key Features:</h6>
            <ul>
              <li><strong>Assign Subjects to Classes:</strong> Define the curriculum for each class</li>
              <li><strong>Assign Teachers:</strong> Assign instructors to teach specific subjects in specific classes</li>
              <li><strong>View Current Assignments:</strong> See all class-subject-teacher combinations</li>
              <li><strong>Filter Options:</strong> Filter by Form, Class, or Subject</li>
              <li><strong>Remove Assignments:</strong> Unassign subjects or teachers as needed</li>
            </ul>
            <h6 className="mt-3">Step-by-Step: Assigning a Subject to a Class</h6>
            <ol>
              <li>Navigate to <strong>Admin Dashboard &rarr; Class-Subject Assignment</strong></li>
              <li>Select Form and Class from filters</li>
              <li>Click <Badge bg="primary">+ Assign Subject</Badge></li>
              <li>Select the subject from the dropdown</li>
              <li>Select the teacher to assign</li>
              <li>Click <Badge bg="success">Save</Badge></li>
            </ol>
          </>
        ),
      },
      {
        title: 'User Management',
        icon: FaUserPlus,
        content: (
          <>
            <h5>Managing System Users</h5>
            <p>Create and manage user accounts for students, teachers, and administrators</p>
            <h6 className="mt-3">Key Features:</h6>
            <ul>
              <li><strong>Create Users:</strong> Add new user accounts</li>
              <li><strong>Assign Roles:</strong> Set user roles (admin, instructor, student)</li>
              <li><strong>Edit Users:</strong> Update user information</li>
              <li><strong>Deactivate Users:</strong> Disable user accounts</li>
              <li><strong>View User Lists:</strong> See all users with filtering options</li>
              <li><strong>Bulk Operations:</strong> Import users from CSV files</li>
            </ul>
            <h6 className="mt-3">User Roles:</h6>
            <ul>
              <li><Badge bg="danger">Admin</Badge> - Full system access</li>
              <li><Badge bg="primary">Instructor/Teacher</Badge> - Teaching and grading access</li>
              <li><Badge bg="success">Student</Badge> - Learning and assignment access</li>
            </ul>
          </>
        ),
      },
      {
        title: 'Instructor Management',
        icon: FaChalkboardTeacher,
        content: (
          <>
            <h5>Managing Teachers and Instructors</h5>
            <p>Add, edit, and manage instructor accounts and assignments</p>
            <h6 className="mt-3">Key Features:</h6>
            <ul>
              <li><strong>Add Instructors:</strong> Create new teacher accounts</li>
              <li><strong>View All Instructors:</strong> See complete instructor list</li>
              <li><strong>Edit Information:</strong> Update instructor details</li>
              <li><strong>View Assignments:</strong> See which classes/subjects each instructor teaches</li>
              <li><strong>Department Assignment:</strong> Assign instructors to departments</li>
            </ul>
          </>
        ),
      },
      {
        title: 'Reports and Analytics',
        icon: FaChartLine,
        content: (
          <>
            <h5>System Reports and Data Analysis</h5>
            <p>Access comprehensive reports and analytics</p>
            <h6 className="mt-3">Available Reports:</h6>
            <ul>
              <li><strong>Enrollment Reports:</strong> Student enrollment by Form/Class</li>
              <li><strong>Attendance Reports:</strong> System-wide attendance statistics</li>
              <li><strong>Grade Reports:</strong> Academic performance analytics</li>
              <li><strong>User Activity:</strong> System usage and activity logs</li>
              <li><strong>Curriculum Coverage:</strong> Subject coverage tracking</li>
              <li><strong>Export Options:</strong> Download reports as PDF or CSV</li>
            </ul>
            <h6 className="mt-3">Accessing Reports:</h6>
            <ol>
              <li>Navigate to <strong>Admin Dashboard &rarr; Reports Tab</strong></li>
              <li>Select the report type</li>
              <li>Apply filters (date range, Form, Class, etc.)</li>
              <li>Click <Badge bg="primary">Generate Report</Badge></li>
              <li>Download or view the report</li>
            </ol>
          </>
        ),
      },
      {
        title: 'Best Practices & Tips',
        icon: FaCheckCircle,
        content: (
          <>
            <h5>Administrative Best Practices</h5>
            <h6 className="mt-3">Setup Workflow:</h6>
            <ol>
              <li><strong>Start with Forms:</strong> Create all Forms first</li>
              <li><strong>Create Classes:</strong> Add classes within each Form</li>
              <li><strong>Add Subjects:</strong> Create subject catalog</li>
              <li><strong>Assign Subjects to Forms:</strong> Define Form offerings</li>
              <li><strong>Assign Students:</strong> Place students in classes</li>
              <li><strong>Assign Subjects to Classes:</strong> Define class curriculum</li>
              <li><strong>Assign Teachers:</strong> Assign instructors to class-subject combinations</li>
            </ol>
            <h6 className="mt-3">Tips for Efficiency:</h6>
            <ul>
              <li>Use bulk operations when assigning multiple students</li>
              <li>Regularly review and update class capacities</li>
              <li>Keep subject catalog organized by department</li>
              <li>Use filters and search to quickly find information</li>
              <li>Export reports regularly for record-keeping</li>
              <li>Review unassigned students periodically</li>
            </ul>
            <Alert variant="success" className="mt-3">
              <strong>Pro Tip:</strong> Use the search and filter features extensively to manage large datasets efficiently.
            </Alert>
          </>
        ),
      },
      {
        title: 'Troubleshooting',
        icon: FaQuestionCircle,
        content: (
          <>
            <h5>Common Issues and Solutions</h5>
            <h6 className="mt-3">Issue: Cannot assign student to class</h6>
            <p><strong>Solution:</strong> Ensure the class exists and has not reached capacity.</p>
            <h6 className="mt-3">Issue: Subject not appearing in class assignment</h6>
            <p><strong>Solution:</strong> Verify the subject is added to the Form's offerings first.</p>
            <h6 className="mt-3">Issue: Teacher cannot see assigned classes</h6>
            <p><strong>Solution:</strong> Confirm the class-subject assignment includes the teacher.</p>
            <h6 className="mt-3">Issue: Reports not generating</h6>
            <p><strong>Solution:</strong> Check that filters are set correctly and data exists for the selected criteria.</p>
            <Alert variant="warning" className="mt-3">
              <strong>Need More Help?</strong> Contact your system administrator or refer to the technical documentation.
            </Alert>
          </>
        ),
      },
    ],
  },

  // ─── SCHOOL ADMIN ───────────────────────────────────────
  school_admin: {
    icon: FaSchool,
    title: 'School Administrator Help Guide',
    subtitle: 'Guide to managing your school in LaunchPad SKN LMS',
    welcomeMessage: 'Welcome, School Administrator! This guide covers all the tools available to manage your school, including forms, classes, subjects, students, instructors, and reports.',
    quickLinks: [
      { label: 'Dashboard', icon: FaChartBar, path: '/school-admin/dashboard' },
      { label: 'Students', icon: FaUserGraduate, path: '/school-admin/students' },
      { label: 'Reports', icon: FaChartLine, path: '/school-admin/reports' },
      { label: 'Report Cards', icon: FaFileAlt, path: '/school-admin/report-cards' },
    ],
    sections: [
      {
        title: 'School Dashboard',
        icon: FaChartBar,
        content: (
          <>
            <h5>Overview of Your School Dashboard</h5>
            <p>Your dashboard gives you a complete overview of your school's data and quick access to management tools.</p>
            <h6 className="mt-3">Key Sections:</h6>
            <ul>
              <li><strong>Statistics Cards:</strong> Quick view of total students, instructors, classes, and subjects</li>
              <li><strong>Management Menu:</strong> Access Forms, Classes, Subjects, Students, Instructors, Reports, and Report Cards</li>
              <li><strong>Recent Activity:</strong> Track recent changes across your school</li>
            </ul>
            <h6 className="mt-3">Navigation Tips:</h6>
            <ul>
              <li>Use the Management dropdown in the navbar for quick access</li>
              <li>Click on statistics cards to jump to detailed views</li>
              <li>Review reports regularly to monitor school performance</li>
            </ul>
          </>
        ),
      },
      {
        title: 'Form Management',
        icon: FaGraduationCap,
        content: (
          <>
            <h5>Managing Forms (Year Groups)</h5>
            <p>Forms represent year groups in your school (Form 1 through Form 5).</p>
            <h6 className="mt-3">Key Features:</h6>
            <ul>
              <li><strong>View Forms:</strong> See all forms in your school with enrollment counts</li>
              <li><strong>Create Forms:</strong> Add new year groups</li>
              <li><strong>Edit Forms:</strong> Update form details and academic year settings</li>
              <li><strong>Assign Coordinators:</strong> Set a form coordinator for each year group</li>
            </ul>
            <h6 className="mt-3">Step-by-Step: Managing Forms</h6>
            <ol>
              <li>Navigate to <strong>Management &rarr; Forms</strong></li>
              <li>View existing forms and their details</li>
              <li>Click <Badge bg="primary">+ Add New Form</Badge> to create a new one</li>
              <li>Enter form name and academic year dates</li>
              <li>Click <Badge bg="success">Save</Badge></li>
            </ol>
          </>
        ),
      },
      {
        title: 'Class Management',
        icon: FaUsers,
        content: (
          <>
            <h5>Managing Classes Within Forms</h5>
            <p>Classes are groups within each Form (e.g., Form 3A, Form 3B).</p>
            <h6 className="mt-3">Key Features:</h6>
            <ul>
              <li><strong>Create Classes:</strong> Add new classes to any Form</li>
              <li><strong>Set Capacity:</strong> Define maximum students per class</li>
              <li><strong>Assign Form Tutors:</strong> Assign homeroom teachers</li>
              <li><strong>Room Assignment:</strong> Set physical classroom locations</li>
              <li><strong>View Enrollment:</strong> See how many students are in each class</li>
            </ul>
            <h6 className="mt-3">Step-by-Step: Creating a Class</h6>
            <ol>
              <li>Navigate to <strong>Management &rarr; Classes</strong></li>
              <li>Select the Form</li>
              <li>Click <Badge bg="primary">+ Add New Class</Badge></li>
              <li>Enter class name, capacity, and room number</li>
              <li>Assign a form tutor</li>
              <li>Click <Badge bg="success">Save</Badge></li>
            </ol>
          </>
        ),
      },
      {
        title: 'Subject Management',
        icon: FaBook,
        content: (
          <>
            <h5>Managing Subjects for Your School</h5>
            <p>Configure which subjects are taught in your school and assign them to forms.</p>
            <h6 className="mt-3">Key Features:</h6>
            <ul>
              <li><strong>View Subjects:</strong> See all subjects available in your school</li>
              <li><strong>Subject Offerings:</strong> Define which subjects are offered in each Form</li>
              <li><strong>Assign to Classes:</strong> Link subjects to specific classes with teachers</li>
              <li><strong>CXC Codes:</strong> Track CSEC/CAPE subject codes</li>
            </ul>
            <h6 className="mt-3">Step-by-Step: Managing Subject Offerings</h6>
            <ol>
              <li>Navigate to <strong>Management &rarr; Subjects</strong></li>
              <li>View subject catalog for your school</li>
              <li>Use the Form Offerings tab to manage per-form subjects</li>
              <li>Assign teachers to class-subject combinations</li>
            </ol>
          </>
        ),
      },
      {
        title: 'Student Management',
        icon: FaUserGraduate,
        content: (
          <>
            <h5>Managing Students in Your School</h5>
            <p>View, assign, and manage all students enrolled in your school.</p>
            <h6 className="mt-3">Key Features:</h6>
            <ul>
              <li><strong>View All Students:</strong> See all students with search and filters</li>
              <li><strong>Assign to Classes:</strong> Place students in their homeroom classes</li>
              <li><strong>View Unassigned:</strong> Find students not yet placed in a class</li>
              <li><strong>Student Details:</strong> View individual student information</li>
              <li><strong>Enrollment Status:</strong> Track active/inactive students</li>
            </ul>
            <h6 className="mt-3">Step-by-Step: Assigning a Student</h6>
            <ol>
              <li>Navigate to <strong>Management &rarr; Students</strong></li>
              <li>Find the student using search or filters</li>
              <li>Click <Badge bg="primary">Assign</Badge></li>
              <li>Select the target Form and Class</li>
              <li>Click <Badge bg="success">Confirm</Badge></li>
            </ol>
          </>
        ),
      },
      {
        title: 'Instructor Management',
        icon: FaChalkboardTeacher,
        content: (
          <>
            <h5>Managing Teachers at Your School</h5>
            <p>View and manage instructor accounts and their class assignments.</p>
            <h6 className="mt-3">Key Features:</h6>
            <ul>
              <li><strong>View Instructors:</strong> See all teachers at your school</li>
              <li><strong>Class Assignments:</strong> View which classes/subjects each teacher handles</li>
              <li><strong>Department Info:</strong> See departmental assignments</li>
              <li><strong>Contact Details:</strong> Access teacher contact information</li>
            </ul>
          </>
        ),
      },
      {
        title: 'Reports',
        icon: FaChartLine,
        content: (
          <>
            <h5>School Reports and Analytics</h5>
            <p>Access reports to monitor your school's performance and operations.</p>
            <h6 className="mt-3">Available Reports:</h6>
            <ul>
              <li><strong>Enrollment Reports:</strong> Student enrollment by Form and Class</li>
              <li><strong>Attendance Reports:</strong> Attendance rates across classes</li>
              <li><strong>Grade Reports:</strong> Academic performance summaries</li>
              <li><strong>Teacher Reports:</strong> Teacher activity and workload</li>
              <li><strong>Export Options:</strong> Download as PDF or CSV</li>
            </ul>
            <h6 className="mt-3">Accessing Reports:</h6>
            <ol>
              <li>Navigate to <strong>Management &rarr; Reports</strong></li>
              <li>Select report type</li>
              <li>Apply date range and filters</li>
              <li>Click <Badge bg="primary">Generate Report</Badge></li>
            </ol>
          </>
        ),
      },
      {
        title: 'Report Cards',
        icon: FaFileAlt,
        content: (
          <>
            <h5>Managing Student Report Cards</h5>
            <p>Generate and manage end-of-term report cards for students.</p>
            <h6 className="mt-3">Key Features:</h6>
            <ul>
              <li><strong>Generate Report Cards:</strong> Create report cards for a class or Form</li>
              <li><strong>Review Grades:</strong> Verify grades before publishing</li>
              <li><strong>Comments:</strong> Add teacher and principal comments</li>
              <li><strong>Print/Export:</strong> Print or download report cards as PDF</li>
            </ul>
            <h6 className="mt-3">Step-by-Step:</h6>
            <ol>
              <li>Navigate to <strong>Management &rarr; Report Cards</strong></li>
              <li>Select the Form and Class</li>
              <li>Review student grades and add comments</li>
              <li>Click <Badge bg="primary">Generate</Badge></li>
              <li>Print or export as needed</li>
            </ol>
          </>
        ),
      },
      {
        title: 'Troubleshooting',
        icon: FaQuestionCircle,
        content: (
          <>
            <h5>Common Issues and Solutions</h5>
            <h6 className="mt-3">Issue: Cannot see school data</h6>
            <p><strong>Solution:</strong> Ensure your account is properly linked to your school/institution by the super admin.</p>
            <h6 className="mt-3">Issue: Students not appearing in class lists</h6>
            <p><strong>Solution:</strong> Verify students are assigned to classes and their enrollment is active.</p>
            <h6 className="mt-3">Issue: Report cards missing grades</h6>
            <p><strong>Solution:</strong> Ensure teachers have entered grades for all assessments before generating report cards.</p>
            <h6 className="mt-3">Issue: Cannot assign teachers to subjects</h6>
            <p><strong>Solution:</strong> Verify the subject is offered in the selected Form and the teacher account exists.</p>
            <Alert variant="warning" className="mt-3">
              <strong>Need More Help?</strong> Contact the system administrator for assistance.
            </Alert>
          </>
        ),
      },
    ],
  },

  // ─── PARENT ─────────────────────────────────────────────
  parent: {
    icon: FaChild,
    title: 'Parent Help Guide',
    subtitle: 'Guide to monitoring your child\'s education on LaunchPad SKN LMS',
    welcomeMessage: 'Welcome, Parent! This guide will help you stay connected with your child\'s education, monitor their progress, and communicate with teachers.',
    quickLinks: [
      { label: 'My Children', icon: FaChild, path: '/parent/dashboard' },
      { label: 'Messages', icon: FaEnvelope, path: '/messages' },
    ],
    sections: [
      {
        title: 'Parent Dashboard',
        icon: FaChartBar,
        content: (
          <>
            <h5>Understanding Your Parent Dashboard</h5>
            <p>Your dashboard shows an overview of all your linked children and their academic status.</p>
            <h6 className="mt-3">Key Sections:</h6>
            <ul>
              <li><strong>My Children:</strong> See all children linked to your account</li>
              <li><strong>Quick Stats:</strong> Overview of each child's attendance and grades</li>
              <li><strong>Recent Activity:</strong> Latest assignments, grades, and announcements</li>
              <li><strong>Notifications:</strong> Important updates about your children</li>
            </ul>
            <h6 className="mt-3">Navigation Tips:</h6>
            <ul>
              <li>Click on a child's card to see their detailed information</li>
              <li>Use the Messages feature to communicate with teachers</li>
              <li>Check notifications regularly for important updates</li>
            </ul>
          </>
        ),
      },
      {
        title: 'Monitoring Your Child\'s Progress',
        icon: FaChartLine,
        content: (
          <>
            <h5>Tracking Academic Performance</h5>
            <p>Stay up to date with how your child is performing across all subjects.</p>
            <h6 className="mt-3">What You Can View:</h6>
            <ul>
              <li><strong>Subject Grades:</strong> See grades for each subject your child is enrolled in</li>
              <li><strong>Assignment Status:</strong> Check if assignments are submitted and graded</li>
              <li><strong>Attendance Records:</strong> View your child's attendance history</li>
              <li><strong>Teacher Feedback:</strong> Read teacher comments on assignments and assessments</li>
              <li><strong>Overall Progress:</strong> See average grades and trends over time</li>
            </ul>
            <h6 className="mt-3">How to View Progress:</h6>
            <ol>
              <li>Click on your child's name from the dashboard</li>
              <li>View the overview with grades and attendance</li>
              <li>Click on individual subjects for detailed information</li>
              <li>Check the assignments tab for submission status</li>
            </ol>
          </>
        ),
      },
      {
        title: 'Attendance Overview',
        icon: FaCheckCircle,
        content: (
          <>
            <h5>Viewing Attendance Records</h5>
            <p>Monitor your child's attendance across all lessons.</p>
            <h6 className="mt-3">Attendance Statuses:</h6>
            <ul>
              <li><Badge bg="success">Present</Badge> - Your child attended the lesson</li>
              <li><Badge bg="danger">Absent</Badge> - Your child was not present</li>
              <li><Badge bg="warning">Late</Badge> - Your child arrived late</li>
              <li><Badge bg="info">Excused</Badge> - Absence was excused</li>
            </ul>
            <h6 className="mt-3">What to Do If Attendance Is Incorrect:</h6>
            <ul>
              <li>Use the Messages feature to contact your child's teacher</li>
              <li>Provide any relevant documentation for excused absences</li>
              <li>Teachers can update attendance records as needed</li>
            </ul>
          </>
        ),
      },
      {
        title: 'Communicating with Teachers',
        icon: FaComments,
        content: (
          <>
            <h5>Using the Messaging System</h5>
            <p>Stay in touch with your child's teachers through the built-in messaging system.</p>
            <h6 className="mt-3">Key Features:</h6>
            <ul>
              <li><strong>Send Messages:</strong> Contact any of your child's teachers directly</li>
              <li><strong>Receive Updates:</strong> Get messages from teachers about your child</li>
              <li><strong>Message History:</strong> View previous conversations</li>
              <li><strong>Notifications:</strong> Get notified when you receive new messages</li>
            </ul>
            <h6 className="mt-3">Step-by-Step: Sending a Message</h6>
            <ol>
              <li>Click on <strong>Messages</strong> in the navigation</li>
              <li>Click <Badge bg="primary">New Message</Badge></li>
              <li>Select the teacher you want to contact</li>
              <li>Type your message</li>
              <li>Click <Badge bg="success">Send</Badge></li>
            </ol>
            <Alert variant="info" className="mt-3">
              <strong>Tip:</strong> Check messages regularly for updates from teachers about your child's progress.
            </Alert>
          </>
        ),
      },
      {
        title: 'Notifications and Alerts',
        icon: FaInfoCircle,
        content: (
          <>
            <h5>Staying Informed</h5>
            <p>Receive important notifications about your child's education.</p>
            <h6 className="mt-3">Types of Notifications:</h6>
            <ul>
              <li><strong>Grade Updates:</strong> When new grades are entered</li>
              <li><strong>Assignment Due Dates:</strong> Reminders about upcoming assignments</li>
              <li><strong>Attendance Alerts:</strong> When your child is marked absent</li>
              <li><strong>Announcements:</strong> School-wide or class announcements</li>
              <li><strong>Messages:</strong> New messages from teachers</li>
            </ul>
            <h6 className="mt-3">Managing Notifications:</h6>
            <ul>
              <li>Click the bell icon in the navigation bar to view notifications</li>
              <li>Go to notification preferences to customize which notifications you receive</li>
            </ul>
          </>
        ),
      },
      {
        title: 'Troubleshooting',
        icon: FaQuestionCircle,
        content: (
          <>
            <h5>Common Issues and Solutions</h5>
            <h6 className="mt-3">Issue: Cannot see my child's information</h6>
            <p><strong>Solution:</strong> Contact the school administrator to ensure your account is properly linked to your child.</p>
            <h6 className="mt-3">Issue: Grades not showing</h6>
            <p><strong>Solution:</strong> Grades are displayed once teachers have entered and published them. Check back after assessment periods.</p>
            <h6 className="mt-3">Issue: Cannot send messages</h6>
            <p><strong>Solution:</strong> Ensure your account is active and properly set up. Contact the school if issues persist.</p>
            <Alert variant="warning" className="mt-3">
              <strong>Need More Help?</strong> Contact your child's school administration for assistance.
            </Alert>
          </>
        ),
      },
    ],
  },
};

export default helpContent;
