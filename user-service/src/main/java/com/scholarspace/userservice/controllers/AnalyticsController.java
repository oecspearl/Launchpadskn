package com.scholarspace.userservice.controllers;

import com.scholarspace.userservice.services.AnalyticsService;
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
@Tag(name = "Analytics", description = "Analytics and reporting endpoints")
public class AnalyticsController {
    
    private final AnalyticsService analyticsService;

    @GetMapping("/users/trends")
    @Operation(summary = "Get user registration trends")
    @ApiResponse(responseCode = "200", description = "User trends retrieved successfully")
    public ResponseEntity<Map<String, Object>> getUserTrends() {
        return ResponseEntity.ok(analyticsService.getUserTrends());
    }

    @GetMapping("/users/by-role")
    @Operation(summary = "Get user distribution by role")
    @ApiResponse(responseCode = "200", description = "User role distribution retrieved successfully")
    public ResponseEntity<Map<String, Object>> getUsersByRole() {
        return ResponseEntity.ok(analyticsService.getUsersByRole());
    }

    @GetMapping("/system/health")
    @Operation(summary = "Get system health metrics")
    @ApiResponse(responseCode = "200", description = "System health retrieved successfully")
    public ResponseEntity<Map<String, Object>> getSystemHealth() {
        return ResponseEntity.ok(analyticsService.getSystemHealth());
    }
}