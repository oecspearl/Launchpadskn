# Curriculum Builder Error Fixes

## Issues Fixed

All the console errors have been addressed:

### 1. ✅ Fixed `user_id` undefined errors
- Added checks for `user?.user_id` before using it
- All database operations now verify user is authenticated

### 2. ✅ Fixed foreign key relationship syntax
- Changed from `users!curriculum_change_history_changed_by_fkey` to proper Supabase syntax
- Fixed relationship queries to handle array responses

### 3. ✅ Added error handling for missing tables
- All queries now gracefully handle cases where tables don't exist yet
- Added helpful error messages when tables are missing

### 4. ✅ Fixed RPC function calls
- Added error handling for missing functions
- Functions will fail gracefully if not created yet

### 5. ✅ Fixed upsert conflicts
- Added `onConflict` parameter for upsert operations
- Prevents 409 conflicts on duplicate inserts

## Next Steps - IMPORTANT

### 1. Run Database Migrations

You **must** run these SQL scripts in your Supabase SQL Editor:

```sql
-- First, create the tables
\i database/add-curriculum-builder-tables.sql

-- Then, create the functions
\i database/add-curriculum-builder-functions.sql
```

Or copy and paste the contents of:
- `database/add-curriculum-builder-tables.sql`
- `database/add-curriculum-builder-functions.sql`

Into the Supabase SQL Editor and run them.

### 2. Enable Supabase Realtime (Optional but Recommended)

For collaborative editing to work:

1. Go to Supabase Dashboard
2. Navigate to **Database** → **Replication**
3. Enable replication for:
   - `subject_form_offerings`
   - `curriculum_session_editors`

### 3. Verify Tables Created

Run this query to verify:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'curriculum%';
```

You should see:
- `curriculum_resources`
- `curriculum_templates`
- `curriculum_resource_links`
- `curriculum_editing_sessions`
- `curriculum_session_editors`
- `curriculum_change_history`
- `curriculum_ai_suggestions`

### 4. Verify Functions Created

Run this query:

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%curriculum%' 
  OR routine_name LIKE 'increment%';
```

You should see:
- `increment_resource_usage`
- `increment_template_usage`
- `get_active_editors`
- `cleanup_inactive_sessions`
- `get_curriculum_change_summary`
- `search_curriculum_resources`
- `get_linked_resources`

## What Works Now

Even without the database tables, the Interactive Curriculum Builder will:
- ✅ Load and display existing curriculum
- ✅ Allow drag-and-drop reordering
- ✅ Save curriculum changes to `subject_form_offerings`
- ✅ Show basic UI without errors

Features that require tables (will show warnings but won't break):
- ⚠️ Resource Library (needs `curriculum_resources` table)
- ⚠️ Templates (needs `curriculum_templates` table)
- ⚠️ Collaborative editing (needs `curriculum_editing_sessions` table)
- ⚠️ Change history (needs `curriculum_change_history` table)
- ⚠️ AI suggestions (needs `curriculum_ai_suggestions` table)

## Testing

After running migrations:

1. Open the Interactive Curriculum Builder
2. Check browser console - should see no errors
3. Try adding a topic
4. Try drag-and-drop reordering
5. Try opening Resource Library (should work now)
6. Try saving a template (should work now)

## Troubleshooting

### Still seeing 400/406 errors?
- Make sure you ran both SQL scripts
- Check Supabase logs for specific error messages
- Verify table names match exactly

### Collaborative editing not working?
- Check if Realtime is enabled
- Verify `curriculum_editing_sessions` table exists
- Check browser console for subscription errors

### RPC functions not found?
- Verify functions were created successfully
- Check function names match exactly
- Ensure you have execute permissions

## Summary

All code errors are fixed. The application will now:
- ✅ Handle missing tables gracefully
- ✅ Check for user authentication before operations
- ✅ Provide helpful error messages
- ✅ Work partially even without all tables

**Just run the database migrations and everything will work!**

