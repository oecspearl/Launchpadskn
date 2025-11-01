package com.scholarspace.courseservice.repositories;

import com.scholarspace.courseservice.models.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    
    Optional<Course> findByCode(String code);
    
    List<Course> findByIsActiveTrue();
    
    List<Course> findByDepartmentId(Long departmentId);
    
    @Modifying
    @Transactional
    @Query(value = "DELETE FROM course_prerequisites WHERE prerequisite_id = :courseId", nativeQuery = true)
    void removeAsPrerequisite(@Param("courseId") Long courseId);
}