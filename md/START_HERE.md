# LaunchPad SKN - Quick Start Guide for Localhost Preview

## Prerequisites

Before starting, ensure you have the following installed:

1. **Java JDK 17 or higher** (required for Spring Boot services)
   - Verify: `java -version`
2. **Node.js 14+ and npm** (required for React frontend)
   - Verify: `node -v` and `npm -v`
3. **PostgreSQL** (required for databases)
   - Verify: PostgreSQL is running and accessible
4. **Maven** (optional - services include Maven Wrapper)
   - Verify: `mvn -v` or use included `mvnw` scripts

## Database Setup

Create three PostgreSQL databases:

```sql
-- Connect to PostgreSQL as superuser (postgres)
CREATE DATABASE scholarspace_users;
CREATE DATABASE scholarspace_institutions;
CREATE DATABASE scholarspace_courses;
```

**Database Configuration:**
- Host: `localhost:5432`
- Username: `postgres`
- Password: `Jayjay_1` (as configured in application.yml files)

> **Note:** If you want to change the database password, update it in:
> - `user-service/src/main/resources/application.yml`
> - `institution-service/src/main/resources/application.yml`
> - `course-service/src/main/resources/application.yml`

## Quick Start (Windows)

### Step 1: Setup Environment (First Time Only)

1. **Setup environment and check prerequisites:**
   ```powershell
   .\setup-environment.bat
   ```
   This will:
   - Create required upload directories
   - Check and optionally install frontend dependencies
   - Remind you about database setup

2. **Check prerequisites:**
   ```powershell
   .\check-prerequisites.bat
   ```

### Step 2: Start Services

### Option 1: Use Startup Scripts (Recommended)

1. **Start all backend services:**
   ```powershell
   .\start-all-services.bat
   ```
   This will start all services in separate windows.

2. **Start frontend (in a new terminal):**
   ```powershell
   cd frontend
   npm install  # Only needed first time
   npm start
   ```

### Option 2: Manual Startup

Follow the service startup order below.

## Service Startup Order

Services must be started in this exact order:

### 1. Config Server (Port 8888)
```powershell
cd config-server
.\mvnw.cmd spring-boot:run
```
Wait until you see: `Started ConfigServerApplication`

### 2. Discovery Server (Port 8761)
```powershell
cd discovery
.\mvnw.cmd spring-boot:run
```
Wait until you see: `Started DiscoveryApplication`

### 3. API Gateway (Port 8080)
```powershell
cd gateway
.\mvnw.cmd spring-boot:run
```
Wait until you see: `Started GatewayApplication`

### 4. User Service (Port 8090)
```powershell
cd user-service
.\mvnw.cmd spring-boot:run
```
Wait until you see: `Started UserServiceApplication`

### 5. Institution Service (Port 8091)
```powershell
cd institution-service
.\mvnw.cmd spring-boot:run
```
Wait until you see: `Started InstitutionServiceApplication`

### 6. Course Service (Port 8092)
```powershell
cd course-service
.\mvnw.cmd spring-boot:run
```
Wait until you see: `Started CourseServiceApplication`

### 7. Frontend (Port 3000)
```powershell
cd frontend
npm install  # Only needed first time
npm start
```

## Verify Services Are Running

### Check Eureka Dashboard
Visit: http://localhost:8761

You should see all services registered:
- ✅ API-GATEWAY
- ✅ USER-SERVICE
- ✅ INSTITUTION-SERVICE
- ✅ COURSE-SERVICE

### Check Service Health Endpoints
- Config Server: http://localhost:8888/actuator/health
- Discovery: http://localhost:8761
- Gateway: http://localhost:8080/actuator/health
- User Service: http://localhost:8090/actuator/health
- Institution Service: http://localhost:8091/actuator/health
- Course Service: http://localhost:8092/actuator/health

### Test API Gateway
Visit: http://localhost:8080/api/auth/login

## Access the Application

1. **Frontend URL:** http://localhost:3000

2. **Default Test Accounts:**
   - You'll need to register a user first or create one via API
   - Admin account can be created via database or registration endpoint

3. **API Gateway URL:** http://localhost:8080
   - All API calls should go through the gateway

## Troubleshooting

### Services Won't Start

**Port Already in Use:**
- Check if ports 8080, 8090, 8091, 8092, 8761, 8888, 3000 are available
- Use `netstat -ano | findstr :PORT_NUMBER` to find processes using ports

**Database Connection Failed:**
- Verify PostgreSQL is running
- Check database credentials in `application.yml` files
- Ensure databases exist: `scholarspace_users`, `scholarspace_institutions`, `scholarspace_courses`

**Config Server Connection Failed:**
- Config server must start FIRST
- Other services will retry connection (check logs)

### Frontend Issues

**CORS Errors:**
- Ensure gateway is running on port 8080
- Frontend is configured to proxy to `http://localhost:8080`

**API Connection Errors:**
- Verify API Gateway is running
- Check browser console for specific error messages
- Ensure all backend services are registered in Eureka

### Service Discovery Issues

**Services Not Appearing in Eureka:**
- Wait 30-60 seconds for registration
- Check service logs for Eureka registration errors
- Verify Discovery Server is running on port 8761

## Service URLs Reference

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| Frontend | 3000 | http://localhost:3000 | React Application |
| API Gateway | 8080 | http://localhost:8080 | Entry point for all APIs |
| Config Server | 8888 | http://localhost:8888 | Configuration management |
| Discovery (Eureka) | 8761 | http://localhost:8761 | Service registry |
| User Service | 8090 | http://localhost:8090 | User & Auth management |
| Institution Service | 8091 | http://localhost:8091 | Institutions & Departments |
| Course Service | 8092 | http://localhost:8092 | Courses & Enrollments |

## Next Steps

Once all services are running:

1. **Register a User:**
   - Visit http://localhost:3000/register
   - Create an account (will default to STUDENT role)

2. **Create Admin Account:**
   - Either manually update database or use API
   - Or register and update role via database

3. **Explore Features:**
   - Admin Dashboard: Manage institutions, departments, courses, instructors
   - Instructor Dashboard: Manage courses, upload materials, grade assignments
   - Student Dashboard: Register for courses, view materials, submit assignments

## Stopping Services

1. Press `Ctrl+C` in each service terminal window
2. Or use the stop script: `.\stop-all-services.bat` (if created)

## Need Help?

- Check service logs for error messages
- Verify database connectivity and schema
- Ensure all ports are available
- Review `TESTING_GUIDE.md` for detailed testing procedures

