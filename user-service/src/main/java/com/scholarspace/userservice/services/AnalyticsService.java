package com.scholarspace.userservice.services;

import com.scholarspace.userservice.models.Role;
import com.scholarspace.userservice.models.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {
    
    private final UserService userService;
    private final RestTemplate restTemplate;

    public Map<String, Object> getUserTrends() {
        List<User> users = userService.getAllUsers();
        Map<String, Object> trends = new HashMap<>();
        
        // Monthly registration trends (last 6 months)
        Map<String, Long> monthlyRegistrations = users.stream()
            .filter(u -> u.getCreatedAt() != null && 
                u.getCreatedAt().isAfter(LocalDateTime.now().minusMonths(6)))
            .collect(Collectors.groupingBy(
                u -> u.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM")),
                Collectors.counting()
            ));
        
        trends.put("monthlyRegistrations", monthlyRegistrations);
        trends.put("totalUsers", users.size());
        trends.put("activeUsers", users.stream().filter(User::isActive).count());
        trends.put("recentUsers", users.stream()
            .filter(u -> u.getCreatedAt() != null && 
                u.getCreatedAt().isAfter(LocalDateTime.now().minusDays(30)))
            .count());
        
        return trends;
    }

    public Map<String, Object> getUsersByRole() {
        List<User> users = userService.getAllUsers();
        Map<String, Object> roleDistribution = new HashMap<>();
        
        Map<Role, Long> roleCounts = users.stream()
            .collect(Collectors.groupingBy(User::getRole, Collectors.counting()));
        
        roleDistribution.put("ADMIN", roleCounts.getOrDefault(Role.ADMIN, 0L));
        roleDistribution.put("INSTRUCTOR", roleCounts.getOrDefault(Role.INSTRUCTOR, 0L));
        roleDistribution.put("STUDENT", roleCounts.getOrDefault(Role.STUDENT, 0L));
        
        return roleDistribution;
    }

    public Map<String, Object> getSystemHealth() {
        Map<String, Object> health = new HashMap<>();
        
        // User service health
        health.put("userService", "UP");
        health.put("userCount", userService.getAllUsers().size());
        health.put("timestamp", LocalDateTime.now());
        
        // Check other services
        try {
            restTemplate.getForObject("http://institution-service/actuator/health", Map.class);
            health.put("institutionService", "UP");
        } catch (Exception e) {
            health.put("institutionService", "DOWN");
        }
        
        try {
            restTemplate.getForObject("http://course-service/actuator/health", Map.class);
            health.put("courseService", "UP");
        } catch (Exception e) {
            health.put("courseService", "DOWN");
        }
        
        return health;
    }
}