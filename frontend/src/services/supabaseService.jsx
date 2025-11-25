/**
 * Supabase Service Facade
 * 
 * This file aggregates all domain-specific services into a single service object
 * for backward compatibility.
 * 
 * New code should import specific services directly:
 * import { authService } from './authService';
 * import { userService } from './userService';
 * etc.
 */

import { authService } from './authService';
import { userService } from './userService';
import { institutionService } from './institutionService';
import { classService } from './classService';
import { storageService } from './storageService';
import { dashboardService } from './dashboardService';
import { studentService } from './studentService';
import { ROLES, INSTITUTION_TYPES } from '../constants/roles';

// Re-export constants
export { ROLES, INSTITUTION_TYPES };

// Combine all services into one object
const supabaseService = {
  ...authService,
  ...userService,
  ...institutionService,
  ...classService,
  ...storageService,
  ...dashboardService,
  ...studentService,

  // Helper to get roles constant
  ROLES,
  INSTITUTION_TYPES
};

export default supabaseService;
