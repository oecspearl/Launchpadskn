package com.scholarspace.courseservice.repositories;

import com.scholarspace.courseservice.models.Enrollment;
import com.scholarspace.courseservice.models.EnrollmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    
    List<Enrollment> findByCourse_Id(Long courseId);
    
    List<Enrollment> findByStudentId(Long studentId);
    
    List<Enrollment> findByCourse_IdAndStatus(Long courseId, EnrollmentStatus status);
    
    List<Enrollment> findByStudentIdAndStatus(Long studentId, EnrollmentStatus status);
    
    List<Enrollment> findByStatus(EnrollmentStatus status);
    
    Optional<Enrollment> findByCourse_IdAndStudentId(Long courseId, Long studentId);
}