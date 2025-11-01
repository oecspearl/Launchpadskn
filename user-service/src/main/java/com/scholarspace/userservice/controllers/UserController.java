package com.scholarspace.userservice.controllers;

import com.scholarspace.userservice.models.Role;
import com.scholarspace.userservice.models.User;
import com.scholarspace.userservice.services.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.client.RestTemplate;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@SuppressWarnings("unused")
@RestController
@RequestMapping("/api/users")
@Tag(name = "User Management", description = "User CRUD operations and profile management")
@SecurityRequirement(name = "Bearer Authentication")
public class UserController {
    private final UserService userService;
    private final RestTemplate restTemplate;

    public UserController(UserService userService, RestTemplate restTemplate) {
        this.userService = userService;
        this.restTemplate = restTemplate;
    }

    private Long parseLongFromObject(Object obj, String fieldName) {
        if (obj == null) return null;
        if (obj instanceof Number) {
            return ((Number) obj).longValue();
        }
        if (obj instanceof String && !((String) obj).isEmpty()) {
            try {
                return Long.parseLong((String) obj);
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("Invalid " + fieldName + " format");
            }
        }
        return null;
    }

    private boolean validateDepartmentExists(Long departmentId) {
        // Skip validation - department existence is validated by frontend
        // and managed by institution-service
        return true;
    }

    @GetMapping
    @Operation(summary = "Get All Users", description = "Retrieve all users (Admin only)")
    @ApiResponse(responseCode = "200", description = "Users retrieved successfully")
    @ApiResponse(responseCode = "403", description = "Access denied - Admin role required")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    @Operation(
        summary = "Get User by ID", 
        description = "Retrieve user details by ID. Accessible by Admin only."
    )
    @ApiResponse(responseCode = "200", description = "User found",
        content = @Content(mediaType = "application/json",
            examples = @ExampleObject(
                value = "{\"userId\": 1, \"name\": \"John Doe\", \"email\": \"john.doe@example.com\", \"role\": \"STUDENT\", \"isActive\": true, \"createdAt\": \"2024-01-01T10:00:00\"}"
            )))
    @ApiResponse(responseCode = "404", description = "User not found")
    @ApiResponse(responseCode = "403", description = "Access denied - Admin role required")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        Optional<User> user = userService.getUserById(id);
        return user.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/role/{role}")
    public ResponseEntity<List<User>> getUsersByRole(@PathVariable String role) {
        try {
            Role userRole = Role.valueOf(role.toUpperCase());
            return ResponseEntity.ok(userService.getUsersByRole(userRole));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/profile")
    @Operation(
        summary = "Get Current User Profile", 
        description = "Get the profile of the currently authenticated user. Available to all authenticated users."
    )
    @ApiResponse(responseCode = "200", description = "Profile retrieved successfully",
        content = @Content(mediaType = "application/json",
            examples = @ExampleObject(
                value = "{\"userId\": 1, \"name\": \"John Doe\", \"email\": \"john.doe@example.com\", \"role\": \"STUDENT\", \"firstName\": \"John\", \"lastName\": \"Doe\", \"isActive\": true}"
            )))
    @ApiResponse(responseCode = "401", description = "User not authenticated")
    @ApiResponse(responseCode = "404", description = "User profile not found")
    public ResponseEntity<?> getCurrentUserProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("error", "User not authenticated"));
        }
        
        String email = authentication.getName();
        Optional<User> user = userService.getUserByEmail(email);
        
        if (user.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(user.get());
    }

    @PutMapping("/{id}/activate")
    public ResponseEntity<?> activateUser(@PathVariable Long id) {
        userService.activateUser(id);
        return ResponseEntity.ok(Map.of("message", "User activated successfully"));
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<?> deactivateUser(@PathVariable Long id) {
        userService.deactivateUser(id);
        return ResponseEntity.ok(Map.of("message", "User deactivated successfully"));
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<?> updateUserStatus(HttpServletRequest request, @PathVariable Long id, @RequestParam boolean isActive) {
        if (!"ADMIN".equals(request.getSession().getAttribute("userRole"))) {
            return ResponseEntity.status(403).build();
        }
        
        if (isActive) {
            userService.activateUser(id);
        } else {
            userService.deactivateUser(id);
        }
        
        return ResponseEntity.ok(Map.of("message", isActive ? "User activated successfully" : "User deactivated successfully"));
    }

    @PutMapping("/profile")
    @Operation(
        summary = "Update Current User Profile", 
        description = "Update the profile of the currently authenticated user. Available to all authenticated users."
    )
    @ApiResponse(responseCode = "200", description = "Profile updated successfully")
    @ApiResponse(responseCode = "401", description = "User not authenticated")
    @ApiResponse(responseCode = "404", description = "User not found")
    public ResponseEntity<?> updateCurrentUserProfile(@RequestBody Map<String, Object> userDetails) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("error", "User not authenticated"));
        }
        
        String email = authentication.getName();
        Optional<User> existingUser = userService.getUserByEmail(email);
        
        if (existingUser.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        User user = existingUser.get();
        
        // Only allow updating profile fields, not role or admin fields
        if (userDetails.containsKey("name")) {
            user.setName((String) userDetails.get("name"));
        }
        
        if (userDetails.containsKey("phone")) {
            user.setPhone((String) userDetails.get("phone"));
        }
        
        if (userDetails.containsKey("address")) {
            user.setAddress((String) userDetails.get("address"));
        }
        
        if (userDetails.containsKey("emergencyContact")) {
            user.setEmergencyContact((String) userDetails.get("emergencyContact"));
        }
        
        if (userDetails.containsKey("dateOfBirth")) {
            String dateStr = (String) userDetails.get("dateOfBirth");
            if (dateStr != null && !dateStr.isEmpty()) {
                try {
                    user.setDateOfBirth(java.time.LocalDate.parse(dateStr));
                } catch (Exception e) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Invalid date format for dateOfBirth"));
                }
            }
        }
        
        return ResponseEntity.ok(userService.updateUser(user));
    }

    @PutMapping("/{id}")
    @Operation(
        summary = "Update User", 
        description = "Update user details by ID. Admin role required.",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "User update details (only include fields to update)",
            content = @Content(
                mediaType = "application/json",
                examples = @ExampleObject(
                    name = "Update User Example",
                    value = "{\"name\": \"John Doe Updated\", \"email\": \"john.doe.updated@example.com\", \"role\": \"INSTRUCTOR\", \"isActive\": true}"
                )
            )
        )
    )
    @ApiResponse(responseCode = "200", description = "User updated successfully")
    @ApiResponse(responseCode = "404", description = "User not found")
    @ApiResponse(responseCode = "403", description = "Access denied - Admin role required")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> userDetails) {
        Optional<User> existingUser = userService.getUserById(id);
        
        if (existingUser.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        User user = existingUser.get();
        
        // Update fields from Map to avoid Jackson binding issues
        if (userDetails.containsKey("name")) {
            user.setName((String) userDetails.get("name"));
        }
        
        if (userDetails.containsKey("email")) {
            user.setEmail((String) userDetails.get("email"));
        }
        
        if (userDetails.containsKey("role")) {
            String roleStr = (String) userDetails.get("role");
            try {
                user.setRole(Role.valueOf(roleStr.toUpperCase()));
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid role: " + roleStr));
            }
        }
        
        if (userDetails.containsKey("isActive")) {
            user.setActive((Boolean) userDetails.get("isActive"));
        }
        
        if (userDetails.containsKey("phone")) {
            user.setPhone((String) userDetails.get("phone"));
        }
        
        if (userDetails.containsKey("address")) {
            user.setAddress((String) userDetails.get("address"));
        }
        
        if (userDetails.containsKey("emergencyContact")) {
            user.setEmergencyContact((String) userDetails.get("emergencyContact"));
        }
        
        if (userDetails.containsKey("dateOfBirth")) {
            String dateStr = (String) userDetails.get("dateOfBirth");
            if (dateStr != null && !dateStr.isEmpty()) {
                try {
                    user.setDateOfBirth(java.time.LocalDate.parse(dateStr));
                } catch (Exception e) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Invalid date format for dateOfBirth"));
                }
            }
        }
        
        // Handle department assignment
        if (userDetails.containsKey("departmentId")) {
            try {
                Long departmentId = parseLongFromObject(userDetails.get("departmentId"), "departmentId");
                // Department validation removed - handled by frontend
                user.setDepartmentId(departmentId);
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
            }
        }
        
        return ResponseEntity.ok(userService.updateUser(user));
    }
    
    @GetMapping("/stats")
    @Operation(
        summary = "Get User Statistics", 
        description = "Get user statistics for dashboard. Admin role required."
    )
    @ApiResponse(responseCode = "200", description = "User statistics retrieved successfully")
    @ApiResponse(responseCode = "403", description = "Access denied - Admin role required")
    public ResponseEntity<Map<String, Object>> getUserStats() {
        List<User> allUsers = userService.getAllUsers();
        
        Map<String, Object> stats = Map.of(
            "totalUsers", allUsers.size(),
            "totalInstructors", allUsers.stream().filter(u -> u.getRole() == Role.INSTRUCTOR).count(),
            "totalStudents", allUsers.stream().filter(u -> u.getRole() == Role.STUDENT).count(),
            "activeUsers", allUsers.stream().filter(User::isActive).count(),
            "recentUsers", allUsers.stream()
                .filter(u -> u.getCreatedAt() != null && 
                    u.getCreatedAt().isAfter(java.time.LocalDateTime.now().minusDays(30)))
                .count()
        );
        
        return ResponseEntity.ok(stats);
    }

    @PostMapping
    @Operation(
        summary = "Create User", 
        description = "Create a new user account. Admin role required.",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "User creation details",
            content = @Content(
                mediaType = "application/json",
                examples = @ExampleObject(
                    name = "Create User Example",
                    value = "{\"name\": \"Jane Smith\", \"email\": \"jane.smith@example.com\", \"password\": \"password123\", \"role\": \"INSTRUCTOR\", \"isActive\": true}"
                )
            )
        )
    )
    @ApiResponse(responseCode = "200", description = "User created successfully")
    @ApiResponse(responseCode = "400", description = "Invalid input or email already exists")
    @ApiResponse(responseCode = "403", description = "Access denied - Admin role required")
    public ResponseEntity<?> createUser(@RequestBody Map<String, Object> userRequest) {
        try {
            String name = (String) userRequest.get("name");
            String email = (String) userRequest.get("email");
            String password = (String) userRequest.get("password");
            String roleStr = (String) userRequest.get("role");
            Boolean isActive = (Boolean) userRequest.get("isActive");
            
            Role role = Role.STUDENT;
            if (roleStr != null && !roleStr.isEmpty()) {
                try {
                    role = Role.valueOf(roleStr.toUpperCase());
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Invalid role: " + roleStr));
                }
            }
            
            User user = userService.registerUser(name, email, password, role);
            
            // Set first login flag for instructors
            if (role == Role.INSTRUCTOR) {
                user.setFirstLogin(true);
                user = userService.updateUser(user);
            }
            
            // Validate department BEFORE creating user to avoid partial state
            Long departmentId = null;
            if (userRequest.containsKey("departmentId")) {
                try {
                    departmentId = parseLongFromObject(userRequest.get("departmentId"), "departmentId");
                    // Department validation removed - handled by frontend
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
                }
            }
            
            // Set department after validation
            if (departmentId != null) {
                user.setDepartmentId(departmentId);
                user = userService.updateUser(user);
            }
            
            if (isActive != null && !isActive) {
                userService.deactivateUser(user.getUserId());
                user.setActive(false);
            }
            
            return ResponseEntity.ok(user);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid input: " + e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Server error: " + e.getMessage()));
        }
    }
    
    @GetMapping("/debug-auth")
    @Operation(
        summary = "Debug Authentication", 
        description = "Debug endpoint to check authentication status"
    )
    public ResponseEntity<?> debugAuth(HttpServletRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        Map<String, Object> debugInfo = new HashMap<>();
        debugInfo.put("requestURI", request.getRequestURI());
        debugInfo.put("authorizationHeader", request.getHeader("Authorization"));
        debugInfo.put("hasAuthentication", authentication != null);
        debugInfo.put("isAuthenticated", authentication != null ? authentication.isAuthenticated() : false);
        debugInfo.put("principal", authentication != null ? authentication.getPrincipal().toString() : "null");
        debugInfo.put("authorities", authentication != null ? authentication.getAuthorities().toString() : "null");
        debugInfo.put("name", authentication != null ? authentication.getName() : "null");
        
        return ResponseEntity.ok(debugInfo);
    }
    
    @PutMapping("/change-password")
    @Operation(
        summary = "Change Password", 
        description = "Change password for the currently authenticated user. Used for first-time login password change."
    )
    @ApiResponse(responseCode = "200", description = "Password changed successfully")
    @ApiResponse(responseCode = "401", description = "User not authenticated")
    @ApiResponse(responseCode = "400", description = "Invalid password or validation failed")
    public ResponseEntity<?> changePassword(HttpServletRequest request, @RequestBody Map<String, String> passwordData) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        

        
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("error", "User not authenticated"));
        }
        
        String email = authentication.getName();
        String newPassword = passwordData.get("newPassword");
        
        if (newPassword == null || newPassword.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "New password is required"));
        }
        
        try {
            userService.changePassword(email, newPassword);
            return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
        } catch (Exception e) {

            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}