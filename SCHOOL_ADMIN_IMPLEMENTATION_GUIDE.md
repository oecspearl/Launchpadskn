# School Admin Implementation Guide

## Overview

This guide explains how to implement a **School Admin** role in the LaunchPad SKN LMS. A School Admin is an institution-scoped administrator who manages all platform features within their assigned school/institution, while a Super Admin (current ADMIN role) manages the entire platform across all institutions.

---

## 🎯 Role Hierarchy

### Current Roles
1. **ADMIN** (Super Admin)
   - Full system access across ALL institutions
   - Can create/manage institutions
   - Can assign school admins
   - Platform-wide management

2. **INSTRUCTOR** (Teacher)
   - Manages assigned classes and subjects
   - Creates lessons, marks attendance, enters grades
   - Scoped to their assigned classes

3. **STUDENT**
   - Views own classes, subjects, lessons
   - Submits assignments, views grades
   - Scoped to their enrolled classes

### New Role: SCHOOL_ADMIN
- **Institution-scoped** administrator
- Manages ALL features within their assigned institution(s)
- Cannot create/manage institutions (only Super Admin can)
- Cannot assign other school admins (only Super Admin can)
- Full access to:
  - Forms, Classes, Subjects within their institution
  - Students and Instructors within their institution
  - Reports and analytics for their institution
  - User management within their institution

---

## 📋 Implementation Steps

### Step 1: Database Schema Updates

#### 1.1 Update Users Table
Ensure the `users` table has an `institution_id` column to link users to institutions:

```sql
-- Check if institution_id column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'institution_id';

-- If it doesn't exist, add it:
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS institution_id BIGINT REFERENCES institutions(institution_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_institution_id ON users(institution_id);
```

#### 1.2 Update Role Enum/Validation
The role field should accept `SCHOOL_ADMIN`:

```sql
-- Update any check constraints if they exist
-- Most systems use VARCHAR, so this should work automatically
-- But verify the role column accepts the new value
```

#### 1.3 Add Institution Assignment Table (Optional - for multi-institution admins)
If a school admin can manage multiple institutions:

```sql
CREATE TABLE IF NOT EXISTS school_admin_institutions (
    admin_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    institution_id BIGINT NOT NULL REFERENCES institutions(institution_id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by BIGINT REFERENCES users(user_id),
    PRIMARY KEY (admin_id, institution_id)
);

CREATE INDEX idx_school_admin_institutions_admin ON school_admin_institutions(admin_id);
CREATE INDEX idx_school_admin_institutions_institution ON school_admin_institutions(institution_id);
```

---

### Step 2: Backend/Service Layer Updates

#### 2.1 Update Role Validation
In `frontend/src/contexts/AuthContextSupabase.jsx`:

```javascript
// Update the valid roles list
const validRoles = ['ADMIN', 'SCHOOL_ADMIN', 'INSTRUCTOR', 'STUDENT'];

// Update role normalization
let userRole = (profile.role || 'STUDENT').toUpperCase().trim();
if (userRole === 'TEACHER') {
  userRole = 'INSTRUCTOR';
}
// Add SCHOOL_ADMIN to valid roles check
const finalRole = validRoles.includes(userRole) 
  ? userRole 
  : (session.user.email.includes('admin') ? 'ADMIN' : 'STUDENT');
```

#### 2.2 Create Institution-Scoped Service Functions
In `frontend/src/services/supabaseService.jsx`, add helper functions:

```javascript
/**
 * Check if user has access to an institution
 */
async hasInstitutionAccess(userId, institutionId) {
  const { data: user } = await supabase
    .from('users')
    .select('role, institution_id')
    .eq('id', userId)
    .single();
  
  if (!user) return false;
  
  // Super Admin has access to all institutions
  if (user.role === 'ADMIN') return true;
  
  // School Admin has access to their institution
  if (user.role === 'SCHOOL_ADMIN') {
    return user.institution_id === institutionId;
  }
  
  return false;
}

/**
 * Get user's accessible institution IDs
 */
async getUserInstitutionIds(userId) {
  const { data: user } = await supabase
    .from('users')
    .select('role, institution_id')
    .eq('id', userId)
    .single();
  
  if (!user) return [];
  
  // Super Admin can access all institutions
  if (user.role === 'ADMIN') {
    const { data: institutions } = await supabase
      .from('institutions')
      .select('institution_id');
    return institutions?.map(i => i.institution_id) || [];
  }
  
  // School Admin can access their institution
  if (user.role === 'SCHOOL_ADMIN' && user.institution_id) {
    return [user.institution_id];
  }
  
  return [];
}

/**
 * Get institution-scoped users
 */
async getUsersByInstitution(institutionId, userRole = null) {
  let query = supabase
    .from('users')
    .select('*')
    .eq('institution_id', institutionId)
    .eq('is_active', true);
  
  if (userRole) {
    query = query.eq('role', userRole);
  }
  
  const { data, error } = await query.order('name');
  if (error) throw error;
  return data || [];
}
```

---

### Step 3: Frontend Route Protection Updates

#### 3.1 Update PrivateRoute Component
In `frontend/src/components/Auth/PrivateRoute.jsx`:

```javascript
// Add SCHOOL_ADMIN to role routing
switch (userRole) {
  case 'admin':
    return <Navigate to="/admin/dashboard" replace />;
  case 'school_admin':
    return <Navigate to="/school-admin/dashboard" replace />;
  case 'instructor':
  case 'teacher':
    return <Navigate to="/teacher/dashboard" replace />;
  case 'student':
    return <Navigate to="/student/dashboard" replace />;
  default:
    return <Navigate to="/login" replace />;
}
```

#### 3.2 Create School Admin Routes
In `frontend/src/routes/AppRoutes.jsx`:

```javascript
// Add school admin routes
<Route path="/school-admin/dashboard" element={
  <PrivateRoute allowedRoles={['admin', 'school_admin']}>
    <SchoolAdminDashboard />
  </PrivateRoute>
} />

<Route path="/school-admin/forms" element={
  <PrivateRoute allowedRoles={['admin', 'school_admin']}>
    <FormManagement />
  </PrivateRoute>
} />

<Route path="/school-admin/classes" element={
  <PrivateRoute allowedRoles={['admin', 'school_admin']}>
    <ClassManagement />
  </PrivateRoute>
} />

// ... more routes
```

---

### Step 4: Create School Admin Dashboard

#### 4.1 Create SchoolAdminDashboard Component
Create `frontend/src/components/SchoolAdmin/SchoolAdminDashboard.jsx`:

```javascript
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Nav, Spinner } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContextSupabase';
import supabaseService from '../../services/supabaseService';
import InstitutionScopedFormManagement from './InstitutionScopedFormManagement';
import InstitutionScopedClassManagement from './InstitutionScopedClassManagement';
// ... other imports

function SchoolAdminDashboard() {
  const { user } = useAuth();
  const [institution, setInstitution] = useState(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalInstructors: 0,
    totalClasses: 0,
    totalForms: 0
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && user.institution_id) {
      loadInstitutionData();
      loadInstitutionStats();
    }
  }, [user]);

  const loadInstitutionData = async () => {
    try {
      const institutionData = await supabaseService.getInstitutionById(user.institution_id);
      setInstitution(institutionData);
    } catch (error) {
      console.error('Error loading institution:', error);
    }
  };

  const loadInstitutionStats = async () => {
    try {
      setIsLoading(true);
      
      // Get stats scoped to this institution
      const [students, instructors, classes, forms] = await Promise.all([
        supabaseService.getUsersByInstitution(user.institution_id, 'STUDENT'),
        supabaseService.getUsersByInstitution(user.institution_id, 'INSTRUCTOR'),
        supabaseService.getClassesByInstitution(user.institution_id),
        supabaseService.getFormsByInstitution(user.institution_id)
      ]);

      setStats({
        totalStudents: students?.length || 0,
        totalInstructors: instructors?.length || 0,
        totalClasses: classes?.length || 0,
        totalForms: forms?.length || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <div className="school-admin-dashboard">
      <Container className="mt-4">
        <h2>School Admin Dashboard</h2>
        <p className="text-muted">
          Managing: <strong>{institution?.name || 'Your Institution'}</strong>
        </p>

        <Nav variant="tabs" className="mb-4">
          <Nav.Item>
            <Nav.Link eventKey="overview" onClick={() => setActiveTab('overview')}>
              Overview
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="forms" onClick={() => setActiveTab('forms')}>
              Forms
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="classes" onClick={() => setActiveTab('classes')}>
              Classes
            </Nav.Link>
          </Nav.Item>
          {/* ... more tabs */}
        </Nav>

        {/* Tab content */}
        {activeTab === 'overview' && (
          <Row className="g-4">
            <Col md={3}>
              <Card>
                <Card.Body>
                  <h5>Students</h5>
                  <h2>{stats.totalStudents}</h2>
                </Card.Body>
              </Card>
            </Col>
            {/* ... more stat cards */}
          </Row>
        )}

        {activeTab === 'forms' && (
          <InstitutionScopedFormManagement institutionId={user.institution_id} />
        )}

        {/* ... more tab content */}
      </Container>
    </div>
  );
}

export default SchoolAdminDashboard;
```

---

### Step 5: Create Institution-Scoped Management Components

#### 5.1 Institution-Scoped Form Management
Create components that automatically filter by institution:

```javascript
// InstitutionScopedFormManagement.jsx
function InstitutionScopedFormManagement({ institutionId }) {
  const [forms, setForms] = useState([]);

  useEffect(() => {
    loadForms();
  }, [institutionId]);

  const loadForms = async () => {
    // Only load forms for this institution
    const institutionForms = await supabaseService.getFormsByInstitution(institutionId);
    setForms(institutionForms);
  };

  const createForm = async (formData) => {
    // Automatically set institution_id
    await supabaseService.createForm({
      ...formData,
      school_id: institutionId // Use institution_id
    });
    loadForms();
  };

  // ... rest of component
}
```

---

### Step 6: Update Existing Admin Components

#### 6.1 Add Institution Filtering to Admin Components
Modify existing admin components to respect institution scope:

```javascript
// In FormManagement.jsx, ClassManagement.jsx, etc.
function FormManagement() {
  const { user } = useAuth();
  const [forms, setForms] = useState([]);

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    let formsData;
    
    // If user is SCHOOL_ADMIN, filter by institution
    if (user.role === 'SCHOOL_ADMIN' && user.institution_id) {
      formsData = await supabaseService.getFormsByInstitution(user.institution_id);
    } else if (user.role === 'ADMIN') {
      // Super Admin sees all forms
      formsData = await supabaseService.getAllForms();
    }
    
    setForms(formsData || []);
  };

  // ... rest of component
}
```

---

### Step 7: Update Navigation

#### 7.1 Update Navbar
In `frontend/src/components/common/Navbar.jsx`:

```javascript
// Add school admin navigation
{user.role?.toLowerCase() === 'school_admin' && (
  <>
    <Nav.Link as={Link} to="/school-admin/dashboard">
      Dashboard
    </Nav.Link>
    <NavDropdown title="Management" id="school-admin-nav-dropdown">
      <NavDropdown.Item as={Link} to="/school-admin/forms">Forms</NavDropdown.Item>
      <NavDropdown.Item as={Link} to="/school-admin/classes">Classes</NavDropdown.Item>
      <NavDropdown.Item as={Link} to="/school-admin/subjects">Subjects</NavDropdown.Item>
      <NavDropdown.Item as={Link} to="/school-admin/students">Students</NavDropdown.Item>
      <NavDropdown.Item as={Link} to="/school-admin/instructors">Instructors</NavDropdown.Item>
    </NavDropdown>
  </>
)}
```

---

### Step 8: Database Row-Level Security (RLS) Policies

#### 8.1 Update Supabase RLS Policies
Create policies that scope data access by institution:

```sql
-- Policy: School Admins can only see their institution's data
CREATE POLICY "School admins see own institution"
ON forms FOR SELECT
USING (
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'ADMIN'
    ) THEN true
    WHEN EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'SCHOOL_ADMIN' 
      AND institution_id = forms.school_id
    ) THEN true
    ELSE false
  END
);

-- Similar policies for classes, subjects, students, etc.
```

---

### Step 9: Super Admin: Assign School Admins

#### 9.1 Create School Admin Assignment Interface
In `frontend/src/components/Admin/UserManagement.jsx` or create a new component:

```javascript
function AssignSchoolAdmin() {
  const [users, setUsers] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedInstitution, setSelectedInstitution] = useState(null);

  const assignSchoolAdmin = async () => {
    if (!selectedUser || !selectedInstitution) return;
    
    // Update user role and institution
    await supabaseService.updateUser(selectedUser.id, {
      role: 'SCHOOL_ADMIN',
      institution_id: selectedInstitution
    });
    
    alert('School Admin assigned successfully!');
  };

  return (
    <Card>
      <Card.Header>
        <h5>Assign School Admin</h5>
      </Card.Header>
      <Card.Body>
        <Form.Select 
          value={selectedUser} 
          onChange={(e) => setSelectedUser(e.target.value)}
        >
          <option>Select User</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.email})
            </option>
          ))}
        </Form.Select>
        
        <Form.Select 
          className="mt-3"
          value={selectedInstitution} 
          onChange={(e) => setSelectedInstitution(e.target.value)}
        >
          <option>Select Institution</option>
          {institutions.map(inst => (
            <option key={inst.institution_id} value={inst.institution_id}>
              {inst.name}
            </option>
          ))}
        </Form.Select>
        
        <Button 
          className="mt-3" 
          onClick={assignSchoolAdmin}
          disabled={!selectedUser || !selectedInstitution}
        >
          Assign as School Admin
        </Button>
      </Card.Body>
    </Card>
  );
}
```

---

## 🔐 Permission Matrix

| Feature | Super Admin (ADMIN) | School Admin (SCHOOL_ADMIN) | Instructor | Student |
|---------|---------------------|----------------------------|------------|---------|
| **Create Institutions** | ✅ | ❌ | ❌ | ❌ |
| **Assign School Admins** | ✅ | ❌ | ❌ | ❌ |
| **Manage Forms** | ✅ (All) | ✅ (Own Institution) | ❌ | ❌ |
| **Manage Classes** | ✅ (All) | ✅ (Own Institution) | ✅ (Assigned) | ❌ |
| **Manage Subjects** | ✅ (All) | ✅ (Own Institution) | ✅ (Assigned) | ❌ |
| **Manage Students** | ✅ (All) | ✅ (Own Institution) | ✅ (Assigned Classes) | ❌ |
| **Manage Instructors** | ✅ (All) | ✅ (Own Institution) | ❌ | ❌ |
| **View Reports** | ✅ (All) | ✅ (Own Institution) | ✅ (Assigned Classes) | ✅ (Own) |
| **Create Lessons** | ✅ | ✅ | ✅ (Assigned) | ❌ |
| **Mark Attendance** | ✅ | ✅ | ✅ (Assigned) | ❌ |
| **Enter Grades** | ✅ | ✅ | ✅ (Assigned) | ❌ |

---

## 📝 Key Implementation Points

### 1. **Institution Scoping**
- All queries must filter by `institution_id` for SCHOOL_ADMIN
- Use helper functions to get user's accessible institutions
- Always validate institution access before operations

### 2. **Role Checks**
```javascript
// Helper function
const isSuperAdmin = (user) => user?.role === 'ADMIN';
const isSchoolAdmin = (user) => user?.role === 'SCHOOL_ADMIN';
const isAdmin = (user) => isSuperAdmin(user) || isSchoolAdmin(user);

// Usage
if (isAdmin(user)) {
  // Show admin features
  if (isSuperAdmin(user)) {
    // Show super admin only features (institution management)
  }
}
```

### 3. **Data Filtering Pattern**
```javascript
// Pattern for all data fetching
const loadData = async () => {
  let data;
  
  if (user.role === 'ADMIN') {
    // Super Admin: Get all data
    data = await supabaseService.getAllData();
  } else if (user.role === 'SCHOOL_ADMIN') {
    // School Admin: Get institution-scoped data
    data = await supabaseService.getDataByInstitution(user.institution_id);
  } else {
    // Other roles: Get role-specific data
    data = await supabaseService.getDataForUser(user.id);
  }
  
  setData(data);
};
```

### 4. **UI Differences**
- Super Admin sees "All Institutions" dropdown
- School Admin sees their institution name (read-only)
- School Admin cannot access institution management
- School Admin cannot assign other admins

---

## 🚀 Migration Steps

1. **Add SCHOOL_ADMIN to role validation** in AuthContext
2. **Update database** to ensure `institution_id` is set for all users
3. **Create SchoolAdminDashboard** component
4. **Update existing admin components** to support institution scoping
5. **Add RLS policies** in Supabase
6. **Update routes** to include school admin paths
7. **Test with a test school admin user**
8. **Update documentation** and user guides

---

## 🧪 Testing Checklist

- [ ] School Admin can only see their institution's data
- [ ] School Admin cannot create/manage institutions
- [ ] School Admin cannot assign other school admins
- [ ] School Admin can manage all features within their institution
- [ ] Super Admin can assign school admins
- [ ] Super Admin can see all institutions
- [ ] RLS policies prevent cross-institution data access
- [ ] Navigation shows correct options for each role
- [ ] Dashboard shows institution-specific stats

---

## 📚 Additional Considerations

### Multi-Institution School Admins
If a school admin needs to manage multiple institutions, use the `school_admin_institutions` junction table and update queries to check membership in that table.

### Audit Logging
Track which admin (super or school) performed actions for audit purposes.

### Institution Switching
If a school admin manages multiple institutions, add an institution switcher in the UI.

---

This implementation provides a complete school admin system with proper scoping, security, and user experience.

