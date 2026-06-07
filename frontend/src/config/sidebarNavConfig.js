import {
  FaHome, FaBook, FaChartLine, FaEnvelope, FaQuestionCircle,
  FaChalkboardTeacher, FaPlusCircle, FaBoxOpen, FaFileAlt, FaBookOpen,
  FaClipboardList, FaRobot, FaUsers, FaUserGraduate, FaBuilding,
  FaCubes, FaUsersCog, FaVrCardboard, FaSchool, FaChartBar
} from 'react-icons/fa';

/*
 * Each item supports:
 *   { section: 'Label' }                                  → uppercase group header
 *   { divider: true }                                     → thin separator
 *   { label, path, icon }                                 → nav link
 *   { ...link, badgeKey: 'messages', badgeVariant: 'red' } → live count badge
 *   { ...link, badge: { text: '3', variant: 'green' } }   → static badge
 * Badge variants: 'red' | 'green' | 'amber'.
 */
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
    { label: 'Messages', path: '/messages', icon: FaEnvelope, badgeKey: 'messages', badgeVariant: 'red' },
    { label: 'Help', path: '/student/help', icon: FaQuestionCircle },
  ],

  instructor: [
    { section: 'Teaching' },
    { label: 'Dashboard', path: '/teacher/dashboard', icon: FaHome },
    { label: 'Create Lesson', path: '/teacher/lessons/create', icon: FaPlusCircle },
    { label: 'Content Library', path: '/teacher/content-library', icon: FaBoxOpen },
    { label: 'Lesson Templates', path: '/teacher/lesson-templates', icon: FaFileAlt },
    { label: 'Curriculum', path: '/teacher/curriculum', icon: FaBookOpen },
    { divider: true },
    { section: 'Assessment' },
    { label: 'Report Cards', path: '/teacher/report-cards', icon: FaClipboardList },
    { label: 'AI Tutor Settings', path: '/teacher/tutor-settings', icon: FaRobot },
    { divider: true },
    { section: 'Community' },
    { label: 'Messages', path: '/messages', icon: FaEnvelope, badgeKey: 'messages', badgeVariant: 'red' },
    { label: 'Help', path: '/teacher/help', icon: FaQuestionCircle },
  ],

  admin: [
    { section: 'Overview' },
    { label: 'Dashboard', path: '/admin/dashboard', icon: FaHome },
    { divider: true },
    { section: 'Academic' },
    { label: 'Forms', path: '/admin/forms', icon: FaSchool },
    { label: 'Classes', path: '/admin/classes', icon: FaChalkboardTeacher },
    { label: 'Subjects', path: '/admin/subjects', icon: FaBook },
    { label: 'Curriculum', path: '/teacher/curriculum', icon: FaBookOpen },
    { divider: true },
    { section: 'People' },
    { label: 'Students', path: '/admin/students', icon: FaUserGraduate },
    { label: 'Instructors', path: '/admin/instructors', icon: FaUsers },
    { divider: true },
    { section: 'System' },
    { label: 'Courses', path: '/admin/courses', icon: FaCubes },
    { label: 'Departments', path: '/admin/departments', icon: FaBuilding },
    { label: 'Users', path: '/admin/users', icon: FaUsersCog },
    { label: 'AR/VR Content', path: '/admin/arvr-content', icon: FaVrCardboard },
    { divider: true },
    { section: 'Community' },
    { label: 'Messages', path: '/messages', icon: FaEnvelope, badgeKey: 'messages', badgeVariant: 'red' },
    { label: 'Help', path: '/admin/help', icon: FaQuestionCircle },
  ],

  school_admin: [
    { section: 'Overview' },
    { label: 'Dashboard', path: '/school-admin/dashboard', icon: FaHome },
    { divider: true },
    { section: 'Academic' },
    { label: 'Forms', path: '/school-admin/forms', icon: FaSchool },
    { label: 'Classes', path: '/school-admin/classes', icon: FaChalkboardTeacher },
    { label: 'Subjects', path: '/school-admin/subjects', icon: FaBook },
    { divider: true },
    { section: 'People' },
    { label: 'Students', path: '/school-admin/students', icon: FaUserGraduate },
    { label: 'Instructors', path: '/school-admin/instructors', icon: FaUsers },
    { divider: true },
    { section: 'Reports' },
    { label: 'Reports', path: '/school-admin/reports', icon: FaChartBar },
    { label: 'Report Cards', path: '/school-admin/report-cards', icon: FaClipboardList },
    { divider: true },
    { section: 'Community' },
    { label: 'Messages', path: '/messages', icon: FaEnvelope, badgeKey: 'messages', badgeVariant: 'red' },
    { label: 'Help', path: '/help', icon: FaQuestionCircle },
  ],

  parent: [
    { section: 'Overview' },
    { label: 'Dashboard', path: '/parent/dashboard', icon: FaHome },
    { divider: true },
    { section: 'Community' },
    { label: 'Messages', path: '/messages', icon: FaEnvelope, badgeKey: 'messages', badgeVariant: 'red' },
    { label: 'Help', path: '/help', icon: FaQuestionCircle },
  ],
};

export default sidebarNavConfig;
