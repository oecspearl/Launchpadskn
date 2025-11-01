# Project Structure and Architecture

## Root Directory Organization

### Frontend Application
```
frontend/
├── public/           # Static assets and HTML template
├── src/
│   ├── components/   # React components organized by user role
│   │   ├── Admin/    # Administrator interface components
│   │   ├── Auth/     # Authentication and authorization components
│   │   ├── common/   # Shared/reusable components
│   │   ├── Instructor/ # Instructor interface components
│   │   └── Student/  # Student interface components
│   ├── contexts/     # React context providers
│   ├── services/     # API service layers
│   └── utils/        # Utility functions and helpers
```

### Backend Microservices Architecture

#### Monolithic Backend (Legacy)
```
backend/
├── src/main/java/com/scholarspace/admin/
│   ├── config/       # Configuration classes
│   ├── controllers/  # REST API endpoints
│   ├── models/       # JPA entity classes
│   ├── repositories/ # Data access layer
│   ├── security/     # Authentication and authorization
│   └── services/     # Business logic layer
```

#### Microservice Components

**Config Server**
```
config-server/
├── src/main/resources/
│   ├── config/       # Service-specific configurations
│   └── application.yml # Server configuration
```

**Service Discovery**
```
discovery/
├── src/main/java/    # Eureka server implementation
└── src/main/resources/application.yml # Discovery configuration
```

**API Gateway**
```
gateway/
├── src/main/java/    # Spring Cloud Gateway implementation
└── src/main/resources/application.yml # Routing configuration
```

**User Service**
```
user-service/
├── src/main/java/com/scholarspace/userservice/
│   ├── config/       # JWT, Security, Swagger configuration
│   ├── controllers/  # Auth and User management endpoints
│   ├── models/       # User, Role, PasswordResetToken entities
│   ├── repositories/ # User data access
│   ├── security/     # JWT filter, UserDetailsService
│   └── services/     # Authentication and user business logic
```

**Institution Service**
```
institution-service/
├── src/main/java/com/scholarspace/institutionservice/
│   ├── config/       # Data initialization, Swagger configuration
│   ├── controllers/  # Institution and Department endpoints
│   ├── models/       # Institution, Department entities
│   ├── repositories/ # Institution data access
│   └── services/     # Institution business logic
```


## Architectural Patterns

### Microservice Communication
- **Service Discovery**: Eureka-based service registration and discovery
- **API Gateway**: Single entry point with routing and load balancing
- **Configuration Management**: Centralized configuration server
- **Inter-service Communication**: REST APIs with service-to-service calls

### Data Architecture
- **Database per Service**: Each microservice has its own PostgreSQL database
- **Entity Relationships**: JPA-based entity modeling with proper foreign key constraints
- **Data Consistency**: Eventual consistency across services

### Security Architecture
- **JWT Authentication**: Token-based authentication managed by user-service
- **Role-Based Authorization**: ADMIN, INSTRUCTOR, STUDENT roles with specific permissions
- **Gateway Security**: Authentication and authorization at the gateway level
- **CORS Configuration**: Cross-origin resource sharing for frontend integration

## Component Relationships

### Service Dependencies
```
Frontend → API Gateway → Microservices
                ↓
        Service Discovery (Eureka)
                ↓
        Configuration Server
```

### Data Flow
1. **Authentication Flow**: Frontend → Gateway → User Service → JWT Token
2. **Institution Management**: Frontend → Gateway → Institution Service → Database
3. **Course Management**: Frontend → Gateway → Course Service → Database
4. **File Operations**: Frontend → Gateway → Backend/File Service → File System

### Database Schema Relationships
- **Users** (user-service database)
- **Institutions → Departments** (institution-service database)
- **Courses → Departments** (course-service database)
- **Enrollments → Users + Courses** (cross-service relationships)

## Configuration Management

### Environment-Specific Configurations
- **Development**: Local database connections, debug logging
- **Production**: Production database URLs, optimized logging
- **Service-Specific**: Each service has tailored configuration profiles

### Port Allocation
- **Frontend**: 3000
- **API Gateway**: 8080
- **Config Server**: 8888
- **Discovery Server**: 8761
- **User Service**: 8090
- **Institution Service**: 8091
- **Backend (Legacy)**: 9090

## Build and Deployment Structure

### Maven Multi-Module Project
- Each microservice is an independent Maven project
- Shared dependencies managed through parent POM configurations
- Individual service deployment capabilities

### Docker Containerization (Future)
- Each service designed for containerization
- Database containers for development environments
- Orchestration-ready architecture