# Quick Fix Guide - Course Service Issues

## Issues Fixed:
1. ✅ **Duplicate `spring:` key in application.yml** - YAML parsing error resolved
2. ✅ **Course-service Eureka registration** - Configuration corrected

## Startup Order (CRITICAL):

```bash
# 1. Config Server (Port 8888) - MUST BE FIRST
cd config-server
./mvnw spring-boot:run

# Wait for "Started ConfigServerApplication" message

# 2. Discovery Server (Port 8761) - MUST BE SECOND  
cd discovery
./mvnw spring-boot:run

# Wait for "Started DiscoveryApplication" message

# 3. API Gateway (Port 8080)
cd gateway
./mvnw spring-boot:run

# Wait for "Started GatewayApplication" message

# 4. User Service (Port 8090)
cd user-service
./mvnw spring-boot:run

# 5. Institution Service (Port 8091)
cd institution-service
./mvnw spring-boot:run

# 6. Course Service (Port 8092) - SHOULD WORK NOW
cd course-service
./mvnw spring-boot:run

# 7. Frontend (Port 3000)
cd frontend
npm start
```

## Verification Steps:

### 1. Check Eureka Dashboard
- Visit: http://localhost:8761
- **Expected**: All services (API-GATEWAY, USER-SERVICE, INSTITUTION-SERVICE, COURSE-SERVICE) should be listed

### 2. Test Course Service Direct
```bash
curl http://localhost:8092/actuator/health
# Expected: {"status":"UP"}
```

### 3. Test Gateway Routing
```bash
curl http://localhost:8080/api/courses
# Expected: Should route to course-service (may need auth)
```

### 4. Check Frontend
- Visit: http://localhost:3000
- Login with admin credentials
- **Expected**: No CORS errors in browser console

## If Course Service Still Fails:

### Check Database Connection:
1. Ensure PostgreSQL is running
2. Verify database `scholarspace_courses` exists
3. Check credentials in application.yml

### Check Port Conflicts:
```bash
netstat -an | findstr :8092
# Should be empty if port is available
```

### Check Logs:
Look for these success messages:
- ✅ "Started CourseServiceApplication"
- ✅ "DiscoveryClient_COURSE-SERVICE... - registration status: 204"
- ✅ "Tomcat started on port 8092"

## Expected Results After Fix:

1. **Course-service starts without YAML errors**
2. **Course-service registers with Eureka**
3. **Gateway can route to course-service**
4. **Frontend dashboard loads without CORS errors**
5. **All microservices visible in Eureka dashboard**

## Next Steps After Successful Startup:
1. Test login flow
2. Test dashboard stats
3. Test course management
4. Gradually update frontend service calls