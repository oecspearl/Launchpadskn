package com.scholarspace.courseservice.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "class_subjects")
public class ClassSubject {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "class_subject_id")
    private Long classSubjectId;
    
    @Column(name = "class_id", nullable = false)
    private Long classId;
    
    @Column(name = "subject_offering_id", nullable = false)
    private Long subjectOfferingId;
    
    @Column(name = "teacher_id")
    private Long teacherId; // Subject teacher for this class
    
    @Column(name = "room_preference", length = 20)
    private String roomPreference; // Preferred room for this class-subject
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getClassSubjectId() {
        return classSubjectId;
    }
    
    public void setClassSubjectId(Long classSubjectId) {
        this.classSubjectId = classSubjectId;
    }
    
    public Long getClassId() {
        return classId;
    }
    
    public void setClassId(Long classId) {
        this.classId = classId;
    }
    
    public Long getSubjectOfferingId() {
        return subjectOfferingId;
    }
    
    public void setSubjectOfferingId(Long subjectOfferingId) {
        this.subjectOfferingId = subjectOfferingId;
    }
    
    public Long getTeacherId() {
        return teacherId;
    }
    
    public void setTeacherId(Long teacherId) {
        this.teacherId = teacherId;
    }
    
    public String getRoomPreference() {
        return roomPreference;
    }
    
    public void setRoomPreference(String roomPreference) {
        this.roomPreference = roomPreference;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}


