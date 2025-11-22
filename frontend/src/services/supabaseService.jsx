/**
 * Supabase Service Layer
 * Replaces all backend API calls with Supabase queries
 */
import { supabase, supabaseAdmin } from '../config/supabase';

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

    // Handle institutionType (camelCase) -> institution_type (DB column)
    if (transformed.institutionType !== undefined) {
      const val = transformed.institutionType.trim().toUpperCase();
      const allowed = ['UNIVERSITY', 'COLLEGE', 'SECONDARY SCHOOL', 'PRIMARY SCHOOL', 'INSTITUTE'];
      let normalized = 'UNIVERSITY';
      if (allowed.includes(val)) {
        normalized = val;
      } else if (val.includes('SECONDARY')) {
        normalized = 'SECONDARY SCHOOL';
      } else if (val.includes('PRIMARY')) {
        normalized = 'PRIMARY SCHOOL';
      } else if (val.includes('UNIV')) {
        normalized = 'UNIVERSITY';
      } else if (val.includes('COLL')) {
        normalized = 'COLLEGE';
      } else if (val.includes('INSTIT')) {
        normalized = 'INSTITUTE';
      }
      transformed.institution_type = normalized;
      delete transformed.institutionType;
    }

    // Legacy 'type' field handling – map to institution_type if present
    if (transformed.type !== undefined) {
      const val = transformed.type.trim().toUpperCase();
      const allowed = ['UNIVERSITY', 'COLLEGE', 'SECONDARY SCHOOL', 'PRIMARY SCHOOL', 'INSTITUTE'];
      let normalized = 'UNIVERSITY';
      if (allowed.includes(val)) {
        normalized = val;
      } else if (val.includes('SECONDARY')) {
        normalized = 'SECONDARY SCHOOL';
      } else if (val.includes('PRIMARY')) {
        normalized = 'PRIMARY SCHOOL';
      } else if (val.includes('UNIV')) {
        normalized = 'UNIVERSITY';
      } else if (val.includes('COLL')) {
        normalized = 'COLLEGE';
      } else if (val.includes('INSTIT')) {
        normalized = 'INSTITUTE';
      }
      transformed.institution_type = normalized;
      delete transformed.type;
    }

    // Ensure a valid institution_type is always present
    if (!transformed.institution_type) {
      transformed.institution_type = 'UNIVERSITY';
    }

    // Remove any stray fields that should not be sent
    delete transformed.institutionId;
    delete transformed.institutionType;
    // (institution_type is the correct column, keep it)

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

  // ---------- Institution Access Helpers ----------
  /**
   * Check if user has access to an institution
   */
  async hasInstitutionAccess(userId, institutionId) {
    const { data: user } = await supabase
      .from('users')
      .select('role, institution_id')
      .eq('id', userId)
      .maybeSingle();
    
    if (!user) return false;
    
    // Super Admin has access to all institutions
    if (user.role === 'ADMIN') return true;
    
    // School Admin has access to their institution
    if (user.role === 'SCHOOL_ADMIN') {
      return user.institution_id === institutionId;
    }
    
    return false;
  }

  /**
   * Get user's accessible institution IDs
   */
  async getUserInstitutionIds(userId) {
    const { data: user } = await supabase
      .from('users')
      .select('role, institution_id')
      .eq('id', userId)
      .maybeSingle();
    
    if (!user) return [];
    
    // Super Admin can access all institutions
    if (user.role === 'ADMIN') {
      const { data: institutions } = await supabase
        .from('institutions')
        .select('institution_id');
      return institutions?.map(i => i.institution_id) || [];
    }
    
    // School Admin can access their institution
    if (user.role === 'SCHOOL_ADMIN' && user.institution_id) {
      return [user.institution_id];
    }
    
    return [];
  }

  /**
   * Get institution-scoped users
   */
  async getUsersByInstitution(institutionId, userRole = null) {
    let query = supabase
      .from('users')
      .select('*')
      .eq('institution_id', institutionId)
      .eq('is_active', true);
    
    if (userRole) {
      query = query.eq('role', userRole.toUpperCase());
    }
    
    const { data, error } = await query.order('name');
    if (error) throw error;
    return data || [];
  }

  /**
   * Get forms by institution
   */
  async getFormsByInstitution(institutionId) {
    const { data, error } = await supabase
      .from('forms')
      .select('*')
      .eq('school_id', institutionId)
      .eq('is_active', true)
      .order('form_number');
    
    if (error) throw error;
    return data || [];
  }

  /**
   * Get classes by institution
   */
  async getClassesByInstitution(institutionId) {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        form:forms(*)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Filter by institution through forms
    if (data) {
      return data.filter(cls => cls.form?.school_id === institutionId);
    }
    
    return [];
  }

  /**
   * Get subjects by institution
   */
  async getSubjectsByInstitution(institutionId) {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('institution_id', institutionId)
      .eq('is_active', true)
      .order('subject_name');
    
    if (error) throw error;
    return data || [];
  }

  // ---------- Admin User Management ----------
  // Fetch all active users (institution join removed due to FK relationship not configured)
  async getAllUsers(institutionId = null) {
    let query = supabase
      .from('users')
      .select('*')
      .eq('is_active', true);
    
    // If institutionId is provided, filter by it
    if (institutionId) {
      query = query.eq('institution_id', institutionId);
    }
    
    const { data, error } = await query.order('name');
    
    if (error) throw error;
    return data;
  }

  // Create a new user (admin creates with email, password, role, institution_id)
  async createUser({ email, password, role = 'STUDENT', institution_id }) {
    // Create auth user (requires service_role key)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (authError) throw authError;
    // Insert profile into custom users table
    const profile = {
      user_id: authData.user.id,
      email,
      role: role.toUpperCase(),
      institution_id,
      is_active: true,
    };
    const { error: profileError } = await supabase.from('users').insert(profile);
    if (profileError) throw profileError;
    return authData.user;
  }

  // Reset a user's password (admin action)
  // Note: Direct password reset requires service role key (server-side only)
  // This function sends a password reset email instead, which is the secure client-side approach
  async resetUserPassword(userEmail) {
    if (!userEmail || typeof userEmail !== 'string' || !userEmail.includes('@')) {
      throw new Error('Invalid email address. Expected a valid email string.');
    }
    
    // Send password reset email - this is the secure way to reset passwords client-side
    const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    
    if (error) throw error;
    return { 
      message: 'Password reset email sent successfully. The user will receive an email with instructions to reset their password.',
      email: userEmail
    };
  }

  // Direct password reset (requires service role key)
  // Note: This will only work if the Supabase admin client is configured with service role key
  // For security, service role key should be used server-side only (Edge Functions, backend API)
  // If you get a 403 error, you need to either:
  // 1. Use the email reset method instead
  // 2. Create a Supabase Edge Function with service role key
  // 3. Use a backend API endpoint with service role key
  async resetUserPasswordDirect(userId, newPassword) {
    // Validate password
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }
    
    // Validate that userId is a UUID
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid user ID. Expected a UUID string.');
    }
    
    // Basic UUID format validation (8-4-4-4-12 hex digits)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      throw new Error(`Invalid UUID format: ${userId}. Please use the user's UUID (id field), not user_id.`);
    }
    
    // Check if admin client is available
    if (!supabaseAdmin) {
      throw new Error('Service role key not configured. Direct password change requires VITE_SUPABASE_SERVICE_ROLE_KEY environment variable. Please use email reset method instead.');
    }
    
    // Use admin client with service role key
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });
    
    if (error) {
      // Provide helpful error message for 403 errors
      if (error.status === 403 || error.message?.includes('not allowed') || error.message?.includes('403')) {
        throw new Error('Direct password change failed. The service role key may be invalid or expired. Please use email reset method instead.');
      }
      throw error;
    }
    
    return { 
      message: 'Password changed successfully!',
      user: data.user 
    };
  }

  // Assign a user to an institution (school)
  async assignUserToInstitution(userId, institutionId) {
    const { error } = await supabase
      .from('users')
      .update({ institution_id: institutionId })
      .eq('user_id', userId);
    if (error) throw error;
    return true;
  }

  // Soft‑delete a user (mark inactive)
  async deleteUser(userId) {
    const { error } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('user_id', userId);
    if (error) throw error;
    return true;
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
   * Get classes with role-based filtering (course-like access control)
   * - Admins/Curriculum Designers: All classes
   * - Instructors: Their classes + published classes
   * - Students: Enrolled classes + published classes
   * - Others: Only published classes
   */
  async getClasses(userRole = null, userId = null) {
    let query = supabase
      .from('classes')
      .select(`
        *,
        form:forms(*),
        form_tutor:users!classes_form_tutor_id_fkey(name, email),
        instructors:class_instructors(
          instructor:users(name, email, user_id)
        )
      `)
      .eq('is_active', true);

    // Role-based filtering
    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'CURRICULUM_DESIGNER') {
      // Admins see all classes (no filter)
    } else if (userRole === 'INSTRUCTOR' || userRole === 'TEACHER') {
      // Instructors see their classes + published classes
      if (userId) {
        // Get classes where user is instructor
        const { data: instructorClasses } = await supabase
          .from('class_instructors')
          .select('class_id')
          .eq('instructor_id', userId)
          .eq('is_active', true);

        const classIds = instructorClasses?.map(c => c.class_id) || [];

        // Also get classes where user is form_tutor
        const { data: tutorClasses } = await supabase
          .from('classes')
          .select('class_id')
          .eq('form_tutor_id', userId)
          .eq('is_active', true);

        const tutorClassIds = tutorClasses?.map(c => c.class_id) || [];
        const allClassIds = [...new Set([...classIds, ...tutorClassIds])];

        if (allClassIds.length > 0) {
          query = query.or(`class_id.in.(${allClassIds.join(',')}),published.eq.true`);
        } else {
          query = query.eq('published', true);
        }
      } else {
        query = query.eq('published', true);
      }
    } else if (userRole === 'STUDENT') {
      // Students see enrolled classes + published classes
      if (userId) {
        // Get enrolled classes
        const { data: enrollments } = await supabase
          .from('student_class_assignments')
          .select('class_id')
          .eq('student_id', userId)
          .eq('is_active', true);

        const enrolledClassIds = enrollments?.map(e => e.class_id) || [];

        if (enrolledClassIds.length > 0) {
          query = query.or(`class_id.in.(${enrolledClassIds.join(',')}),published.eq.true`);
        } else {
          query = query.eq('published', true);
        }
      } else {
        query = query.eq('published', true);
      }
    } else {
      // Guests/others: only published classes
      query = query.eq('published', true);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get published classes (for public browsing)
   */
  async getPublishedClasses(filters = {}) {
    let query = supabase
      .from('classes')
      .select(`
        *,
        form:forms(*),
        form_tutor:users!classes_form_tutor_id_fkey(name, email),
        instructors:class_instructors(
          instructor:users(name, email)
        )
      `)
      .eq('published', true)
      .eq('is_active', true);

    if (filters.form_id) {
      query = query.eq('form_id', filters.form_id);
    }

    if (filters.difficulty) {
      query = query.eq('difficulty', filters.difficulty);
    }

    if (filters.featured) {
      query = query.eq('featured', true);
    }

    if (filters.search) {
      query = query.or(`class_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, error } = await query.order('featured', { ascending: false }).order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get class by ID with full details
   */
  async getClassById(classId) {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        form_tutor:users!classes_form_tutor_id_fkey(*),
        form:forms(*),
        instructors:class_instructors(
          instructor:users(name, email, user_id, role),
          role,
          assigned_at
        ),
        students:student_class_assignments(
          student:users(name, email, user_id),
          enrollment_type,
          enrolled_at,
          progress_percentage
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
   * Enroll student in class (self-enrollment)
   */
  async enrollStudentInClass(studentId, classId, academicYear) {
    // Check if class exists and is published
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('class_id, published, capacity, current_enrollment')
      .eq('class_id', classId)
      .single();

    if (classError) throw classError;

    if (!classData.published) {
      throw new Error('Class is not available for enrollment');
    }

    // Check capacity
    if (classData.current_enrollment >= classData.capacity) {
      throw new Error('Class is at full capacity');
    }

    // Check if already enrolled
    const { data: existing } = await supabase
      .from('student_class_assignments')
      .select('assignment_id, is_active')
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .maybeSingle();

    if (existing) {
      if (existing.is_active) {
        throw new Error('Already enrolled in this class');
      } else {
        // Re-enroll
        const { data, error } = await supabase
          .from('student_class_assignments')
          .update({
            is_active: true,
            enrollment_type: 'enrolled',
            enrolled_at: new Date().toISOString(),
            academic_year: academicYear
          })
          .eq('assignment_id', existing.assignment_id)
          .select()
          .single();

        if (error) throw error;

        // Update enrollment count
        await this.updateClassEnrollmentCount(classId);

        return data;
      }
    }

    // Create new enrollment
    const { data, error } = await supabase
      .from('student_class_assignments')
      .insert({
        student_id: studentId,
        class_id: classId,
        academic_year: academicYear,
        enrollment_type: 'enrolled',
        enrolled_at: new Date().toISOString(),
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;

    // Update enrollment count
    await this.updateClassEnrollmentCount(classId);

    return data;
  }

  /**
   * Drop enrollment (student leaves class)
   */
  async dropEnrollment(studentId, classId) {
    const { data, error } = await supabase
      .from('student_class_assignments')
      .update({
        is_active: false,
        enrollment_type: 'dropped'
      })
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .select()
      .single();

    if (error) throw error;

    // Update enrollment count
    await this.updateClassEnrollmentCount(classId);

    return data;
  }

  /**
   * Check if student is enrolled in class
   */
  async checkEnrollment(studentId, classId) {
    const { data, error } = await supabase
      .from('student_class_assignments')
      .select('assignment_id, is_active, enrollment_type')
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .maybeSingle();

    if (error) throw error;
    return data && data.is_active ? data : null;
  }

  /**
   * Update class enrollment count
   */
  async updateClassEnrollmentCount(classId) {
    const { count } = await supabase
      .from('student_class_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', classId)
      .eq('is_active', true);

    await supabase
      .from('classes')
      .update({ current_enrollment: count || 0 })
      .eq('class_id', classId);
  }

  /**
   * Remove student from class (admin action)
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

    // Update enrollment count
    await this.updateClassEnrollmentCount(classId);

    return data;
  }

  /**
   * Add instructor to class
   */
  async addClassInstructor(classId, instructorId, role = 'instructor') {
    const { data, error } = await supabase
      .from('class_instructors')
      .insert({
        class_id: classId,
        instructor_id: instructorId,
        role: role,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Remove instructor from class
   */
  async removeClassInstructor(classId, instructorId) {
    const { data, error } = await supabase
      .from('class_instructors')
      .update({ is_active: false })
      .eq('class_id', classId)
      .eq('instructor_id', instructorId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get class instructors
   */
  async getClassInstructors(classId) {
    const { data, error } = await supabase
      .from('class_instructors')
      .select(`
        *,
        instructor:users(name, email, user_id, role)
      `)
      .eq('class_id', classId)
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  }

  /**
   * Publish class (make visible to all)
   */
  async publishClass(classId) {
    const { data, error } = await supabase
      .from('classes')
      .update({ published: true, updated_at: new Date().toISOString() })
      .eq('class_id', classId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Unpublish class (hide from public)
   */
  async unpublishClass(classId) {
    const { data, error } = await supabase
      .from('classes')
      .update({ published: false, updated_at: new Date().toISOString() })
      .eq('class_id', classId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Toggle featured status
   */
  async toggleClassFeatured(classId, featured) {
    const { data, error } = await supabase
      .from('classes')
      .update({ featured: featured, updated_at: new Date().toISOString() })
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
    
    // Normalize all lesson dates to YYYY-MM-DD format
    if (data && Array.isArray(data)) {
      data.forEach(lesson => {
        if (lesson.lesson_date) {
          let dateStr = String(lesson.lesson_date);
          if (dateStr.includes('T')) {
            dateStr = dateStr.split('T')[0];
          } else if (dateStr.length > 10) {
            dateStr = dateStr.substring(0, 10);
          }
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (dateRegex.test(dateStr)) {
            lesson.lesson_date = dateStr;
          }
        }
      });
    }
    
    return data;
  }

  /**
   * Get lessons for a student (all their subjects)
   */
  async getLessonsByStudent(studentId, startDate, endDate) {
    // Ensure studentId is numeric (not UUID)
    let numericStudentId = studentId;
    if (typeof studentId === 'string' && studentId.includes('-')) {
      // It's a UUID, need to get the numeric user_id
      const { data: userProfile } = await supabase
        .from('users')
        .select('user_id')
        .eq('id', studentId)
        .maybeSingle();

      if (userProfile && userProfile.user_id) {
        numericStudentId = userProfile.user_id;
      } else {
        console.warn('[supabaseService] Could not find user_id for UUID:', studentId);
        return [];
      }
    }

    // Get student's class
    const { data: classAssignment } = await supabase
      .from('student_class_assignments')
      .select('class_id')
      .eq('student_id', numericStudentId)
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
    
    // Normalize all lesson dates to YYYY-MM-DD format
    if (data && Array.isArray(data)) {
      data.forEach(lesson => {
        if (lesson.lesson_date) {
          let dateStr = String(lesson.lesson_date);
          if (dateStr.includes('T')) {
            dateStr = dateStr.split('T')[0];
          } else if (dateStr.length > 10) {
            dateStr = dateStr.substring(0, 10);
          }
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (dateRegex.test(dateStr)) {
            lesson.lesson_date = dateStr;
          }
        }
      });
    }
    
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
    
    // Normalize all lesson dates to YYYY-MM-DD format
    if (data && Array.isArray(data)) {
      data.forEach(lesson => {
        if (lesson.lesson_date) {
          let dateStr = String(lesson.lesson_date);
          if (dateStr.includes('T')) {
            dateStr = dateStr.split('T')[0];
          } else if (dateStr.length > 10) {
            dateStr = dateStr.substring(0, 10);
          }
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (dateRegex.test(dateStr)) {
            lesson.lesson_date = dateStr;
          }
        }
      });
    }
    
    return data || [];
  }

  /**
   * Create a lesson
   */
  async createLesson(lessonData) {
    console.log('[supabaseService] createLesson called with:', JSON.stringify(lessonData, null, 2));
    console.log('[supabaseService] class_subject_id:', lessonData.class_subject_id, 'type:', typeof lessonData.class_subject_id);
    
    // Ensure class_subject_id is an integer
    const payload = {
      ...lessonData,
      class_subject_id: parseInt(lessonData.class_subject_id, 10)
    };
    
    // Ensure lesson_date is in correct format (YYYY-MM-DD)
    // Don't convert if already in correct format to avoid timezone issues
    if (payload.lesson_date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(payload.lesson_date)) {
        // Only convert if not already in YYYY-MM-DD format
        // Use local date parsing to avoid timezone conversion
        const date = new Date(payload.lesson_date);
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          payload.lesson_date = `${year}-${month}-${day}`;
        }
      }
      // If already in YYYY-MM-DD format, use it as-is (no conversion)
      console.log('[supabaseService] lesson_date before insert:', payload.lesson_date, 'type:', typeof payload.lesson_date);
    }
    
    console.log('[supabaseService] Final payload:', JSON.stringify(payload, null, 2));
    
    const { data, error } = await supabase
      .from('lessons')
      .insert(payload)
      .select()
      .single();
    
    if (error) {
      console.error('[supabaseService] Error creating lesson:', error);
      throw error;
    }
    
    // Normalize the returned date to YYYY-MM-DD format
    // Supabase may return dates as timestamps, so extract just the date part
    if (data && data.lesson_date) {
      let dateStr = String(data.lesson_date);
      // Handle various date formats that might be returned
      if (dateStr.includes('T')) {
        // It's a timestamp string like "2024-01-15T00:00:00.000Z"
        // Extract just the date part before 'T'
        dateStr = dateStr.split('T')[0];
      } else if (dateStr.length > 10) {
        // It might have timezone info or other characters
        dateStr = dateStr.substring(0, 10);
      }
      // Ensure it's in YYYY-MM-DD format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dateRegex.test(dateStr)) {
        data.lesson_date = dateStr;
        console.log('[supabaseService] Returned lesson_date after normalization:', data.lesson_date);
      } else {
        console.warn('[supabaseService] Unexpected date format returned:', dateStr);
      }
    }

    if (error) {
      console.error('[supabaseService] Error creating lesson:', error);
      throw error;
    }
    return data;
  }

  /**
   * Update lesson
   */
  async updateLesson(lessonId, updates) {
    // Ensure lesson_date is in correct format (YYYY-MM-DD) if provided
    // Don't convert if already in correct format to avoid timezone issues
    const formattedUpdates = { ...updates };
    if (formattedUpdates.lesson_date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formattedUpdates.lesson_date)) {
        // Only convert if not already in YYYY-MM-DD format
        // Use local date parsing to avoid timezone conversion
        const date = new Date(formattedUpdates.lesson_date);
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          formattedUpdates.lesson_date = `${year}-${month}-${day}`;
        }
      }
      // If already in YYYY-MM-DD format, use it as-is (no conversion)
      console.log('[supabaseService] updateLesson - lesson_date:', formattedUpdates.lesson_date);
    }
    
    const { data, error } = await supabase
      .from('lessons')
      .update({ ...formattedUpdates, updated_at: new Date().toISOString() })
      .eq('lesson_id', lessonId)
      .select()
      .single();

    if (error) throw error;
    
    // Normalize the returned date to YYYY-MM-DD format
    if (data && data.lesson_date) {
      let dateStr = String(data.lesson_date);
      if (dateStr.includes('T')) {
        dateStr = dateStr.split('T')[0];
      } else if (dateStr.length > 10) {
        dateStr = dateStr.substring(0, 10);
      }
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dateRegex.test(dateStr)) {
        data.lesson_date = dateStr;
      }
    }

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

  // ============================================
  // QUIZ SYSTEM METHODS
  // ============================================

  /**
   * Create a new quiz
   */
  async createQuiz(quizData) {
    const { data, error } = await supabase
      .from('quizzes')
      .insert(quizData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get quiz by content ID
   */
  async getQuizByContentId(contentId) {
    // First get the quiz
    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('content_id', contentId)
      .eq('is_published', true)
      .single();

    if (quizError) {
      if (quizError.code === 'PGRST116') return null; // No rows returned
      throw quizError;
    }
    if (!quizData) return null;

    // Then get questions
    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quizData.quiz_id)
      .order('question_order', { ascending: true });

    if (questionsError) throw questionsError;

    // Get options and correct answers for each question separately
    if (questions && questions.length > 0) {
      const questionIds = questions.map(q => q.question_id).filter(id => id != null);

      let allOptions = [];
      let allCorrectAnswers = [];

      // Only query if we have valid question IDs
      if (questionIds.length > 0) {
        // Get all options for these questions
        const { data: optionsData, error: optionsError } = await supabase
          .from('quiz_answer_options')
          .select('*')
          .in('question_id', questionIds)
          .order('option_order', { ascending: true });

        if (optionsError) throw optionsError;
        allOptions = optionsData || [];

        // Get all correct answers for these questions
        const { data: answersData, error: answersError } = await supabase
          .from('quiz_correct_answers')
          .select('*')
          .in('question_id', questionIds);

        if (answersError) throw answersError;
        allCorrectAnswers = answersData || [];
      }

      // Attach options and correct answers to each question
      const questionsWithData = questions.map(question => ({
        ...question,
        options: allOptions.filter(opt => opt.question_id === question.question_id),
        correct_answers: allCorrectAnswers.filter(ans => ans.question_id === question.question_id)
      }));

      return {
        ...quizData,
        questions: questionsWithData
      };
    }

    return {
      ...quizData,
      questions: []
    };
  }

  /**
   * Get quiz by ID (for teachers)
   */
  async getQuizById(quizId) {
    // First get the quiz
    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('quiz_id', quizId)
      .single();

    if (quizError) throw quizError;
    if (!quizData) return null;

    // Then get questions
    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('question_order', { ascending: true });

    if (questionsError) throw questionsError;

    // Get options and correct answers for each question separately
    if (questions && questions.length > 0) {
      const questionIds = questions.map(q => q.question_id).filter(id => id != null);

      let allOptions = [];
      let allCorrectAnswers = [];

      // Only query if we have valid question IDs
      if (questionIds.length > 0) {
        // Get all options for these questions
        const { data: optionsData, error: optionsError } = await supabase
          .from('quiz_answer_options')
          .select('*')
          .in('question_id', questionIds)
          .order('option_order', { ascending: true });

        if (optionsError) throw optionsError;
        allOptions = optionsData || [];

        // Get all correct answers for these questions
        const { data: answersData, error: answersError } = await supabase
          .from('quiz_correct_answers')
          .select('*')
          .in('question_id', questionIds);

        if (answersError) throw answersError;
        allCorrectAnswers = answersData || [];
      }

      // Attach options and correct answers to each question
      const questionsWithData = questions.map(question => ({
        ...question,
        options: allOptions.filter(opt => opt.question_id === question.question_id),
        correct_answers: allCorrectAnswers.filter(ans => ans.question_id === question.question_id)
      }));

      return {
        ...quizData,
        questions: questionsWithData
      };
    }

    return {
      ...quizData,
      questions: []
    };
  }

  /**
   * Update quiz
   */
  async updateQuiz(quizId, quizData) {
    const { data, error } = await supabase
      .from('quizzes')
      .update(quizData)
      .eq('quiz_id', quizId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete quiz
   */
  async deleteQuiz(quizId) {
    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('quiz_id', quizId);

    if (error) throw error;
  }

  /**
   * Create quiz question
   */
  async createQuizQuestion(questionData) {
    const { data, error } = await supabase
      .from('quiz_questions')
      .insert(questionData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update quiz question
   */
  async updateQuizQuestion(questionId, questionData) {
    const { data, error } = await supabase
      .from('quiz_questions')
      .update(questionData)
      .eq('question_id', questionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete quiz question
   */
  async deleteQuizQuestion(questionId) {
    const { error } = await supabase
      .from('quiz_questions')
      .delete()
      .eq('question_id', questionId);

    if (error) throw error;
  }

  /**
   * Create answer option
   */
  async createAnswerOption(optionData) {
    const { data, error } = await supabase
      .from('quiz_answer_options')
      .insert(optionData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update answer option
   */
  async updateAnswerOption(optionId, optionData) {
    const { data, error } = await supabase
      .from('quiz_answer_options')
      .update(optionData)
      .eq('option_id', optionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete answer option
   */
  async deleteAnswerOption(optionId) {
    const { error } = await supabase
      .from('quiz_answer_options')
      .delete()
      .eq('option_id', optionId);

    if (error) throw error;
  }

  /**
   * Create correct answer
   */
  async createCorrectAnswer(answerData) {
    const { data, error } = await supabase
      .from('quiz_correct_answers')
      .insert(answerData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete correct answers for a question
   */
  async deleteCorrectAnswersForQuestion(questionId) {
    const { error } = await supabase
      .from('quiz_correct_answers')
      .delete()
      .eq('question_id', questionId);

    if (error) throw error;
  }

  /**
   * Create student quiz attempt
   */
  async createQuizAttempt(attemptData) {
    const { data, error } = await supabase
      .from('student_quiz_attempts')
      .insert(attemptData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Submit quiz attempt
   */
  async submitQuizAttempt(attemptId, responses) {
    // First, submit all responses
    if (responses && responses.length > 0) {
      const { error: responsesError } = await supabase
        .from('student_quiz_responses')
        .insert(responses);

      if (responsesError) throw responsesError;
    }

    // Calculate score
    const { data: attempt } = await supabase
      .from('student_quiz_attempts')
      .select(`
        *,
        quiz:quizzes(*),
        responses:student_quiz_responses(
          *,
          question:quiz_questions(*)
        )
      `)
      .eq('attempt_id', attemptId)
      .single();

    if (!attempt) throw new Error('Attempt not found');

    // Auto-grade objective questions
    let totalPoints = 0;
    let earnedPoints = 0;
    const responsesToUpdate = [];

    console.log('[submitQuizAttempt] Grading responses:', attempt.responses?.length || 0);

    for (const response of attempt.responses || []) {
      const question = response.question;
      if (!question) {
        console.warn('[submitQuizAttempt] Response missing question:', response);
        continue;
      }
      totalPoints += parseFloat(question.points || 0);

      if (question.question_type === 'MULTIPLE_CHOICE' || question.question_type === 'TRUE_FALSE') {
        // Check if selected option is correct
        const { data: option } = await supabase
          .from('quiz_answer_options')
          .select('is_correct, points')
          .eq('option_id', response.selected_option_id)
          .single();

        if (option && option.is_correct) {
          const points = parseFloat(option.points || question.points || 0);
          earnedPoints += points;
          console.log(`[submitQuizAttempt] Question ${question.question_id} (${question.question_type}): CORRECT, +${points} points`);
          responsesToUpdate.push({
            response_id: response.response_id,
            points_earned: points,
            is_correct: true,
            is_graded: true
          });
        } else {
          console.log(`[submitQuizAttempt] Question ${question.question_id} (${question.question_type}): INCORRECT, selected_option_id=${response.selected_option_id}`);
          responsesToUpdate.push({
            response_id: response.response_id,
            points_earned: 0,
            is_correct: false,
            is_graded: true
          });
        }
      } else if (question.question_type === 'SHORT_ANSWER' || question.question_type === 'FILL_BLANK') {
        // Check against correct answers
        const { data: correctAnswers } = await supabase
          .from('quiz_correct_answers')
          .select('*')
          .eq('question_id', question.question_id);

        let isCorrect = false;
        if (correctAnswers && correctAnswers.length > 0 && response.response_text) {
          const studentAnswer = response.response_text.trim();
          for (const correctAnswer of correctAnswers) {
            let correctText = correctAnswer.correct_answer.trim();
            if (!correctAnswer.case_sensitive) {
              correctText = correctText.toLowerCase();
              const studentText = studentAnswer.toLowerCase();
              if (studentText === correctText ||
                (correctAnswer.accept_partial && studentText.includes(correctText))) {
                isCorrect = true;
                break;
              }
            } else {
              if (studentAnswer === correctText ||
                (correctAnswer.accept_partial && studentAnswer.includes(correctText))) {
                isCorrect = true;
                break;
              }
            }
          }
        }

        if (isCorrect) {
          earnedPoints += parseFloat(question.points || 0);
          responsesToUpdate.push({
            response_id: response.response_id,
            points_earned: question.points || 0,
            is_correct: true,
            is_graded: true
          });
        } else {
          responsesToUpdate.push({
            response_id: response.response_id,
            points_earned: 0,
            is_correct: false,
            is_graded: true
          });
        }
      } else if (question.question_type === 'ESSAY') {
        // Essay questions need manual grading
        responsesToUpdate.push({
          response_id: response.response_id,
          points_earned: 0,
          is_correct: false,
          is_graded: false
        });
      }
    }

    // Update all responses
    for (const update of responsesToUpdate) {
      const { error: updateError } = await supabase
        .from('student_quiz_responses')
        .update({
          points_earned: update.points_earned,
          is_correct: update.is_correct,
          is_graded: update.is_graded
        })
        .eq('response_id', update.response_id);

      if (updateError) throw updateError;
    }

    // Calculate percentage
    const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const isPassed = attempt.quiz.passing_score ? percentage >= attempt.quiz.passing_score : null;

    console.log('[submitQuizAttempt] Grading complete:', {
      totalPoints,
      earnedPoints,
      percentage: percentage.toFixed(1) + '%',
      isPassed,
      correctCount: responsesToUpdate.filter(r => r.is_correct).length,
      totalCount: responsesToUpdate.length
    });
    const needsGrading = (attempt.responses || []).some(r =>
      r.question.question_type === 'ESSAY' && !r.is_graded
    );

    // Update attempt
    const { error: updateError } = await supabase
      .from('student_quiz_attempts')
      .update({
        submitted_at: new Date().toISOString(),
        total_points_earned: earnedPoints,
        percentage_score: percentage,
        is_passed: isPassed,
        is_graded: !needsGrading
      })
      .eq('attempt_id', attemptId);

    if (updateError) throw updateError;

    // Refetch the attempt with all responses, questions, and options for display
    const { data: updatedAttempt, error: fetchError } = await supabase
      .from('student_quiz_attempts')
      .select(`
        *,
        quiz:quizzes(*),
        responses:student_quiz_responses(
          *,
          question:quiz_questions(
            *,
            options:quiz_answer_options(*),
            correct_answers:quiz_correct_answers(*)
          )
        )
      `)
      .eq('attempt_id', attemptId)
      .single();

    if (fetchError) throw fetchError;
    return updatedAttempt;
  }

  /**
   * Get student quiz attempts
   */
  async getStudentQuizAttempts(quizId, studentId = null) {
    // Use explicit foreign key relationship to avoid ambiguity
    let query = supabase
      .from('student_quiz_attempts')
      .select(`
        *,
        student:users!student_quiz_attempts_student_id_fkey(user_id, name, email),
        responses:student_quiz_responses(
          *,
          question:quiz_questions(*),
          option:quiz_answer_options(*)
        )
      `)
      .eq('quiz_id', quizId)
      .order('submitted_at', { ascending: false });

    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  /**
   * Get quiz results/analytics
   */
  async getQuizResults(quizId) {
    const { data, error } = await supabase
      .from('student_quiz_attempts')
      .select(`
        *,
        student:users!student_quiz_attempts_student_id_fkey(user_id, name, email)
      `)
      .eq('quiz_id', quizId)
      .not('submitted_at', 'is', null)
      .order('submitted_at', { ascending: false });

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

