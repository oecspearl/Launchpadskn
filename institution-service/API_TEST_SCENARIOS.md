# Institution Service API Test Scenarios

## Base URLs
- **Direct Service**: http://localhost:8091
- **Through Gateway**: http://localhost:8080
- **Swagger UI**: http://localhost:8091/swagger-ui.html

## Institution API Tests

### 1. Create Institution
```http
POST /api/institutions
Content-Type: application/json

{
  "name": "Harvard University",
  "location": "Cambridge, MA",
  "contact": "info@harvard.edu"
}
```
**Expected**: 200 OK with institution object

### 2. Get All Institutions
```http
GET /api/institutions
```
**Expected**: 200 OK with array of institutions

### 3. Get Institution by ID
```http
GET /api/institutions/1
```
**Expected**: 200 OK with institution object

### 4. Get Institution by Name
```http
GET /api/institutions/name/Harvard University
```
**Expected**: 200 OK with institution object

### 5. Update Institution
```http
PUT /api/institutions/1
Content-Type: application/json

{
  "name": "Harvard University Updated",
  "location": "Cambridge, Massachusetts",
  "contact": "contact@harvard.edu"
}
```
**Expected**: 200 OK with updated institution

### 6. Delete Institution
```http
DELETE /api/institutions/1
```
**Expected**: 200 OK with success message

## Department API Tests

### 1. Create Department
```http
POST /api/departments
Content-Type: application/json

{
  "name": "Computer Science",
  "code": "CS",
  "description": "Department of Computer Science",
  "institutionId": 1
}
```
**Expected**: 200 OK with department object

### 2. Get All Departments
```http
GET /api/departments
```
**Expected**: 200 OK with array of departments

### 3. Get Department by ID
```http
GET /api/departments/1
```
**Expected**: 200 OK with department object

### 4. Get Department by Code
```http
GET /api/departments/code/CS
```
**Expected**: 200 OK with department object

### 5. Get Departments by Institution
```http
GET /api/departments/institution/1
```
**Expected**: 200 OK with array of departments

### 6. Update Department
```http
PUT /api/departments/1
Content-Type: application/json

{
  "name": "Computer Science & Engineering",
  "description": "Department of Computer Science and Engineering"
}
```
**Expected**: 200 OK with updated department

### 7. Delete Department
```http
DELETE /api/departments/1
```
**Expected**: 200 OK with success message

## Error Test Scenarios

### 1. Create Institution with Duplicate Name
```http
POST /api/institutions
Content-Type: application/json

{
  "name": "Test University",
  "location": "Test Location",
  "contact": "test@test.edu"
}
```
**Expected**: 400 Bad Request with error message

### 2. Create Department with Duplicate Code
```http
POST /api/departments
Content-Type: application/json

{
  "name": "Mathematics",
  "code": "CS",
  "description": "Mathematics Department",
  "institutionId": 1
}
```
**Expected**: 400 Bad Request with error message

### 3. Create Department with Invalid Institution ID
```http
POST /api/departments
Content-Type: application/json

{
  "name": "Physics",
  "code": "PHY",
  "description": "Physics Department",
  "institutionId": 999
}
```
**Expected**: 400 Bad Request with "Institution not found" error

### 4. Get Non-existent Institution
```http
GET /api/institutions/999
```
**Expected**: 404 Not Found

### 5. Get Non-existent Department
```http
GET /api/departments/999
```
**Expected**: 404 Not Found

## Health Check Tests

### 1. Service Health
```http
GET /actuator/health
```
**Expected**: 200 OK with health status

### 2. Service Info
```http
GET /actuator/info
```
**Expected**: 200 OK with service information

## Gateway Routing Tests

### 1. Institution via Gateway
```http
GET http://localhost:8080/api/institutions
```
**Expected**: Same response as direct service call

### 2. Department via Gateway
```http
GET http://localhost:8080/api/departments
```
**Expected**: Same response as direct service call

## Test Data Setup

Run these in order to set up test data:

1. **Create Institution**:
```json
{
  "name": "MIT",
  "location": "Cambridge, MA",
  "contact": "info@mit.edu"
}
```

2. **Create Departments**:
```json
{
  "name": "Computer Science",
  "code": "CS",
  "description": "Computer Science Department",
  "institutionId": 1
}
```

```json
{
  "name": "Mathematics",
  "code": "MATH",
  "description": "Mathematics Department",
  "institutionId": 1
}
```

```json
{
  "name": "Physics",
  "code": "PHY",
  "description": "Physics Department",
  "institutionId": 1
}
```

## Expected Database State

After running tests, verify database contains:
- At least 1 institution (Test University from DataInitializer)
- At least 1 department (Computer Science from DataInitializer)
- Proper foreign key relationships between departments and institutions