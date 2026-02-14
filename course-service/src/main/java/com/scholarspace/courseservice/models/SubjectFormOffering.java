package com.scholarspace.courseservice.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "subject_form_offerings")
public class SubjectFormOffering {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "offering_id")
    private Long offeringId;
    
    @Column(name = "subject_id", nullable = false)
    private Long subjectId;
    
    @Column(name = "form_id", nullable = false)
    private Long formId;
    
    @Column(name = "curriculum_framework", columnDefinition = "TEXT")
    private String curriculumFramework; // Link to CXC/CSEC/CAPE standards
    
    @Column(name = "learning_outcomes", columnDefinition = "TEXT")
    private String learningOutcomes;
    
    @Column(name = "weekly_periods")
    private Integer weeklyPeriods = 5; // Number of lessons per week
    
    @Column(name = "is_compulsory")
    private Boolean isCompulsory = false;
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getOfferingId() {
        return offeringId;
    }
    
    public void setOfferingId(Long offeringId) {
        this.offeringId = offeringId;
    }
    
    public Long getSubjectId() {
        return subjectId;
    }
    
    public void setSubjectId(Long subjectId) {
        this.subjectId = subjectId;
    }
    
    public Long getFormId() {
        return formId;
    }
    
    public void setFormId(Long formId) {
        this.formId = formId;
    }
    
    public String getCurriculumFramework() {
        return curriculumFramework;
    }
    
    public void setCurriculumFramework(String curriculumFramework) {
        this.curriculumFramework = curriculumFramework;
    }
    
    public String getLearningOutcomes() {
        return learningOutcomes;
    }
    
    public void setLearningOutcomes(String learningOutcomes) {
        this.learningOutcomes = learningOutcomes;
    }
    
    public Integer getWeeklyPeriods() {
        return weeklyPeriods != null ? weeklyPeriods : 5;
    }
    
    public void setWeeklyPeriods(Integer weeklyPeriods) {
        this.weeklyPeriods = weeklyPeriods;
    }
    
    public Boolean getIsCompulsory() {
        return isCompulsory != null ? isCompulsory : false;
    }
    
    public void setIsCompulsory(Boolean isCompulsory) {
        this.isCompulsory = isCompulsory;
    }
    
    public Boolean getIsActive() {
        return isActive != null ? isActive : true;
    }
    
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}


