# Real-Time Collaboration Setup Guide

## Step-by-Step Setup Instructions

### ✅ Step 1: Database Tables Created (COMPLETED)
You've already run:
- `database/add-collaboration-tables.sql` ✓
- `database/add-collaboration-functions.sql` ✓
- `database/enable-realtime-replication.sql` ✓

---

### 📋 Step 2: Enable Realtime in Supabase Dashboard

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project

2. **Open Database → Replication**
   - In the left sidebar, click **"Database"**
   - Click **"Replication"** (or look for "Publications" in some versions)

3. **Enable Realtime for Each Table**
   For each table below, find it in the list and toggle **"Enable Realtime"** to **ON**:
   
   - ✅ `collaborative_documents`
   - ✅ `document_changes`
   - ✅ `collaboration_participants`
   - ✅ `whiteboard_elements`
   - ✅ `project_tasks`
   - ✅ `collaboration_sessions`

   **How to do it:**
   - Find the table name in the list
   - Click the toggle switch next to it
   - It should turn green/blue when enabled
   - You may see a confirmation message

4. **Verify Realtime is Enabled**
   - Each enabled table should show a checkmark or "Active" status
   - If you see "Inactive" or no toggle, refresh the page

---

### 🔍 Step 3: Verify RLS Policies

1. **Check Policies in Supabase Dashboard**
   - Go to **Database → Tables**
   - Click on `collaborative_documents`
   - Click the **"Policies"** tab
   - You should see: "Users can view documents in their sessions"
   - Repeat for other tables:
     - `document_changes`
     - `collaboration_participants`
     - `whiteboard_elements`
     - `project_tasks`
     - `collaboration_sessions`

2. **Test RLS (Optional)**
   - Go to **Database → SQL Editor**
   - Run this query to test:
   ```sql
   SELECT * FROM collaborative_documents;
   ```
   - You should only see documents you have access to (based on your user)

---

### 🎨 Step 4: Integrate Collaboration Hub into Frontend

The Collaboration Hub needs to be accessible from your application. Here are the integration points:

#### Option A: Add to Class-Subject Assignment Page

1. **Open**: `frontend/src/components/Admin/ClassSubjectAssignment.jsx`

2. **Add Collaboration Button** (next to the Analytics button):
   ```jsx
   import CollaborationHub from '../Collaboration/CollaborationHub';
   
   // In the actions column, add:
   <Button
     variant="outline-success"
     size="sm"
     className="me-2"
     onClick={() => {
       setSelectedClassSubject(classSubject);
       setShowCollaboration(true);
     }}
     title="Open Collaboration Hub"
   >
     <FaUsers /> Collaborate
   </Button>
   ```

3. **Add Modal** (similar to the Analytics modal):
   ```jsx
   <Modal
     show={showCollaboration}
     onHide={() => {
       setShowCollaboration(false);
       setSelectedClassSubject(null);
     }}
     size="xl"
     fullscreen="lg-down"
   >
     <Modal.Header closeButton>
       <Modal.Title>Collaboration Hub</Modal.Title>
     </Modal.Header>
     <Modal.Body>
       {selectedClassSubject && (
         <CollaborationHub
           classSubjectId={selectedClassSubject.class_subject_id}
           classSubject={selectedClassSubject}
         />
       )}
     </Modal.Body>
   </Modal>
   ```

#### Option B: Add as a Standalone Route

1. **Add Route** in your router (e.g., `App.jsx` or router file):
   ```jsx
   import CollaborationHub from './components/Collaboration/CollaborationHub';
   
   <Route 
     path="/collaboration/:classSubjectId" 
     element={<CollaborationHub />} 
   />
   ```

2. **Add Navigation Link** in your admin dashboard or class management page

---

### 🧪 Step 5: Test the Collaboration Features

1. **Start Your Frontend**
   ```bash
   cd frontend
   npm start
   ```

2. **Login as Admin/Teacher**

3. **Navigate to Collaboration Hub**
   - Go to Class-Subject Assignment
   - Click the "Collaborate" button (or navigate to the route)

4. **Test Each Feature:**

   **A. Create a Collaborative Document:**
   - Click "Documents" tab
   - Click "New Document"
   - Enter title and content
   - Click "Create Document"
   - Open the document
   - Type some text
   - Open in another browser/incognito window (as different user)
   - You should see changes in real-time!

   **B. Create a Virtual Classroom:**
   - Click "Virtual Classrooms" tab
   - Click "New Classroom"
   - Fill in details
   - Click "Join" to open Jitsi meeting

   **C. Create a Whiteboard:**
   - Click "Whiteboards" tab
   - Click "New Whiteboard"
   - Open it (currently shows placeholder - ready for library integration)

   **D. Schedule Tutoring:**
   - Click "Peer Learning" tab
   - Click "Schedule Session"
   - Fill in student ID and details
   - Create session

   **E. Create Group Project:**
   - Click "Group Projects" tab
   - Click "New Project"
   - Fill in details
   - Add tasks
   - Track progress

---

### 🔧 Step 6: Troubleshooting

**If Realtime doesn't work:**

1. **Check Realtime is Enabled:**
   - Go back to Database → Replication
   - Verify all tables show "Active" or have the toggle ON

2. **Check Browser Console:**
   - Open browser DevTools (F12)
   - Look for errors in Console tab
   - Check Network tab for WebSocket connections

3. **Verify RLS Policies:**
   - Go to Database → Tables → [table name] → Policies
   - Ensure policies exist and are enabled

4. **Check User Authentication:**
   - Make sure you're logged in
   - Verify `auth.uid()` returns your UUID
   - Check that your user exists in `users` table with matching `id` (UUID)

5. **Test Realtime Subscription:**
   - In browser console, try:
   ```javascript
   const channel = supabase
     .channel('test')
     .on('postgres_changes', 
       { event: '*', schema: 'public', table: 'collaborative_documents' },
       (payload) => console.log('Change received!', payload)
     )
     .subscribe();
   ```

---

### 📝 Step 7: Next Steps (Optional Enhancements)

1. **Install Advanced Libraries** (for better features):
   ```bash
   cd frontend
   npm install yjs y-websocket  # For advanced document collaboration
   npm install fabric  # For whiteboard drawing
   ```

2. **Configure Jitsi Server** (optional):
   - Currently uses public Jitsi Meet
   - You can set up your own Jitsi server for better control

3. **Add Notifications:**
   - Notify users when someone joins a session
   - Alert on document changes
   - Remind about scheduled tutoring sessions

---

### ✅ Verification Checklist

- [ ] All tables created successfully
- [ ] All functions created successfully
- [ ] RLS policies created and enabled
- [ ] Realtime enabled for all 6 tables in Supabase Dashboard
- [ ] Collaboration Hub integrated into frontend
- [ ] Can create a collaboration session
- [ ] Can create a document
- [ ] Real-time updates work (test with 2 browsers)
- [ ] Virtual classroom opens Jitsi meeting
- [ ] Can create group projects and tasks

---

### 🆘 Need Help?

If you encounter issues:
1. Check browser console for errors
2. Check Supabase logs (Dashboard → Logs)
3. Verify all SQL scripts ran successfully
4. Ensure you're logged in with a valid user account

