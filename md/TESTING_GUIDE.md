# Microservice Testing Guide

## Service Startup Order

Start services in this exact order:

```bash
# 1. Config Server (Port 8888)
cd config-server
./mvnw spring-boot:run

# 2. Discovery Server (Port 8761) 
cd discovery
./mvnw spring-boot:run

# 3. API Gateway (Port 8080)
cd gateway
./mvnw spring-boot:run

# 4. User Service (Port 8090)
cd user-service
./mvnw spring-boot:run

# 5. Institution Service (Port 8091)
cd institution-service
./mvnw spring-boot:run

# 6. Course Service (Port 8092)
cd course-service
./mvnw spring-boot:run

# 7. Frontend (Port 3000)
cd frontend
npm start
```

## Testing Endpoints

### 1. Test Service Discovery
- Visit: http://localhost:8761
- Verify all services are registered

### 2. Test Authentication Flow
```bash
# Login via Gateway
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@scholarspace.com", "password": "admin123"}'
```

### 3. Test Dashboard (Fixed Issue)
```bash
# Get dashboard stats via Gateway (should work now)
curl -X GET http://localhost:8080/api/dashboard/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Test Course Management
```bash
# Get all courses via Gateway
curl -X GET http://localhost:8080/api/courses \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. Test Enrollment Management
```bash
# Get pending enrollments via Gateway (should work now)
curl -X GET http://localhost:8080/api/enrollments/pending \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Frontend Testing

### Current Status
- ✅ Login should work (user-service via gateway)
- ✅ Dashboard should work (course-service via gateway)
- ✅ Course management should work (course-service via gateway)
- ✅ Institution management should work (institution-service via gateway)

### Expected Behavior
1. **Login Page**: Should authenticate successfully
2. **Admin Dashboard**: Should load stats without CORS errors
3. **Course Management**: Should display courses
4. **User Management**: Should display users
5. **Institution Management**: Should display institutions

## Troubleshooting

### If CORS Errors Persist:
1. Check all services are running
2. Verify JWT tokens are being passed correctly
3. Check gateway routing configuration
4. Ensure services are registered in Eureka

### If Services Don't Start:
1. Check database connections (PostgreSQL)
2. Verify port availability
3. Check service dependencies (config-server → discovery → others)

### If Frontend Still Has Issues:
1. Clear browser cache
2. Check browser developer tools for specific errors
3. Verify API calls are going to localhost:8080 (gateway)

## Database Setup Reminder

Ensure these databases exist in PostgreSQL:
- `scholarspace_users` (user-service)
- `scholarspace_institutions` (institution-service)  
- `scholarspace_courses` (course-service)

## Success Indicators

✅ **All services show as UP in Eureka dashboard**
✅ **Frontend loads without CORS errors**
✅ **Login works and returns JWT token**
✅ **Dashboard displays statistics**
✅ **Course management functions work**
✅ **No 404 errors on API calls**

## Next Steps After Testing

If everything works:
1. Gradually update frontend service files to use gateway endpoints
2. Phase out monolithic backend dependencies
3. Add more comprehensive error handling
4. Implement proper logging and monitoring