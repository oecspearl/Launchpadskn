package com.scholarspace.courseservice.services;

import com.scholarspace.courseservice.models.Course;
import com.scholarspace.courseservice.models.CourseInstructor;
import com.scholarspace.courseservice.models.InstructorRole;
import com.scholarspace.courseservice.repositories.CourseInstructorRepository;
import com.scholarspace.courseservice.repositories.CourseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class InstructorAssignmentService {

    private final CourseInstructorRepository courseInstructorRepository;
    private final CourseRepository courseRepository;
    private final RestTemplate restTemplate;

    @Transactional
    public CourseInstructor assignInstructorToCourse(Long courseId, Long instructorId, InstructorRole role) {
        // Validate course exists and is active
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        
        if (!course.isActive()) {
            throw new RuntimeException("Cannot assign instructor to inactive course");
        }

        // Skip instructor validation - handled by frontend

        // Check if assignment already exists
        Optional<CourseInstructor> existing = courseInstructorRepository
                .findByCourse_IdAndInstructorId(courseId, instructorId);
        if (existing.isPresent()) {
            throw new RuntimeException("Instructor is already assigned to this course");
        }

        CourseInstructor assignment = new CourseInstructor(course, instructorId, role);
        return courseInstructorRepository.save(assignment);
    }

    private void validateInstructorAndDepartment(Long instructorId, Long courseDepartmentId) {
        try {
            String url = "http://user-service/api/users/" + instructorId;
            @SuppressWarnings("unchecked")
            Map<String, Object> user = restTemplate.getForObject(url, Map.class);
            
            if (user == null) {
                throw new RuntimeException("Instructor not found");
            }
            
            String role = (String) user.get("role");
            if (!"INSTRUCTOR".equals(role)) {
                throw new RuntimeException("User is not an instructor");
            }
            
            Boolean isActive = (Boolean) user.get("isActive");
            if (isActive == null || !isActive) {
                throw new RuntimeException("Cannot assign inactive instructor to course");
            }
            
            // Validate department matching
            Object deptIdObj = user.get("departmentId");
            Long instructorDepartmentId = null;
            if (deptIdObj instanceof Number) {
                instructorDepartmentId = ((Number) deptIdObj).longValue();
            }
            
            if (instructorDepartmentId == null) {
                throw new RuntimeException("Instructor must be assigned to a department before being assigned to courses");
            }
            
            if (!instructorDepartmentId.equals(courseDepartmentId)) {
                throw new RuntimeException("Instructor can only be assigned to courses in their department");
            }
        } catch (Exception e) {
            log.error("Instructor validation failed for ID: {}", instructorId, e);
            throw new RuntimeException("Instructor validation failed: " + e.getMessage());
        }
    }

    @Transactional
    public void removeInstructorFromCourse(Long courseId, Long instructorId) {
        CourseInstructor assignment = courseInstructorRepository
                .findByCourse_IdAndInstructorId(courseId, instructorId)
                .orElseThrow(() -> new RuntimeException("Instructor assignment not found"));
        
        courseInstructorRepository.delete(assignment);
    }

    public List<CourseInstructor> getCoursesByInstructor(Long instructorId) {
        return courseInstructorRepository.findByInstructorId(instructorId);
    }

    public List<CourseInstructor> getInstructorsByCourse(Long courseId) {
        return courseInstructorRepository.findByCourse_Id(courseId);
    }

    public boolean isInstructorAssignedToCourse(Long instructorId, Long courseId) {
        return courseInstructorRepository.findByCourse_IdAndInstructorId(courseId, instructorId).isPresent();
    }
}