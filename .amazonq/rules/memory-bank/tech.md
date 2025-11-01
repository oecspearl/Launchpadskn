# Technology Stack and Dependencies

## Programming Languages and Versions

### Backend
- **Java**: Version 21 (OpenJDK)
- **Spring Boot**: Version 3.5.6 (Latest stable)
- **Spring Cloud**: Version 2025.0.0

### Frontend
- **JavaScript**: ES6+ with React
- **Node.js**: For package management and build tools
- **CSS**: Modern CSS3 with Bootstrap integration

## Backend Technology Stack

### Core Framework
- **Spring Boot**: Main application framework
- **Spring Cloud**: Microservice infrastructure
- **Spring Security**: Authentication and authorization
- **Spring Data JPA**: Data persistence layer
- **Spring Web**: REST API development

### Microservice Components
- **Spring Cloud Config**: Centralized configuration management
- **Spring Cloud Netflix Eureka**: Service discovery and registration
- **Spring Cloud Gateway**: API gateway and routing
- **Spring Boot Actuator**: Health checks and monitoring

### Database and Persistence
- **PostgreSQL**: Primary database system
- **Hibernate**: ORM framework (via Spring Data JPA)
- **HikariCP**: Connection pooling (default with Spring Boot)

### Security and Authentication
- **JWT (JSON Web Tokens)**: Stateless authentication
- **BCrypt**: Password hashing
- **Spring Security**: Security framework
- **JJWT**: JWT library (version 0.11.5)

### Development and Documentation
- **Lombok**: Code generation and boilerplate reduction
- **SpringDoc OpenAPI**: API documentation (Swagger)
- **Spring Boot DevTools**: Development productivity tools

### Testing Framework
- **JUnit 5**: Unit testing framework
- **Spring Boot Test**: Integration testing
- **Mockito**: Mocking framework (included with Spring Boot Test)

## Frontend Technology Stack

### Core Framework
- **React**: Version 18+ (Single Page Application)
- **React Router**: Client-side routing
- **React Bootstrap**: UI component library

### State Management and Context
- **React Context API**: Global state management
- **React Hooks**: State and lifecycle management

### HTTP Client and API Integration
- **Axios**: HTTP client for API requests
- **REST API**: Communication with backend services

### UI and Styling
- **Bootstrap**: CSS framework
- **React Bootstrap**: Bootstrap components for React
- **React Icons**: Icon library
- **Custom CSS**: Component-specific styling

### Development Tools
- **Create React App**: Project scaffolding and build tools
- **npm**: Package management
- **ESLint**: Code linting (configured with Create React App)

## Build Systems and Dependencies

### Backend Build System
```xml
<!-- Maven Configuration -->
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.5.6</version>
</parent>

<!-- Key Dependencies -->
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
    </dependency>
</dependencies>
```

### Frontend Build System
```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "react-router-dom": "^6.x",
    "react-bootstrap": "^2.x",
    "bootstrap": "^5.x",
    "axios": "^1.x",
    "react-icons": "^4.x"
  }
}
```

## Development Commands

### Backend Services
```bash
# Start individual services
./mvnw spring-boot:run                    # For any Spring Boot service
mvn spring-boot:run                       # Alternative Maven command

# Build services
./mvnw clean package                      # Build JAR file
./mvnw clean install                      # Install to local repository

# Run tests
./mvnw test                              # Run unit tests
./mvnw verify                            # Run integration tests
```

### Frontend Application
```bash
# Development
npm start                                # Start development server (port 3000)
npm run build                           # Build for production
npm test                                # Run test suite
npm run eject                           # Eject from Create React App

# Package management
npm install                             # Install dependencies
npm install <package>                   # Add new dependency
npm update                              # Update dependencies
```

### Service Startup Sequence
```bash
# Required startup order for microservices
1. ./mvnw spring-boot:run               # config-server (port 8888)
2. ./mvnw spring-boot:run               # discovery (port 8761)
3. ./mvnw spring-boot:run               # gateway (port 8080)
4. ./mvnw spring-boot:run               # user-service (port 8090)
5. ./mvnw spring-boot:run               # institution-service (port 8091)
6. npm start                            # frontend (port 3000)
```

## Database Configuration

### PostgreSQL Setup
```yaml
# Application configuration
spring:
  datasource:
    driver-class-name: org.postgresql.Driver
    url: jdbc:postgresql://localhost:5432/database_name
    username: postgres
    password: password
  jpa:
    hibernate:
      ddl-auto: update
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
```

### Database Per Service
- **scholarspace_users**: User service database
- **scholarspace_institutions**: Institution service database
- **scholarspace_courses**: Course service database (future)

## API Documentation

### Swagger/OpenAPI Integration
- **SpringDoc OpenAPI**: Automatic API documentation generation
- **Swagger UI**: Interactive API documentation interface
- **Access URLs**:
  - User Service: `http://localhost:8090/swagger-ui.html`
  - Institution Service: `http://localhost:8091/swagger-ui.html`

## Monitoring and Health Checks

### Spring Boot Actuator Endpoints
- `/actuator/health`: Service health status
- `/actuator/info`: Service information
- `/actuator/metrics`: Application metrics
- `/actuator/env`: Environment properties

### Service Discovery
- **Eureka Dashboard**: `http://localhost:8761`
- **Service Registration**: Automatic service discovery and registration
- **Load Balancing**: Client-side load balancing with Ribbon (deprecated, using Spring Cloud LoadBalancer)