# ⚠️ DEPRECATED SERVICE FILES

These service files are **no longer in use** and have been replaced by Supabase:

## Replaced Services

1. **`api.js`** → Replaced by `supabaseService.js`
   - Old: Axios-based API client pointing to Java backend
   - New: Supabase client with direct database access

2. **`authService.js`** → Replaced by `authServiceSupabase.js` and `AuthContextSupabase.js`
   - Old: JWT-based auth with Java backend
   - New: Supabase Auth with session management

3. **`adminService.js`** → Replaced by `supabaseService.js`
   - Old: Admin operations via Java backend API
   - New: Direct Supabase queries for admin operations

4. **`studentService.js`** → Replaced by `supabaseService.js`
   - Old: Student operations via Java backend API
   - New: Direct Supabase queries for student operations

5. **`instructorService.js`** → Replaced by `supabaseService.js`
   - Old: Instructor operations via Java backend API
   - New: Direct Supabase queries for instructor operations

6. **`analyticsService.js`** → Replaced by `supabaseService.js`
   - Old: Analytics via Java backend API
   - New: Direct Supabase queries for analytics

7. **`contexts/AuthContext.js`** → Replaced by `contexts/AuthContextSupabase.js`
   - Old: Auth context using Java backend
   - New: Auth context using Supabase Auth

## Migration Status

All components have been updated to use Supabase. These files are kept for reference but should **NOT** be imported in new code.

## Removal

These files can be safely removed once you verify no legacy code references them.

