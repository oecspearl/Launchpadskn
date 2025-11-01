package com.scholarspace.institutionservice.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "departments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Department {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "department_id")
    private Long departmentId;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false)
    private String code;
    
    private String description;
    
    @Column(name = "head_of_department")
    private String headOfDepartment;
    
    @Column(name = "department_email")
    private String email;
    
    @Column(name = "office_location")
    private String officeLocation;
    
    @ManyToOne
    @JoinColumn(name = "institution_id", nullable = false)
    private Institution institution;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    public Department(String name, String code, String description, Institution institution) {
        this.name = name;
        this.code = code;
        this.description = description;
        this.institution = institution;
        this.createdAt = LocalDateTime.now();
    }
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}