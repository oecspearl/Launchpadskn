package com.scholarspace.courseservice.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "submissions")
public class Submission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "submission_id")
    private Long submissionId;
    
    @ManyToOne
    @JoinColumn(name = "content_id", nullable = false)
    private CourseContent assignment;
    
    @Column(name = "student_id", nullable = false)
    private Long studentId;
    
    @Column(name = "submission_date")
    private LocalDateTime submissionDate;
    
    @Column(name = "file_path")
    private String filePath;
    
    private Double grade;
    
    private String feedback;
    
    @Column(name = "graded_by")
    private Long gradedBy;
    
    @Column(name = "graded_at")
    private LocalDateTime gradedAt;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    public Submission() {
        this.submissionDate = LocalDateTime.now();
        this.createdAt = LocalDateTime.now();
    }
    
    public Submission(CourseContent assignment, Long studentId, String filePath) {
        this.assignment = assignment;
        this.studentId = studentId;
        this.filePath = filePath;
        this.submissionDate = LocalDateTime.now();
        this.createdAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getSubmissionId() { return submissionId; }
    public void setSubmissionId(Long submissionId) { this.submissionId = submissionId; }

    public CourseContent getAssignment() { return assignment; }
    public void setAssignment(CourseContent assignment) { this.assignment = assignment; }

    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }

    public LocalDateTime getSubmissionDate() { return submissionDate; }
    public void setSubmissionDate(LocalDateTime submissionDate) { this.submissionDate = submissionDate; }

    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }

    public Double getGrade() { return grade; }
    public void setGrade(Double grade) { this.grade = grade; }

    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }

    public Long getGradedBy() { return gradedBy; }
    public void setGradedBy(Long gradedBy) { this.gradedBy = gradedBy; }

    public LocalDateTime getGradedAt() { return gradedAt; }
    public void setGradedAt(LocalDateTime gradedAt) { this.gradedAt = gradedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}