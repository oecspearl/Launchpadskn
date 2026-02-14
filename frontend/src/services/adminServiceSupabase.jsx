/**
 * Admin Service - Supabase Version
 * Replaces adminService.js with Supabase queries
 */
import supabaseService from './supabaseService';
import { supabase } from '../config/supabase';

const adminService = {
  
  // ============================================
  // DASHBOARD STATISTICS
  // ============================================
  
  async getDashboardStats() {
    try {
      return await supabaseService.getDashboardStats();
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },
  
  // ============================================
  // USER MANAGEMENT
  // ============================================
  
  async getAllUsers() {
    try {
      return await supabaseService.getAllUsers();
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
  },
  
  async getUserById(id) {
    try {
      return await supabaseService.getUserProfile(id);
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },
  
  async getUsersByRole(role) {
    try {
      return await supabaseService.getUsersByRole(role);
    } catch (error) {
      console.error('Error fetching users by role:', error);
      throw error;
    }
  },
  
  async activateUser(id) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ is_active: true })
        .eq('user_id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error activating user:', error);
      throw error;
    }
  },
  
  async deactivateUser(id) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('user_id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error deactivating user:', error);
      throw error;
    }
  },
  
  async updateUser(id, userData) {
    try {
      return await supabaseService.updateUserProfile(id, userData);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },
  
  // ============================================
  // INSTITUTION MANAGEMENT
  // ============================================
  
  async getAllInstitutions() {
    try {
      return await supabaseService.getAllInstitutions();
    } catch (error) {
      console.error('Error fetching institutions:', error);
      throw error;
    }
  },
  
  async getInstitutionById(id) {
    try {
      return await supabaseService.getInstitutionById(id);
    } catch (error) {
      console.error('Error fetching institution:', error);
      throw error;
    }
  },
  
  async createInstitution(institutionData) {
    try {
      return await supabaseService.createInstitution(institutionData);
    } catch (error) {
      console.error('Error creating institution:', error);
      throw error;
    }
  },
  
  async updateInstitution(id, updates) {
    try {
      return await supabaseService.updateInstitution(id, updates);
    } catch (error) {
      console.error('Error updating institution:', error);
      throw error;
    }
  },
  
  async deleteInstitution(id) {
    try {
      await supabaseService.deleteInstitution(id);
    } catch (error) {
      console.error('Error deleting institution:', error);
      throw error;
    }
  },
  
  // ============================================
  // DEPARTMENT MANAGEMENT
  // ============================================
  
  async getAllDepartments() {
    try {
      return await supabaseService.getAllDepartments();
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  },
  
  async getDepartmentById(id) {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('department_id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching department:', error);
      throw error;
    }
  },
  
  async getDepartmentsByInstitution(institutionId) {
    try {
      return await supabaseService.getDepartmentsByInstitution(institutionId);
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  },
  
  async createDepartment(departmentData) {
    try {
      return await supabaseService.createDepartment(departmentData);
    } catch (error) {
      console.error('Error creating department:', error);
      throw error;
    }
  },
  
  async updateDepartment(id, updates) {
    try {
      const { data, error } = await supabase
        .from('departments')
        .update(updates)
        .eq('department_id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating department:', error);
      throw error;
    }
  },
  
  async deleteDepartment(id) {
    try {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('department_id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting department:', error);
      throw error;
    }
  },
  
  // ============================================
  // FORMS MANAGEMENT (Caribbean School Structure)
  // ============================================
  
  async getAllForms(schoolId) {
    try {
      return await supabaseService.getAllForms(schoolId);
    } catch (error) {
      console.error('Error fetching forms:', error);
      throw error;
    }
  },
  
  async createForm(formData) {
    try {
      return await supabaseService.createForm(formData);
    } catch (error) {
      console.error('Error creating form:', error);
      throw error;
    }
  },
  
  async updateForm(id, updates) {
    try {
      const { data, error } = await supabase
        .from('forms')
        .update(updates)
        .eq('form_id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating form:', error);
      throw error;
    }
  },
  
  // ============================================
  // CLASSES MANAGEMENT
  // ============================================
  
  async getClassesByForm(formId) {
    try {
      return await supabaseService.getClassesByForm(formId);
    } catch (error) {
      console.error('Error fetching classes:', error);
      throw error;
    }
  },
  
  async createClass(classData) {
    try {
      return await supabaseService.createClass(classData);
    } catch (error) {
      console.error('Error creating class:', error);
      throw error;
    }
  },
  
  // ============================================
  // SUBJECTS MANAGEMENT
  // ============================================
  
  async getAllSubjects(schoolId) {
    try {
      return await supabaseService.getAllSubjects(schoolId);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      throw error;
    }
  },
  
  async createSubject(subjectData) {
    try {
      return await supabaseService.createSubject(subjectData);
    } catch (error) {
      console.error('Error creating subject:', error);
      throw error;
    }
  },
  
  // ============================================
  // INSTRUCTOR MANAGEMENT
  // ============================================
  
  async getAllInstructors() {
    try {
      return await supabaseService.getUsersByRole('INSTRUCTOR');
    } catch (error) {
      console.error('Error fetching instructors:', error);
      throw error;
    }
  },
  
  async createInstructor(instructorData) {
    try {
      // Use Supabase Auth to create user, then update profile
      const { supabase: authSupabase } = await import('../config/supabase');
      
      // Create auth user first
      const { data: authData, error: authError } = await authSupabase.auth.signUp({
        email: instructorData.email,
        password: instructorData.password,
        options: {
          data: {
            name: `${instructorData.firstName} ${instructorData.lastName}`,
            role: 'INSTRUCTOR'
          }
        }
      });
      
      if (authError) throw authError;
      
      // Create profile in users table
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          name: `${instructorData.firstName} ${instructorData.lastName}`,
          email: instructorData.email,
          role: 'INSTRUCTOR',
          is_active: instructorData.isActive !== false,
          department_id: instructorData.departmentId || null
        })
        .select()
        .single();
      
      if (profileError) {
        // Rollback: delete auth user if profile creation fails
        await authSupabase.auth.admin.deleteUser(authData.user.id);
        throw profileError;
      }
      
      return profileData;
    } catch (error) {
      console.error('Error creating instructor:', error);
      throw error;
    }
  },
  
  // Note: Course-related methods will be in a separate service
  // as they belong to the Caribbean school structure (Forms/Classes/Subjects)
};

export default adminService;


