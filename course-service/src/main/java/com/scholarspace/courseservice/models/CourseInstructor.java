package com.scholarspace.courseservice.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "course_instructors")
public class CourseInstructor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;
    
    @Column(name = "instructor_id", nullable = false)
    private Long instructorId;
    
    @Enumerated(EnumType.STRING)
    private InstructorRole role;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    public CourseInstructor() {
        this.role = InstructorRole.PRIMARY;
        this.createdAt = LocalDateTime.now();
    }
    
    public CourseInstructor(Course course, Long instructorId, InstructorRole role) {
        this.course = course;
        this.instructorId = instructorId;
        this.role = role;
        this.createdAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Course getCourse() { return course; }
    public void setCourse(Course course) { this.course = course; }

    public Long getInstructorId() { return instructorId; }
    public void setInstructorId(Long instructorId) { this.instructorId = instructorId; }

    public InstructorRole getRole() { return role; }
    public void setRole(InstructorRole role) { this.role = role; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}