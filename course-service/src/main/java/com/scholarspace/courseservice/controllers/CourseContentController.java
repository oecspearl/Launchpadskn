package com.scholarspace.courseservice.controllers;

import com.scholarspace.courseservice.models.CourseContent;
import com.scholarspace.courseservice.models.ContentType;
import com.scholarspace.courseservice.services.CourseContentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/course-contents")
@RequiredArgsConstructor
@Tag(name = "Course Content Management", description = "APIs for managing course content including assignments, lectures, and resources. Instructors can create and manage content while students can view it.")
public class CourseContentController {

    private final CourseContentService courseContentService;

    @PostMapping
    @Operation(
        summary = "Create course content",
        description = "Creates new course content such as assignments, lectures, or resources. Only instructors can create content."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Content created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input data"),
        @ApiResponse(responseCode = "403", description = "Access denied - Instructor role required")
    })
    public ResponseEntity<?> createCourseContent(
            @RequestParam("courseId") Long courseId,
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("contentType") String contentTypeStr,
            @RequestParam(value = "dueDate", required = false) String dueDateStr,
            @RequestParam(value = "file", required = false) MultipartFile file,
            Authentication authentication) {
        
        try {
            ContentType contentType = ContentType.valueOf(contentTypeStr.toUpperCase());
            Long instructorId = getUserIdFromAuth(authentication);
            
            LocalDateTime dueDate = null;
            if (dueDateStr != null && !dueDateStr.isEmpty()) {
                dueDate = LocalDateTime.parse(dueDateStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            }
            
            CourseContent content = courseContentService.createCourseContent(
                courseId, title, description, contentType, instructorId, dueDate, file);
            
            return ResponseEntity.ok(content);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/course/{courseId}")
    @Operation(
        summary = "Get course contents by course ID",
        description = "Retrieves all content for a specific course."
    )
    @ApiResponse(responseCode = "200", description = "Course contents retrieved successfully")
    public ResponseEntity<List<CourseContent>> getCourseContentsByCourse(
        @Parameter(description = "Course ID", example = "1")
        @PathVariable Long courseId) {
        return ResponseEntity.ok(courseContentService.getCourseContentsByCourse(courseId));
    }

    @GetMapping("/course/{courseId}/type/{contentType}")
    public ResponseEntity<List<CourseContent>> getCourseContentsByType(
            @PathVariable Long courseId,
            @PathVariable String contentType) {
        
        try {
            ContentType type = ContentType.valueOf(contentType.toUpperCase());
            return ResponseEntity.ok(courseContentService.getCourseContentsByType(courseId, type));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{contentId}")
    public ResponseEntity<?> getCourseContentById(@PathVariable Long contentId) {
        Optional<CourseContent> content = courseContentService.getCourseContentById(contentId);
        return content.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{contentId}")
    public ResponseEntity<?> updateCourseContent(
            @PathVariable Long contentId,
            @RequestBody Map<String, Object> updateData,
            Authentication authentication) {
        
        try {
            Long instructorId = getUserIdFromAuth(authentication);
            
            String title = (String) updateData.get("title");
            String description = (String) updateData.get("description");
            
            ContentType contentType = null;
            if (updateData.containsKey("contentType")) {
                contentType = ContentType.valueOf(updateData.get("contentType").toString().toUpperCase());
            }
            
            LocalDateTime dueDate = null;
            if (updateData.containsKey("dueDate") && updateData.get("dueDate") != null) {
                dueDate = LocalDateTime.parse(updateData.get("dueDate").toString(), 
                        DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            }
            
            CourseContent content = courseContentService.updateCourseContent(
                contentId, title, description, contentType, dueDate, instructorId);
            
            return ResponseEntity.ok(content);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{contentId}")
    public ResponseEntity<?> deleteCourseContent(
            @PathVariable Long contentId,
            Authentication authentication) {
        
        try {
            Long instructorId = getUserIdFromAuth(authentication);
            courseContentService.deleteCourseContent(contentId, instructorId);
            return ResponseEntity.ok(Map.of("message", "Course content deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private Long getUserIdFromAuth(Authentication authentication) {
        // Extract user ID from JWT token - this would need to be implemented
        // based on how user ID is stored in the JWT claims
        return 1L; // Placeholder - should extract from JWT
    }
}