# Java Backend Removal Plan

## 📋 Files to Update/Remove

### ✅ Already Using Supabase
- `supabaseService.js` - ✅ Complete
- `authServiceSupabase.js` - ✅ Complete
- `AuthContextSupabase.js` - ✅ Complete
- `AdminDashboard.js` - ✅ Updated
- `StudentDashboard.js` - ✅ Updated
- All new admin/teacher/student components - ✅ Using Supabase

### ⚠️ Still Using Old Backend (To Update)

#### High Priority
1. **`services/api.js`** - Main API service (used by many components)
   - Replace with Supabase queries
   - Used by: Profile, ChangePassword, ResetPassword

2. **`services/authService.js`** - Old auth service
   - Replace with `authServiceSupabase.js`
   - Update imports in components still using it

3. **`services/instructorService.js`** - Instructor operations
   - Replace with Supabase queries
   - Update InstructorDashboard if still in use

4. **`services/studentService.js`** - Student operations
   - Replace with Supabase queries
   - Update CourseRegistration if still in use

5. **`services/adminService.js`** - Old admin service
   - Replace with `supabaseService.js`
   - Check for remaining usages

#### Medium Priority
6. **`services/institutionService.js`** - Institution management
   - Replace with Supabase queries
   - Update AdminDashboard tabs

7. **`services/analyticsService.js`** - Analytics
   - Replace with Supabase queries or remove if not needed

### 📦 Components to Check/Update

1. **Profile Component** (`components/common/Profile.js`)
   - Uses: `api.put('/users/profile')`
   - Replace with Supabase update

2. **ChangePassword** (`components/Auth/ChangePassword.js`)
   - Uses: `api.put('/users/change-password')`
   - Replace with Supabase Auth

3. **ResetPassword** (`components/Auth/ResetPassword.js`)
   - Uses old backend token system
   - Replace with Supabase Auth

4. **FileList** (`components/common/FileList.js`)
   - Uses: `api.get()` for file operations
   - Replace with Supabase Storage

5. **InstructorDashboard** (old component)
   - Uses: `instructorService.js`
   - Already replaced with `TeacherDashboard`

6. **CourseRegistration** (`components/Student/CourseRegistration.js`)
   - Uses: `studentService.js`
   - May need update or removal (replaced by hierarchical structure)

### 🗑️ Files to Remove (After Migration)

- `services/api.js` (or convert to Supabase wrapper)
- `services/authService.js` (replace with authServiceSupabase)
- `services/adminService.js` (replace with supabaseService)
- `services/instructorService.js` (replace with supabaseService)
- `services/studentService.js` (replace with supabaseService)
- `services/analyticsService.js` (replace or remove)

### 🔄 Migration Steps

1. **Phase 1: Critical Components**
   - Update Profile component
   - Update ChangePassword
   - Update ResetPassword

2. **Phase 2: Legacy Components**
   - Update or remove CourseRegistration
   - Update FileList (use Supabase Storage)
   - Update institutionService if needed

3. **Phase 3: Cleanup**
   - Remove old service files
   - Remove axios dependencies if unused
   - Update package.json if needed

### ✅ Already Done

- AdminDashboard uses Supabase
- StudentDashboard uses Supabase  
- TeacherDashboard uses Supabase
- All new admin management pages use Supabase
- All new teacher features use Supabase
- Authentication uses Supabase Auth

---

**Status: ~70% Complete**

Most new components use Supabase. Remaining work is updating legacy components.

