import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

// Helper function to get auth header
const authHeader = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.token) {
    return { Authorization: `Bearer ${user.token}` };
  } else {
    return {};
  }
};

// Admin Dashboard
const getDashboardStats = async () => {
  const response = await axios.get(`${API_URL}/admin/dashboard`, { headers: authHeader() });
  return response.data;
};

// User Management
const getAllUsers = async () => {
  const response = await axios.get(`${API_URL}/admin/users`, { headers: authHeader() });
  return response.data;
};

const getUserById = async (userId) => {
  const response = await axios.get(`${API_URL}/admin/users/${userId}`, { headers: authHeader() });
  return response.data;
};

const updateUserStatus = async (userId, active) => {
  const response = await axios.put(
    `${API_URL}/admin/users/${userId}/status`, 
    { active }, 
    { headers: authHeader() }
  );
  return response.data;
};

// Course Management
const getAllCourses = async () => {
  const response = await axios.get(`${API_URL}/courses`, { headers: authHeader() });
  return response.data;
};

const getCourseById = async (courseId) => {
  const response = await axios.get(`${API_URL}/courses/${courseId}`, { headers: authHeader() });
  return response.data;
};

const createCourse = async (courseData) => {
  const response = await axios.post(
    `${API_URL}/courses`, 
    courseData, 
    { headers: authHeader() }
  );
  return response.data;
};

const updateCourse = async (courseId, courseData) => {
  const response = await axios.put(
    `${API_URL}/courses/${courseId}`, 
    courseData, 
    { headers: authHeader() }
  );
  return response.data;
};

const deleteCourse = async (courseId) => {
  const response = await axios.delete(
    `${API_URL}/courses/${courseId}`, 
    { headers: authHeader() }
  );
  return response.data;
};

const activateCourse = async (courseId) => {
  const response = await axios.put(
    `${API_URL}/courses/${courseId}/activate`, 
    {}, 
    { headers: authHeader() }
  );
  return response.data;
};

const deactivateCourse = async (courseId) => {
  const response = await axios.put(
    `${API_URL}/courses/${courseId}/deactivate`, 
    {}, 
    { headers: authHeader() }
  );
  return response.data;
};

// Instructor Management
const getAllInstructors = async () => {
  const response = await axios.get(`${API_URL}/instructors`, { headers: authHeader() });
  return response.data;
};

const createInstructor = async (instructorData) => {
  // First create user with INSTRUCTOR role
  const userResponse = await axios.post(
    `${API_URL}/users`,
    {
      name: `${instructorData.firstName} ${instructorData.lastName}`,
      email: instructorData.email,
      password: instructorData.password,
      role: 'INSTRUCTOR',
      isActive: instructorData.isActive
    },
    { headers: authHeader() }
  );
  
  // Then create instructor record
  const response = await axios.post(
    `${API_URL}/instructors`,
    {
      userId: userResponse.data.userId,
      departmentId: instructorData.departmentId,
      specialization: instructorData.specialization || '',
      officeLocation: instructorData.officeLocation || '',
      officeHours: instructorData.officeHours || ''
    },
    { headers: authHeader() }
  );
  return response.data;
};

const updateInstructor = async (instructorId, instructorData) => {
  const response = await axios.put(
    `${API_URL}/instructors/${instructorId}`, 
    instructorData, 
    { headers: authHeader() }
  );
  return response.data;
};

const getCourseInstructors = async (courseId) => {
  const response = await axios.get(
    `${API_URL}/instructors/courses/${courseId}`, 
    { headers: authHeader() }
  );
  return response.data;
};

const assignInstructorToCourse = async (courseId, instructorId) => {
  const response = await axios.post(
    `${API_URL}/instructors/${instructorId}/courses/${courseId}`, 
    { role: 'PRIMARY' }, 
    { headers: authHeader() }
  );
  return response.data;
};

const removeInstructorFromCourse = async (courseId, instructorId) => {
  const response = await axios.delete(
    `${API_URL}/instructors/${instructorId}/courses/${courseId}`, 
    { headers: authHeader() }
  );
  return response.data;
};

const activateInstructor = async (instructorId) => {
  const response = await axios.put(
    `${API_URL}/instructors/${instructorId}/activate`, 
    {}, 
    { headers: authHeader() }
  );
  return response.data;
};

const deactivateInstructor = async (instructorId) => {
  const response = await axios.put(
    `${API_URL}/instructors/${instructorId}/deactivate`, 
    {}, 
    { headers: authHeader() }
  );
  return response.data;
};

// Enrollment Management
const getPendingEnrollments = async () => {
  const response = await axios.get(
    `${API_URL}/enrollments/pending`, 
    { headers: authHeader() }
  );
  return response.data;
};

const approveEnrollment = async (enrollmentId) => {
  const response = await axios.put(
    `${API_URL}/enrollments/${enrollmentId}/approve`, 
    {}, 
    { headers: authHeader() }
  );
  return response.data;
};

const rejectEnrollment = async (enrollmentId) => {
  const response = await axios.put(
    `${API_URL}/enrollments/${enrollmentId}/reject`, 
    {}, 
    { headers: authHeader() }
  );
  return response.data;
};

const getEnrollmentsByCourse = async (courseId) => {
  const response = await axios.get(
    `${API_URL}/enrollments/course/${courseId}`, 
    { headers: authHeader() }
  );
  return response.data;
};

const getEnrollmentsByStudent = async (studentId) => {
  const response = await axios.get(
    `${API_URL}/enrollments/student/${studentId}`, 
    { headers: authHeader() }
  );
  return response.data;
};

export const adminService = {
  // Dashboard
  getDashboardStats,
  
  // User Management
  getAllUsers,
  getUserById,
  updateUserStatus,
  
  // Course Management
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  activateCourse,
  deactivateCourse,
  
  // Instructor Management
  getAllInstructors,
  createInstructor,
  updateInstructor,
  getCourseInstructors,
  assignInstructorToCourse,
  removeInstructorFromCourse,
  activateInstructor,
  deactivateInstructor,
  
  // Enrollment Management
  getPendingEnrollments,
  approveEnrollment,
  rejectEnrollment,
  getEnrollmentsByCourse,
  getEnrollmentsByStudent
};