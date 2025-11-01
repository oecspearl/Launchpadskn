package com.scholarspace.courseservice.services;

import com.scholarspace.courseservice.models.Course;
import com.scholarspace.courseservice.models.Enrollment;
import com.scholarspace.courseservice.models.EnrollmentStatus;
import com.scholarspace.courseservice.repositories.CourseRepository;
import com.scholarspace.courseservice.repositories.EnrollmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final RestTemplate restTemplate;

    public Enrollment requestEnrollment(Long studentId, Long courseId) {
        // Validate student exists and has STUDENT role
        validateStudent(studentId);
        
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        
        // Check if student is already enrolled
        Optional<Enrollment> existingEnrollment = 
                enrollmentRepository.findByCourse_IdAndStudentId(courseId, studentId);
        
        if (existingEnrollment.isPresent()) {
            throw new RuntimeException("Student is already enrolled in this course");
        }
        
        Enrollment enrollment = new Enrollment(course, studentId);
        return enrollmentRepository.save(enrollment);
    }

    private void validateStudent(Long studentId) {
        try {
            String url = "http://user-service/api/users/" + studentId;
            @SuppressWarnings("unchecked")
            Map<String, Object> user = restTemplate.getForObject(url, Map.class);
            
            if (user == null) {
                throw new RuntimeException("Student not found");
            }
            
            String role = (String) user.get("role");
            if (!"STUDENT".equals(role)) {
                throw new RuntimeException("User is not a student");
            }
        } catch (Exception e) {
            log.error("Student validation failed for ID: {}", studentId, e);
            throw new RuntimeException("Student validation failed");
        }
    }

    public Optional<Enrollment> getEnrollmentById(Long id) {
        return enrollmentRepository.findById(id);
    }

    public List<Enrollment> getEnrollmentsByCourse(Long courseId) {
        return enrollmentRepository.findByCourse_Id(courseId);
    }

    public List<Enrollment> getEnrollmentsByStudent(Long studentId) {
        return enrollmentRepository.findByStudentId(studentId);
    }

    public List<Enrollment> getActiveEnrollmentsByCourse(Long courseId) {
        return enrollmentRepository.findByCourse_IdAndStatus(courseId, EnrollmentStatus.ACTIVE);
    }

    public List<Enrollment> getActiveEnrollmentsByStudent(Long studentId) {
        return enrollmentRepository.findByStudentIdAndStatus(studentId, EnrollmentStatus.ACTIVE);
    }

    public List<Enrollment> getEnrollmentsByStatus(EnrollmentStatus status) {
        return enrollmentRepository.findByStatus(status);
    }

    public Enrollment updateEnrollmentStatus(Long enrollmentId, EnrollmentStatus status) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found"));
        
        enrollment.setStatus(status);
        return enrollmentRepository.save(enrollment);
    }

    public void dropEnrollment(Long enrollmentId) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found"));
        
        enrollment.setStatus(EnrollmentStatus.DROPPED);
        enrollmentRepository.save(enrollment);
    }

    public void completeEnrollment(Long enrollmentId, String grade) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found"));
        
        enrollment.setStatus(EnrollmentStatus.COMPLETED);
        enrollment.setGrade(grade);
        enrollmentRepository.save(enrollment);
    }
}