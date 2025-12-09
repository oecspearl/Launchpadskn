import React, { useState } from 'react';
import { Container, Row, Col, Card, Accordion, Badge, Alert } from 'react-bootstrap';
import {
  FaChalkboardTeacher, FaBook, FaCalendarAlt, FaClipboardCheck,
  FaGraduationCap, FaFileAlt, FaVideo, FaImage, FaLink,
  FaMagic, FaRobot, FaEdit, FaTrash, FaEye, FaDownload,
  FaUpload, FaCheckCircle, FaQuestionCircle, FaInfoCircle,
  FaUsers, FaChartBar, FaTasks, FaComments, FaLightbulb,
  FaArrowRight, FaBookOpen, FaPoll, FaFlask, FaLayerGroup
} from 'react-icons/fa';
import './HelpPage.css';

function TeacherHelpPage() {
  const [activeKey, setActiveKey] = useState('0');

  return (
    <Container fluid className="help-page-container">
      <Row>
        <Col>
          <div className="help-header mb-4">
            <h1 className="display-4">
              <FaChalkboardTeacher className="me-3" />
              Teacher/Instructor Help Guide
            </h1>
            <p className="lead text-muted">
              Complete guide to teaching and managing your classes in LaunchPad SKN LMS
            </p>
          </div>

          <Alert variant="info" className="mb-4">
            <FaInfoCircle className="me-2" />
            <strong>Welcome, Teacher!</strong> This guide covers all teaching features including 
            lesson planning, content management, grading, and student engagement tools.
          </Alert>

          <Accordion activeKey={activeKey} onSelect={(k) => setActiveKey(k)} className="help-accordion">
            {/* Dashboard Overview */}
            <Accordion.Item eventKey="0">
              <Accordion.Header>
                <FaChartBar className="me-2" />
                <strong>Teacher Dashboard</strong>
              </Accordion.Header>
              <Accordion.Body>
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
              </Accordion.Body>
            </Accordion.Item>

            {/* Lesson Planning */}
            <Accordion.Item eventKey="1">
              <Accordion.Header>
                <FaCalendarAlt className="me-2" />
                <strong>Lesson Planning</strong>
              </Accordion.Header>
              <Accordion.Body>
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
              </Accordion.Body>
            </Accordion.Item>

            {/* Content Management */}
            <Accordion.Item eventKey="2">
              <Accordion.Header>
                <FaFileAlt className="me-2" />
                <strong>Lesson Content Management</strong>
              </Accordion.Header>
              <Accordion.Body>
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
              </Accordion.Body>
            </Accordion.Item>

            {/* Attendance */}
            <Accordion.Item eventKey="3">
              <Accordion.Header>
                <FaCheckCircle className="me-2" />
                <strong>Attendance Marking</strong>
              </Accordion.Header>
              <Accordion.Body>
                <h5>Marking Student Attendance</h5>
                <p>Track student attendance for each lesson with detailed status options.</p>
                
                <h6 className="mt-3">Key Features:</h6>
                <ul>
                  <li><strong>Quick Marking:</strong> One-click attendance marking</li>
                  <li><strong>Status Options:</strong> Present, Absent, Late, Excused</li>
                  <li><strong>Notes:</strong> Add notes per student for special circumstances</li>
                  <li><strong>Real-time Stats:</strong> See attendance counts as you mark</li>
                  <li><strong>Visual Indicators:</strong> Color-coded status badges</li>
                  <li><strong>Save/Update:</strong> Update attendance records anytime</li>
                </ul>

                <h6 className="mt-3">Step-by-Step: Marking Attendance</h6>
                <ol>
                  <li>Navigate to a lesson</li>
                  <li>Click <Badge bg="primary">Mark Attendance</Badge></li>
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
              </Accordion.Body>
            </Accordion.Item>

            {/* Grading */}
            <Accordion.Item eventKey="4">
              <Accordion.Header>
                <FaClipboardCheck className="me-2" />
                <strong>Grade Entry and Management</strong>
              </Accordion.Header>
              <Accordion.Body>
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
              </Accordion.Body>
            </Accordion.Item>

            {/* Interactive Content */}
            <Accordion.Item eventKey="5">
              <Accordion.Header>
                <FaLayerGroup className="me-2" />
                <strong>Interactive Content Creation</strong>
              </Accordion.Header>
              <Accordion.Body>
                <h5>Creating Engaging Interactive Content</h5>
                <p>Build interactive learning experiences with quizzes, flashcards, videos, and books.</p>
                
                <h6 className="mt-3">Content Types:</h6>
                
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
              </Accordion.Body>
            </Accordion.Item>

            {/* Student View */}
            <Accordion.Item eventKey="6">
              <Accordion.Header>
                <FaEye className="me-2" />
                <strong>Student View Preview</strong>
              </Accordion.Header>
              <Accordion.Body>
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
              </Accordion.Body>
            </Accordion.Item>

            {/* Content Library */}
            <Accordion.Item eventKey="7">
              <Accordion.Header>
                <FaBookOpen className="me-2" />
                <strong>Content Library</strong>
              </Accordion.Header>
              <Accordion.Body>
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
              </Accordion.Body>
            </Accordion.Item>

            {/* Best Practices */}
            <Accordion.Item eventKey="8">
              <Accordion.Header>
                <FaLightbulb className="me-2" />
                <strong>Teaching Best Practices</strong>
              </Accordion.Header>
              <Accordion.Body>
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
              </Accordion.Body>
            </Accordion.Item>

            {/* Troubleshooting */}
            <Accordion.Item eventKey="9">
              <Accordion.Header>
                <FaQuestionCircle className="me-2" />
                <strong>Troubleshooting</strong>
              </Accordion.Header>
              <Accordion.Body>
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
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>

          <Card className="mt-4 help-footer">
            <Card.Body>
              <h5>Quick Navigation</h5>
              <Row>
                <Col md={4}>
                  <h6>Teaching Tools</h6>
                  <ul className="list-unstyled">
                    <li><FaArrowRight className="me-2" />Lesson Planning</li>
                    <li><FaArrowRight className="me-2" />Content Management</li>
                    <li><FaArrowRight className="me-2" />Attendance Marking</li>
                    <li><FaArrowRight className="me-2" />Grade Entry</li>
                  </ul>
                </Col>
                <Col md={4}>
                  <h6>Content Creation</h6>
                  <ul className="list-unstyled">
                    <li><FaArrowRight className="me-2" />Quizzes</li>
                    <li><FaArrowRight className="me-2" />Flashcards</li>
                    <li><FaArrowRight className="me-2" />Interactive Videos</li>
                    <li><FaArrowRight className="me-2" />Interactive Books</li>
                  </ul>
                </Col>
                <Col md={4}>
                  <h6>Management</h6>
                  <ul className="list-unstyled">
                    <li><FaArrowRight className="me-2" />My Classes</li>
                    <li><FaArrowRight className="me-2" />Content Library</li>
                    <li><FaArrowRight className="me-2" />Gradebook</li>
                    <li><FaArrowRight className="me-2" />Student View</li>
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

export default TeacherHelpPage;

