package com.scholarspace.courseservice.controllers;

import com.scholarspace.courseservice.models.Course;
import com.scholarspace.courseservice.repositories.CourseRepository;
import com.scholarspace.courseservice.services.CourseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
@Tag(name = "Course Management", description = "APIs for managing courses in the system. Administrators can create, update, and manage courses while instructors and students can view course information.")
public class CourseController {
    
    private final CourseRepository courseRepo;
    private final CourseService courseService;

    @GetMapping
    @Operation(
        summary = "Retrieve all courses",
        description = "Fetches a complete list of all courses in the system. Returns both active and inactive courses."
    )
    @ApiResponse(
        responseCode = "200", 
        description = "Successfully retrieved all courses",
        content = @Content(
            mediaType = "application/json",
            schema = @Schema(implementation = Course.class)
        )
    )
    public List<Course> getAllCourses() {
        return courseRepo.findAll();
    }

    @PostMapping
    @Operation(
        summary = "Create a new course",
        description = "Creates a new course in the system. Only administrators can create courses."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200", 
            description = "Course created successfully",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = Course.class)
            )
        ),
        @ApiResponse(
            responseCode = "400", 
            description = "Invalid input data",
            content = @Content(
                mediaType = "application/json",
                examples = @ExampleObject(
                    value = "{\"error\": \"Course code already exists\"}"
                )
            )
        ),
        @ApiResponse(
            responseCode = "403", 
            description = "Access denied - Admin role required"
        )
    })
    public ResponseEntity<?> createCourse(
        @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "Course details to create",
            content = @Content(
                mediaType = "application/json",
                examples = @ExampleObject(
                    value = "{\"code\": \"CS101\", \"title\": \"Introduction to Computer Science\", \"description\": \"Basic programming concepts\", \"creditHours\": 3, \"departmentId\": 1}"
                )
            )
        )
        @RequestBody Map<String, Object> courseData) {
        try {
            String code = (String) courseData.get("code");
            String title = (String) courseData.get("title");
            String description = (String) courseData.get("description");
            Object creditHoursObj = courseData.get("creditHours");
            Integer creditHours = creditHoursObj instanceof Integer ? (Integer) creditHoursObj : 
                                 creditHoursObj != null ? Integer.parseInt(creditHoursObj.toString()) : null;
            
            String semester = "";
            if (courseData.containsKey("semester") && courseData.get("semester") != null) {
                semester = courseData.get("semester").toString();
            }
            
            String academicYear = "";
            if (courseData.containsKey("academicYear") && courseData.get("academicYear") != null) {
                academicYear = courseData.get("academicYear").toString();
            }
            Long departmentId = ((Number) courseData.get("departmentId")).longValue();
            
            boolean isActive = true;
            if (courseData.containsKey("isActive") && courseData.get("isActive") != null) {
                Object activeObj = courseData.get("isActive");
                isActive = activeObj instanceof Boolean ? (Boolean) activeObj : 
                          Boolean.parseBoolean(activeObj.toString());
            }
            
            Course course = courseService.createCourse(
                code, title, description, creditHours, 
                semester, academicYear, departmentId
            );
            
            course.setActive(isActive);
            courseRepo.save(course);
            
            return ResponseEntity.ok(course);
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid number format: " + e.getMessage()));
        } catch (NullPointerException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing required field: " + e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/active")
    @Operation(
        summary = "Get active courses",
        description = "Retrieves all courses that are currently active in the system."
    )
    @ApiResponse(
        responseCode = "200", 
        description = "Active courses retrieved successfully"
    )
    public ResponseEntity<List<Course>> getActiveCourses() {
        List<Course> activeCourses = courseService.getActiveCourses();
        return ResponseEntity.ok(activeCourses);
    }

    @GetMapping("/{id}")
    @Operation(
        summary = "Get course by ID",
        description = "Retrieves a specific course by its unique identifier."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Course found"),
        @ApiResponse(responseCode = "404", description = "Course not found")
    })
    public ResponseEntity<?> getCourseById(
        @Parameter(description = "Course ID", example = "1")
        @PathVariable Long id) {
        Optional<Course> course = courseRepo.findById(id);
        return course.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/code/{code}")
    @Operation(
        summary = "Get course by code",
        description = "Retrieves a specific course by its unique course code."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Course found"),
        @ApiResponse(responseCode = "404", description = "Course not found")
    })
    public ResponseEntity<?> getCourseByCode(
        @Parameter(description = "Course code", example = "CS101")
        @PathVariable String code) {
        Optional<Course> course = courseService.getCourseByCode(code);
        return course.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/department/{departmentId}")
    @Operation(
        summary = "Get courses by department",
        description = "Retrieves all courses belonging to a specific department."
    )
    @ApiResponse(responseCode = "200", description = "Courses retrieved successfully")
    public ResponseEntity<List<Course>> getCoursesByDepartment(
        @Parameter(description = "Department ID", example = "1")
        @PathVariable Long departmentId) {
        return ResponseEntity.ok(courseService.getCoursesByDepartment(departmentId));
    }

    @PutMapping("/{id}")
    @Operation(
        summary = "Update course",
        description = "Updates an existing course. Only administrators can update courses."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Course updated successfully"),
        @ApiResponse(responseCode = "404", description = "Course not found"),
        @ApiResponse(responseCode = "400", description = "Invalid input data"),
        @ApiResponse(responseCode = "403", description = "Access denied - Admin role required")
    })
    public ResponseEntity<?> updateCourse(
        @Parameter(description = "Course ID", example = "1")
        @PathVariable Long id, 
        @RequestBody Map<String, Object> courseData) {
        try {
            Optional<Course> existingCourse = courseRepo.findById(id);

            if (existingCourse.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Course course = existingCourse.get();

            // Handle code update with duplicate check
            if (courseData.containsKey("code")) {
                String newCode = (String) courseData.get("code");
                if (newCode != null && !newCode.equals(course.getCode())) {
                    Optional<Course> existingByCode = courseRepo.findByCode(newCode);
                    if (existingByCode.isPresent() && !existingByCode.get().getId().equals(id)) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Course code already exists"));
                    }
                    course.setCode(newCode);
                }
            }
            
            if (courseData.containsKey("title")) {
                course.setTitle((String) courseData.get("title"));
            }
            
            if (courseData.containsKey("description")) {
                course.setDescription((String) courseData.get("description"));
            }
            
            if (courseData.containsKey("creditHours")) {
                Object creditHoursObj = courseData.get("creditHours");
                Integer creditHours = creditHoursObj instanceof Integer ? (Integer) creditHoursObj : 
                                     creditHoursObj != null ? Integer.parseInt(creditHoursObj.toString()) : null;
                course.setCreditHours(creditHours);
            }
            
            if (courseData.containsKey("semester")) {
                course.setSemester((String) courseData.get("semester"));
            }
            
            if (courseData.containsKey("academicYear")) {
                course.setAcademicYear((String) courseData.get("academicYear"));
            }
            
            if (courseData.containsKey("isActive")) {
                Object activeObj = courseData.get("isActive");
                boolean isActive = activeObj instanceof Boolean ? (Boolean) activeObj : 
                                  Boolean.parseBoolean(activeObj.toString());
                course.setActive(isActive);
            }
            
            if (courseData.containsKey("departmentId")) {
                Object deptIdObj = courseData.get("departmentId");
                Long departmentId = deptIdObj instanceof Long ? (Long) deptIdObj : 
                                   deptIdObj != null ? Long.parseLong(deptIdObj.toString()) : null;
                course.setDepartmentId(departmentId);
            }

            Course updatedCourse = courseRepo.save(course);
            return ResponseEntity.ok(updatedCourse);
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid number format: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Update failed: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}/activate")
    @Operation(
        summary = "Activate course",
        description = "Activates a course making it available for enrollment."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Course activated successfully"),
        @ApiResponse(responseCode = "404", description = "Course not found")
    })
    public ResponseEntity<?> activateCourse(
        @Parameter(description = "Course ID", example = "1")
        @PathVariable Long id) {
        Optional<Course> courseOpt = courseRepo.findById(id);
        if (courseOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        courseService.activateCourse(id);
        return ResponseEntity.ok(Map.of("message", "Course activated successfully"));
    }

    @PutMapping("/{id}/deactivate")
    @Operation(
        summary = "Deactivate course",
        description = "Deactivates a course making it unavailable for new enrollments."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Course deactivated successfully"),
        @ApiResponse(responseCode = "404", description = "Course not found")
    })
    public ResponseEntity<?> deactivateCourse(
        @Parameter(description = "Course ID", example = "1")
        @PathVariable Long id) {
        Optional<Course> courseOpt = courseRepo.findById(id);
        if (courseOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        courseService.deactivateCourse(id);
        return ResponseEntity.ok(Map.of("message", "Course deactivated successfully"));
    }

    @DeleteMapping("/{id}")
    @Operation(
        summary = "Delete course",
        description = "Permanently deletes a course from the system. This action cannot be undone."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Course deleted successfully"),
        @ApiResponse(responseCode = "404", description = "Course not found"),
        @ApiResponse(responseCode = "400", description = "Cannot delete course with existing enrollments")
    })
    public ResponseEntity<?> deleteCourse(
        @Parameter(description = "Course ID", example = "1")
        @PathVariable Long id) {
        try {
            if (courseRepo.findById(id).isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            courseService.deleteCourse(id);
            return ResponseEntity.ok(Map.of("message", "Course deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}