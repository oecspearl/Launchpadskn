package com.scholarspace.courseservice.repositories;

import com.scholarspace.courseservice.models.CourseContent;
import com.scholarspace.courseservice.models.ContentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseContentRepository extends JpaRepository<CourseContent, Long> {
    
    List<CourseContent> findByCourse_Id(Long courseId);
    
    List<CourseContent> findByCourse_IdAndContentType(Long courseId, ContentType contentType);
    
    List<CourseContent> findByCreatedBy(Long createdBy);
    
    List<CourseContent> findByCourse_IdOrderByCreatedAtDesc(Long courseId);
}