# Interactive Learning Classes - Complete Guide

## 📚 Overview

Classes in the LMS represent student groups within Forms (year groups). Each class can have multiple subjects, teachers, and students assigned to it. This guide explains how classes are created, edited, and accessed by different user roles.

---

## 🏗️ How Classes Are Created

### Step 1: Prerequisites

Before creating a class, you need:
1. **A School/Institution** - Created in the system
2. **A Form** - Year group (Form 1-7) must exist
3. **An Admin Account** - Only admins can create classes

### Step 2: Create a Form (if not exists)

**Location:** Admin Dashboard → Forms Management (`/admin/forms`)

**Example:**
```
Form Number: 3
Form Name: Form 3
Academic Year: 2024-2025
School: LaunchPad SKN Secondary School
Coordinator: (Optional) Assign a form coordinator
Description: Lower Secondary - Year 3
```

**What happens:**
- Form is created in the `forms` table
- Form is linked to a school
- Form coordinator can be assigned (optional)

### Step 3: Create a Class

**Location:** Admin Dashboard → Class Management (`/admin/classes`)

**Required Fields:**
- **Form** - Select which Form this class belongs to
- **Class Name** - e.g., "3A", "4Science", "5Arts"
- **Class Code** - Auto-generated (e.g., "F3A") or manual
- **Academic Year** - e.g., "2024-2025"

**Optional Fields:**
- **Capacity** - Default: 35 students
- **Form Tutor** - Homeroom teacher (optional)
- **Room Number** - Physical classroom location
- **Description** - Additional notes

**Example Creation:**
```
Form: Form 3 (2024-2025)
Class Name: 3A
Class Code: F3A (auto-generated)
Academic Year: 2024-2025
Capacity: 35
Form Tutor: Ms. Jane Smith
Room Number: Room 101
Description: Lower Secondary Class A
```

**What happens:**
- Class is created in the `classes` table
- Class is linked to the selected Form
- Form Tutor is assigned (if provided)
- Class is set as active by default
- Enrollment count starts at 0

---

## ✏️ How Classes Are Edited

### Admin Edit Process

**Location:** Admin Dashboard → Class Management (`/admin/classes`)

**Steps:**
1. Navigate to Class Management page
2. Find the class in the table
3. Click the **Edit** button (pencil icon)
4. Modal opens with current class data
5. Modify any fields:
   - Change class name
   - Update capacity
   - Change form tutor
   - Update room number
   - Modify description
6. Click **Update Class**
7. Changes are saved to database

**Example Edit:**
```
Original:
- Class Name: 3A
- Capacity: 35
- Form Tutor: Ms. Jane Smith

Edited:
- Class Name: 3A (unchanged)
- Capacity: 30 (reduced)
- Form Tutor: Mr. John Doe (changed)
```

**What can be edited:**
- ✅ Class name
- ✅ Class code
- ✅ Capacity
- ✅ Form tutor
- ✅ Room number
- ✅ Description
- ✅ Academic year (with caution)
- ❌ Form (cannot change - would require creating new class)

### Soft Delete (Deactivation)

**Process:**
1. Click **Delete** button (trash icon)
2. Confirm deletion
3. Class is marked as `is_active = false`
4. Class no longer appears in active lists
5. Historical data is preserved

**Note:** Deletion is soft - data is preserved for records.

---

## 👥 How Classes Are Accessed by Users

### 1. Students Access Classes

**Access Path:**
```
Login → Student Dashboard → My Subjects → Click Subject → View Class Info
```

**What Students See:**
- **Dashboard:** Their assigned class name (e.g., "Form 3 - 3A")
- **Subjects:** All subjects for their class
- **Lessons:** Lessons scheduled for their class
- **Timetable:** Weekly schedule for their class
- **Classmates:** (Indirectly through shared subjects)

**Example Student View:**
```
Student Dashboard:
┌─────────────────────────────┐
│ My Class: Form 3 - 3A       │
│ Form Tutor: Ms. Jane Smith  │
│ Room: Room 101               │
│ Enrollment: 30/35            │
└─────────────────────────────┘

My Subjects:
- Mathematics (Mr. John Doe)
- English (Ms. Sarah Brown)
- Science (Dr. Michael Green)
```

**Student Cannot:**
- ❌ Create classes
- ❌ Edit classes
- ❌ Assign students
- ❌ View other classes

**Student Can:**
- ✅ View their assigned class
- ✅ See all subjects for their class
- ✅ Access lessons for their class
- ✅ View class timetable

---

### 2. Teachers Access Classes

**Access Path:**
```
Login → Teacher Dashboard → My Classes → Click "Manage Class"
```

**What Teachers See:**
- **Dashboard:** Classes they teach
- **Class Management:** Full class details
- **Students:** List of all students in class
- **Subjects:** Subjects they teach for that class
- **Lessons:** Recent lessons for the class

**Example Teacher View:**
```
Teacher Dashboard:
┌─────────────────────────────┐
│ My Classes                  │
│                             │
│ Form 3 - 3A                 │
│ Subjects: Mathematics        │
│ Students: 30                │
│ [Manage Class]              │
└─────────────────────────────┘

Class Management Page:
┌─────────────────────────────┐
│ Class: 3A                   │
│ Form: Form 3                │
│ Students: 30                │
│                             │
│ Students List:               │
│ - John Doe                  │
│ - Jane Smith                │
│ ...                         │
│                             │
│ Subjects I Teach:           │
│ - Mathematics               │
└─────────────────────────────┘
```

**Teacher Can:**
- ✅ View classes they teach
- ✅ See students in their classes
- ✅ Manage lessons for their classes
- ✅ Mark attendance
- ✅ Enter grades
- ✅ View class timetable

**Teacher Cannot:**
- ❌ Create new classes
- ❌ Edit class details (name, capacity, etc.)
- ❌ Assign students to classes
- ❌ Delete classes

---

### 3. Admins Access Classes

**Access Path:**
```
Login → Admin Dashboard → Classes → Class Management
```

**What Admins See:**
- **Full Class List:** All classes in the system
- **Filter by Form:** View classes by year group
- **Enrollment Stats:** See enrollment vs capacity
- **Class Details:** All class information
- **Management Actions:** Create, Edit, Delete

**Example Admin View:**
```
Class Management:
┌─────────────────────────────────────────────┐
│ Filter: [All Forms ▼]                        │
│ [+ Create Class]                             │
├─────────────────────────────────────────────┤
│ Class Name │ Form │ Enrollment │ Actions    │
├─────────────────────────────────────────────┤
│ 3A         │ F3   │ 30/35      │ [✏️] [👥] [🗑️]│
│ 3B         │ F3   │ 28/35      │ [✏️] [👥] [🗑️]│
│ 4A         │ F4   │ 32/35      │ [✏️] [👥] [🗑️]│
└─────────────────────────────────────────────┘
```

**Admin Can:**
- ✅ Create new classes
- ✅ Edit any class
- ✅ Delete/deactivate classes
- ✅ View all classes
- ✅ Assign form tutors
- ✅ Set capacity
- ✅ View enrollment statistics
- ✅ Manage student assignments (separate page)

---

## 🔄 Complete Workflow Example

### Scenario: Setting Up a New Academic Year

**Step 1: Admin Creates Forms**
```
Form 1 (2024-2025)
Form 2 (2024-2025)
Form 3 (2024-2025)
... etc
```

**Step 2: Admin Creates Classes**
```
For Form 3:
- Class 3A (Capacity: 35, Tutor: Ms. Smith)
- Class 3B (Capacity: 35, Tutor: Mr. Jones)
- Class 3C (Capacity: 30, Tutor: Ms. Brown)
```

**Step 3: Admin Assigns Students**
```
Student Assignment Page:
- Assign 30 students to Class 3A
- Assign 28 students to Class 3B
- Assign 25 students to Class 3C
```

**Step 4: Admin Assigns Subjects to Classes**
```
Class-Subject Assignment:
- Class 3A → Mathematics (Teacher: Mr. Doe)
- Class 3A → English (Teacher: Ms. Brown)
- Class 3A → Science (Teacher: Dr. Green)
```

**Step 5: Teachers Access Their Classes**
```
Teacher Login:
- See "Form 3 - 3A" in My Classes
- Click "Manage Class"
- See 30 students
- See subjects they teach
- Can create lessons
```

**Step 6: Students Access Their Class**
```
Student Login:
- See "Form 3 - 3A" on dashboard
- See all subjects for their class
- Access lessons and materials
- View timetable
```

---

## 📊 Database Structure

### Classes Table
```sql
classes:
- class_id (Primary Key)
- form_id (Foreign Key → forms)
- class_name (e.g., "3A")
- class_code (e.g., "F3A")
- academic_year (e.g., "2024-2025")
- capacity (e.g., 35)
- current_enrollment (auto-calculated)
- form_tutor_id (Foreign Key → users)
- room_number (optional)
- description (optional)
- is_active (boolean)
- created_at
- updated_at
```

### Relationships
```
School (Institution)
  └── Form (Year Group)
        └── Class (Student Group)
              ├── Students (via student_class_assignments)
              ├── Subjects (via class_subjects)
              └── Lessons (via lessons → class_subjects)
```

---

## 🎯 Key Features

### Auto-Generated Class Codes
- When you enter "3A" as class name, system auto-generates "F3A" as code
- Can be manually overridden

### Enrollment Tracking
- System automatically counts active student assignments
- Shows enrollment vs capacity
- Visual indicators (green/yellow/red badges)

### Form Tutor Assignment
- Each class can have a form tutor (homeroom teacher)
- Form tutor can manage class activities
- Optional field - class can exist without tutor

### Academic Year Management
- Classes are tied to specific academic years
- Allows historical tracking
- Supports multi-year data

### Soft Delete
- Classes are never permanently deleted
- Marked as inactive (`is_active = false`)
- Historical data preserved

---

## 🔐 Access Control

### Role-Based Permissions

| Action | Admin | Teacher | Student |
|--------|-------|---------|---------|
| Create Class | ✅ | ❌ | ❌ |
| Edit Class | ✅ | ❌ | ❌ |
| Delete Class | ✅ | ❌ | ❌ |
| View All Classes | ✅ | ❌ | ❌ |
| View Own Class | ✅ | ✅* | ✅ |
| View Students | ✅ | ✅* | ❌ |
| Manage Lessons | ✅ | ✅* | ❌ |

*Teachers can only view/manage classes they teach

---

## 📝 Best Practices

1. **Naming Convention:**
   - Use consistent naming: "3A", "3B", "4Science", etc.
   - Keep class codes short and unique

2. **Capacity Planning:**
   - Set realistic capacity based on room size
   - Monitor enrollment vs capacity

3. **Form Tutor Assignment:**
   - Assign form tutors early
   - Ensure tutors have instructor/admin role

4. **Academic Year:**
   - Use format: "YYYY-YYYY" (e.g., "2024-2025")
   - Be consistent across all classes

5. **Room Numbers:**
   - Use clear room identifiers
   - Helpful for timetable generation

---

## 🚀 Quick Reference

### Create Class
```
Admin → Classes → Create Class → Fill Form → Submit
```

### Edit Class
```
Admin → Classes → Find Class → Edit → Modify → Update
```

### View Class (Student)
```
Student → Dashboard → See Class Info
```

### View Class (Teacher)
```
Teacher → Dashboard → My Classes → Manage Class
```

### View Class (Admin)
```
Admin → Classes → See All Classes
```

---

## ❓ Common Questions

**Q: Can I change a class's Form after creation?**
A: No, you must create a new class. The Form is a fundamental relationship.

**Q: What happens to students when I delete a class?**
A: Students remain in the system but their assignment becomes inactive. Reassign them to another class.

**Q: Can multiple teachers teach the same class?**
A: Yes, different teachers can teach different subjects to the same class.

**Q: How do I see which students are in a class?**
A: Admins: Class Management → Click student icon. Teachers: Class Management page shows students.

**Q: Can a class have no students?**
A: Yes, classes can exist with 0 enrollment. Students are assigned separately.

---

This guide covers the complete lifecycle of classes in the LMS system. Classes are the foundation for organizing students, subjects, and lessons in the Caribbean secondary school structure.












