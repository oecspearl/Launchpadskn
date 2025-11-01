package com.scholarspace.institutionservice.services;

import com.scholarspace.institutionservice.models.Department;
import com.scholarspace.institutionservice.models.Institution;
import com.scholarspace.institutionservice.repositories.DepartmentRepository;
import com.scholarspace.institutionservice.repositories.InstitutionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class InstitutionService {

    private final InstitutionRepository institutionRepository;
    private final DepartmentRepository departmentRepository;
    private final RestTemplate restTemplate;

    public Institution createInstitution(String name, String location, String contact) {
        if (institutionRepository.findByName(name).isPresent()) {
            throw new RuntimeException("Institution with this name already exists");
        }
        
        Institution institution = new Institution();
        institution.setName(name);
        institution.setLocation(location);
        institution.setContact(contact);
        institution.setCreatedAt(LocalDateTime.now());
        
        return institutionRepository.save(institution);
    }

    public Optional<Institution> getInstitutionById(Long id) {
        return institutionRepository.findById(id);
    }

    public Optional<Institution> getInstitutionByName(String name) {
        return institutionRepository.findByName(name);
    }

    public List<Institution> getAllInstitutions() {
        return institutionRepository.findAll();
    }

    @Transactional
    public Institution updateInstitution(Institution institution) {
        // Check if institution exists
        if (!institutionRepository.existsById(institution.getInstitutionId())) {
            throw new RuntimeException("Institution not found with ID: " + institution.getInstitutionId());
        }
        
        // Check for duplicate name (excluding current institution)
        Optional<Institution> existingWithSameName = institutionRepository.findByName(institution.getName());
        if (existingWithSameName.isPresent() && 
            !existingWithSameName.get().getInstitutionId().equals(institution.getInstitutionId())) {
            throw new RuntimeException("Institution with this name already exists");
        }
        
        return institutionRepository.save(institution);
    }

    @Transactional
    public void deleteInstitution(Long institutionId) {
        if (!institutionRepository.existsById(institutionId)) {
            throw new RuntimeException("Institution not found with ID: " + institutionId);
        }
        
        // Check if institution has departments
        long departmentCount = departmentRepository.countByInstitution_InstitutionId(institutionId);
        if (departmentCount > 0) {
            throw new RuntimeException("Cannot delete institution with existing departments");
        }
        
        institutionRepository.deleteById(institutionId);
    }

    public List<Department> getDepartmentsByInstitution(Long institutionId) {
        return departmentRepository.findByInstitution_InstitutionId(institutionId);
    }

    public Map<String, Object> getInstitutionStats(Long institutionId) {
        Map<String, Object> stats = new HashMap<>();
        
        // Get department count
        long departmentCount = departmentRepository.countByInstitution_InstitutionId(institutionId);
        stats.put("departmentCount", departmentCount);
        
        // Get course count from course-service
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> courseStats = restTemplate.getForObject(
                "http://course-service/api/courses/institution/" + institutionId + "/stats", 
                Map.class
            );
            if (courseStats != null) {
                stats.putAll(courseStats);
            }
        } catch (Exception e) {
            stats.put("courseCount", 0);
            stats.put("studentCount", 0);
        }
        
        return stats;
    }
}