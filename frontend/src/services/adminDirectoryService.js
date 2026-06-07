import { supabase } from '../config/supabase';

/**
 * Admin directory data access.
 *
 * Owns Supabase `from(...)` queries previously inlined in the admin/school-admin
 * directory screens (ManageInstructors, InstitutionManagement, SchoolAdminDashboard,
 * Profile). Components consume these methods instead of importing the Supabase
 * client directly for table queries.
 */
export const adminDirectoryService = {
  /** Create a user profile row in the `users` table. */
  async createUserProfile(profile) {
    await supabase.from('users').insert(profile);
  },
};

export default adminDirectoryService;
