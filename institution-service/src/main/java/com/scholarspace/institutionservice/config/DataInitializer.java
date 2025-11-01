package com.scholarspace.institutionservice.config;

import com.scholarspace.institutionservice.models.Department;
import com.scholarspace.institutionservice.models.Institution;
import com.scholarspace.institutionservice.repositories.DepartmentRepository;
import com.scholarspace.institutionservice.repositories.InstitutionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.time.LocalDateTime;

@Configuration
@RequiredArgsConstructor
public class DataInitializer {

    @Bean
    @Profile("!test")
    CommandLineRunner initDatabase(
            InstitutionRepository institutionRepository,
            DepartmentRepository departmentRepository) {

        return args -> {
            if (institutionRepository.count() == 0) {
                // Create test institution
                Institution institution = new Institution();
                institution.setName("Test University");
                institution.setLocation("Test Location");
                institution.setContact("contact@testuniversity.edu");
                institution.setCreatedAt(LocalDateTime.now());
                institutionRepository.save(institution);
                
                // Create test department
                Department department = new Department();
                department.setName("Computer Science");
                department.setCode("CS");
                department.setDescription("Department of Computer Science and Information Technology");
                department.setInstitution(institution);
                department.setCreatedAt(LocalDateTime.now());
                departmentRepository.save(department);
            }
        };
    }
}