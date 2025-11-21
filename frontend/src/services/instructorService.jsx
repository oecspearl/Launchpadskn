/**
 * ⚠️ DEPRECATED: This service is no longer used.
 * Instructor operations have been migrated to Supabase.
 * Use `supabaseService.js` instead.
 * 
 * This file is kept for reference only.
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Helper function to get auth header
const authHeader = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.token) {
    return { Authorization: `Bearer ${user.token}` };
  } else {
    return {};
  }
};

// Get current user ID
const getCurrentUserId = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return user ? user.userId : null;
};

// Course Management
const getInstructorCourses = async () => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  try {
    const instructorResponse = await axios.get(
      `${API_URL}/instructors/user/${userId}`,
      { headers: authHeader() }
    );

    const instructor = instructorResponse.data;
    const coursesResponse = await axios.get(
      `${API_URL}/instructors/${instructor.instructorId}/courses/detailed`,
      { headers: authHeader() }
    );

    return { data: coursesResponse.data };
  } catch (error) {
    console.error('Error fetching instructor courses:', error);
    return { data: [] };
  }
};

const getCourseById = async (courseId) => {
  const response = await axios.get(`${API_URL}/courses/${courseId}`, { headers: authHeader() });
  return response.data;
};

// Course Content Management
const getCourseContents = async (courseId) => {
  const response = await axios.get(
    `${API_URL}/contents/course/${courseId}`,
    { headers: authHeader() }
  );
  return response.data;
};

const createCourseContent = async (contentData, file) => {
  const formData = new FormData();
  if (file) {
    formData.append('file', file);
  }

  // Add other contentData fields to formData
  for (const key in contentData) {
    formData.append(key, contentData[key]);
  }

  const response = await axios.post(
    `${API_URL}/contents/upload`,
    formData,
    {
      headers: {
        ...authHeader(),
        'Content-Type': 'multipart/form-data',
      }
    }
  );
  return response.data;
};

// Assignment Management
const getPendingAssignments = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/submissions/ungraded`,
      { headers: authHeader() }
    );
    return { data: response.data };
  } catch (error) {
    console.error('Error fetching pending assignments:', error);
    return { data: [] };
  }
};

// Get instructor profile with department info
const getInstructorProfile = async () => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  try {
    const instructorResponse = await axios.get(
      `${API_URL}/instructors/user/${userId}`,
      { headers: authHeader() }
    );
    return { data: instructorResponse.data };
  } catch (error) {
    console.error('Error fetching instructor profile:', error);
    return { data: null };
  }
};

// Get instructor notifications
const getInstructorNotifications = async () => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  try {
    const instructorResponse = await axios.get(
      `${API_URL}/instructors/user/${userId}`,
      { headers: authHeader() }
    );

    const instructor = instructorResponse.data;
    const notificationsResponse = await axios.get(
      `${API_URL}/notifications/instructor/${instructor.instructorId}`,
      { headers: authHeader() }
    );
    return { data: notificationsResponse.data };
  } catch (error) {
    console.error('Error fetching instructor notifications:', error);
    return { data: [] };
  }
};

const getSubmissionsByAssignment = async (assignmentId) => {
  const response = await axios.get(
    `${API_URL}/submissions/assignment/${assignmentId}`,
    { headers: authHeader() }
  );
  return response.data;
};

const gradeSubmission = async (submissionId, gradeData) => {
  const userId = getCurrentUserId();
  const response = await axios.post(
    `${API_URL}/submissions/${submissionId}/grade`,
    { ...gradeData, gradedById: userId },
    { headers: authHeader() }
  );
  return response.data;
};

export const instructorService = {
  // Course Management
  getInstructorCourses,
  getCourseById,

  // Content Management
  getCourseContents,
  createCourseContent,

  // Assignment Management
  getPendingAssignments,
  getSubmissionsByAssignment,
  gradeSubmission,

  // Profile Management
  getInstructorProfile,

  // Notifications
  getInstructorNotifications
};