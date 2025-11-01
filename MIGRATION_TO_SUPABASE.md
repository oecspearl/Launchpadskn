# Migration Plan: React + Supabase BaaS

## 🎯 Goal
Convert LaunchPad SKN from Java microservices architecture to pure React + Supabase BaaS.

## 📋 Current Architecture Analysis

### Frontend (React)
- Already using React
- Multiple service files calling backend APIs:
  - `authService.js` - Authentication
  - `api.js` - Main API service
  - `adminService.js` - Admin operations
  - `instructorService.js` - Instructor operations
  - `studentService.js` - Student operations
  - `analyticsService.js` - Analytics
  - `institutionService.js` - Institution management

### Backend (To Be Removed)
- Config Server (Port 8888)
- Discovery Server (Port 8761)
- API Gateway (Port 8080)
- User Service (Port 8090)
- Institution Service (Port 8091)
- Course Service (Port 8092)

### Database
- Already on Supabase ✅
- Tables need to be compatible with Supabase

## 🔄 Migration Strategy

### Phase 1: Setup & Configuration (Day 1)
1. ✅ Install Supabase client library
2. ✅ Configure Supabase connection
3. ✅ Create Supabase service wrapper
4. ✅ Update environment variables

### Phase 2: Authentication (Day 1-2)
1. Replace `authService.js` with Supabase Auth
2. Update login/register components
3. Implement session management
4. Add role-based access control (RLS policies)

### Phase 3: Database Operations (Day 2-3)
1. Create Supabase service layer
2. Replace all API calls with Supabase queries
3. Update service files:
   - `adminService.js` → Supabase queries
   - `instructorService.js` → Supabase queries
   - `studentService.js` → Supabase queries
   - `institutionService.js` → Supabase queries
   - `analyticsService.js` → Supabase queries

### Phase 4: File Storage (Day 3)
1. Setup Supabase Storage buckets
2. Replace file upload logic
3. Update course content/file handling

### Phase 5: Testing & Cleanup (Day 4)
1. Test all features
2. Remove Java backend references
3. Update documentation
4. Clean up unused files

## 📦 Supabase Features We'll Use

1. **Supabase Auth** - User authentication & management
2. **Supabase Database** - PostgreSQL with RLS
3. **Supabase Storage** - File uploads (course content, assignments)
4. **Supabase Realtime** - Live updates (optional, for future)
5. **Supabase Edge Functions** - Custom logic if needed (optional)

## 🔐 Row Level Security (RLS) Setup

We'll need to create RLS policies for:
- Users can only see their own data
- Admins can see all data
- Instructors can see their courses and students
- Students can see their enrolled courses

## 📝 Migration Checklist

- [ ] Install @supabase/supabase-js
- [ ] Create Supabase client configuration
- [ ] Replace authentication
- [ ] Create Supabase service layer
- [ ] Migrate admin operations
- [ ] Migrate instructor operations
- [ ] Migrate student operations
- [ ] Migrate institution operations
- [ ] Setup Supabase Storage
- [ ] Update all React components
- [ ] Test all features
- [ ] Remove Java backend references
- [ ] Update README

## 🚀 Benefits After Migration

✅ No need for Java/JDK
✅ No need for 6 microservices
✅ Simpler deployment
✅ Built-in authentication
✅ Real-time capabilities
✅ Automatic scaling
✅ Lower infrastructure costs
✅ Easier maintenance


