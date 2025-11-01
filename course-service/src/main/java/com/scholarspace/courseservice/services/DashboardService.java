package com.scholarspace.courseservice.services;

import com.scholarspace.courseservice.models.Course;
import com.scholarspace.courseservice.models.Enrollment;
import com.scholarspace.courseservice.repositories.CourseRepository;
import com.scholarspace.courseservice.repositories.EnrollmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {
    
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final RestTemplate restTemplate;

    public Map<String, Object> getCourseStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // Get course statistics
        List<Course> allCourses = courseRepository.findAll();
        stats.put("totalCourses", allCourses.size());
        
        // Count active courses
        long activeCourses = allCourses.stream()
                .filter(Course::isActive)
                .count();
        stats.put("activeCourses", activeCourses);
        
        // Get recently added courses (last 30 days)
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minus(30, ChronoUnit.DAYS);
        List<Course> recentCourses = allCourses.stream()
                .filter(course -> course.getCreatedAt() != null && course.getCreatedAt().isAfter(thirtyDaysAgo))
                .toList();
        stats.put("recentCourses", recentCourses.size());
        
        // Get enrollment statistics
        List<Enrollment> allEnrollments = enrollmentRepository.findAll();
        

        
        return stats;
    }
    

}