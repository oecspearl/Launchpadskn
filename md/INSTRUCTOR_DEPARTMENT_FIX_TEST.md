# Instructor-Department Assignment Fix Test

## Issue Fixed
The instructor-department assignment was not working properly due to missing `departmentId` handling in the UserController's `updateUser` method.

## Changes Made

### 1. Backend Fix (UserController.java)
- **File**: `user-service/src/main/java/com/scholarspace/userservice/controllers/UserController.java`
- **Issue**: The `updateUser` method was missing `departmentId` field handling
- **Fix**: Added department assignment logic with validation and utility methods

```java
// Utility method for parsing Long values
private Long parseLongFromObject(Object obj, String fieldName) {
    if (obj == null) return null;
    if (obj instanceof Number) {
        return ((Number) obj).longValue();
    }
    if (obj instanceof String && !((String) obj).isEmpty()) {
        try {
            return Long.parseLong((String) obj);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid " + fieldName + " format");
        }
    }
    return null;
}

// Department validation method
private boolean validateDepartmentExists(Long departmentId) {
    if (departmentId == null) return true;
    try {
        ResponseEntity<Object> response = restTemplate.getForEntity(
            "http://institution-service/api/departments/" + departmentId, Object.class);
        return response.getStatusCode().is2xxSuccessful();
    } catch (Exception e) {
        return false;
    }
}

// Refactored department assignment with validation
if (userDetails.containsKey("departmentId")) {
    try {
        Long departmentId = parseLongFromObject(userDetails.get("departmentId"), "departmentId");
        if (!validateDepartmentExists(departmentId)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Department not found"));
        }
        user.setDepartmentId(departmentId);
    } catch (IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
}
```

### 2. Frontend Fix (ManageInstructors.js)
- **File**: `frontend/src/components/Admin/ManageInstructors.js`
- **Issue**: `handleEditInstructor` was not properly retrieving `departmentId` from user object
- **Fix**: Updated to use `user.departmentId` as primary source

```javascript
// Get departmentId from user.departmentId (primary source) or fallback to instructor.department
const departmentId = user.departmentId || instructor.department?.departmentId || '';
```

## Testing Steps

### Prerequisites
1. Ensure all services are running:
   - Config Server (port 8888)
   - Discovery Server (port 8761)
   - Gateway (port 8080)
   - User Service (port 8090)
   - Institution Service (port 8091)
   - Frontend (port 3000)

2. Ensure you have:
   - At least one institution created
   - At least one department created under that institution
   - At least one instructor user created

### Test Scenario 1: Edit Existing Instructor Department Assignment

1. **Login as Admin**
   - Navigate to `http://localhost:3000`
   - Login with admin credentials

2. **Navigate to Manage Instructors**
   - Go to Admin Dashboard
   - Click on "Manage Instructors" tab

3. **Edit an Instructor**
   - Find an existing instructor in the list
   - Click the "Edit" button (pencil icon)
   - In the modal, change the "Department" dropdown to a different department
   - Click "Save Instructor"

4. **Verify the Fix**
   - The success message should appear: "Instructor updated successfully!"
   - The instructor list should refresh automatically
   - The instructor's department column should show the new department name
   - Refresh the page - the department assignment should persist

### Test Scenario 2: Create New Instructor with Department

1. **Add New Instructor**
   - Click "Add Instructor" button
   - Fill in:
     - First Name: "Test"
     - Last Name: "Instructor"
     - Email: "test.instructor@example.com"
     - Department: Select any available department
   - Click "Save Instructor"

2. **Verify Creation**
   - Success message should appear
   - New instructor should appear in the list with correct department
   - Department column should show the selected department name

### Test Scenario 3: Database Verification

1. **Check Database Directly**
   ```sql
   -- Connect to PostgreSQL database: scholarspace_users
   SELECT user_id, name, email, role, department_id 
   FROM users 
   WHERE role = 'INSTRUCTOR';
   ```

2. **Verify Data**
   - The `department_id` column should contain the correct department ID
   - It should match the department selected in the frontend

### Expected Results

✅ **Before Fix**: 
- Frontend showed department assignment in UI
- Backend didn't save departmentId to database
- Database department_id remained NULL or unchanged

✅ **After Fix**:
- Frontend correctly sends departmentId in update request
- Backend properly handles departmentId field and saves to database
- Database department_id column gets updated with correct value
- UI reflects the correct department assignment consistently

## Troubleshooting

### If the fix doesn't work:

1. **Check Backend Logs**
   ```bash
   # In user-service directory
   ./mvnw spring-boot:run
   # Look for any errors in the console
   ```

2. **Check Network Requests**
   - Open browser Developer Tools (F12)
   - Go to Network tab
   - Perform the instructor edit operation
   - Check the PUT request to `/api/users/{id}`
   - Verify `departmentId` is included in request body

3. **Check Database Connection**
   ```sql
   -- Verify the users table has department_id column
   \d users;
   ```

4. **Verify Services Communication**
   - Check Eureka dashboard: `http://localhost:8761`
   - Ensure all services are registered and UP

## Files Modified

1. `user-service/src/main/java/com/scholarspace/userservice/controllers/UserController.java`
2. `frontend/src/components/Admin/ManageInstructors.js`

## Root Cause Analysis

The issue was a **missing field handler** in the backend API. While the User entity had the `departmentId` field and the frontend was sending it correctly, the UserController's `updateUser` method was not processing this field from the request body, causing it to be ignored during updates.

## Code Quality Improvements

The fix also addresses several code quality issues:

1. **Department Validation**: Added validation to verify department exists before assignment
2. **Code Deduplication**: Extracted common Object-to-Long parsing logic into utility method
3. **Error Handling**: Improved error messages and validation
4. **Service Communication**: Added proper inter-service validation via RestTemplate

This is a common issue in REST APIs where new fields are added to entities but the corresponding controller methods are not updated to handle them.