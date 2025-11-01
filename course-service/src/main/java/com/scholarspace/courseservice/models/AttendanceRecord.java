package com.scholarspace.courseservice.models;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance_records")
public class AttendanceRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "attendance_id")
    private Long attendanceId;
    
    @ManyToOne
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;
    
    @Column(name = "student_id", nullable = false)
    private Long studentId;
    
    @Column(name = "session_date", nullable = false)
    private LocalDate sessionDate;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AttendanceStatus status;
    
    @Column(name = "recorded_by", nullable = false)
    private Long recordedBy;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    public AttendanceRecord() {
        this.createdAt = LocalDateTime.now();
    }
    
    public AttendanceRecord(Course course, Long studentId, LocalDate sessionDate, 
                          AttendanceStatus status, Long recordedBy) {
        this.course = course;
        this.studentId = studentId;
        this.sessionDate = sessionDate;
        this.status = status;
        this.recordedBy = recordedBy;
        this.createdAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getAttendanceId() { return attendanceId; }
    public void setAttendanceId(Long attendanceId) { this.attendanceId = attendanceId; }

    public Course getCourse() { return course; }
    public void setCourse(Course course) { this.course = course; }

    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }

    public LocalDate getSessionDate() { return sessionDate; }
    public void setSessionDate(LocalDate sessionDate) { this.sessionDate = sessionDate; }

    public AttendanceStatus getStatus() { return status; }
    public void setStatus(AttendanceStatus status) { this.status = status; }

    public Long getRecordedBy() { return recordedBy; }
    public void setRecordedBy(Long recordedBy) { this.recordedBy = recordedBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}