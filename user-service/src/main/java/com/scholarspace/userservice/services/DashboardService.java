package com.scholarspace.userservice.services;

import com.scholarspace.userservice.models.Role;
import com.scholarspace.userservice.models.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {
    
    private final UserService userService;
    private final RestTemplate restTemplate;

    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // Get user statistics (local)
        List<User> allUsers = userService.getAllUsers();
        stats.put("totalUsers", allUsers.size());
        stats.put("totalInstructors", allUsers.stream().filter(u -> u.getRole() == Role.INSTRUCTOR).count());
        stats.put("totalStudents", allUsers.stream().filter(u -> u.getRole() == Role.STUDENT).count());
        stats.put("activeUsers", allUsers.stream().filter(User::isActive).count());
        stats.put("recentUsers", allUsers.stream()
            .filter(u -> u.getCreatedAt() != null && 
                u.getCreatedAt().isAfter(LocalDateTime.now().minusDays(30)))
            .count());
        
        // Get course statistics from course-service
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> courseStats = restTemplate.getForObject("http://course-service/api/courses/stats", Map.class);
            if (courseStats != null) {
                stats.putAll(courseStats);
            }
        } catch (Exception e) {
            // Fallback values if course-service unavailable
            stats.put("totalCourses", 0);
            stats.put("activeCourses", 0);
            stats.put("recentCourses", 0);
        }
        
        return stats;
    }

    public List<User> getStudentsByFilter(String search, Boolean active) {
        List<User> students = userService.getAllUsers().stream()
            .filter(u -> u.getRole() == Role.STUDENT)
            .collect(java.util.stream.Collectors.toList());
        
        if (search != null && !search.trim().isEmpty()) {
            students = students.stream()
                .filter(u -> u.getName().toLowerCase().contains(search.toLowerCase()) ||
                           u.getEmail().toLowerCase().contains(search.toLowerCase()))
                .collect(java.util.stream.Collectors.toList());
        }
        
        if (active != null) {
            students = students.stream()
                .filter(u -> u.isActive() == active)
                .collect(java.util.stream.Collectors.toList());
        }
        
        return students;
    }
}