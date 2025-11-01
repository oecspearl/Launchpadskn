package com.scholarspace.userservice.controllers;

import com.scholarspace.userservice.models.User;
import com.scholarspace.userservice.services.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Dashboard statistics and user management endpoints")
public class DashboardController {
    
    private final DashboardService dashboardService;

    @GetMapping("/stats")
    @Operation(summary = "Get dashboard statistics")
    @ApiResponse(responseCode = "200", description = "Statistics retrieved successfully")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        return ResponseEntity.ok(dashboardService.getDashboardStats());
    }

    @GetMapping("/students")
    @Operation(summary = "Get filtered students list")
    @ApiResponse(responseCode = "200", description = "Students retrieved successfully")
    public ResponseEntity<List<User>> getStudents(
        @Parameter(description = "Search term for name or email")
        @RequestParam(required = false) String search,
        @Parameter(description = "Filter by active status")
        @RequestParam(required = false) Boolean active) {
        return ResponseEntity.ok(dashboardService.getStudentsByFilter(search, active));
    }
}