package com.scholarspace.courseservice.services;

import com.scholarspace.courseservice.models.Course;
import com.scholarspace.courseservice.models.Enrollment;
import com.scholarspace.courseservice.repositories.CourseRepository;
import com.scholarspace.courseservice.repositories.EnrollmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {
    
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;

    public Map<String, Object> getCourseTrends() {
        List<Course> courses = courseRepository.findAll();
        Map<String, Object> trends = new HashMap<>();
        
        // Monthly course creation trends (last 6 months)
        Map<String, Long> monthlyCourses = courses.stream()
            .filter(c -> c.getCreatedAt() != null && 
                c.getCreatedAt().isAfter(LocalDateTime.now().minusMonths(6)))
            .collect(Collectors.groupingBy(
                c -> c.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM")),
                Collectors.counting()
            ));
        
        trends.put("monthlyCourses", monthlyCourses);
        trends.put("totalCourses", courses.size());
        trends.put("activeCourses", courses.stream().filter(Course::isActive).count());
        trends.put("recentCourses", courses.stream()
            .filter(c -> c.getCreatedAt() != null && 
                c.getCreatedAt().isAfter(LocalDateTime.now().minusDays(30)))
            .count());
        
        return trends;
    }

    public Map<String, Object> getEnrollmentTrends() {
        List<Enrollment> enrollments = enrollmentRepository.findAll();
        Map<String, Object> trends = new HashMap<>();
        
        // Monthly enrollment trends (last 6 months)
        Map<String, Long> monthlyEnrollments = enrollments.stream()
            .filter(e -> e.getEnrollmentDate() != null && 
                e.getEnrollmentDate().isAfter(LocalDateTime.now().minusMonths(6)))
            .collect(Collectors.groupingBy(
                e -> e.getEnrollmentDate().format(DateTimeFormatter.ofPattern("yyyy-MM")),
                Collectors.counting()
            ));
        
        trends.put("monthlyEnrollments", monthlyEnrollments);
        trends.put("totalEnrollments", enrollments.size());
        trends.put("pendingEnrollments", enrollments.stream()
            .filter(e -> e.getStatus().name().equals("PENDING"))
            .count());
        trends.put("approvedEnrollments", enrollments.stream()
            .filter(e -> e.getStatus().name().equals("APPROVED"))
            .count());
        
        return trends;
    }

    public Map<String, Object> getCoursesByDepartment() {
        List<Course> courses = courseRepository.findAll();
        Map<String, Object> distribution = new HashMap<>();
        
        Map<Long, Long> departmentCounts = courses.stream()
            .collect(Collectors.groupingBy(Course::getDepartmentId, Collectors.counting()));
        
        distribution.put("departmentCounts", departmentCounts);
        distribution.put("totalDepartments", departmentCounts.size());
        
        return distribution;
    }
}