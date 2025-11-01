import api from './api';

class AnalyticsService {
  // User Analytics
  async getUserTrends() {
    try {
      const response = await api.get('/analytics/users/trends');
      return response.data;
    } catch (error) {
      console.error('Error fetching user trends:', error);
      throw error;
    }
  }

  async getUsersByRole() {
    try {
      const response = await api.get('/analytics/users/by-role');
      return response.data;
    } catch (error) {
      console.error('Error fetching users by role:', error);
      throw error;
    }
  }

  // Course Analytics
  async getCourseTrends() {
    try {
      const response = await api.get('/analytics/courses/trends');
      return response.data;
    } catch (error) {
      console.error('Error fetching course trends:', error);
      throw error;
    }
  }

  async getEnrollmentTrends() {
    try {
      const response = await api.get('/analytics/enrollments/trends');
      return response.data;
    } catch (error) {
      console.error('Error fetching enrollment trends:', error);
      throw error;
    }
  }

  async getCoursesByDepartment() {
    try {
      const response = await api.get('/analytics/courses/by-department');
      return response.data;
    } catch (error) {
      console.error('Error fetching courses by department:', error);
      throw error;
    }
  }

  // System Health
  async getSystemHealth() {
    try {
      const response = await api.get('/analytics/system/health');
      return response.data;
    } catch (error) {
      console.error('Error fetching system health:', error);
      throw error;
    }
  }

  // Export Functions
  async exportData(type, format = 'json') {
    try {
      const response = await api.get(`/analytics/export/${type}`, {
        params: { format },
        responseType: format === 'pdf' ? 'blob' : 'json'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }
}

export default new AnalyticsService();