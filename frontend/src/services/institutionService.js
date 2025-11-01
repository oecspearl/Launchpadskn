import api from './api';

class InstitutionService {
  // Institution CRUD operations
  async getAllInstitutions() {
    try {
      const response = await api.get('/institutions');
      return response.data;
    } catch (error) {
      console.error('Error fetching institutions:', error);
      throw error;
    }
  }

  async getInstitutionById(id) {
    try {
      const response = await api.get(`/institutions/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching institution:', error);
      throw error;
    }
  }

  async createInstitution(institutionData) {
    try {
      const response = await api.post('/institutions', institutionData);
      return response.data;
    } catch (error) {
      console.error('Error creating institution:', error);
      throw error;
    }
  }

  async updateInstitution(id, institutionData) {
    try {
      const response = await api.put(`/institutions/${id}`, institutionData);
      return response.data;
    } catch (error) {
      console.error('Error updating institution:', error);
      throw error;
    }
  }

  async deleteInstitution(id) {
    try {
      const response = await api.delete(`/institutions/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting institution:', error);
      throw error;
    }
  }

  // Department operations
  async getDepartmentsByInstitution(institutionId) {
    try {
      const response = await api.get(`/institutions/${institutionId}/departments`);
      return response.data;
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  }

  async getAllDepartments() {
    try {
      const response = await api.get('/departments');
      return response.data;
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  }

  async createDepartment(departmentData) {
    try {
      const response = await api.post('/departments', departmentData);
      return response.data;
    } catch (error) {
      console.error('Error creating department:', error);
      throw error;
    }
  }

  async updateDepartment(id, departmentData) {
    try {
      const response = await api.put(`/departments/${id}`, departmentData);
      return response.data;
    } catch (error) {
      console.error('Error updating department:', error);
      throw error;
    }
  }

  async deleteDepartment(id) {
    try {
      const response = await api.delete(`/departments/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting department:', error);
      throw error;
    }
  }

  // Statistics
  async getInstitutionStats(id) {
    try {
      const response = await api.get(`/institutions/${id}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching institution stats:', error);
      throw error;
    }
  }

  async getDepartmentStats(id) {
    try {
      const response = await api.get(`/departments/${id}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching department stats:', error);
      throw error;
    }
  }
}

export default new InstitutionService();