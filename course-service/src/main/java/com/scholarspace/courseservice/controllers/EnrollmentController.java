package com.scholarspace.courseservice.controllers;

import com.scholarspace.courseservice.models.Enrollment;
import com.scholarspace.courseservice.models.EnrollmentStatus;
import com.scholarspace.courseservice.services.EnrollmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
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
@RequestMapping("/api/enrollments")
@RequiredArgsConstructor
@Tag(name = "Enrollment Management", description = "APIs for managing student enrollments in courses. Students can request enrollment, administrators can approve/reject requests.")
public class EnrollmentController {
    
    private final EnrollmentService enrollmentService;

    @PostMapping
    @Operation(
        summary = "Request course enrollment",
        description = "Students can request enrollment in a course. Request will be pending until approved by administrator."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Enrollment request created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request data or already enrolled"),
        @ApiResponse(responseCode = "403", description = "Access denied - Student role required")
    })
    public ResponseEntity<?> requestEnrollment(@RequestBody Map<String, Long> enrollmentRequest) {
        try {
            Long studentId = enrollmentRequest.get("studentId");
            Long courseId = enrollmentRequest.get("courseId");
            
            Enrollment enrollment = enrollmentService.requestEnrollment(studentId, courseId);
            return ResponseEntity.ok(enrollment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getEnrollmentById(@PathVariable Long id) {
        Optional<Enrollment> enrollment = enrollmentService.getEnrollmentById(id);
        return enrollment.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<Enrollment>> getEnrollmentsByCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(enrollmentService.getEnrollmentsByCourse(courseId));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Enrollment>> getEnrollmentsByStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(enrollmentService.getEnrollmentsByStudent(studentId));
    }

    @GetMapping("/course/{courseId}/active")
    public ResponseEntity<List<Enrollment>> getActiveEnrollmentsByCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(enrollmentService.getActiveEnrollmentsByCourse(courseId));
    }

    @GetMapping("/student/{studentId}/active")
    public ResponseEntity<List<Enrollment>> getActiveEnrollmentsByStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(enrollmentService.getActiveEnrollmentsByStudent(studentId));
    }

    @GetMapping("/pending")
    @Operation(
        summary = "Get pending enrollments",
        description = "Retrieves all enrollment requests that are pending approval. Only administrators can access this."
    )
    @ApiResponse(responseCode = "200", description = "Pending enrollments retrieved successfully")
    public ResponseEntity<List<Enrollment>> getPendingEnrollments() {
        return ResponseEntity.ok(enrollmentService.getEnrollmentsByStatus(EnrollmentStatus.PENDING));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateEnrollmentStatus(
            @PathVariable Long id, 
            @RequestBody Map<String, String> statusRequest) {
        
        try {
            String statusStr = statusRequest.get("status");
            EnrollmentStatus status = EnrollmentStatus.valueOf(statusStr.toUpperCase());
            
            Enrollment enrollment = enrollmentService.updateEnrollmentStatus(id, status);
            return ResponseEntity.ok(enrollment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approveEnrollment(@PathVariable Long id) {
        try {
            Enrollment enrollment = enrollmentService.updateEnrollmentStatus(id, EnrollmentStatus.ACTIVE);
            return ResponseEntity.ok(Map.of(
                "message", "Enrollment approved successfully",
                "enrollment", enrollment
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<?> rejectEnrollment(@PathVariable Long id) {
        try {
            Enrollment enrollment = enrollmentService.updateEnrollmentStatus(id, EnrollmentStatus.DROPPED);
            return ResponseEntity.ok(Map.of(
                "message", "Enrollment rejected",
                "enrollment", enrollment
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/drop")
    public ResponseEntity<?> dropEnrollment(@PathVariable Long id) {
        enrollmentService.dropEnrollment(id);
        return ResponseEntity.ok(Map.of("message", "Enrollment dropped successfully"));
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<?> completeEnrollment(
            @PathVariable Long id, 
            @RequestBody Map<String, String> gradeRequest) {
        
        String grade = gradeRequest.get("grade");
        enrollmentService.completeEnrollment(id, grade);
        return ResponseEntity.ok(Map.of("message", "Enrollment completed successfully"));
    }
}