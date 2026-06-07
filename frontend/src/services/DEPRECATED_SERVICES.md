# Legacy Services — fully migrated

The Java backend and all of its Axios client services have been removed. Auth and
data now go through Supabase and the Vercel serverless functions under `/api`.

## Where things live now
- **Supabase client:** `config/supabase.jsx`
- **Data facade:** `services/supabaseService.jsx` (aggregates the domain services
  below; new code should import the specific service directly)
- **Domain services:** `userService`, `classService`, `institutionService`,
  `studentService`, `dashboardService`, `storageService`, `authService.js`, …
- **Auth context:** `contexts/AuthContextSupabase.jsx`
- **Server-side (Vercel):** `/api/ai/*`, `/api/admin/reset-password`

No remaining files target the old `localhost:8080` Java gateway.
