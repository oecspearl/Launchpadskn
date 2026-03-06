import {
  FaHome, FaBook, FaChartLine, FaEnvelope, FaQuestionCircle,
  FaChalkboardTeacher, FaPlusCircle, FaBoxOpen, FaFileAlt, FaBookOpen,
  FaClipboardList, FaRobot, FaUsers, FaUserGraduate, FaBuilding,
  FaCubes, FaUsersCog, FaVrCardboard, FaSchool, FaChartBar
} from 'react-icons/fa';

const sidebarNavConfig = {
  student: [
    { section: 'Learning' },
    { label: 'Dashboard', path: '/student/dashboard', icon: FaHome },
    { label: 'My Lessons', path: '/student/timetable', icon: FaBookOpen },
    { label: 'Assignments', path: '/student/assignments', icon: FaClipboardList },
    { label: 'My Subjects', path: '/student/subjects', icon: FaBook },
    { label: 'My Grades', path: '/student/progress', icon: FaChartLine },
    { divider: true },
    { section: 'Tools' },
    { label: 'AI Study Guide', path: '/student/tutor', icon: FaUserGraduate },
    { divider: true },
    { section: 'Community' },
    { label: 'Messages', path: '/messages', icon: FaEnvelope },
    { label: 'Help', path: '/student/help', icon: FaQuestionCircle },
  ],

  instructor: [
    { label: 'Dashboard', path: '/teacher/dashboard', icon: FaHome },
    { label: 'Create Lesson', path: '/teacher/lessons/create', icon: FaPlusCircle },
    { label: 'Content Library', path: '/teacher/content-library', icon: FaBoxOpen },
    { label: 'Lesson Templates', path: '/teacher/lesson-templates', icon: FaFileAlt },
    { label: 'Curriculum', path: '/teacher/curriculum', icon: FaBookOpen },
    { divider: true },
    { label: 'Report Cards', path: '/teacher/report-cards', icon: FaClipboardList },
    { label: 'AI Tutor Settings', path: '/teacher/tutor-settings', icon: FaRobot },
    { divider: true },
    { label: 'Messages', path: '/messages', icon: FaEnvelope },
    { label: 'Help', path: '/teacher/help', icon: FaQuestionCircle },
  ],

  admin: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: FaHome },
    { section: 'Academic' },
    { label: 'Forms', path: '/admin/forms', icon: FaSchool },
    { label: 'Classes', path: '/admin/classes', icon: FaChalkboardTeacher },
    { label: 'Subjects', path: '/admin/subjects', icon: FaBook },
    { label: 'Curriculum', path: '/teacher/curriculum', icon: FaBookOpen },
    { section: 'People' },
    { label: 'Students', path: '/admin/students', icon: FaUserGraduate },
    { label: 'Instructors', path: '/admin/instructors', icon: FaUsers },
    { section: 'System' },
    { label: 'Courses', path: '/admin/courses', icon: FaCubes },
    { label: 'Departments', path: '/admin/departments', icon: FaBuilding },
    { label: 'Users', path: '/admin/users', icon: FaUsersCog },
    { label: 'AR/VR Content', path: '/admin/arvr-content', icon: FaVrCardboard },
    { divider: true },
    { label: 'Messages', path: '/messages', icon: FaEnvelope },
    { label: 'Help', path: '/admin/help', icon: FaQuestionCircle },
  ],

  school_admin: [
    { label: 'Dashboard', path: '/school-admin/dashboard', icon: FaHome },
    { section: 'Academic' },
    { label: 'Forms', path: '/school-admin/forms', icon: FaSchool },
    { label: 'Classes', path: '/school-admin/classes', icon: FaChalkboardTeacher },
    { label: 'Subjects', path: '/school-admin/subjects', icon: FaBook },
    { section: 'People' },
    { label: 'Students', path: '/school-admin/students', icon: FaUserGraduate },
    { label: 'Instructors', path: '/school-admin/instructors', icon: FaUsers },
    { section: 'Reports' },
    { label: 'Reports', path: '/school-admin/reports', icon: FaChartBar },
    { label: 'Report Cards', path: '/school-admin/report-cards', icon: FaClipboardList },
    { divider: true },
    { label: 'Messages', path: '/messages', icon: FaEnvelope },
    { label: 'Help', path: '/help', icon: FaQuestionCircle },
  ],

  parent: [
    { label: 'Dashboard', path: '/parent/dashboard', icon: FaHome },
    { divider: true },
    { label: 'Messages', path: '/messages', icon: FaEnvelope },
    { label: 'Help', path: '/help', icon: FaQuestionCircle },
  ],
};

export default sidebarNavConfig;
