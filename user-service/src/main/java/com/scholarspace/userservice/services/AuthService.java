package com.scholarspace.userservice.services;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.time.LocalDateTime;

import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.scholarspace.userservice.models.Role;
import com.scholarspace.userservice.models.User;
import com.scholarspace.userservice.repositories.UserRepository;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserService userService;
    private final JwtService jwtService;
    private final LdapAuthenticationService ldapAuthenticationService;
    
    // Store reset tokens in memory (for development only)
    private final Map<String, PasswordResetToken> resetTokens = new HashMap<>();

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, 
                       UserService userService, JwtService jwtService, 
                       LdapAuthenticationService ldapAuthenticationService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.userService = userService;
        this.jwtService = jwtService;
        this.ldapAuthenticationService = ldapAuthenticationService;
    }

    public Map<String, Object> login(String email, String password) {
        Optional<User> userOptional = userRepository.findByEmail(email);
        
        if (userOptional.isEmpty()) {
            throw new UsernameNotFoundException("User not found with email: " + email);
        }
        
        User user = userOptional.get();
        
        if (!user.isActive()) {
            throw new RuntimeException("User account is deactivated");
        }
        
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }
        
        // Check if this is first login for instructors
        boolean isFirstLogin = user.getRole() == Role.INSTRUCTOR && user.isFirstLogin();
        
        // Update last login timestamp
        userService.updateLastLogin(user);
        
        String token = jwtService.generateToken(user);
        
        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("userId", user.getUserId().toString());
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        response.put("role", user.getRole().toString());
        response.put("isFirstLogin", isFirstLogin);
        
        return response;
    }
    
    public Map<String, Object> loginWithAD(String email, String password) {
        if (email == null || password == null || email.trim().isEmpty() || password.trim().isEmpty()) {
            throw new RuntimeException("Email and password are required");
        }
        
        // Authenticate against Active Directory
        if (!ldapAuthenticationService.authenticateUser(email, password)) {
            throw new RuntimeException("Invalid Active Directory credentials");
        }
        
        // Get user details from AD
        Map<String, Object> adUserDetails = ldapAuthenticationService.getUserDetails(email);
        if (adUserDetails == null) {
            throw new RuntimeException("Unable to retrieve user details from Active Directory");
        }
        
        String userName = (String) adUserDetails.get("name");
        Role userRole = (Role) adUserDetails.get("role");
        
        if (userName == null || userName.trim().isEmpty()) {
            userName = email.split("@")[0]; // Fallback to email prefix
        }
        
        // Check if user exists in local database
        Optional<User> userOptional = userRepository.findByEmail(email);
        User user;
        
        if (userOptional.isEmpty()) {
            // Create new user from AD details
            user = new User();
            user.setEmail(email);
            user.setName(userName);
            user.setRole(userRole);
            user.setActive(true);
            user.setFirstLogin(false); // AD users are not first-time logins
            user.setPassword(""); // No password stored for AD users
            user = userRepository.save(user);
        } else {
            user = userOptional.get();
            if (!user.isActive()) {
                throw new RuntimeException("User account is deactivated");
            }
            // Update user details from AD
            user.setName(userName);
            user.setRole(userRole);
            user = userRepository.save(user);
        }
        
        // Update last login timestamp
        userService.updateLastLogin(user);
        
        String token = jwtService.generateToken(user);
        
        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("userId", user.getUserId().toString());
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        response.put("role", user.getRole().toString());
        response.put("isFirstLogin", false);
        response.put("authType", "AD");
        
        return response;
    }
    
    /**
     * Generate a password reset token for the given email
     * In a production environment, this would send an email with the reset link
     */
    public Map<String, String> forgotPassword(String email) {
        Optional<User> userOptional = userRepository.findByEmail(email);
        
        if (userOptional.isEmpty()) {
            throw new UsernameNotFoundException("User not found with email: " + email);
        }
        
        User user = userOptional.get();
        
        if (!user.isActive()) {
            throw new RuntimeException("User account is deactivated");
        }
        
        // Generate a unique token
        String token = UUID.randomUUID().toString();
        
        // Store token with user email and expiration time (24 hours from now)
        resetTokens.put(token, new PasswordResetToken(email, LocalDateTime.now().plusHours(24)));
        
        // In a real application, send an email with the reset link
        // For development, just return the token
        Map<String, String> response = new HashMap<>();
        response.put("message", "Password reset token generated successfully");
        response.put("token", token); // Only for development - would normally be sent via email
        response.put("email", email);
        
        return response;
    }
    
    /**
     * Reset the password using the token
     */
    public Map<String, String> resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = resetTokens.get(token);
        
        if (resetToken == null) {
            throw new RuntimeException("Invalid or expired password reset token");
        }
        
        if (resetToken.isExpired()) {
            resetTokens.remove(token);
            throw new RuntimeException("Password reset token has expired");
        }
        
        Optional<User> userOptional = userRepository.findByEmail(resetToken.getEmail());
        
        if (userOptional.isEmpty()) {
            throw new UsernameNotFoundException("User not found with email: " + resetToken.getEmail());
        }
        
        User user = userOptional.get();
        
        // Update the password
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        
        // Remove the used token
        resetTokens.remove(token);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Password has been reset successfully");
        
        return response;
    }
    
    /**
     * Validate if a reset token is valid
     */
    public boolean validateResetToken(String token) {
        PasswordResetToken resetToken = resetTokens.get(token);
        return resetToken != null && !resetToken.isExpired();
    }
    
    /**
     * Inner class to store password reset token information
     */
    private static class PasswordResetToken {
        private final String email;
        private final LocalDateTime expiryDate;
        
        public PasswordResetToken(String email, LocalDateTime expiryDate) {
            this.email = email;
            this.expiryDate = expiryDate;
        }
        
        public String getEmail() {
            return email;
        }
        
        public boolean isExpired() {
            return LocalDateTime.now().isAfter(expiryDate);
        }
    }
}