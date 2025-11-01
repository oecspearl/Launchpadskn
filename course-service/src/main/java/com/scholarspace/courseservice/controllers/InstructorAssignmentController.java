package com.scholarspace.courseservice.controllers;

import com.scholarspace.courseservice.models.CourseInstructor;
import com.scholarspace.courseservice.models.InstructorRole;
import com.scholarspace.courseservice.services.InstructorAssignmentService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Instructor Assignment", description = "APIs for assigning instructors to courses and managing instructor-course relationships.")
public class InstructorAssignmentController {

    private final InstructorAssignmentService instructorAssignmentService;

    @PostMapping("/{courseId}/instructors/{instructorId}")
    public ResponseEntity<?> assignInstructorToCourse(
            @PathVariable Long courseId,
            @PathVariable Long instructorId,
            @RequestBody(required = false) Map<String, String> request) {
        
        try {
            InstructorRole role = InstructorRole.PRIMARY;
            if (request != null && request.containsKey("role")) {
                String roleStr = request.get("role").toUpperCase();
                role = InstructorRole.valueOf(roleStr);
            }
            
            CourseInstructor assignment = instructorAssignmentService
                    .assignInstructorToCourse(courseId, instructorId, role);
            
            return ResponseEntity.ok(Map.of(
                "message", "Instructor assigned to course successfully",
                "assignment", assignment
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid input: " + e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{courseId}/instructors/{instructorId}")
    public ResponseEntity<?> removeInstructorFromCourse(
            @PathVariable Long courseId,
            @PathVariable Long instructorId) {
        try {
            instructorAssignmentService.removeInstructorFromCourse(courseId, instructorId);
            return ResponseEntity.ok(Map.of("message", "Instructor removed from course successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/courses/instructor/{instructorId}")
    public ResponseEntity<List<CourseInstructor>> getCoursesByInstructor(@PathVariable Long instructorId) {
        return ResponseEntity.ok(instructorAssignmentService.getCoursesByInstructor(instructorId));
    }

    @PostMapping("/instructors/{instructorId}/courses/{courseId}")
    public ResponseEntity<?> assignInstructorToCourseAlt(
            @PathVariable Long instructorId,
            @PathVariable Long courseId,
            @RequestBody(required = false) Map<String, String> request) {
        
        try {
            InstructorRole role = InstructorRole.PRIMARY;
            if (request != null && request.containsKey("role")) {
                String roleStr = request.get("role").toUpperCase();
                role = InstructorRole.valueOf(roleStr);
            }
            
            CourseInstructor assignment = instructorAssignmentService
                    .assignInstructorToCourse(courseId, instructorId, role);
            
            return ResponseEntity.ok(Map.of(
                "message", "Instructor assigned to course successfully",
                "assignment", assignment
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid input: " + e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/instructors/{instructorId}/courses/{courseId}")
    public ResponseEntity<?> removeInstructorFromCourseAlt(
            @PathVariable Long instructorId,
            @PathVariable Long courseId) {
        try {
            instructorAssignmentService.removeInstructorFromCourse(courseId, instructorId);
            return ResponseEntity.ok(Map.of("message", "Instructor removed from course successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{courseId}/instructors")
    public ResponseEntity<List<CourseInstructor>> getInstructorsByCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(instructorAssignmentService.getInstructorsByCourse(courseId));
    }

    @GetMapping("/{courseId}/instructors/{instructorId}/validate")
    public ResponseEntity<?> validateInstructorAssignment(
            @PathVariable Long courseId,
            @PathVariable Long instructorId) {
        
        boolean isAssigned = instructorAssignmentService.isInstructorAssignedToCourse(instructorId, courseId);
        
        return ResponseEntity.ok(Map.of(
            "valid", isAssigned,
            "instructorId", instructorId,
            "courseId", courseId,
            "message", isAssigned ? "Instructor is assigned to course" : "Instructor is not assigned to course"
        ));
    }
}