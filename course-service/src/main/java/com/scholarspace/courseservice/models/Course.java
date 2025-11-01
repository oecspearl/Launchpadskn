package com.scholarspace.courseservice.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import org.hibernate.annotations.BatchSize;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "courses")
public class Course {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "course_id")
    private Long id;
    
    @Column(name = "course_code", unique = true, nullable = false)
    private String code;
    
    @Column(nullable = false)
    private String title;
    
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "course_prerequisites",
        joinColumns = @JoinColumn(name = "course_id"),
        inverseJoinColumns = @JoinColumn(name = "prerequisite_id")
    )
    @JsonIgnore
    @BatchSize(size = 10)
    private List<Course> prerequisites;
    
    private String description;
    
    @Column(name = "credit_hours")
    private Integer creditHours;
    
    private String semester;
    
    @Column(name = "academic_year")
    private String academicYear;
    
    @Column(name = "department_id")
    private Long departmentId;
    
    @Column(name = "is_active")
    @JsonProperty("isActive")
    private boolean isActive = true;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    public Course() {
        this.createdAt = LocalDateTime.now();
    }
    
    public Course(String code, String title, String description, Integer creditHours, 
                 String semester, String academicYear, Long departmentId) {
        this.code = code;
        this.title = title;
        this.description = description;
        this.creditHours = creditHours;
        this.semester = semester;
        this.academicYear = academicYear;
        this.departmentId = departmentId;
        this.createdAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public void setCourseId(Long id) { this.id = id; }
    public Long getCourseId() { return id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    
    public void setCourseCode(String code) { this.code = code; }
    public String getCourseCode() { return code; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    
    public String getCourseName() { return title; }
    public void setCourseName(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getCreditHours() { return creditHours; }
    public void setCreditHours(Integer creditHours) { this.creditHours = creditHours; }

    public String getSemester() { return semester; }
    public void setSemester(String semester) { this.semester = semester; }

    public String getAcademicYear() { return academicYear; }
    public void setAcademicYear(String academicYear) { this.academicYear = academicYear; }

    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }

    @JsonProperty("isActive")
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
    
    public boolean getIsActive() { return isActive; }
    public void setIsActive(boolean isActive) { this.isActive = isActive; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public List<Course> getPrerequisites() { return prerequisites; }
    public void setPrerequisites(List<Course> prerequisites) { this.prerequisites = prerequisites; }
}