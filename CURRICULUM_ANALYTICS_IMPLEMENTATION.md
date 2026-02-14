# Curriculum Analytics Implementation

## Overview
This document describes the implementation of the Curriculum Analytics feature, which provides comprehensive tracking and analysis of curriculum coverage, time allocation, outcome achievement, and gap identification.

## Features Implemented

### 1. Coverage Tracking
- **Visual Progress Indicators**: Progress bars showing coverage percentage for topics, units, and SCOs
- **Status Tracking**: Tracks status (NOT_STARTED, IN_PROGRESS, COMPLETED, SKIPPED) for each curriculum item
- **Lesson Count**: Tracks number of lessons covering each SCO
- **Date Tracking**: Records first and last taught dates for each SCO
- **Filtering**: Search and filter by status, topic, unit, or SCO number

### 2. Time Allocation Analysis
- **Planned vs Actual**: Compares planned time allocation with actual time spent
- **Variance Analysis**: Shows variance in hours and percentage
- **Summary Cards**: Displays total planned time, actual time, variance, and status
- **Detailed Breakdown**: Table showing time allocation by SCO with variance indicators
- **Term/Year Filtering**: Filter analysis by academic year and term

### 3. Outcome Achievement Dashboard
- **Achievement Summary**: Tracks student achievement rates per SCO
- **Status Breakdown**: Shows achieved, developing, and not assessed counts
- **Average Achievement**: Calculates average achievement percentage per SCO
- **Achievement Rate**: Percentage of students who achieved each SCO
- **Visual Indicators**: Progress bars and badges for quick status identification

### 4. Gap Analysis
- **Automatic Gap Identification**: Identifies gaps in curriculum coverage and achievement
- **Gap Types**: 
  - NOT_COVERED: SCOs not covered in any lessons
  - PARTIALLY_COVERED: SCOs with incomplete coverage
  - NO_ASSESSMENT: SCOs without student assessments
  - LOW_ACHIEVEMENT: SCOs with achievement rates below 70%
- **Severity Levels**: CRITICAL, HIGH, MEDIUM, LOW
- **Resolution Tracking**: Ability to mark gaps as resolved with timestamps
- **Recommended Actions**: Provides actionable recommendations for each gap

## Database Schema

### Tables Created

1. **curriculum_coverage**: Tracks coverage status for each SCO per class-subject
2. **curriculum_time_allocation**: Stores planned vs actual time allocation
3. **curriculum_outcome_achievement**: Tracks individual student achievement per SCO
4. **lesson_sco_mapping**: Maps lessons to specific SCOs they cover
5. **curriculum_gaps**: Stores identified curriculum gaps
6. **curriculum_analytics_snapshots**: Periodic snapshots for historical tracking

### Functions Created

1. **get_curriculum_coverage**: Returns detailed coverage information
2. **get_coverage_summary**: Returns summary statistics
3. **get_time_allocation_analysis**: Returns planned vs actual time analysis
4. **get_outcome_achievement_summary**: Returns achievement summary by SCO
5. **get_gap_analysis**: Returns identified gaps
6. **update_coverage_from_lessons**: Updates coverage from completed lessons
7. **calculate_time_allocation**: Calculates actual time from lesson data
8. **identify_curriculum_gaps**: Automatically identifies gaps

## Frontend Components

### Main Component
- **CurriculumAnalytics.jsx**: Main container component with tabs for each analytics feature

### Sub-Components
- **CoverageTracking.jsx**: Displays coverage progress with filtering and search
- **TimeAllocationAnalysis.jsx**: Shows planned vs actual time comparison
- **OutcomeAchievementDashboard.jsx**: Displays student achievement metrics
- **GapAnalysis.jsx**: Shows identified gaps with resolution tracking

### Service
- **curriculumAnalyticsService.js**: Service layer for all analytics API calls

## Integration

The Curriculum Analytics feature is integrated into the **ClassSubjectAssignment** component:
- A chart icon button appears next to each class-subject assignment
- Clicking the button opens a modal with the full analytics dashboard
- Analytics can be refreshed to update data from lessons

## Usage

### Accessing Analytics
1. Navigate to Admin → Class-Subject Assignment
2. Find the class-subject assignment you want to analyze
3. Click the chart icon (📊) button
4. View analytics in the modal

### Refreshing Data
1. Click "Refresh Data" button in the analytics dashboard
2. This will:
   - Update coverage from completed lessons
   - Calculate time allocation from lesson data
   - Identify new gaps

### Viewing Different Analytics
- Use the tabs to switch between:
  - Coverage Tracking
  - Time Allocation
  - Outcome Achievement
  - Gap Analysis

## Setup Instructions

### Database Setup
1. Run the SQL scripts in order:
   ```sql
   -- Create tables
   database/add-curriculum-analytics-tables.sql
   
   -- Create functions
   database/add-curriculum-analytics-functions.sql
   ```

2. The tables and functions will be created in your Supabase database.

### Frontend Setup
No additional setup required. The components are already integrated and will work once the database tables are created.

## Data Flow

1. **Lessons → Coverage**: When lessons are completed and mapped to SCOs, coverage is automatically tracked
2. **Lessons → Time Allocation**: Lesson duration is calculated and aggregated per SCO
3. **Assessments → Achievement**: Student assessments linked to SCOs update achievement tracking
4. **Gap Identification**: Automatic analysis identifies gaps in coverage and achievement

## Future Enhancements

- Historical trend analysis
- Export analytics reports (PDF/Excel)
- Email alerts for critical gaps
- Integration with lesson planning
- Predictive analytics for curriculum completion
- Custom dashboard widgets
- Comparative analytics across classes/subjects

## Notes

- Analytics data is calculated on-demand when "Refresh Data" is clicked
- Some features require lessons to be mapped to SCOs using `lesson_sco_mapping`
- Achievement tracking requires assessments to be linked to SCOs
- Gap identification runs automatically but can be triggered manually

