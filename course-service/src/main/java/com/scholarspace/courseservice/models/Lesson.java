package com.scholarspace.courseservice.models;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "lessons")
public class Lesson {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "lesson_id")
    private Long lessonId;
    
    @Column(name = "class_subject_id", nullable = false)
    private Long classSubjectId;
    
    @Column(name = "lesson_title", nullable = false, length = 200)
    private String lessonTitle;
    
    @Column(name = "lesson_date", nullable = false)
    private LocalDate lessonDate;
    
    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;
    
    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;
    
    @Column(name = "location", length = 100)
    private String location; // Room number or location
    
    @Column(name = "lesson_number")
    private Integer lessonNumber; // Sequence within topic/unit
    
    @Column(name = "topic", length = 200)
    private String topic;
    
    @Column(name = "learning_objectives", columnDefinition = "TEXT")
    private String learningObjectives;
    
    @Column(name = "lesson_plan", columnDefinition = "TEXT")
    private String lessonPlan;
    
    @Column(name = "homework_description", columnDefinition = "TEXT")
    private String homeworkDescription;
    
    @Column(name = "homework_due_date")
    private LocalDateTime homeworkDueDate;
    
    @Column(name = "status", length = 20)
    private String status = "SCHEDULED"; // SCHEDULED, COMPLETED, CANCELLED, ABSENT
    
    @Column(name = "attendance_taken")
    private Boolean attendanceTaken = false;
    
    @Column(name = "created_by")
    private Long createdBy;
    
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
    public Long getLessonId() {
        return lessonId;
    }
    
    public void setLessonId(Long lessonId) {
        this.lessonId = lessonId;
    }
    
    public Long getClassSubjectId() {
        return classSubjectId;
    }
    
    public void setClassSubjectId(Long classSubjectId) {
        this.classSubjectId = classSubjectId;
    }
    
    public String getLessonTitle() {
        return lessonTitle;
    }
    
    public void setLessonTitle(String lessonTitle) {
        this.lessonTitle = lessonTitle;
    }
    
    public LocalDate getLessonDate() {
        return lessonDate;
    }
    
    public void setLessonDate(LocalDate lessonDate) {
        this.lessonDate = lessonDate;
    }
    
    public LocalTime getStartTime() {
        return startTime;
    }
    
    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }
    
    public LocalTime getEndTime() {
        return endTime;
    }
    
    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }
    
    public String getLocation() {
        return location;
    }
    
    public void setLocation(String location) {
        this.location = location;
    }
    
    public Integer getLessonNumber() {
        return lessonNumber;
    }
    
    public void setLessonNumber(Integer lessonNumber) {
        this.lessonNumber = lessonNumber;
    }
    
    public String getTopic() {
        return topic;
    }
    
    public void setTopic(String topic) {
        this.topic = topic;
    }
    
    public String getLearningObjectives() {
        return learningObjectives;
    }
    
    public void setLearningObjectives(String learningObjectives) {
        this.learningObjectives = learningObjectives;
    }
    
    public String getLessonPlan() {
        return lessonPlan;
    }
    
    public void setLessonPlan(String lessonPlan) {
        this.lessonPlan = lessonPlan;
    }
    
    public String getHomeworkDescription() {
        return homeworkDescription;
    }
    
    public void setHomeworkDescription(String homeworkDescription) {
        this.homeworkDescription = homeworkDescription;
    }
    
    public LocalDateTime getHomeworkDueDate() {
        return homeworkDueDate;
    }
    
    public void setHomeworkDueDate(LocalDateTime homeworkDueDate) {
        this.homeworkDueDate = homeworkDueDate;
    }
    
    public String getStatus() {
        return status != null ? status : "SCHEDULED";
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public Boolean getAttendanceTaken() {
        return attendanceTaken != null ? attendanceTaken : false;
    }
    
    public void setAttendanceTaken(Boolean attendanceTaken) {
        this.attendanceTaken = attendanceTaken;
    }
    
    public Long getCreatedBy() {
        return createdBy;
    }
    
    public void setCreatedBy(Long createdBy) {
        this.createdBy = createdBy;
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


