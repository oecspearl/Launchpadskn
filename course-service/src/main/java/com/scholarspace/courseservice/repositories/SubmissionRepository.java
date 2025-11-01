package com.scholarspace.courseservice.repositories;

import com.scholarspace.courseservice.models.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    
    List<Submission> findByAssignment_ContentId(Long contentId);
    
    List<Submission> findByStudentId(Long studentId);
    
    Optional<Submission> findByAssignment_ContentIdAndStudentId(Long contentId, Long studentId);
    
    List<Submission> findByAssignment_Course_Id(Long courseId);
    
    List<Submission> findByGradedByIsNull();
}