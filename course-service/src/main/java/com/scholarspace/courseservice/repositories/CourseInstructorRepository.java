package com.scholarspace.courseservice.repositories;

import com.scholarspace.courseservice.models.CourseInstructor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseInstructorRepository extends JpaRepository<CourseInstructor, Long> {
    
    List<CourseInstructor> findByCourse_Id(Long courseId);
    
    List<CourseInstructor> findByInstructorId(Long instructorId);
    
    Optional<CourseInstructor> findByCourse_IdAndInstructorId(Long courseId, Long instructorId);
    
    void deleteByCourse_IdAndInstructorId(Long courseId, Long instructorId);
}