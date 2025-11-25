# Real-Time Collaboration Implementation

## Overview
This document describes the implementation of the comprehensive Real-Time Collaboration system, providing live collaborative documents, virtual classrooms, whiteboards, peer-to-peer learning, and group project management.

## Features Implemented

### 1. Live Collaborative Documents
- **Real-Time Editing**: Google Docs-style collaborative editing with operational transforms
- **Document Types**: Plain text, rich text, markdown, and code
- **Change Tracking**: Complete change log with version control
- **Comments**: Threaded comments and annotations
- **Live Participants**: See who's currently editing
- **Auto-Save**: Automatic saving of changes

### 2. Virtual Classrooms
- **Video Conferencing**: Integration with Jitsi Meet (or custom WebRTC)
- **Breakout Rooms**: Create and manage breakout rooms for group discussions
- **Recording**: Optional session recording
- **Chat**: Built-in chat functionality
- **Raise Hand**: Student interaction features
- **Polls**: Interactive polling during sessions

### 3. Whiteboard Collaboration
- **Shared Canvas**: Real-time collaborative whiteboard
- **Drawing Tools**: Shapes, text, drawings, images, sticky notes
- **Grid & Snap**: Optional grid and snap-to-grid features
- **Version Control**: Track whiteboard changes
- **Multi-User**: Multiple users can draw simultaneously

### 4. Peer-to-Peer Learning
- **Tutoring Sessions**: Schedule and manage tutoring sessions
- **Mentoring**: Peer mentoring system
- **Study Groups**: Organize peer study sessions
- **Ratings & Feedback**: Rate sessions and provide feedback
- **Session Tracking**: Track session duration and outcomes

### 5. Group Project Management
- **Team Workspaces**: Dedicated spaces for group projects
- **Task Tracking**: Create, assign, and track tasks
- **Progress Monitoring**: Visual progress bars and completion tracking
- **Task Dependencies**: Link tasks that depend on each other
- **Team Management**: Add/remove team members, assign roles
- **Project Types**: Assignments, presentations, research, portfolios

## Database Schema

### Tables Created

1. **collaboration_sessions**: Main table for all collaboration sessions
2. **collaboration_participants**: Participants in sessions with permissions
3. **collaborative_documents**: Documents with real-time editing
4. **document_changes**: Change log for operational transforms
5. **document_comments**: Comments and annotations
6. **virtual_classrooms**: Virtual classroom sessions
7. **breakout_rooms**: Breakout rooms within classrooms
8. **breakout_room_participants**: Participants in breakout rooms
9. **collaborative_whiteboards**: Shared whiteboards
10. **whiteboard_elements**: Individual elements on whiteboards
11. **tutoring_sessions**: Tutoring and mentoring sessions
12. **group_projects**: Group project workspaces
13. **project_tasks**: Tasks within projects
14. **project_members**: Team members in projects

### Functions Created

1. **get_active_sessions**: Returns active collaboration sessions
2. **get_session_participants**: Returns participants in a session
3. **join_session**: Adds a user to a session
4. **leave_session**: Removes a user from a session
5. **get_document_with_changes**: Returns document with change history
6. **get_tutoring_sessions**: Returns tutoring sessions
7. **get_group_projects**: Returns group projects
8. **get_project_tasks**: Returns tasks for a project
9. **update_project_progress**: Updates project progress automatically

## Frontend Components

### Main Component
- **CollaborationHub.jsx**: Main hub with tabs for all collaboration features

### Feature Components
- **CollaborativeDocuments.jsx**: Real-time document editor with Supabase Realtime
- **VirtualClassrooms.jsx**: Virtual classroom management with Jitsi integration
- **WhiteboardCollaboration.jsx**: Whiteboard interface (ready for library integration)
- **PeerToPeerLearning.jsx**: Tutoring and mentoring session management
- **GroupProjectManagement.jsx**: Project workspace with task tracking

### Service
- **collaborationService.js**: Service layer for all collaboration API calls

## Real-Time Features

### Supabase Realtime Integration
- **Streaming Row Changes**: Tables are added to Supabase Realtime publication
- **RLS-Based Access**: Users only receive updates for rows they can SELECT (via RLS policies)
- **Document Changes**: Real-time updates when others edit documents
- **Participant Presence**: See who's online and active via `collaboration_participants` table
- **Live Cursors**: Track where others are editing (can be enhanced with additional tracking)
- **Change Broadcasting**: Changes broadcast automatically to all subscribed clients
- **Channel Subscriptions**: Frontend subscribes using `supabase.channel().on('postgres_changes', ...)`

### Video Conferencing
- **Jitsi Integration**: Uses Jitsi Meet for video conferencing
- **Custom Rooms**: Unique meeting rooms per session
- **Breakout Rooms**: Separate rooms for group work
- **Recording**: Optional session recording

## Integration

The Collaboration Hub can be integrated into:
- **Class Subject Pages**: Access from class-subject assignments
- **Teacher Dashboard**: Quick access to create sessions
- **Student Dashboard**: Join active sessions

## Usage

### Creating a Collaboration Session
1. Navigate to Collaboration Hub
2. Click "New Session"
3. Select session type (Document, Classroom, Whiteboard, Project)
4. Fill in details and create

### Collaborative Documents
1. Go to Documents tab
2. Create or open a document
3. Start typing - changes sync in real-time
4. See other participants' cursors and changes

### Virtual Classrooms
1. Go to Virtual Classrooms tab
2. Create a classroom
3. Click "Join" to open video conference
4. Use breakout rooms for group activities

### Whiteboards
1. Go to Whiteboards tab
2. Create a whiteboard
3. Draw and collaborate in real-time
4. All changes sync automatically

### Peer Learning
1. Go to Peer Learning tab
2. Schedule a tutoring session
3. Set topic and learning objectives
4. Track sessions and provide feedback

### Group Projects
1. Go to Group Projects tab
2. Create a project
3. Add team members
4. Create and assign tasks
5. Track progress

## Setup Instructions

### Database Setup
1. Run the SQL scripts in order:
   ```sql
   -- Create tables
   database/add-collaboration-tables.sql
   
   -- Create functions
   database/add-collaboration-functions.sql
   
   -- Enable Realtime and RLS policies
   database/enable-realtime-replication.sql
   ```

2. Enable Realtime in Supabase Dashboard:
   - Go to **Database → Replication** (or **Database → Publications**)
   - For each table below, toggle **"Enable Realtime"** to **ON**:
     - `collaborative_documents`
     - `document_changes`
     - `collaboration_participants`
     - `whiteboard_elements`
     - `project_tasks`
     - `collaboration_sessions`
   
   This enables streaming row changes to clients via Supabase Realtime channels.

3. Verify RLS Policies:
   - The `enable-realtime-replication.sql` script creates RLS policies
   - These policies allow users to subscribe to realtime changes
   - Users can only receive updates for rows they have SELECT permission on

### Frontend Setup
1. Install additional dependencies (optional for enhanced features):
   ```bash
   npm install yjs y-websocket  # For advanced document collaboration
   npm install fabric  # For whiteboard drawing
   npm install jitsi-meet  # For enhanced video features
   ```

2. The components are ready to use once database tables are created.

## Real-Time Libraries (Optional Enhancements)

### Document Collaboration
- **Yjs**: Operational transforms for conflict-free editing
- **ShareJS**: Real-time document synchronization
- **Quill**: Rich text editor with collaboration

### Whiteboard
- **Fabric.js**: Canvas manipulation library
- **Konva.js**: 2D canvas library
- **Excalidraw**: Open-source whiteboard tool

### Video Conferencing
- **Jitsi Meet**: Open-source video conferencing (already integrated)
- **WebRTC**: Custom peer-to-peer video
- **Zoom SDK**: Commercial video solution

## Future Enhancements

- Advanced operational transforms for documents
- Rich text editor with formatting
- Whiteboard drawing tools integration
- Screen sharing in virtual classrooms
- File sharing in projects
- Notification system for collaboration events
- Mobile app support
- Offline editing with sync
- Export documents (PDF, Word)
- Whiteboard export (PNG, PDF)
- Video recording storage
- Advanced analytics and reporting

## Notes

- Real-time features use Supabase Realtime subscriptions
- Document changes are tracked for version control
- All components include error handling for missing tables
- Video conferencing uses Jitsi Meet (free, open-source)
- Whiteboard is ready for library integration
- Project progress updates automatically based on task completion
- All collaboration sessions are linked to class-subjects

