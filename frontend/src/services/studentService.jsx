/**
 * ⚠️ DEPRECATED: This service is no longer used.
 * Student operations have been migrated to Supabase.
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
const getAvailableCourses = async () => {
  const response = await axios.get(`${API_URL}/courses`, { headers: authHeader() });
  return response.data;
};

const getCourseById = async (courseId) => {
  const response = await axios.get(`${API_URL}/courses/${courseId}`, { headers: authHeader() });
  return response.data;
};

// Enrollment Management
const enrollInCourse = async (courseId) => {
  const studentId = getCurrentUserId();
  if (!studentId) {
    throw new Error('User not authenticated');
  }

  const response = await axios.post(
    `${API_URL}/enrollments`,
    { studentId, courseId },
    { headers: authHeader() }
  );
  return response.data;
};

const getMyEnrollments = async () => {
  const studentId = getCurrentUserId();
  if (!studentId) {
    throw new Error('User not authenticated');
  }

  const response = await axios.get(
    `${API_URL}/enrollments/student/${studentId}`,
    { headers: authHeader() }
  );
  return response.data;
};

const getMyActiveEnrollments = async () => {
  const studentId = getCurrentUserId();
  if (!studentId) {
    throw new Error('User not authenticated');
  }

  const response = await axios.get(
    `${API_URL}/enrollments/student/${studentId}/active`,
    { headers: authHeader() }
  );
  return response.data;
};

const dropEnrollment = async (enrollmentId) => {
  const response = await axios.put(
    `${API_URL}/enrollments/${enrollmentId}/drop`,
    {},
    { headers: authHeader() }
  );
  return response.data;
};

export const studentService = {
  // Course Management
  getAvailableCourses,
  getCourseById,

  // Enrollment Management
  enrollInCourse,
  getMyEnrollments,
  getMyActiveEnrollments,
  dropEnrollment
};