# Development Guidelines and Standards

## Code Quality Standards

### Frontend React Components
- **Functional Components**: Use React functional components with hooks exclusively (100% of analyzed components)
- **State Management**: Utilize `useState` and `useEffect` hooks for local state and side effects
- **Component Structure**: Follow consistent component organization:
  ```javascript
  // 1. Imports (React, libraries, local components)
  // 2. Component function declaration
  // 3. State declarations
  // 4. Effect hooks
  // 5. Event handlers
  // 6. Render logic with early returns for loading/error states
  // 7. Export statement
  ```

### Backend Java Services
- **Service Layer Pattern**: All business logic encapsulated in `@Service` annotated classes
- **Constructor Injection**: Use constructor-based dependency injection consistently
- **Exception Handling**: Implement comprehensive try-catch blocks with detailed error messages
- **Method Documentation**: Include JavaDoc comments for public methods explaining parameters and return values

### Naming Conventions
- **Frontend**: camelCase for variables, PascalCase for components
- **Backend**: camelCase for methods/variables, PascalCase for classes
- **Database**: snake_case for table/column names
- **API Endpoints**: kebab-case for URL paths

## Architectural Patterns

### Component Organization
- **Role-Based Structure**: Components organized by user roles (Admin/, Student/, Instructor/, common/)
- **Feature Separation**: Each component handles a single responsibility
- **Reusable Components**: Common components (FileManagement, NotificationToast) shared across roles

### State Management Patterns
- **Local State**: Use `useState` for component-specific data
- **Context API**: Implement React Context for global state (AuthContext, NotificationContext)
- **Prop Drilling Avoidance**: Pass data through context rather than deep prop chains

### API Integration Patterns
- **Service Layer**: Dedicated service files for API calls (adminService.js, studentService.js)
- **Error Handling**: Consistent error handling with user-friendly messages
- **Loading States**: Implement loading spinners and error boundaries
- **Authentication**: JWT token-based authentication with automatic header injection

## Security Implementation

### Authentication & Authorization
- **JWT Tokens**: Stateless authentication using JSON Web Tokens
- **Role-Based Access Control**: Granular permissions based on user roles (ADMIN, INSTRUCTOR, STUDENT)
- **Route Protection**: Private routes with authentication checks
- **CORS Configuration**: Proper cross-origin resource sharing setup

### Input Validation
- **Frontend Validation**: Client-side form validation with real-time feedback
- **Backend Validation**: Server-side validation using Spring Boot validation annotations
- **File Upload Security**: Filename sanitization and file type validation
- **SQL Injection Prevention**: Use JPA repositories with parameterized queries

## Error Handling Standards

### Frontend Error Handling
```javascript
// Consistent error handling pattern
try {
  const response = await apiCall();
  // Handle success
} catch (err) {
  console.error("Error description:", err);
  setError(err.response?.data?.error || 'Default error message');
}
```

### Backend Error Handling
```java
// Service layer error handling
try {
  // Business logic
  return result;
} catch (Exception e) {
  throw new RuntimeException("Descriptive error message: " + e.getMessage());
}
```

### User Experience
- **Loading States**: Show spinners during async operations
- **Error Messages**: Display user-friendly error messages
- **Success Feedback**: Provide confirmation for successful operations
- **Graceful Degradation**: Handle network failures gracefully

## File and Resource Management

### File Upload Patterns
- **Unique Filenames**: Generate UUID-based filenames to prevent conflicts
- **Path Validation**: Sanitize file paths to prevent directory traversal
- **Metadata Storage**: Store file metadata in database with filesystem references
- **File Type Categorization**: Organize files by type (ASSIGNMENT, COURSE_MATERIAL, etc.)

### Resource Organization
- **Static Assets**: Store in public/ directory for frontend
- **Upload Directory**: Centralized file storage location (C:\ScholarSpace\uploads\)
- **Database References**: Store file paths and metadata in database entities

## API Design Patterns

### RESTful Conventions
- **HTTP Methods**: Use appropriate HTTP verbs (GET, POST, PUT, DELETE)
- **Status Codes**: Return meaningful HTTP status codes
- **Response Format**: Consistent JSON response structure
- **Error Responses**: Standardized error response format

### Endpoint Structure
```
/api/{resource}           # Collection operations
/api/{resource}/{id}      # Individual resource operations
/api/{resource}/{id}/{action} # Resource actions
```

### Request/Response Patterns
- **Request Bodies**: Use JSON for complex data
- **Query Parameters**: Use for filtering and pagination
- **Headers**: Include authentication and content-type headers
- **Response Metadata**: Include relevant metadata in responses

## Database Design Patterns

### Entity Relationships
- **JPA Annotations**: Use appropriate JPA annotations (@Entity, @Table, @Column)
- **Foreign Keys**: Proper foreign key relationships with @JoinColumn
- **Cascade Operations**: Configure cascade types appropriately
- **Lazy Loading**: Use lazy loading for performance optimization

### Repository Pattern
- **Interface Extension**: Extend JpaRepository for basic CRUD operations
- **Custom Queries**: Use @Query annotation for complex queries
- **Method Naming**: Follow Spring Data JPA naming conventions
- **Transaction Management**: Use @Transactional for multi-step operations

## Testing and Quality Assurance

### Code Organization
- **Separation of Concerns**: Clear separation between controllers, services, and repositories
- **Single Responsibility**: Each class/component has a single, well-defined purpose
- **Dependency Injection**: Loose coupling through dependency injection

### Performance Considerations
- **Lazy Loading**: Implement lazy loading for large datasets
- **Caching**: Use appropriate caching strategies
- **Database Optimization**: Optimize queries and use proper indexing
- **Bundle Optimization**: Minimize frontend bundle size

## Development Workflow

### Code Structure
- **Consistent Formatting**: Use consistent indentation and formatting
- **Import Organization**: Group imports logically (React, libraries, local)
- **Component Lifecycle**: Follow React component lifecycle best practices
- **Error Boundaries**: Implement error boundaries for robust error handling

### Documentation Standards
- **Code Comments**: Include meaningful comments for complex logic
- **API Documentation**: Use Swagger/OpenAPI for API documentation
- **README Files**: Maintain comprehensive README files
- **Change Logs**: Document significant changes and updates