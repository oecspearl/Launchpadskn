package com.scholarspace.userservice.controllers;

import com.scholarspace.userservice.models.Role;
import com.scholarspace.userservice.models.User;
import com.scholarspace.userservice.services.AuthService;
import com.scholarspace.userservice.services.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@Tag(name = "Authentication", description = "User authentication and password management")
public class AuthController {
    private final AuthService authService;
    private final UserService userService;

    public AuthController(AuthService authService, UserService userService) {
        this.authService = authService;
        this.userService = userService;
    }

    @PostMapping("/login")
    @Operation(
        summary = "User Login", 
        description = "Authenticate user with email and password. Returns JWT token for subsequent API calls.",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "Login credentials",
            content = @Content(
                mediaType = "application/json",
                examples = @io.swagger.v3.oas.annotations.media.ExampleObject(
                    name = "Login Example",
                    value = "{\"email\": \"admin@scholarspace.com\", \"password\": \"admin123\"}"
                )
            )
        )
    )
    @ApiResponse(responseCode = "200", description = "Login successful", 
        content = @Content(mediaType = "application/json",
            examples = @io.swagger.v3.oas.annotations.media.ExampleObject(
                value = "{\"token\": \"eyJhbGciOiJIUzI1NiJ9...\", \"userId\": \"1\", \"name\": \"Admin User\", \"email\": \"admin@scholarspace.com\", \"role\": \"ADMIN\"}"
            )))
    @ApiResponse(responseCode = "400", description = "Invalid credentials or inactive account")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest) {
        try {
            String email = loginRequest.get("email");
            String password = loginRequest.get("password");
            
            Map<String, Object> response = authService.login(email, password);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @PostMapping("/login-ad")
    @Operation(
        summary = "Active Directory Login", 
        description = "Authenticate user against Active Directory. Returns JWT token for subsequent API calls.",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "AD login credentials",
            content = @Content(
                mediaType = "application/json",
                examples = @io.swagger.v3.oas.annotations.media.ExampleObject(
                    name = "AD Login Example",
                    value = "{\"email\": \"jadmin@mylab.local\", \"password\": \"Complex123!Pass\"}"
                )
            )
        )
    )
    @ApiResponse(responseCode = "200", description = "AD login successful", 
        content = @Content(mediaType = "application/json",
            examples = @io.swagger.v3.oas.annotations.media.ExampleObject(
                value = "{\"token\": \"eyJhbGciOiJIUzI1NiJ9...\", \"userId\": \"1\", \"name\": \"John Admin\", \"email\": \"jadmin@mylab.local\", \"role\": \"ADMIN\", \"authType\": \"AD\"}"
            )))
    @ApiResponse(responseCode = "400", description = "Invalid AD credentials or connection error")
    public ResponseEntity<?> loginWithAD(@RequestBody Map<String, String> loginRequest) {
        try {
            String email = loginRequest.get("email");
            String password = loginRequest.get("password");
            
            Map<String, Object> response = authService.loginWithAD(email, password);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @PostMapping("/register")
    @Operation(
        summary = "User Registration", 
        description = "Register a new user account with enhanced student fields. Default role is STUDENT if not specified.",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "User registration details with optional student fields",
            content = @Content(
                mediaType = "application/json",
                examples = {
                    @io.swagger.v3.oas.annotations.media.ExampleObject(
                        name = "Enhanced Student Registration",
                        value = "{\"name\": \"John Doe\", \"email\": \"john.doe@example.com\", \"password\": \"password123\", \"role\": \"STUDENT\", \"phone\": \"+1234567890\", \"dateOfBirth\": \"1995-05-15\", \"address\": \"123 Main St, City, State\", \"emergencyContact\": \"Jane Doe - +0987654321\"}"
                    ),
                    @io.swagger.v3.oas.annotations.media.ExampleObject(
                        name = "Basic Registration",
                        value = "{\"name\": \"Admin User\", \"email\": \"admin@scholarspace.com\", \"password\": \"admin123\", \"role\": \"ADMIN\"}"
                    )
                }
            )
        )
    )
    @ApiResponse(responseCode = "200", description = "Registration successful",
        content = @Content(mediaType = "application/json",
            examples = @io.swagger.v3.oas.annotations.media.ExampleObject(
                value = "{\"message\": \"User registered successfully\", \"userId\": \"1\", \"email\": \"john.doe@example.com\"}"
            )))
    @ApiResponse(responseCode = "400", description = "Invalid input or email already exists")
    public ResponseEntity<?> register(@RequestBody Map<String, Object> registerRequest) {
        try {
            String name = (String) registerRequest.get("name");
            String email = (String) registerRequest.get("email");
            String password = (String) registerRequest.get("password");
            String roleStr = (String) registerRequest.get("role");
            
            // Enhanced student fields
            String phone = (String) registerRequest.get("phone");
            String dateOfBirthStr = (String) registerRequest.get("dateOfBirth");
            String address = (String) registerRequest.get("address");
            String emergencyContact = (String) registerRequest.get("emergencyContact");
            
            Role role = Role.STUDENT; // Default role
            if (roleStr != null && !roleStr.isEmpty()) {
                try {
                    role = Role.valueOf(roleStr.toUpperCase());
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Invalid role: " + roleStr));
                }
            }
            
            // Parse date of birth
            java.time.LocalDate dateOfBirth = null;
            if (dateOfBirthStr != null && !dateOfBirthStr.isEmpty()) {
                try {
                    dateOfBirth = java.time.LocalDate.parse(dateOfBirthStr);
                } catch (Exception e) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Invalid date format for dateOfBirth. Use YYYY-MM-DD"));
                }
            }
            
            User user = userService.registerUserWithDetails(name, email, password, role, phone, dateOfBirth, address, emergencyContact);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "User registered successfully");
            response.put("userId", user.getUserId().toString());
            response.put("email", user.getEmail());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    @PostMapping("/forgot-password")
    @Operation(
        summary = "Forgot Password", 
        description = "Generate password reset token for user. Token is valid for 24 hours.",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "User email for password reset",
            content = @Content(
                mediaType = "application/json",
                examples = @io.swagger.v3.oas.annotations.media.ExampleObject(
                    name = "Forgot Password Example",
                    value = "{\"email\": \"john.doe@example.com\"}"
                )
            )
        )
    )
    @ApiResponse(responseCode = "200", description = "Reset token generated successfully",
        content = @Content(mediaType = "application/json",
            examples = @io.swagger.v3.oas.annotations.media.ExampleObject(
                value = "{\"message\": \"Password reset token generated successfully\", \"token\": \"abc123-def456-ghi789\", \"email\": \"john.doe@example.com\"}"
            )))
    @ApiResponse(responseCode = "400", description = "User not found or account inactive")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> forgotPasswordRequest) {
        try {
            String email = forgotPasswordRequest.get("email");
            
            Map<String, String> response = authService.forgotPassword(email);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> resetPasswordRequest) {
        try {
            String token = resetPasswordRequest.get("token");
            String newPassword = resetPasswordRequest.get("newPassword");
            
            if (token == null || token.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Reset token is required"));
            }
            
            if (newPassword == null || newPassword.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "New password is required"));
            }
            
            Map<String, String> response = authService.resetPassword(token, newPassword);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    @GetMapping("/validate-reset-token")
    public ResponseEntity<?> validateResetToken(@RequestParam String token) {
        try {
            boolean isValid = authService.validateResetToken(token);
            
            Map<String, Object> response = new HashMap<>();
            response.put("valid", isValid);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
}