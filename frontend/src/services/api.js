/**
 * ⚠️ DEPRECATED: This service is no longer used.
 * All API calls have been migrated to Supabase.
 * Use `supabaseService.js` instead.
 * 
 * This file is kept for reference only.
 */

import axios from 'axios';

const API_URL = 'http://localhost:8080/api/';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add interceptor to include token in all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Common API calls
const commonService = {
  // Get current user profile
  getCurrentUserProfile: () => api.get('users/profile'),
};

// Admin API calls
const adminService = {
  // Dashboard statistics
  getDashboardStats: async () => {
    try {
      // Use the dedicated dashboard stats endpoint
      const response = await api.get('dashboard/stats');
      
      // Extract the data from the response
      const stats = response.data || {};
      
      // Add derived statistics if needed
      return {
        totalUsers: stats.totalUsers || 0,
        totalCourses: stats.totalCourses || 0,
        totalInstructors: stats.totalInstructors || 0,
        totalStudents: stats.totalStudents || 0,
        activeUsers: stats.activeUsers || 0,
        activeCourses: stats.activeCourses || 0,
        recentUsers: stats.recentUsers || 0,
        recentCourses: stats.recentCourses || 0
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },
  
  // Users management
  getAllUsers: () => api.get('users'),
  getUserById: (id) => api.get(`users/${id}`),
  getUsersByRole: (role) => api.get(`users/role/${role}`),
  activateUser: (id) => api.put(`users/${id}/activate`),
  deactivateUser: (id) => api.put(`users/${id}/deactivate`),
  updateUser: (id, userData) => api.put(`users/${id}`, userData),
  
  // Courses management
  getAllCourses: () => api.get('courses'),
  getActiveCourses: () => api.get('courses/active'),
  getCourseById: (id) => api.get(`courses/${id}`),
  getCourseByCode: (code) => api.get(`courses/code/${code}`),
  getCoursesByDepartment: (departmentId) => api.get(`courses/department/${departmentId}`),
  createCourse: (courseData) => api.post('courses', courseData),
  updateCourse: (id, courseData) => api.put(`courses/${id}`, courseData),
  deleteCourse: (id) => api.delete(`courses/${id}`),
  activateCourse: (id) => api.put(`courses/${id}/activate`),
  deactivateCourse: (id) => api.put(`courses/${id}/deactivate`),
  
  // Departments management
  getAllDepartments: () => api.get('departments'),
  getDepartmentById: (id) => api.get(`departments/${id}`),
  getDepartmentByCode: (code) => api.get(`departments/code/${code}`),
  getDepartmentsByInstitution: (institutionId) => api.get(`departments/institution/${institutionId}`),
  createDepartment: (departmentData) => api.post('departments', departmentData),
  updateDepartment: (id, departmentData) => api.put(`departments/${id}`, departmentData),
  deleteDepartment: (id) => api.delete(`departments/${id}`),
  
  // Institutions management
  getAllInstitutions: () => api.get('institutions'),
  getInstitutionById: (id) => api.get(`institutions/${id}`),
  getInstitutionByName: (name) => api.get(`institutions/name/${name}`),
  createInstitution: (institutionData) => api.post('institutions', institutionData),
  updateInstitution: (id, institutionData) => api.put(`institutions/${id}`, institutionData),
  deleteInstitution: (id) => api.delete(`institutions/${id}`),
  
  // Instructor management
  getAllInstructors: () => api.get('instructors'),
  getActiveInstructors: () => api.get('instructors/active'),
  getInstructorById: (id) => api.get(`instructors/${id}`),
  getInstructorByUserId: (userId) => api.get(`instructors/user/${userId}`),
  createInstructor: (instructorData) => {
    return api.post('users', {
      name: `${instructorData.firstName} ${instructorData.lastName}`,
      email: instructorData.email,
      password: instructorData.password,
      role: 'INSTRUCTOR',
      isActive: instructorData.isActive,
      departmentId: instructorData.departmentId
    });
  },
  updateInstructor: (id, instructorData) => api.put(`instructors/${id}`, instructorData),
  activateInstructor: (id) => api.put(`instructors/${id}/activate`),
  deactivateInstructor: (id) => api.put(`instructors/${id}/deactivate`),
  assignInstructorToCourse: (instructorId, courseId, role) => 
    api.post(`instructors/${instructorId}/courses/${courseId}`, { role }),
  removeInstructorFromCourse: (instructorId, courseId) => 
    api.delete(`instructors/${instructorId}/courses/${courseId}`),
  getInstructorsByCourse: (courseId) => api.get(`courses/${courseId}/instructors`),
  getCourseInstructors: (courseId) => api.get(`courses/${courseId}/instructors`),
  getInstructorCourses: (instructorId) => api.get(`courses/instructor/${instructorId}`)
};

// Instructor API calls
const instructorService = {
  // Instructor's courses
  getInstructorCourses: async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.userId) throw new Error('User not found');
      
      // First get instructor by userId, then get their courses
      const instructorResponse = await api.get(`instructors/user/${user.userId}`);
      const instructor = instructorResponse.data;
      
      const coursesResponse = await api.get(`instructors/${instructor.instructorId}/courses`);
      return coursesResponse.data.map(courseInstructor => courseInstructor.course);
    } catch (error) {
      console.error('Error fetching instructor courses:', error);
      return [];
    }
  },
  
  // Pending assignments to grade
  getPendingAssignments: async () => {
    try {
      const response = await api.get('submissions/ungraded');
      return response.data;
    } catch (error) {
      console.error('Error fetching pending assignments:', error);
      return [];
    }
  },
  
  // Course content management
  getCourseContents: (courseId) => api.get(`contents/course/${courseId}`),
  getContentById: (contentId) => api.get(`contents/${contentId}`),
  createCourseContent: (contentData, file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add other contentData fields to formData
    for (const key in contentData) {
      formData.append(key, contentData[key]);
    }
    
    return api.post(`contents/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  updateContent: (contentId, contentData) => api.put(`contents/${contentId}`, contentData),
  deleteContent: (contentId) => api.delete(`contents/${contentId}`),
  
  // Assignment management
  getAssignmentsByCourse: (courseId) => api.get(`contents/course/${courseId}/assignments`),
  getLecturesByCourse: (courseId) => api.get(`contents/course/${courseId}/lectures`),
  getResourcesByCourse: (courseId) => api.get(`contents/course/${courseId}/resources`),
  
  // Grade management
  getSubmissionById: (submissionId) => api.get(`submissions/${submissionId}`),
  getSubmissionsByAssignment: (assignmentId) => api.get(`submissions/assignment/${assignmentId}`),
  gradeSubmission: (submissionId, gradeData) => {
    const user = JSON.parse(localStorage.getItem('user'));
    return api.post(`submissions/${submissionId}/grade`, {
      ...gradeData,
      gradedById: user.userId
    });
  }
};

// Student API calls
const studentService = {
  // Student's registered courses
  getRegisteredCourses: async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.userId) throw new Error('User not found');
      
      // This targets the enrollment endpoint
      const response = await api.get(`enrollments/student/${user.userId}/active`);
      
      // Map enrollment data to get course details
      return response.data.map(enrollment => enrollment.course);
    } catch (error) {
      console.error('Error fetching registered courses:', error);
      throw error;
    }
  },
  
  // Available courses for registration
  getAvailableCourses: async () => {
    try {
      // Get all active courses
      const allCoursesResponse = await api.get('courses/active');
      
      // Get user's registered courses
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.userId) throw new Error('User not found');
      
      const enrollmentsResponse = await api.get(`enrollments/student/${user.userId}`);
      
      // Filter out courses the student is already enrolled in
      const enrolledCourseIds = enrollmentsResponse.data.map(e => e.course.courseId);
      return allCoursesResponse.data.filter(course => !enrolledCourseIds.includes(course.courseId));
    } catch (error) {
      console.error('Error fetching available courses:', error);
      throw error;
    }
  },
  
  // Course enrollment
  getEnrollmentById: (enrollmentId) => api.get(`enrollments/${enrollmentId}`),
  getEnrollmentsByCourse: (courseId) => api.get(`enrollments/course/${courseId}`),
  getEnrollmentsByStudent: (studentId) => api.get(`enrollments/student/${studentId}`),
  getActiveEnrollmentsByCourse: (courseId) => api.get(`enrollments/course/${courseId}/active`),
  getActiveEnrollmentsByStudent: () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return api.get(`enrollments/student/${user.userId}/active`);
  },
  
  // Enroll in a course
  enrollInCourse: (courseId) => {
    const user = JSON.parse(localStorage.getItem('user'));
    return api.post('enrollments', {
      studentId: user.userId,
      courseId: courseId
    });
  },
  
  // Drop a course
  dropCourse: (enrollmentId) => api.put(`enrollments/${enrollmentId}/drop`),
  
  // Assignment submission
  getAssignmentsByCourse: (courseId) => api.get(`contents/course/${courseId}/assignments`),
  getContentById: (contentId) => api.get(`contents/${contentId}`),
  
  // Submit assignment
  submitAssignment: (assignmentId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const user = JSON.parse(localStorage.getItem('user'));
    formData.append('assignmentId', assignmentId);
    formData.append('studentId', user.userId);
    
    return api.post('submissions/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Get student's submissions
  getStudentSubmissions: () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return api.get(`submissions/student/${user.userId}`);
  },
  
  getSubmissionByAssignmentAndStudent: (assignmentId) => {
    const user = JSON.parse(localStorage.getItem('user'));
    return api.get(`submissions/assignment/${assignmentId}/student/${user.userId}`);
  }
};

// Default export for the axios instance
export default api;

// Named exports for services
export { commonService, adminService, instructorService, studentService };