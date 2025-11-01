package com.scholarspace.courseservice.controllers;

import com.scholarspace.courseservice.services.AnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@Tag(name = "Course Analytics", description = "Course analytics and reporting endpoints")
public class AnalyticsController {
    
    private final AnalyticsService analyticsService;

    @GetMapping("/courses/trends")
    @Operation(summary = "Get course creation trends")
    @ApiResponse(responseCode = "200", description = "Course trends retrieved successfully")
    public ResponseEntity<Map<String, Object>> getCourseTrends() {
        return ResponseEntity.ok(analyticsService.getCourseTrends());
    }

    @GetMapping("/enrollments/trends")
    @Operation(summary = "Get enrollment trends")
    @ApiResponse(responseCode = "200", description = "Enrollment trends retrieved successfully")
    public ResponseEntity<Map<String, Object>> getEnrollmentTrends() {
        return ResponseEntity.ok(analyticsService.getEnrollmentTrends());
    }

    @GetMapping("/courses/by-department")
    @Operation(summary = "Get course distribution by department")
    @ApiResponse(responseCode = "200", description = "Course distribution retrieved successfully")
    public ResponseEntity<Map<String, Object>> getCoursesByDepartment() {
        return ResponseEntity.ok(analyticsService.getCoursesByDepartment());
    }
}