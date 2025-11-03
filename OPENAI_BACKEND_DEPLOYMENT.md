# OpenAI Lesson Generation Backend Deployment Guide

## Overview

The OpenAI lesson generation feature has been moved to the backend for security. The API key is now stored securely on the server instead of in the frontend code.

## Architecture

- **Frontend**: Calls `/api/lessons/generate` endpoint
- **API Gateway**: Routes requests to course-service
- **Course Service**: Handles OpenAI API calls securely
- **OpenAI API**: Generates lesson plans based on curriculum

## Backend Components Added

### 1. DTOs (Data Transfer Objects)
- `LessonGenerationRequest.java` - Request payload
- `LessonGenerationResponse.java` - Response payload

### 2. Service Layer
- `OpenAIService.java` - Handles OpenAI API communication

### 3. Controller
- `LessonGenerationController.java` - REST endpoint at `/api/lessons/generate`

### 4. Configuration
- Added OpenAI settings to `application.yml`:
  ```yaml
  app:
    openai:
      api-key: ${OPENAI_API_KEY:fallback_key}
      api-url: https://api.openai.com/v1/chat/completions
      model: gpt-4o-mini
  ```

### 5. Security
- Endpoint protected: Requires `ROLE_INSTRUCTOR`, `ROLE_TEACHER`, or `ROLE_ADMIN`
- Added route in API Gateway for `/api/lessons/**`

## Deployment to Heroku

### Prerequisites
1. Heroku CLI installed
2. Heroku app created for course-service
3. OpenAI API key ready

### Steps

#### 1. Set Environment Variables on Heroku

```bash
heroku config:set OPENAI_API_KEY=your_openai_api_key_here -a your-course-service-app
```

#### 2. Update application.yml for Heroku

The application will automatically use the `OPENAI_API_KEY` environment variable if set.

#### 3. Deploy Course Service

```bash
cd course-service
git init  # if not already a git repo
heroku git:remote -a your-course-service-app
git add .
git commit -m "Add OpenAI lesson generation endpoint"
git push heroku main
```

#### 4. Update Gateway Configuration

If deploying gateway separately, ensure the route for `/api/lessons/**` is configured.

#### 5. Update Frontend Configuration

Set the API base URL for production:

```bash
# In frontend/.env or Heroku config vars
REACT_APP_API_BASE_URL=https://your-gateway-url.herokuapp.com
```

Or if calling course-service directly:
```bash
REACT_APP_API_BASE_URL=https://your-course-service.herokuapp.com
```

## Local Development

### 1. Set Environment Variable

```bash
# Windows PowerShell
$env:OPENAI_API_KEY="your_api_key_here"

# Linux/Mac
export OPENAI_API_KEY="your_api_key_here"
```

### 2. Run Course Service

```bash
cd course-service
mvn spring-boot:run
```

### 3. Run API Gateway (if using)

```bash
cd gateway
mvn spring-boot:run
```

### 4. Run Frontend

```bash
cd frontend
npm start
```

## API Endpoint

### POST `/api/lessons/generate`

**Request Body:**
```json
{
  "curriculumData": {
    "subject": {
      "subject_name": "Mathematics",
      "description": "..."
    },
    "form": {
      "form_name": "Form 1"
    },
    "curriculum_framework": "...",
    "learning_outcomes": "...",
    "curriculum_structure": { ... }
  },
  "topic": "Algebra Basics",
  "lessonDate": "2024-01-15",
  "duration": 45
}
```

**Response:**
```json
{
  "lessonTitle": "Introduction to Algebra",
  "topic": "Algebra Basics",
  "learningObjectives": "1. ...\n2. ...",
  "lessonPlan": "Detailed lesson plan..."
}
```

**Authentication:**
- Requires JWT token in Authorization header
- User must have role: `INSTRUCTOR`, `TEACHER`, or `ADMIN`

## Testing

### Using cURL

```bash
curl -X POST http://localhost:8080/api/lessons/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "curriculumData": {
      "subject": {"subject_name": "Mathematics"},
      "form": {"form_name": "Form 1"}
    },
    "topic": "Algebra",
    "lessonDate": "2024-01-15",
    "duration": 45
  }'
```

### Using Postman

1. Set method to POST
2. URL: `http://localhost:8080/api/lessons/generate`
3. Headers:
   - `Content-Type: application/json`
   - `Authorization: Bearer YOUR_JWT_TOKEN`
4. Body (raw JSON): Use the request body format above

## Troubleshooting

### Error: "Failed to generate lesson"
- Check OpenAI API key is set correctly
- Verify API key has sufficient credits
- Check backend logs for detailed error messages

### Error: "401 Unauthorized"
- Verify JWT token is valid
- Check user has required role (INSTRUCTOR, TEACHER, or ADMIN)
- Ensure token is in Authorization header with "Bearer " prefix

### Error: "503 Service Unavailable"
- Verify course-service is running
- Check API Gateway routing configuration
- Ensure Eureka service discovery is working (if using microservices)

## Security Notes

1. **API Key**: Never commit the OpenAI API key to version control
2. **Environment Variables**: Use Heroku config vars or `.env` files (not in git)
3. **Authentication**: All endpoints require valid JWT tokens
4. **Authorization**: Only instructors, teachers, and admins can generate lessons

## Cost Considerations

- OpenAI API charges per token used
- `gpt-4o-mini` is cost-effective for this use case
- Monitor usage via OpenAI dashboard
- Consider rate limiting for production use

