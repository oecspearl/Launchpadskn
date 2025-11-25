# Interactive Curriculum Builder - Implementation Guide

## Overview

The Interactive Curriculum Builder is an enhanced curriculum management system with drag-and-drop functionality, resource library integration, collaborative editing, template system, and AI-powered suggestions.

## Features Implemented

### ✅ 1. Drag-and-Drop Topic Sequencing
- **Visual Reordering**: Topics can be reordered by dragging and dropping
- **Auto-renumbering**: Topic numbers and SCO numbers automatically update when topics are reordered
- **Smooth Animations**: Visual feedback during dragging operations

### ✅ 2. Resource Library Integration
- **Reusable Resources**: Create and manage reusable curriculum resources
- **Resource Types**: Support for Videos, Links, Games, Worksheets, Documents, Activities, and Assessments
- **Tagging System**: Tag resources for easy searching
- **Usage Tracking**: Track how often resources are used
- **Linking**: Link resources directly to curriculum items (topics, units, SCOs)

### ✅ 3. Collaborative Editing
- **Real-time Collaboration**: Multiple teachers can edit curriculum simultaneously
- **Active Editor Indicators**: See who else is currently editing
- **Change History**: Complete audit trail of all curriculum changes
- **Session Management**: Automatic session cleanup for inactive editors

### ✅ 4. Template System
- **Save Templates**: Save current curriculum as reusable templates
- **Browse Templates**: Search and browse available templates
- **Public/Private**: Templates can be shared publicly or kept private
- **Usage Tracking**: Track template usage statistics

### ✅ 5. AI-Powered Suggestions
- **Context-Aware**: Suggestions based on topic, unit, or SCO context
- **Multiple Types**: Suggestions for activities, resources, and assessments
- **Confidence Scores**: Each suggestion includes a confidence score
- **Rule-Based**: Currently uses rule-based suggestions (can be enhanced with AI APIs)

## Installation

### 1. Install Dependencies

```bash
cd frontend
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### 2. Database Setup

Run the database migration scripts:

```sql
-- Create tables
\i database/add-curriculum-builder-tables.sql

-- Create functions
\i database/add-curriculum-builder-functions.sql
```

### 3. Enable Supabase Realtime

In your Supabase dashboard:
1. Go to Database → Replication
2. Enable replication for:
   - `subject_form_offerings` table
   - `curriculum_session_editors` table
   - `curriculum_change_history` table (optional)

## Usage

### Accessing the Interactive Builder

1. Navigate to **Admin Dashboard** → **Subject Management**
2. Go to the **Form Offerings** tab
3. Find the subject-form offering you want to edit
4. Click the **"Interactive Builder"** button (next to the classic editor button)

### Using Drag-and-Drop

1. In the Interactive Builder, topics are displayed as cards
2. Click and hold the grip icon (⋮⋮) on the left side of a topic card
3. Drag the topic to the desired position
4. Release to drop - topic numbers will automatically update

### Using the Resource Library

1. Click **"Resource Library"** button in the builder
2. **Browse**: Search and filter existing resources
3. **Create**: Add new resources with title, description, type, URL, and tags
4. **Link**: Click "Link to Curriculum" on any resource to link it to the current curriculum item

### Collaborative Editing

- Multiple users can edit the same curriculum simultaneously
- Active editors are shown in the header with a green indicator
- Changes are automatically synced to all editors
- Each change is logged in the change history

### Using Templates

1. Click **"Templates"** button in the builder
2. **Browse**: Search and view available templates
3. **Use Template**: Click "Use Template" to apply a template to the current curriculum
4. **Save Template**: Click "Save Current as Template" to save the current curriculum as a reusable template

### AI Suggestions

1. Select a topic, unit, or SCO
2. Click **"AI Suggestions"** button
3. Click **"Generate New Suggestions"** to get AI-powered recommendations
4. Review suggestions with confidence scores
5. Click **"Apply"** to add a suggestion to your curriculum

## Database Schema

### Tables Created

1. **curriculum_resources**: Reusable curriculum resources
2. **curriculum_templates**: Saved curriculum templates
3. **curriculum_resource_links**: Links between resources and curriculum items
4. **curriculum_editing_sessions**: Active collaborative editing sessions
5. **curriculum_session_editors**: Users currently editing
6. **curriculum_change_history**: Audit trail of changes
7. **curriculum_ai_suggestions**: Cached AI suggestions

### Key Functions

- `increment_resource_usage(resource_id)`: Track resource usage
- `increment_template_usage(template_id)`: Track template usage
- `get_active_editors(session_id)`: Get active editors in a session
- `search_curriculum_resources(...)`: Search resources with filters
- `get_linked_resources(offering_id, link_path)`: Get resources linked to a curriculum item

## Component Structure

```
InteractiveCurriculumBuilder.jsx
├── SortableTopicItem (drag-and-drop topic)
├── TopicEditor (edit topic details)
├── ChangeHistoryView (view change history)
├── ResourceLibrary.jsx
│   └── ResourceCreator
├── CurriculumTemplateManager.jsx
│   └── TemplateSaver
└── AISuggestionPanel.jsx
```

## API Integration

### Supabase Realtime

The collaborative editing uses Supabase Realtime subscriptions:

```javascript
// Subscribe to curriculum changes
supabase
  .channel(`curriculum:${offering_id}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'subject_form_offerings',
    filter: `offering_id=eq.${offering_id}`
  }, (payload) => {
    // Update curriculum data
  })
  .subscribe();
```

## Future Enhancements

### AI Integration
- Integrate with OpenAI API for more intelligent suggestions
- Use GPT-4 for generating learning activities
- Analyze curriculum content for suggestions

### Advanced Features
- Unit-level drag-and-drop
- SCO-level drag-and-drop
- Visual curriculum map/graph view
- Export curriculum to PDF/Word
- Import curriculum from external sources
- Version comparison and diff view

### Performance
- Optimize for large curricula (100+ topics)
- Virtual scrolling for long lists
- Debounced auto-save
- Offline editing support

## Troubleshooting

### Drag-and-Drop Not Working
- Ensure `@dnd-kit` packages are installed
- Check browser console for errors
- Verify sensors are properly configured

### Collaborative Editing Not Syncing
- Check Supabase Realtime is enabled
- Verify table replication is enabled
- Check network connection

### AI Suggestions Not Generating
- Currently uses rule-based suggestions
- Can be enhanced with actual AI API integration
- Check browser console for errors

## Support

For issues or questions, please refer to:
- Component files in `frontend/src/components/Admin/`
- Database scripts in `database/`
- This documentation

