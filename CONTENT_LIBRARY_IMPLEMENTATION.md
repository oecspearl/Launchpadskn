# Content Library Implementation

## Overview

The Content Library feature allows teachers to share and reuse educational content across lessons, significantly reducing workload by eliminating the need to recreate similar materials. Teachers can browse, rate, favorite, and easily add library content to their lessons.

## Features

### 1. **Share Content to Library**
- Teachers can share any lesson content to the library
- Content is automatically tagged with subject and form information
- Shared content becomes available to all teachers (or institution-specific based on settings)

### 2. **Browse Library Content**
- Search by title, description, or tags
- Filter by:
  - Content type (Video, Image, File, Link, Quiz, Assignment, etc.)
  - Subject
  - Form/Grade level
  - Featured content
  - Rating
- Sort by:
  - Most Popular (use count)
  - Highest Rated
  - Newest First

### 3. **Add Content to Lessons**
- One-click "Add to Lesson" button
- Content is copied to the lesson (not linked, so teachers can customize)
- Usage statistics tracked automatically

### 4. **Ratings and Reviews**
- 5-star rating system
- Optional written reviews
- Average ratings displayed on content cards
- Helps teachers find quality content

### 5. **Favorites**
- Teachers can bookmark favorite content
- Quick access to frequently used materials
- Separate "My Favorites" tab

### 6. **Statistics**
- View count tracking
- Use count tracking
- Average ratings
- Content type distribution

## Database Schema

### Main Tables

1. **content_library** - Stores shared content
   - All fields from `lesson_content` plus:
   - `shared_by` - Teacher who shared it
   - `subject_id`, `form_id` - For filtering
   - `tags` - Array for searchability
   - `is_public`, `is_featured`, `is_verified` - Status flags
   - `view_count`, `use_count` - Statistics
   - `rating_average`, `rating_count` - Rating stats

2. **content_library_ratings** - Ratings and reviews
   - One rating per user per content item
   - Optional review text

3. **content_library_usage** - Tracks when content is used
   - Links library content to lesson content
   - Tracks who used it and when

4. **content_library_favorites** - Teacher bookmarks
   - Many-to-many relationship

### Database Functions

- `update_content_library_ratings()` - Auto-updates rating stats
- `update_content_library_use_count()` - Auto-increments use count
- `increment_library_view_count()` - Increments view count

## User Interface

### Content Library Page
**Route:** `/teacher/content-library`

**Features:**
- Statistics dashboard (total items, uses, avg rating, content types)
- Search bar
- Filter panel (type, subject, form, featured)
- Sort options
- Content cards with:
  - Content type icon
  - Title and description
  - Subject and form badges
  - Rating stars
  - Use/view counts
  - Tags
  - Estimated time
  - Action buttons (Add to Lesson, Rate, Favorite)

**Tabs:**
- Browse Library - All available content
- My Favorites - Bookmarked content

### Integration with Lesson Content Manager

**Share to Library:**
- "Share" button on each content item
- Automatically extracts all content data
- Prompts for tags (optional, can be enhanced)
- Shares to library with subject/form from lesson

**Add from Library:**
- "Add from Library" button in header
- Opens library with lesson context
- Direct "Add to Lesson" functionality
- Automatically navigates back to lesson content page

## Usage Flow

### Sharing Content

1. Teacher creates content in a lesson
2. Clicks "Share" button on content item
3. System extracts all content data
4. Gets subject/form from lesson
5. Creates library entry
6. Content is now available to all teachers

### Using Library Content

1. Teacher navigates to Content Library
2. Searches/filters for desired content
3. Reviews ratings and descriptions
4. Clicks "Add to Lesson"
5. If lessonId in URL, adds directly
6. Otherwise, prompts for lesson ID
7. Content is copied to lesson
8. Usage is tracked

## API/Service Methods

### contentLibraryService

- `getLibraryContent(filters)` - Get filtered content
- `getLibraryContentById(id)` - Get single item
- `shareContentToLibrary(data)` - Share content
- `addLibraryContentToLesson(libraryId, lessonId, userId)` - Add to lesson
- `rateContent(libraryId, userId, rating, review)` - Rate content
- `getRatings(libraryId)` - Get all ratings
- `addToFavorites(libraryId, userId)` - Bookmark
- `removeFromFavorites(libraryId, userId)` - Unbookmark
- `getFavorites(userId)` - Get user's favorites
- `isFavorite(libraryId, userId)` - Check if favorited
- `getLibraryStats()` - Get statistics
- `incrementViewCount(libraryId)` - Track view

## Implementation Files

### Database
- `database/create-content-library.sql` - Complete schema

### Services
- `frontend/src/services/contentLibraryService.js` - All API methods

### Components
- `frontend/src/components/Teacher/ContentLibrary.jsx` - Main library UI
- `frontend/src/components/Teacher/ContentLibrary.css` - Styles

### Integration
- `frontend/src/components/Teacher/LessonContentManager.jsx` - Share/Add buttons
- `frontend/src/routes/InstructorRoutes.jsx` - Route definition

## Setup Instructions

1. **Run Database Migration:**
   ```sql
   -- Execute database/create-content-library.sql
   ```

2. **Access Content Library:**
   - Navigate to `/teacher/content-library`
   - Or click "Add from Library" in Lesson Content Manager

3. **Start Sharing:**
   - Go to any lesson's content page
   - Click "Share" on any content item
   - Content is now in the library!

## Future Enhancements

- **Tags Management:** UI for adding/editing tags
- **Content Versioning:** Track updates to shared content
- **Collections:** Group related content together
- **Content Moderation:** Admin approval workflow
- **Institution-Specific:** Private libraries per institution
- **Content Templates:** Pre-structured templates
- **Bulk Operations:** Share multiple items at once
- **Content Analytics:** Detailed usage analytics
- **Recommendations:** AI-powered content suggestions
- **Export/Import:** Backup and restore library content

## Benefits

1. **Reduced Workload:** Teachers don't recreate similar content
2. **Quality Content:** Ratings help find best materials
3. **Collaboration:** Teachers share knowledge and resources
4. **Consistency:** Standardized content across classes
5. **Time Savings:** Quick content reuse
6. **Best Practices:** Popular content indicates effective materials

