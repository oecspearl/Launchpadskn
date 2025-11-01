# LaunchPad SKN - Online Learning Management System

A comprehensive microservices-based Learning Management System (LMS) built with Spring Boot and React.

## 🚀 Quick Start

**For detailed setup instructions, see [START_HERE.md](START_HERE.md)**

### Prerequisites
- Java JDK 17+
- Node.js 14+
- PostgreSQL
- Maven (or use included Maven Wrapper)

### Quick Setup

1. **Setup Databases:**
   
   **Option A: Local PostgreSQL**
   ```sql
   CREATE DATABASE scholarspace_users;
   CREATE DATABASE scholarspace_institutions;
   CREATE DATABASE scholarspace_courses;
   ```
   Or run: `psql -U postgres -f setup-databases.sql`
   
   **Option B: Supabase (Cloud PostgreSQL)** ⭐ Recommended for Cloud Setup
   - See [SUPABASE_QUICK_START.md](SUPABASE_QUICK_START.md) for quick setup
   - Or [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for detailed guide

2. **Check Prerequisites:**
   ```powershell
   .\check-prerequisites.bat
   ```

3. **Start All Services:**
   ```powershell
   .\start-all-services.bat
   ```

4. **Start Frontend:**
   ```powershell
   cd frontend
   npm install
   npm start
   ```

5. **Verify Services:**
   ```powershell
   .\verify-services.bat
   ```

## 📋 Architecture

### Microservices
- **Config Server** (8888) - Centralized configuration
- **Discovery Server** (8761) - Eureka service registry
- **API Gateway** (8080) - Single entry point
- **User Service** (8090) - Authentication & user management
- **Institution Service** (8091) - Institutions & departments
- **Course Service** (8092) - Courses, enrollments, assignments

### Frontend
- **React App** (3000) - Single Page Application

### Databases
- `scholarspace_users` - User accounts and authentication
- `scholarspace_institutions` - Institutions and departments
- `scholarspace_courses` - Courses, enrollments, and assignments

## 🎯 Features

### For Administrators
- Institution and Department Management
- Course Creation and Management
- Instructor Assignment
- Student Enrollment Approval
- System Analytics and Reporting
- User Management

### For Instructors
- Course Management
- Material Upload
- Assignment Creation and Grading
- Student Progress Tracking

### For Students
- Course Registration
- Material Access
- Assignment Submission
- Grade Viewing

## 📚 Documentation

- [START_HERE.md](START_HERE.md) - Complete setup guide
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - Testing procedures
- [SYSTEM_ARCHITECTURE_FIX.md](SYSTEM_ARCHITECTURE_FIX.md) - Architecture details
- [IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md) - Implementation status

## 🔧 Configuration

### Database Configuration

**Local PostgreSQL:**
Update database credentials in:
- `user-service/src/main/resources/application.yml`
- `institution-service/src/main/resources/application.yml`
- `course-service/src/main/resources/application.yml`

Default:
- Username: `postgres`
- Password: `Jayjay_1`

**Supabase (Cloud):**
- See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for complete setup instructions
- Quick start: [SUPABASE_QUICK_START.md](SUPABASE_QUICK_START.md)

### Frontend Configuration
API URL is configured in `frontend/src/services/api.js`:
- Gateway URL: `http://localhost:8080/api/`
- Proxy configured in `package.json`: `"proxy": "http://localhost:8080"`

## 🌐 Service URLs

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| API Gateway | 8080 | http://localhost:8080 |
| Discovery | 8761 | http://localhost:8761 |
| Config Server | 8888 | http://localhost:8888 |
| User Service | 8090 | http://localhost:8090 |
| Institution Service | 8091 | http://localhost:8091 |
| Course Service | 8092 | http://localhost:8092 |

## 🛠️ Development

### Starting Individual Services
```powershell
# Config Server
cd config-server
.\mvnw.cmd spring-boot:run

# Discovery Server
cd discovery
.\mvnw.cmd spring-boot:run

# API Gateway
cd gateway
.\mvnw.cmd spring-boot:run

# User Service
cd user-service
.\mvnw.cmd spring-boot:run

# Institution Service
cd institution-service
.\mvnw.cmd spring-boot:run

# Course Service
cd course-service
.\mvnw.cmd spring-boot:run

# Frontend
cd frontend
npm start
```

## 🧪 Testing

### Verify All Services
```powershell
.\verify-services.bat
```

### Check Eureka Dashboard
Visit: http://localhost:8761

All services should appear as registered and UP.

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

Please read the documentation files for more details on system architecture and implementation.

