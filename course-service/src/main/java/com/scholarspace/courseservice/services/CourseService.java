package com.scholarspace.courseservice.services;

import com.scholarspace.courseservice.models.Course;
import com.scholarspace.courseservice.repositories.CourseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CourseService {

    private final CourseRepository courseRepository;
    private final RestTemplate restTemplate;

    public Course createCourse(String courseCode, String title, String description,
                              Integer creditHours, String semester, String academicYear,
                              Long departmentId) {
        
        // Check if course code is already used
        if (courseRepository.findByCode(courseCode).isPresent()) {
            throw new RuntimeException("Course code already exists");
        }
        
        // Validate department exists via institution-service
        validateDepartment(departmentId);
        
        Course course = new Course();
        course.setCourseCode(courseCode);
        course.setTitle(title);
        course.setDescription(description);
        course.setCreditHours(creditHours);
        course.setSemester(semester);
        course.setAcademicYear(academicYear);
        course.setDepartmentId(departmentId);
        course.setActive(true);
        course.setCreatedAt(LocalDateTime.now());
        
        return courseRepository.save(course);
    }

    private void validateDepartment(Long departmentId) {
        try {
            String url = "http://institution-service/api/departments/" + departmentId;
            restTemplate.getForObject(url, Object.class);
            log.info("Department validation successful for ID: {}", departmentId);
        } catch (Exception e) {
            log.warn("Department validation failed for ID: {} - {}", departmentId, e.getMessage());
            // For now, just log the warning instead of throwing exception
            // This allows course creation to proceed even if institution-service is unavailable
        }
    }

    public Optional<Course> getCourseById(Long id) {
        return courseRepository.findById(id);
    }

    public Optional<Course> getCourseByCode(String courseCode) {
        return courseRepository.findByCode(courseCode);
    }

    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    public List<Course> getActiveCourses() {
        return courseRepository.findByIsActiveTrue();
    }

    public List<Course> getCoursesByDepartment(Long departmentId) {
        return courseRepository.findByDepartmentId(departmentId);
    }

    public Course updateCourse(Course course) {
        return courseRepository.save(course);
    }

    public void activateCourse(Long courseId) {
        courseRepository.findById(courseId).ifPresent(course -> {
            course.setActive(true);
            courseRepository.save(course);
        });
    }

    public void deactivateCourse(Long courseId) {
        courseRepository.findById(courseId).ifPresent(course -> {
            course.setActive(false);
            courseRepository.save(course);
        });
    }

    public void deleteCourse(Long courseId) {
        if (!courseRepository.existsById(courseId)) {
            throw new RuntimeException("Course not found");
        }
        
        // For now, simple deletion - in production, check for enrollments first
        courseRepository.deleteById(courseId);
    }
}