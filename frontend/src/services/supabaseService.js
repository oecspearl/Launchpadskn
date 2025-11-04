/**
 * Supabase Service Layer
 * Replaces all backend API calls with Supabase queries
 */
import { supabase } from '../config/supabase';

class SupabaseService {
  
  // ============================================
  // AUTHENTICATION
  // ============================================
  
  /**
   * Sign in with email and password
   */
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Sign up new user
   */
  async signUp(email, password, metadata = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata // Custom user metadata (name, role, etc.)
      }
    });
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Sign out current user
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
  
  /**
   * Get current session
   */
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  }
  
  /**
   * Get current user
   */
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  }
  
  /**
   * Reset password
   */
  async resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    if (error) throw error;
  }
  
  /**
   * Update password
   */
  async updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
  }
  
  // ============================================
  // DATABASE OPERATIONS
  // ============================================
  
  /**
   * Get user profile from users table
   * Tries both user_id and id (UUID) columns
   */
  async getUserProfile(userId) {
    // First try by UUID (id column)
    let { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    // If not found, try by user_id (in case UUID is stored differently)
    if (error || !data) {
      const { data: data2, error: error2 } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error2 && error2.code !== 'PGRST116') throw error2;
      if (data2) return data2;
    }
    
    if (error && error.code !== 'PGRST116') throw error;
    if (!data) throw new Error('User profile not found');
    
    return data;
  }
  
  /**
   * Update user profile
   * Tries both user_id and id (UUID) columns
   */
  async updateUserProfile(userId, updates) {
    // Try by UUID first
    let { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .maybeSingle();
    
    // If not found, try by user_id
    if (error || !data) {
      const { data: data2, error: error2 } = await supabase
        .from('users')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .maybeSingle();
      
      if (error2 && error2.code !== 'PGRST116') throw error2;
      if (data2) return data2;
      
      // If still not found, try to insert
      const { data: data3, error: error3 } = await supabase
        .from('users')
        .insert({
          id: userId,
          ...updates
        })
        .select()
        .single();
      
      if (error3) throw error3;
      return data3;
    }
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
  
  /**
   * Get all users (Admin only - requires RLS policy)
   */
  async getAllUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Get users by role
   */
  async getUsersByRole(role) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', role)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
  
  // ============================================
  // INSTITUTIONS
  // ============================================
  
  /**
   * Helper function to convert snake_case to camelCase
   */
  toCamelCase(str) {
    return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
  }
  
  /**
   * Helper function to transform institution object from snake_case to camelCase
   */
  transformInstitution(institution) {
    if (!institution) return null;
    return {
      ...institution,
      establishedYear: institution.established_year || institution.establishedYear,
      institutionId: institution.institution_id || institution.institutionId,
      createdAt: institution.created_at || institution.createdAt,
      institutionType: institution.institution_type || institution.institutionType
    };
  }
  
  /**
   * Helper function to transform institution data for database (camelCase to snake_case)
   */
  transformInstitutionForDB(institutionData) {
    const transformed = { ...institutionData };
    
    // Handle establishedYear -> established_year
    if (transformed.establishedYear !== undefined) {
      transformed.established_year = transformed.establishedYear;
      delete transformed.establishedYear;
    }
    
    // Handle institutionId -> institution_id (don't include in updates/inserts)
    if (transformed.institutionId !== undefined) {
      delete transformed.institutionId; // Don't send ID in data, it's used separately
    }
    
    // Handle institutionType -> institution_type
    if (transformed.institutionType !== undefined) {
      transformed.institution_type = transformed.institutionType;
      delete transformed.institutionType;
    }
    
    // Also handle 'type' field (legacy support)
    if (transformed.type !== undefined && !transformed.institution_type) {
      transformed.institution_type = transformed.type;
    }
    
    return transformed;
  }
  
  async getAllInstitutions() {
    const { data, error } = await supabase
      .from('institutions')
      .select('*')
      .order('name');
    
    if (error) throw error;
    // Transform data to camelCase
    return (data || []).map(inst => this.transformInstitution(inst));
  }
  
  async getInstitutionById(id) {
    const { data, error } = await supabase
      .from('institutions')
      .select('*')
      .eq('institution_id', id)
      .single();
    
    if (error) throw error;
    return this.transformInstitution(data);
  }
  
  async createInstitution(institutionData) {
    // Transform camelCase to snake_case for database
    const dbData = this.transformInstitutionForDB(institutionData);
    const { data, error } = await supabase
      .from('institutions')
      .insert(dbData)
      .select()
      .single();
    
    if (error) throw error;
    return this.transformInstitution(data);
  }
  
  async updateInstitution(id, updates) {
    // Transform camelCase to snake_case for database
    const dbUpdates = this.transformInstitutionForDB(updates);
    const { data, error } = await supabase
      .from('institutions')
      .update(dbUpdates)
      .eq('institution_id', id)
      .select()
      .single();
    
    if (error) throw error;
    return this.transformInstitution(data);
  }
  
  async deleteInstitution(id) {
    const { error } = await supabase
      .from('institutions')
      .delete()
      .eq('institution_id', id);
    
    if (error) throw error;
  }
  
  // ============================================
  // DEPARTMENTS
  // ============================================
  
  async getAllDepartments() {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  }
  
  async getDepartmentsByInstitution(institutionId) {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('institution_id', institutionId)
      .order('name');
    
    if (error) throw error;
    return data;
  }
  
  async createDepartment(departmentData) {
    const { data, error } = await supabase
      .from('departments')
      .insert(departmentData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  // ============================================
  // FORMS (Caribbean School Structure)
  // ============================================
  
  async getAllForms(schoolId) {
    const { data, error } = await supabase
      .from('forms')
      .select('*')
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .order('form_number');
    
    if (error) throw error;
    return data;
  }
  
  async createForm(formData) {
    const { data, error } = await supabase
      .from('forms')
      .insert(formData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  // ============================================
  // CLASSES
  // ============================================
  
  async getClassesByForm(formId) {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('form_id', formId)
      .eq('is_active', true)
      .order('class_name');
    
    if (error) throw error;
    return data;
  }
  
  async createClass(classData) {
    const { data, error } = await supabase
      .from('classes')
      .insert(classData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  // ============================================
  // SUBJECTS
  // ============================================
  
  async getAllSubjects(schoolId) {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .order('subject_name');
    
    if (error) throw error;
    return data;
  }
  
  async createSubject(subjectData) {
    const { data, error } = await supabase
      .from('subjects')
      .insert(subjectData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  // ============================================
  // LESSONS
  // ============================================
  
  async getLessonsByClassSubject(classSubjectId) {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('class_subject_id', classSubjectId)
      .order('lesson_date', { ascending: false });
    
    if (error) throw error;
    return data;
  }
  
  async createLesson(lessonData) {
    const { data, error } = await supabase
      .from('lessons')
      .insert(lessonData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  // ============================================
  // STORAGE OPERATIONS
  // ============================================
  
  /**
   * List files in a Supabase Storage bucket/folder
   */
  async listFiles(bucket, folderPath = '') {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(folderPath, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });
      
      if (error) throw error;
      
      // Get public URLs for each file
      const filesWithUrls = await Promise.all(
        (data || []).map(async (file) => {
          const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(`${folderPath}/${file.name}`);
          
          return {
            name: file.name,
            size: file.metadata?.size || 0,
            createdAt: file.created_at,
            updatedAt: file.updated_at,
            url: urlData.publicUrl,
            publicUrl: urlData.publicUrl
          };
        })
      );
      
      return filesWithUrls;
    } catch (error) {
      console.error('[supabaseService] Error listing files:', error);
      return [];
    }
  }
  
  /**
   * Upload file to Supabase Storage
   */
  async uploadFile(bucket, filePath, file) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Get public URL for file
   */
  getPublicUrl(bucket, filePath) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  }
  
  /**
   * Delete file from storage
   */
  async deleteFile(bucket, filePath) {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);
    
    if (error) throw error;
  }
  
  // ============================================
  // ANALYTICS / STATISTICS
  // ============================================
  
  async getDashboardStats() {
    try {
      console.log('[supabaseService] getDashboardStats called');
      
      // Get counts from different tables using Supabase
      // Use Promise.allSettled to handle errors gracefully
      const [
        usersResult,
        subjectsResult,
        classesResult,
        formsResult,
        studentsResult,
        instructorsResult,
        adminsResult
      ] = await Promise.allSettled([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('subjects').select('*', { count: 'exact', head: true }),
        supabase.from('classes').select('*', { count: 'exact', head: true }),
        supabase.from('forms').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'STUDENT'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'INSTRUCTOR'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'ADMIN')
      ]);
      
      const totalUsers = usersResult.status === 'fulfilled' ? (usersResult.value.count || 0) : 0;
      const totalSubjects = subjectsResult.status === 'fulfilled' ? (subjectsResult.value.count || 0) : 0;
      const totalClasses = classesResult.status === 'fulfilled' ? (classesResult.value.count || 0) : 0;
      const totalForms = formsResult.status === 'fulfilled' ? (formsResult.value.count || 0) : 0;
      const totalStudents = studentsResult.status === 'fulfilled' ? (studentsResult.value.count || 0) : 0;
      const totalInstructors = instructorsResult.status === 'fulfilled' ? (instructorsResult.value.count || 0) : 0;
      const totalAdmins = adminsResult.status === 'fulfilled' ? (adminsResult.value.count || 0) : 0;
      
      console.log('[supabaseService] Stats:', { totalUsers, totalSubjects, totalClasses, totalForms, totalStudents, totalInstructors, totalAdmins });
      
      // Return stats object
      return {
        totalUsers,
        totalSubjects,
        totalCourses: totalSubjects, // Alias for backward compatibility
        totalClasses,
        totalForms,
        totalStudents,
        totalInstructors,
        totalAdmins
      };
    } catch (error) {
      console.error('[supabaseService] Error in getDashboardStats:', error);
      // Return default values instead of throwing
      return {
        totalUsers: 0,
        totalSubjects: 0,
        totalCourses: 0,
        totalClasses: 0,
        totalForms: 0,
        totalStudents: 0,
        totalInstructors: 0,
        totalAdmins: 0
      };
    }
  }

  /**
   * Get recent activity for dashboard
   * Fetches recent user registrations, subject/class/form creations
   */
  async getRecentActivity(limit = 10) {
    try {
      console.log('[supabaseService] getRecentActivity called');
      
      // Get recent users (last 7 days) - use a shorter time window for better performance
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      // Use Promise.allSettled with individual timeouts to prevent hanging
      const activityTimeout = 2000; // 2 seconds max per query
      
      const createTimeoutPromise = (timeoutMs) => 
        new Promise((resolve) => setTimeout(() => resolve({ status: 'fulfilled', value: { data: [] } }), timeoutMs));
      
      const [
        recentUsersResult,
        recentSubjectsResult,
        recentClassesResult,
        recentFormsResult
      ] = await Promise.allSettled([
        Promise.race([
          supabase
            .from('users')
            .select('user_id, email, name, role, created_at')
            .gte('created_at', sevenDaysAgo.toISOString())
            .order('created_at', { ascending: false })
            .limit(limit),
          createTimeoutPromise(activityTimeout)
        ]),
        Promise.race([
          supabase
            .from('subjects')
            .select('subject_id, subject_name, created_at')
            .gte('created_at', sevenDaysAgo.toISOString())
            .order('created_at', { ascending: false })
            .limit(limit),
          createTimeoutPromise(activityTimeout)
        ]),
        Promise.race([
          supabase
            .from('classes')
            .select('class_id, class_name, created_at')
            .gte('created_at', sevenDaysAgo.toISOString())
            .order('created_at', { ascending: false })
            .limit(limit),
          createTimeoutPromise(activityTimeout)
        ]),
        Promise.race([
          supabase
            .from('forms')
            .select('form_id, form_number, form_name, created_at')
            .gte('created_at', sevenDaysAgo.toISOString())
            .order('created_at', { ascending: false })
            .limit(limit),
          createTimeoutPromise(activityTimeout)
        ])
      ]);
      
      const activities = [];
      
      // Process recent users
      if (recentUsersResult.status === 'fulfilled' && recentUsersResult.value.data) {
        recentUsersResult.value.data.forEach(user => {
          const roleText = user.role === 'ADMIN' ? 'admin' : 
                          user.role === 'INSTRUCTOR' ? 'instructor' : 
                          'student';
          activities.push({
            id: `user-${user.user_id}`,
            type: 'user',
            user: user.name || user.email,
            action: 'registered as',
            target: roleText,
            time: this.formatRelativeTime(user.created_at),
            timestamp: new Date(user.created_at).getTime()
          });
        });
      }
      
      // Process recent subjects
      if (recentSubjectsResult.status === 'fulfilled' && recentSubjectsResult.value.data) {
        recentSubjectsResult.value.data.forEach(subject => {
          activities.push({
            id: `subject-${subject.subject_id}`,
            type: 'subject',
            user: 'Admin',
            action: 'created subject',
            target: subject.subject_name,
            time: this.formatRelativeTime(subject.created_at),
            timestamp: new Date(subject.created_at).getTime()
          });
        });
      }
      
      // Process recent classes
      if (recentClassesResult.status === 'fulfilled' && recentClassesResult.value.data) {
        recentClassesResult.value.data.forEach(cls => {
          activities.push({
            id: `class-${cls.class_id}`,
            type: 'class',
            user: 'Admin',
            action: 'created class',
            target: cls.class_name,
            time: this.formatRelativeTime(cls.created_at),
            timestamp: new Date(cls.created_at).getTime()
          });
        });
      }
      
      // Process recent forms
      if (recentFormsResult.status === 'fulfilled' && recentFormsResult.value.data) {
        recentFormsResult.value.data.forEach(form => {
          activities.push({
            id: `form-${form.form_id}`,
            type: 'form',
            user: 'Admin',
            action: 'created form',
            target: form.form_name || `Form ${form.form_number}`,
            time: this.formatRelativeTime(form.created_at),
            timestamp: new Date(form.created_at).getTime()
          });
        });
      }
      
      // Sort by timestamp and limit
      activities.sort((a, b) => b.timestamp - a.timestamp);
      return activities.slice(0, limit);
      
    } catch (error) {
      console.error('[supabaseService] Error in getRecentActivity:', error);
      return [];
    }
  }
  
  /**
   * Format timestamp to relative time (e.g., "2 hours ago")
   */
  formatRelativeTime(timestamp) {
    if (!timestamp) return 'N/A';
    
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    
    return time.toLocaleDateString();
  }

  // ============================================
  // HIERARCHICAL STRUCTURE - FORMS
  // ============================================
  
  /**
   * Get all forms for a school (or all forms if schoolId is null)
   */
  async getFormsBySchool(schoolId) {
    let query = supabase
      .from('forms')
      .select('*, coordinator:users!forms_coordinator_id_fkey(name, email)')
      .eq('is_active', true)
      .order('form_number', { ascending: true });
    
    // Only filter by school_id if it's provided
    if (schoolId !== null && schoolId !== undefined) {
      query = query.eq('school_id', schoolId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Get form by ID
   */
  async getFormById(formId) {
    const { data, error } = await supabase
      .from('forms')
      .select('*, coordinator:users!forms_coordinator_id_fkey(*)')
      .eq('form_id', formId)
      .single();
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Create a new form
   */
  async createForm(formData) {
    const { data, error } = await supabase
      .from('forms')
      .insert(formData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Update form
   */
  async updateForm(formId, updates) {
    const { data, error } = await supabase
      .from('forms')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('form_id', formId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Delete form (soft delete by setting is_active to false)
   */
  async deleteForm(formId) {
    const { data, error } = await supabase
      .from('forms')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('form_id', formId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // ============================================
  // HIERARCHICAL STRUCTURE - CLASSES
  // ============================================
  
  /**
   * Get all classes for a form
   */
  async getClassesByForm(formId) {
    const { data, error } = await supabase
      .from('classes')
      .select('*, form_tutor:users!classes_form_tutor_id_fkey(name, email)')
      .eq('form_id', formId)
      .eq('is_active', true)
      .order('class_name', { ascending: true });
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Get class by ID with roster
   */
  async getClassById(classId) {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        form_tutor:users!classes_form_tutor_id_fkey(*),
        form:forms(*),
        students:student_class_assignments!inner(
          student:users(*)
        )
      `)
      .eq('class_id', classId)
      .single();
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Create a new class
   */
  async createClass(classData) {
    const { data, error } = await supabase
      .from('classes')
      .insert(classData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Update class
   */
  async updateClass(classId, updates) {
    const { data, error } = await supabase
      .from('classes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('class_id', classId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Get class roster (students in class)
   */
  async getClassRoster(classId) {
    const { data, error } = await supabase
      .from('student_class_assignments')
      .select(`
        *,
        student:users(*)
      `)
      .eq('class_id', classId)
      .eq('is_active', true);
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Assign student to class
   */
  async assignStudentToClass(studentId, classId, academicYear) {
    const { data, error } = await supabase
      .from('student_class_assignments')
      .insert({
        student_id: studentId,
        class_id: classId,
        academic_year: academicYear,
        is_active: true
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Remove student from class
   */
  async removeStudentFromClass(studentId, classId) {
    const { data, error } = await supabase
      .from('student_class_assignments')
      .update({ is_active: false })
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // ============================================
  // HIERARCHICAL STRUCTURE - SUBJECTS
  // ============================================
  
  /**
   * Get all subjects for a school (or all subjects if schoolId is null)
   */
  async getSubjectsBySchool(schoolId) {
    let query = supabase
      .from('subjects')
      .select('*, department:departments(*)')
      .eq('is_active', true)
      .order('subject_name', { ascending: true });
    
    // Only filter by school_id if it's provided
    if (schoolId !== null && schoolId !== undefined) {
      query = query.eq('school_id', schoolId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Get subject by ID
   */
  async getSubjectById(subjectId) {
    const { data, error } = await supabase
      .from('subjects')
      .select('*, department:departments(*)')
      .eq('subject_id', subjectId)
      .single();
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Create a new subject
   */
  async createSubject(subjectData) {
    const { data, error } = await supabase
      .from('subjects')
      .insert(subjectData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Get subjects offered in a form
   */
  async getSubjectsByForm(formId) {
    const { data, error } = await supabase
      .from('subject_form_offerings')
      .select(`
        *,
        subject:subjects(*)
      `)
      .eq('form_id', formId);
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Create subject offering for a form
   */
  async createSubjectOffering(subjectId, formId, offeringData = {}) {
    const { data, error } = await supabase
      .from('subject_form_offerings')
      .insert({
        subject_id: subjectId,
        form_id: formId,
        ...offeringData
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Get subjects assigned to a class
   */
  async getSubjectsByClass(classId) {
    const { data, error } = await supabase
      .from('class_subjects')
      .select(`
        *,
        subject_offering:subject_form_offerings(
          *,
          subject:subjects(*)
        ),
        teacher:users!class_subjects_teacher_id_fkey(*)
      `)
      .eq('class_id', classId);
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Assign subject to class
   */
  async assignSubjectToClass(classId, subjectOfferingId, teacherId) {
    // Ensure IDs are numbers
    const classIdNum = parseInt(classId);
    const subjectOfferingIdNum = parseInt(subjectOfferingId);
    const teacherIdNum = teacherId ? parseInt(teacherId) : null;
    
    if (isNaN(classIdNum) || isNaN(subjectOfferingIdNum)) {
      throw new Error('Invalid class or subject offering ID');
    }
    
    const insertData = {
      class_id: classIdNum,
      subject_offering_id: subjectOfferingIdNum
    };
    
    // Only include teacher_id if it's provided
    if (teacherIdNum) {
      insertData.teacher_id = teacherIdNum;
    }
    
    const { data, error } = await supabase
      .from('class_subjects')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      // Handle unique constraint violation (subject already assigned)
      if (error.code === '23505') {
        throw new Error('This subject is already assigned to this class');
      }
      // Handle foreign key constraint violation
      if (error.code === '23503') {
        throw new Error('Invalid class, subject offering, or teacher selected');
      }
      throw error;
    }
    return data;
  }
  
  /**
   * Get classes for a teacher (across all subjects)
   * @param {number|string} teacherId - The numeric user_id (BIGINT), not UUID
   */
  async getClassesByTeacher(teacherId) {
    // Ensure teacherId is a number (BIGINT)
    const teacherIdNum = typeof teacherId === 'string' && !teacherId.includes('-') 
      ? parseInt(teacherId) 
      : teacherId;
    
    // If it's still not a number or is a UUID, we need the numeric user_id
    if (isNaN(teacherIdNum) || typeof teacherIdNum !== 'number') {
      throw new Error('Invalid teacher ID: must be numeric user_id, not UUID');
    }
    
    const { data, error } = await supabase
      .from('class_subjects')
      .select(`
        *,
        class:classes(
          *,
          form:forms(*)
        ),
        subject_offering:subject_form_offerings(
          subject:subjects(*)
        )
      `)
      .eq('teacher_id', teacherIdNum);
    
    if (error) throw error;
    return data;
  }

  // ============================================
  // CURRICULUM MANAGEMENT
  // ============================================
  
  /**
   * Get all curriculum content (subject-form offerings with curriculum details)
   */
  async getCurriculumContent(schoolId = null, formId = null, subjectId = null) {
    // If filtering by school, first get forms for that school
    let formIds = null;
    if (schoolId) {
      const { data: forms } = await supabase
        .from('forms')
        .select('form_id')
        .eq('school_id', schoolId)
        .eq('is_active', true);
      
      if (forms && forms.length > 0) {
        formIds = forms.map(f => f.form_id);
      } else {
        // No forms found for this school, return empty
        return [];
      }
    }
    
    let query = supabase
      .from('subject_form_offerings')
      .select(`
        *,
        subject:subjects(*),
        form:forms(
          *,
          school:institutions(*)
        )
      `)
      .eq('is_active', true);
    
    if (formIds) {
      query = query.in('form_id', formIds);
    } else if (formId) {
      query = query.eq('form_id', formId);
    }
    
    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    }
    
    // Order by form_id (forms are already ordered by form_number in the database)
    query = query.order('form_id', { ascending: true });
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  }
  
  /**
   * Get curriculum content for a specific subject across all forms
   */
  async getCurriculumBySubject(subjectId) {
    const { data, error } = await supabase
      .from('subject_form_offerings')
      .select(`
        *,
        subject:subjects(*),
        form:forms(
          *,
          school:institutions(*)
        )
      `)
      .eq('subject_id', subjectId)
      .eq('is_active', true)
      .order('form_number', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }
  
  /**
   * Get curriculum content for a specific form (all subjects in that form)
   */
  async getCurriculumByForm(formId) {
    const { data, error } = await supabase
      .from('subject_form_offerings')
      .select(`
        *,
        subject:subjects(*),
        form:forms(
          *,
          school:institutions(*)
        )
      `)
      .eq('form_id', formId)
      .eq('is_active', true)
      .order('subject_name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }
  
  /**
   * Get subject-form offering by ID (full curriculum details)
   */
  async getCurriculumOfferingById(offeringId) {
    const { data, error } = await supabase
      .from('subject_form_offerings')
      .select(`
        *,
        subject:subjects(*),
        form:forms(
          *,
          school:institutions(*)
        )
      `)
      .eq('offering_id', offeringId)
      .single();
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Update curriculum framework or learning outcomes for a subject-form offering
   */
  async updateCurriculumOffering(offeringId, curriculumData) {
    const updateData = {
      curriculum_framework: curriculumData.curriculum_framework,
      learning_outcomes: curriculumData.learning_outcomes,
      weekly_periods: curriculumData.weekly_periods,
      is_compulsory: curriculumData.is_compulsory,
      updated_at: new Date().toISOString()
    };

    // Include structured curriculum data if provided
    if (curriculumData.curriculum_structure !== undefined) {
      updateData.curriculum_structure = curriculumData.curriculum_structure;
    }
    if (curriculumData.curriculum_version) {
      updateData.curriculum_version = curriculumData.curriculum_version;
    }
    if (curriculumData.curriculum_updated_at) {
      updateData.curriculum_updated_at = curriculumData.curriculum_updated_at;
    }

    const { data, error } = await supabase
      .from('subject_form_offerings')
      .update(updateData)
      .eq('offering_id', offeringId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // ============================================
  // HIERARCHICAL STRUCTURE - LESSONS
  // ============================================
  
  /**
   * Get lessons for a class-subject
   */
  async getLessonsByClassSubject(classSubjectId) {
    const { data, error } = await supabase
      .from('lessons')
      .select('*, content:lesson_content(*)')
      .eq('class_subject_id', classSubjectId)
      .order('lesson_date', { ascending: true })
      .order('start_time', { ascending: true });
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Get lessons for a student (all their subjects)
   */
  async getLessonsByStudent(studentId, startDate, endDate) {
    // Get student's class
    const { data: classAssignment } = await supabase
      .from('student_class_assignments')
      .select('class_id')
      .eq('student_id', studentId)
      .eq('is_active', true)
      .single();
    
    if (!classAssignment) return [];
    
    // Get all subjects for that class
    const { data: classSubjects } = await supabase
      .from('class_subjects')
      .select('class_subject_id')
      .eq('class_id', classAssignment.class_id);
    
    if (!classSubjects || classSubjects.length === 0) return [];
    
    const classSubjectIds = classSubjects.map(cs => cs.class_subject_id);
    
    // Get lessons
    let query = supabase
      .from('lessons')
      .select(`
        *,
        class_subject:class_subjects(
          subject_offering:subject_form_offerings(
            subject:subjects(*)
          ),
          class:classes(*)
        )
      `)
      .in('class_subject_id', classSubjectIds);
    
    if (startDate) {
      query = query.gte('lesson_date', startDate);
    }
    if (endDate) {
      query = query.lte('lesson_date', endDate);
    }
    
    const { data, error } = await query
      .order('lesson_date', { ascending: true })
      .order('start_time', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }
  
  /**
   * Get lessons for a teacher
   */
  async getLessonsByTeacher(teacherId, startDate, endDate) {
    // Ensure teacherId is a number (BIGINT)
    const teacherIdNum = typeof teacherId === 'string' && !teacherId.includes('-') 
      ? parseInt(teacherId) 
      : teacherId;
    
    if (isNaN(teacherIdNum) || typeof teacherIdNum !== 'number') {
      throw new Error('Invalid teacher ID: must be numeric user_id, not UUID');
    }
    
    // Get all class-subjects for teacher
    const { data: classSubjects } = await supabase
      .from('class_subjects')
      .select('class_subject_id')
      .eq('teacher_id', teacherIdNum);
    
    if (!classSubjects || classSubjects.length === 0) return [];
    
    const classSubjectIds = classSubjects.map(cs => cs.class_subject_id);
    
    let query = supabase
      .from('lessons')
      .select(`
        *,
        class_subject:class_subjects(
          subject_offering:subject_form_offerings(
            subject:subjects(*)
          ),
          class:classes(*)
        )
      `)
      .in('class_subject_id', classSubjectIds);
    
    if (startDate) {
      query = query.gte('lesson_date', startDate);
    }
    if (endDate) {
      query = query.lte('lesson_date', endDate);
    }
    
    const { data, error } = await query
      .order('lesson_date', { ascending: true })
      .order('start_time', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }
  
  /**
   * Create a lesson
   */
  async createLesson(lessonData) {
    const { data, error } = await supabase
      .from('lessons')
      .insert(lessonData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Update lesson
   */
  async updateLesson(lessonId, updates) {
    const { data, error } = await supabase
      .from('lessons')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('lesson_id', lessonId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Delete lesson
   */
  async deleteLesson(lessonId) {
    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('lesson_id', lessonId);
    
    if (error) throw error;
  }

  // ============================================
  // ATTENDANCE
  // ============================================
  
  /**
   * Get attendance for a lesson
   */
  async getLessonAttendance(lessonId) {
    const { data, error } = await supabase
      .from('lesson_attendance')
      .select(`
        *,
        student:users(*)
      `)
      .eq('lesson_id', lessonId);
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Mark attendance for multiple students
   */
  async markAttendance(lessonId, attendanceRecords) {
    // Delete existing attendance for this lesson
    await supabase
      .from('lesson_attendance')
      .delete()
      .eq('lesson_id', lessonId);
    
    // Insert new attendance records
    const records = attendanceRecords.map(record => ({
      lesson_id: lessonId,
      student_id: record.student_id,
      status: record.status,
      notes: record.notes || null
    }));
    
    const { data, error } = await supabase
      .from('lesson_attendance')
      .insert(records)
      .select();
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Get student attendance history
   */
  async getStudentAttendance(studentId, startDate, endDate) {
    let query = supabase
      .from('lesson_attendance')
      .select(`
        *,
        lesson:lessons(
          *,
          class_subject:class_subjects(
            subject_offering:subject_form_offerings(
              subject:subjects(*)
            )
          )
        )
      `)
      .eq('student_id', studentId);
    
    if (startDate) {
      query = query.gte('lesson.lesson_date', startDate);
    }
    if (endDate) {
      query = query.lte('lesson.lesson_date', endDate);
    }
    
    const { data, error } = await query
      .order('lesson.lesson_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  // ============================================
  // ASSESSMENTS & GRADES
  // ============================================
  
  /**
   * Get assessments for a class-subject
   */
  async getAssessmentsByClassSubject(classSubjectId) {
    const { data, error } = await supabase
      .from('subject_assessments')
      .select('*')
      .eq('class_subject_id', classSubjectId)
      .order('due_date', { ascending: true });
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Create assessment
   */
  async createAssessment(assessmentData) {
    const { data, error } = await supabase
      .from('subject_assessments')
      .insert(assessmentData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Get grades for an assessment
   */
  async getGradesByAssessment(assessmentId) {
    const { data, error } = await supabase
      .from('student_grades')
      .select(`
        *,
        student:users(*)
      `)
      .eq('assessment_id', assessmentId);
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Enter/update grades for multiple students
   */
  async enterGrades(assessmentId, grades) {
    const records = grades.map(grade => ({
      assessment_id: assessmentId,
      student_id: grade.student_id,
      marks_obtained: grade.marks_obtained,
      percentage: grade.percentage,
      grade_letter: grade.grade_letter,
      comments: grade.comments || null
    }));
    
    // Use upsert to handle both insert and update
    const { data, error } = await supabase
      .from('student_grades')
      .upsert(records, {
        onConflict: 'assessment_id,student_id'
      })
      .select();
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Get student grades across all subjects
   */
  async getStudentGrades(studentId, academicYear = null) {
    // Get student's class
    const { data: classAssignment } = await supabase
      .from('student_class_assignments')
      .select('class_id')
      .eq('student_id', studentId)
      .eq('is_active', true)
      .single();
    
    if (!classAssignment) return [];
    
    // Get all class-subjects
    const { data: classSubjects } = await supabase
      .from('class_subjects')
      .select('class_subject_id')
      .eq('class_id', classAssignment.class_id);
    
    if (!classSubjects || classSubjects.length === 0) return [];
    
    const classSubjectIds = classSubjects.map(cs => cs.class_subject_id);
    
    // Get assessments and grades
    const { data, error } = await supabase
      .from('student_grades')
      .select(`
        *,
        assessment:subject_assessments(
          *,
          class_subject:class_subjects(
            subject_offering:subject_form_offerings(
              subject:subjects(*)
            )
          )
        )
      `)
      .eq('student_id', studentId)
      .in('assessment.class_subject_id', classSubjectIds);
    
    if (error) throw error;
    return data || [];
  }
}

export default new SupabaseService();

