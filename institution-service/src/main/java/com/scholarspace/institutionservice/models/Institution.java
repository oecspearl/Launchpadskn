package com.scholarspace.institutionservice.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "institutions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Institution {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "institution_id")
    private Long institutionId;
    
    @Column(nullable = false, unique = true)
    private String name;
    
    @Column(nullable = false)
    private String location;
    
    private String contact;
    
    private String phone;
    
    private String website;
    
    @Column(name = "established_year")
    private Integer establishedYear;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "institution_type")
    private InstitutionType type;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    public Institution(String name, String location, String contact) {
        this.name = name;
        this.location = location;
        this.contact = contact;
        this.createdAt = LocalDateTime.now();
    }
    
    public enum InstitutionType {
        UNIVERSITY, COLLEGE, SCHOOL, INSTITUTE
    }
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}